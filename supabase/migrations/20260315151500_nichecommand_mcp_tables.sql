-- NicheCommand MCP Server Tables
-- These tables support the MCP server integration for project management,
-- signal capture, evaluation pipeline, and task tracking.

-- API KEYS (for MCP authentication)
CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  key_hash text NOT NULL UNIQUE,
  label text NOT NULL DEFAULT 'default',
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own api keys" ON public.api_keys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own api keys" ON public.api_keys FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own api keys" ON public.api_keys FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own api keys" ON public.api_keys FOR DELETE USING (auth.uid() = user_id);

-- PROJECTS
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  project_type text CHECK (project_type IN ('saas', 'marketplace', 'tool', 'api', 'automation', 'agency', 'other')) DEFAULT 'saas',
  status text CHECK (status IN ('active', 'paused', 'archived', 'completed')) DEFAULT 'active',
  current_stage text CHECK (current_stage IN ('capture', 'score', 'evaluate', 'decide', 'execute')) DEFAULT 'capture',
  is_focused boolean DEFAULT false,
  project_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own projects" ON public.projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SIGNALS (pain points, opportunities, problems)
CREATE TABLE public.signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  source text DEFAULT 'manual',
  title text NOT NULL,
  body text,
  source_url text,
  tags text[] DEFAULT '{}',
  source_metadata jsonb,
  status text CHECK (status IN ('inbox', 'scored', 'promoted', 'rejected', 'archived')) DEFAULT 'inbox',
  score numeric(5,2),
  ai_assessment jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own signals" ON public.signals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own signals" ON public.signals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own signals" ON public.signals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own signals" ON public.signals FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_signals_updated_at BEFORE UPDATE ON public.signals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- EVALUATIONS (detailed scoring of signals)
CREATE TABLE public.evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  signal_id uuid REFERENCES public.signals(id) ON DELETE CASCADE,
  overall_score numeric(5,2),
  market_size_score numeric(5,2),
  pain_severity_score numeric(5,2),
  competition_score numeric(5,2),
  tech_fit_score numeric(5,2),
  build_effort_score numeric(5,2),
  revenue_score numeric(5,2),
  notes text,
  status text CHECK (status IN ('draft', 'completed', 'reviewed')) DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own evaluations" ON public.evaluations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own evaluations" ON public.evaluations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own evaluations" ON public.evaluations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own evaluations" ON public.evaluations FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_evaluations_updated_at BEFORE UPDATE ON public.evaluations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- DECISIONS (go/no-go decisions on signals/evaluations)
CREATE TABLE public.decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  signal_id uuid REFERENCES public.signals(id) ON DELETE SET NULL,
  evaluation_id uuid REFERENCES public.evaluations(id) ON DELETE SET NULL,
  decision text CHECK (decision IN ('go', 'no_go', 'defer', 'pivot')) NOT NULL,
  reasoning text,
  confidence numeric(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  decided_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own decisions" ON public.decisions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own decisions" ON public.decisions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own decisions" ON public.decisions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own decisions" ON public.decisions FOR DELETE USING (auth.uid() = user_id);

-- TASKS (execute stage kanban)
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  phase text,
  priority text CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  status text CHECK (status IN ('todo', 'in_progress', 'blocked', 'done')) DEFAULT 'todo',
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own tasks" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON public.tasks FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ACTIVITY LOG (research and action timeline)
CREATE TABLE public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  stage text CHECK (stage IN ('capture', 'score', 'evaluate', 'decide', 'execute')),
  activity_type text NOT NULL,
  title text NOT NULL,
  description text,
  tool_used text,
  duration_minutes integer,
  external_url text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own activity log" ON public.activity_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activity log" ON public.activity_log FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own activity log" ON public.activity_log FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own activity log" ON public.activity_log FOR DELETE USING (auth.uid() = user_id);

-- CONSTRAINT PROFILES (builder preferences)
CREATE TABLE public.constraint_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  tech_stack text[],
  builder_tools text[],
  existing_assets text[],
  time_budget_hours_per_week integer DEFAULT 10,
  risk_tolerance text CHECK (risk_tolerance IN ('low', 'medium', 'high')) DEFAULT 'medium',
  target_revenue_model text CHECK (target_revenue_model IN ('subscription', 'one_time', 'usage_based', 'freemium', 'marketplace_fee', 'other')) DEFAULT 'subscription',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.constraint_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own constraint profile" ON public.constraint_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own constraint profile" ON public.constraint_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own constraint profile" ON public.constraint_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER update_constraint_profiles_updated_at BEFORE UPDATE ON public.constraint_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- STAGE PROGRESS (tracks pipeline stage transitions per project)
CREATE TABLE public.stage_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  stage text NOT NULL CHECK (stage IN ('capture', 'score', 'evaluate', 'decide', 'execute')),
  status text CHECK (status IN ('not_started', 'in_progress', 'completed')) DEFAULT 'not_started',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, stage)
);
ALTER TABLE public.stage_progress ENABLE ROW LEVEL SECURITY;
-- stage_progress doesn't have user_id directly, so we join through projects
CREATE POLICY "Users can view own stage progress" ON public.stage_progress
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.projects WHERE projects.id = stage_progress.project_id AND projects.user_id = auth.uid())
  );
CREATE POLICY "Users can insert own stage progress" ON public.stage_progress
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects WHERE projects.id = stage_progress.project_id AND projects.user_id = auth.uid())
  );
CREATE POLICY "Users can update own stage progress" ON public.stage_progress
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.projects WHERE projects.id = stage_progress.project_id AND projects.user_id = auth.uid())
  );

-- Auto-create stage_progress rows when a project is created
CREATE OR REPLACE FUNCTION public.handle_new_project()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.stage_progress (project_id, stage, status, started_at)
  VALUES
    (NEW.id, 'capture', 'in_progress', now()),
    (NEW.id, 'score', 'not_started', NULL),
    (NEW.id, 'evaluate', 'not_started', NULL),
    (NEW.id, 'decide', 'not_started', NULL),
    (NEW.id, 'execute', 'not_started', NULL);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_project_created
  AFTER INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_project();

-- Indexes for common query patterns
CREATE INDEX idx_signals_user_project ON public.signals(user_id, project_id);
CREATE INDEX idx_signals_status ON public.signals(status);
CREATE INDEX idx_tasks_project_status ON public.tasks(project_id, status);
CREATE INDEX idx_activity_log_project ON public.activity_log(project_id, created_at DESC);
CREATE INDEX idx_api_keys_hash ON public.api_keys(key_hash);
CREATE INDEX idx_projects_user_focused ON public.projects(user_id, is_focused) WHERE is_focused = true;
