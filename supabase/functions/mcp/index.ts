import { McpServer } from "mcp-lite";
import { createClient } from "@supabase/supabase-js";

const server = new McpServer({
  name: "nichecommand",
  version: "1.0.0",
});

// Helper: authenticate via API key and return supabase client + user_id
async function authenticate(apiKey: string) {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Hash the key and look up
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const keyHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  const { data: keyRecord, error } = await supabase
    .from("api_keys")
    .select("user_id")
    .eq("key_hash", keyHash)
    .is("revoked_at", null)
    .single();

  if (error || !keyRecord) throw new Error("Invalid API key");

  // Update last_used_at
  await supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("key_hash", keyHash);

  return { supabase, userId: keyRecord.user_id };
}

// Helper: get focused project for user
async function getFocusedProject(supabase: any, userId: string) {
  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .eq("is_focused", true)
    .eq("status", "active")
    .single();
  return data;
}

// ============ TOOLS ============

// TOOL 1: add_signal
server.addTool({
  name: "add_signal",
  description: "Add a pain point, problem, or business opportunity signal to NicheCommand. Use this whenever you identify a potential problem worth tracking during research.",
  parameters: {
    type: "object",
    properties: {
      title: { type: "string", description: "Short title of the pain point or opportunity (required)" },
      body: { type: "string", description: "Detailed description, evidence, or context" },
      source_url: { type: "string", description: "URL where this was found (Reddit thread, article, etc)" },
      tags: { type: "array", items: { type: "string" }, description: "Categorization tags like 'fintech', 'smb', 'saas'" },
      project_id: { type: "string", description: "UUID of the project to assign to. If omitted, assigns to focused project." },
    },
    required: ["title"],
  },
  handler: async (params: any, { apiKey }: any) => {
    const { supabase, userId } = await authenticate(apiKey);

    let projectId = params.project_id;
    if (!projectId) {
      const focused = await getFocusedProject(supabase, userId);
      projectId = focused?.id || null;
    }

    const { data: signal, error } = await supabase
      .from("signals")
      .insert({
        user_id: userId,
        project_id: projectId,
        source: "mcp",
        title: params.title,
        body: params.body || null,
        source_url: params.source_url || null,
        tags: params.tags || [],
        source_metadata: { tool: "windsurf_mcp" },
        status: "inbox",
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to add signal: ${error.message}`);

    // Auto-log activity
    await supabase.from("activity_log").insert({
      user_id: userId,
      project_id: projectId,
      activity_type: "signal_captured",
      title: `Signal: ${params.title}`,
      tool_used: "windsurf",
      metadata: { signal_id: signal.id },
    });

    return { content: [{ type: "text", text: `Signal added: "${params.title}" (ID: ${signal.id})${projectId ? ` → project ${projectId}` : " (unassigned)"}` }] };
  },
});

// TOOL 2: log_research
server.addTool({
  name: "log_research",
  description: "Log a research activity to the project timeline. Use this after completing a research task like market analysis, competitor research, or technical feasibility assessment.",
  parameters: {
    type: "object",
    properties: {
      title: { type: "string", description: "What was researched (required)" },
      description: { type: "string", description: "Key findings or summary" },
      stage: { type: "string", enum: ["capture", "score", "evaluate", "decide", "execute"], description: "Pipeline stage this research relates to" },
      duration_minutes: { type: "number", description: "How long the research took" },
      project_id: { type: "string", description: "Project UUID. If omitted, uses focused project." },
    },
    required: ["title"],
  },
  handler: async (params: any, { apiKey }: any) => {
    const { supabase, userId } = await authenticate(apiKey);

    let projectId = params.project_id;
    if (!projectId) {
      const focused = await getFocusedProject(supabase, userId);
      projectId = focused?.id || null;
    }

    const { error } = await supabase.from("activity_log").insert({
      user_id: userId,
      project_id: projectId,
      stage: params.stage || null,
      activity_type: "research",
      title: params.title,
      description: params.description || null,
      tool_used: "windsurf",
      duration_minutes: params.duration_minutes || null,
    });

    if (error) throw new Error(`Failed to log activity: ${error.message}`);

    return { content: [{ type: "text", text: `Research logged: "${params.title}"` }] };
  },
});

// TOOL 3: get_project_context
server.addTool({
  name: "get_project_context",
  description: "Get full context for the active project including signals, evaluations, decisions, tasks, and builder profile. Use this at the start of a conversation to understand what the user is working on.",
  parameters: {
    type: "object",
    properties: {
      project_id: { type: "string", description: "Project UUID. If omitted, uses focused project." },
    },
  },
  handler: async (params: any, { apiKey }: any) => {
    const { supabase, userId } = await authenticate(apiKey);

    let project;
    if (params.project_id) {
      const { data } = await supabase.from("projects").select("*").eq("id", params.project_id).eq("user_id", userId).single();
      project = data;
    } else {
      project = await getFocusedProject(supabase, userId);
    }

    if (!project) {
      return { content: [{ type: "text", text: "No active project found. The user should create or focus a project in NicheCommand first." }] };
    }

    const [signals, evaluations, decisions, tasks, constraintProfile, recentActivity] = await Promise.all([
      supabase.from("signals").select("*").eq("project_id", project.id).order("created_at", { ascending: false }).limit(30),
      supabase.from("evaluations").select("*, signals(title)").eq("project_id", project.id),
      supabase.from("decisions").select("*").eq("project_id", project.id).order("created_at", { ascending: false }).limit(5),
      supabase.from("tasks").select("*").eq("project_id", project.id).order("sort_order"),
      supabase.from("constraint_profiles").select("*").eq("user_id", userId).single(),
      supabase.from("activity_log").select("*").eq("project_id", project.id).order("created_at", { ascending: false }).limit(15),
    ]);

    const context = {
      project: {
        name: project.name,
        type: project.project_type,
        stage: project.current_stage,
        status: project.status,
        notes: project.project_notes,
      },
      builder_profile: constraintProfile.data ? {
        tech_stack: constraintProfile.data.tech_stack,
        tools: constraintProfile.data.builder_tools,
        existing_assets: constraintProfile.data.existing_assets,
        time_budget: `${constraintProfile.data.time_budget_hours_per_week} hrs/week`,
        risk_tolerance: constraintProfile.data.risk_tolerance,
        revenue_preference: constraintProfile.data.target_revenue_model,
      } : "Not configured",
      signals: {
        total: signals.data?.length || 0,
        by_status: {
          inbox: signals.data?.filter((s: any) => s.status === "inbox").length || 0,
          scored: signals.data?.filter((s: any) => s.status === "scored").length || 0,
          promoted: signals.data?.filter((s: any) => s.status === "promoted").length || 0,
        },
        items: signals.data?.map((s: any) => ({
          id: s.id,
          title: s.title,
          score: s.score,
          status: s.status,
          verdict: s.ai_assessment?.verdict,
          tags: s.tags,
        })),
      },
      evaluations: evaluations.data?.map((e: any) => ({
        id: e.id,
        signal_title: e.signals?.title,
        overall_score: e.overall_score,
        status: e.status,
        scores: {
          market: e.market_size_score,
          pain: e.pain_severity_score,
          competition: e.competition_score,
          tech_fit: e.tech_fit_score,
          build_effort: e.build_effort_score,
          revenue: e.revenue_score,
        },
      })),
      decisions: decisions.data?.map((d: any) => ({
        decision: d.decision,
        reasoning: d.reasoning,
        confidence: d.confidence,
        date: d.decided_at,
      })),
      tasks: {
        total: tasks.data?.length || 0,
        done: tasks.data?.filter((t: any) => t.status === "done").length || 0,
        items: tasks.data?.map((t: any) => ({
          title: t.title,
          status: t.status,
          priority: t.priority,
          phase: t.phase,
        })),
      },
      recent_activity: recentActivity.data?.map((a: any) => ({
        type: a.activity_type,
        title: a.title,
        tool: a.tool_used,
        date: a.created_at,
      })),
    };

    return { content: [{ type: "text", text: JSON.stringify(context, null, 2) }] };
  },
});

// TOOL 4: list_projects
server.addTool({
  name: "list_projects",
  description: "List all projects in NicheCommand with their current stage and status.",
  parameters: { type: "object", properties: {} },
  handler: async (_params: any, { apiKey }: any) => {
    const { supabase, userId } = await authenticate(apiKey);
    const { data: projects } = await supabase
      .from("projects")
      .select("id, name, project_type, status, current_stage, is_focused")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    const text = (projects || []).map((p: any) =>
      `${p.is_focused ? "→ " : "  "}${p.name} [${p.status}] Stage: ${p.current_stage} (${p.project_type})`
    ).join("\n");

    return { content: [{ type: "text", text: text || "No projects found." }] };
  },
});

// TOOL 5: add_tasks
server.addTool({
  name: "add_tasks",
  description: "Add one or more tasks to a project's Execute stage. Use this when breaking down a build plan into actionable steps.",
  parameters: {
    type: "object",
    properties: {
      tasks: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            phase: { type: "string", description: "Build phase like 'Phase 1: Lovable Scaffold'" },
            priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
          },
          required: ["title"],
        },
        description: "Array of tasks to add",
      },
      project_id: { type: "string", description: "Project UUID. If omitted, uses focused project." },
    },
    required: ["tasks"],
  },
  handler: async (params: any, { apiKey }: any) => {
    const { supabase, userId } = await authenticate(apiKey);

    let projectId = params.project_id;
    if (!projectId) {
      const focused = await getFocusedProject(supabase, userId);
      projectId = focused?.id;
    }
    if (!projectId) throw new Error("No project specified and no focused project found");

    const tasksToInsert = params.tasks.map((t: any, i: number) => ({
      project_id: projectId,
      user_id: userId,
      title: t.title,
      description: t.description || null,
      phase: t.phase || null,
      priority: t.priority || "medium",
      status: "todo",
      sort_order: i,
    }));

    const { error } = await supabase.from("tasks").insert(tasksToInsert);
    if (error) throw new Error(`Failed to add tasks: ${error.message}`);

    return { content: [{ type: "text", text: `Added ${params.tasks.length} tasks to project.` }] };
  },
});

// TOOL 6: advance_stage
server.addTool({
  name: "advance_stage",
  description: "Move a project to the next pipeline stage (capture → score → evaluate → decide → execute).",
  parameters: {
    type: "object",
    properties: {
      project_id: { type: "string", description: "Project UUID. If omitted, uses focused project." },
    },
  },
  handler: async (params: any, { apiKey }: any) => {
    const { supabase, userId } = await authenticate(apiKey);

    let projectId = params.project_id;
    if (!projectId) {
      const focused = await getFocusedProject(supabase, userId);
      projectId = focused?.id;
    }
    if (!projectId) throw new Error("No project found");

    const { data: project } = await supabase.from("projects").select("current_stage").eq("id", projectId).single();
    const stages = ["capture", "score", "evaluate", "decide", "execute"];
    const currentIdx = stages.indexOf(project.current_stage);
    if (currentIdx >= stages.length - 1) {
      return { content: [{ type: "text", text: "Project is already in Execute stage." }] };
    }

    const nextStage = stages[currentIdx + 1];

    await supabase.from("stage_progress").update({ status: "completed", completed_at: new Date().toISOString() }).eq("project_id", projectId).eq("stage", project.current_stage);
    await supabase.from("stage_progress").update({ status: "in_progress", started_at: new Date().toISOString() }).eq("project_id", projectId).eq("stage", nextStage);
    await supabase.from("projects").update({ current_stage: nextStage, updated_at: new Date().toISOString() }).eq("id", projectId);

    return { content: [{ type: "text", text: `Project advanced: ${project.current_stage} → ${nextStage}` }] };
  },
});

// Export the server's fetch handler
export default server.handler;
