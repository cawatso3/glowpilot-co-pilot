# MCP Server Testing Guide

This guide walks through testing the NicheCommand MCP server locally and in production.

## Prerequisites

Before testing, ensure you have:
- Supabase CLI installed: `npm install -g supabase`
- Docker running (required for local Supabase)
- The migration applied to your database
- An API key created in the `api_keys` table

---

## Step 1: Apply the Database Migration

### Option A: Via Supabase Dashboard (Easiest)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/obfmtiiimdafvfxyupce
2. Navigate to **SQL Editor**
3. Open the migration file: `supabase/migrations/20260315151500_nichecommand_mcp_tables.sql`
4. Copy the entire contents
5. Paste into the SQL Editor and click **Run**
6. Verify tables were created by checking the **Table Editor**

### Option B: Via Supabase CLI

```bash
# Navigate to project directory
cd /Users/mac/glowpilot

# Push migrations to remote database
supabase db push

# Or if you want to apply locally first
supabase db reset
```

---

## Step 2: Create an API Key

You need to manually create an API key in the database since there's no UI for this yet.

### Generate a Key

```bash
# Generate a random API key (save this!)
openssl rand -hex 32
# Example output: nc_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

### Hash and Insert the Key

```sql
-- In Supabase SQL Editor, run this (replace YOUR_USER_ID and the key):

-- First, get your user_id
SELECT id FROM auth.users LIMIT 1;

-- Then insert the API key (replace the values)
INSERT INTO public.api_keys (user_id, key_hash, label)
VALUES (
  'YOUR_USER_ID_HERE',
  encode(digest('nc_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6', 'sha256'), 'hex'),
  'Windsurf MCP'
);
```

**Important**: Save the original key (e.g., `nc_a1b2c3d4e5f6...`). You'll need it for testing. The database only stores the hash.

---

## Step 3: Create Test Data

Create a test project and constraint profile:

```sql
-- Get your user_id first
SELECT id FROM auth.users LIMIT 1;

-- Create a test project
INSERT INTO public.projects (user_id, name, project_type, is_focused, current_stage)
VALUES (
  'YOUR_USER_ID_HERE',
  'Test Project - Invoice Reconciliation SaaS',
  'saas',
  true,
  'capture'
);

-- Create a constraint profile
INSERT INTO public.constraint_profiles (
  user_id,
  tech_stack,
  builder_tools,
  time_budget_hours_per_week,
  risk_tolerance,
  target_revenue_model
)
VALUES (
  'YOUR_USER_ID_HERE',
  ARRAY['React', 'TypeScript', 'Supabase', 'Vite'],
  ARRAY['Lovable', 'Windsurf', 'Claude'],
  15,
  'medium',
  'subscription'
);
```

---

## Step 4: Test Locally with Supabase CLI

### Start Local Supabase

```bash
cd /Users/mac/glowpilot

# Start local Supabase (this will take a few minutes first time)
supabase start

# You should see output like:
# API URL: http://localhost:54321
# DB URL: postgresql://postgres:postgres@localhost:54322/postgres
# Studio URL: http://localhost:54323
# anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Serve the MCP Function Locally

```bash
# In a new terminal, serve the MCP function
supabase functions serve mcp --no-verify-jwt

# You should see:
# Serving functions on http://localhost:54321/functions/v1/
```

### Test with curl

```bash
# Test the list_projects tool
curl -X POST http://localhost:54321/functions/v1/mcp/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer nc_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "list_projects",
      "arguments": {}
    }
  }'

# Expected response:
# {
#   "jsonrpc": "2.0",
#   "id": 1,
#   "result": {
#     "content": [{
#       "type": "text",
#       "text": "→ Test Project - Invoice Reconciliation SaaS [active] Stage: capture (saas)"
#     }]
#   }
# }
```

### Test add_signal

```bash
curl -X POST http://localhost:54321/functions/v1/mcp/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer nc_YOUR_API_KEY_HERE" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "add_signal",
      "arguments": {
        "title": "Small accounting firms struggle with invoice reconciliation",
        "body": "Found on Reddit r/accounting - firms with 5-20 clients manually reconcile invoices across QuickBooks, Excel, and email. Takes 2-3 hours per week per accountant.",
        "source_url": "https://reddit.com/r/accounting/comments/example",
        "tags": ["fintech", "smb", "saas", "accounting"]
      }
    }
  }'

# Expected response:
# {
#   "jsonrpc": "2.0",
#   "id": 2,
#   "result": {
#     "content": [{
#       "type": "text",
#       "text": "Signal added: \"Small accounting firms struggle with invoice reconciliation\" (ID: uuid-here) → project uuid-here"
#     }]
#   }
# }
```

### Test get_project_context

```bash
curl -X POST http://localhost:54321/functions/v1/mcp/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer nc_YOUR_API_KEY_HERE" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "get_project_context",
      "arguments": {}
    }
  }'

# Expected response: Full JSON context with project, signals, tasks, etc.
```

### Test log_research

```bash
curl -X POST http://localhost:54321/functions/v1/mcp/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer nc_YOUR_API_KEY_HERE" \
  -d '{
    "jsonrpc": "2.0",
    "id": 4,
    "method": "tools/call",
    "params": {
      "name": "log_research",
      "arguments": {
        "title": "Market research on invoice reconciliation tools",
        "description": "Analyzed 5 competitors, identified pricing gap at $49/mo for SMBs",
        "stage": "capture",
        "duration_minutes": 45
      }
    }
  }'
```

---

## Step 5: Deploy to Production

### Deploy the Edge Function

```bash
cd /Users/mac/glowpilot

# Deploy the MCP function
supabase functions deploy mcp --no-verify-jwt

# You should see:
# Deploying function mcp...
# Function deployed successfully!
# URL: https://obfmtiiimdafvfxyupce.supabase.co/functions/v1/mcp
```

### Test Production Endpoint

```bash
# Test with your production API key
curl -X POST https://obfmtiiimdafvfxyupce.supabase.co/functions/v1/mcp/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer nc_YOUR_API_KEY_HERE" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "list_projects",
      "arguments": {}
    }
  }'
```

---

## Step 6: Configure Windsurf

### Add MCP Server to Windsurf Config

Edit `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "nichecommand": {
      "url": "https://obfmtiiimdafvfxyupce.supabase.co/functions/v1/mcp/mcp",
      "headers": {
        "Authorization": "Bearer nc_YOUR_API_KEY_HERE"
      }
    }
  }
}
```

### Restart Windsurf

Close and reopen Windsurf for the config to take effect.

---

## Step 7: Test in Windsurf

### Test 1: List Projects

1. Open Windsurf
2. Start a new Cascade conversation
3. Say: **"Use NicheCommand to list my projects"**
4. Cascade should call `list_projects` and show your test project

### Test 2: Add a Signal

Say: **"I found an interesting pain point: small accounting firms struggle to reconcile invoices across multiple clients. Add this as a signal to NicheCommand."**

Cascade should:
1. Call `add_signal` with the pain point
2. Confirm the signal was added
3. You can verify in Supabase Table Editor → `signals` table

### Test 3: Get Project Context

Say: **"Get the full context for my current NicheCommand project"**

Cascade should:
1. Call `get_project_context`
2. Display the full project state including signals, tasks, builder profile

### Test 4: Log Research

Say: **"Log this research session to NicheCommand: I spent 30 minutes analyzing the accounting software market and found 3 key competitors"**

Cascade should:
1. Call `log_research`
2. Confirm the activity was logged
3. You can verify in `activity_log` table

### Test 5: Add Tasks

Say: **"Add these tasks to my NicheCommand project: 1) Create Lovable prompt for MVP, 2) Set up Supabase schema, 3) Build invoice upload UI"**

Cascade should:
1. Call `add_tasks` with the task list
2. Confirm tasks were added
3. You can verify in `tasks` table

---

## Troubleshooting

### Error: "Invalid API key"

**Cause**: API key hash doesn't match database

**Fix**:
1. Verify you're using the exact key you generated
2. Check the hash was computed correctly:
   ```bash
   echo -n "nc_YOUR_KEY_HERE" | openssl dgst -sha256 -hex
   ```
3. Compare with the `key_hash` in the database

### Error: "No active project found"

**Cause**: No project with `is_focused = true`

**Fix**:
```sql
UPDATE public.projects
SET is_focused = true
WHERE user_id = 'YOUR_USER_ID'
LIMIT 1;
```

### Error: "Failed to add signal"

**Cause**: RLS policy blocking insert

**Fix**: Verify the API key's `user_id` matches the authenticated user

### Function Not Found

**Cause**: Function not deployed or wrong URL

**Fix**:
```bash
# List deployed functions
supabase functions list

# Redeploy
supabase functions deploy mcp --no-verify-jwt
```

### Windsurf Not Seeing MCP Server

**Cause**: Config file not loaded or syntax error

**Fix**:
1. Verify JSON syntax in `mcp_config.json`
2. Restart Windsurf completely
3. Check Windsurf logs: `~/Library/Logs/Windsurf/`

---

## Verification Checklist

- [ ] Migration applied successfully
- [ ] API key created and hash stored
- [ ] Test project created with `is_focused = true`
- [ ] Constraint profile created
- [ ] Local function serves without errors
- [ ] `list_projects` returns test project
- [ ] `add_signal` creates signal in database
- [ ] `get_project_context` returns full context
- [ ] Function deployed to production
- [ ] Production endpoint responds correctly
- [ ] Windsurf config file created
- [ ] Windsurf can call MCP tools
- [ ] Signals appear in Supabase table
- [ ] Activity log entries created

---

## Next Steps After Testing

1. **Build the NicheCommand UI** to visualize signals, projects, and tasks
2. **Add API key management UI** in settings page
3. **Create project creation UI** instead of manual SQL
4. **Build the pipeline stages UI** (Capture → Score → Evaluate → Decide → Execute)
5. **Add AI assessment** for signals (the `ai_assessment` jsonb field)
6. **Implement evaluation scoring UI** for the 6 scoring dimensions

---

## Useful SQL Queries for Testing

```sql
-- View all signals
SELECT id, title, status, tags, created_at
FROM public.signals
ORDER BY created_at DESC;

-- View activity log
SELECT activity_type, title, tool_used, created_at
FROM public.activity_log
ORDER BY created_at DESC;

-- View tasks
SELECT title, status, priority, phase
FROM public.tasks
ORDER BY sort_order;

-- View stage progress
SELECT p.name, sp.stage, sp.status, sp.started_at, sp.completed_at
FROM public.stage_progress sp
JOIN public.projects p ON p.id = sp.project_id
ORDER BY p.name, sp.stage;

-- Check API key usage
SELECT label, last_used_at, created_at
FROM public.api_keys
WHERE revoked_at IS NULL;
```

---

## Performance Testing

### Load Test the MCP Endpoint

```bash
# Install Apache Bench
brew install apache-bench

# Run 100 requests with 10 concurrent
ab -n 100 -c 10 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer nc_YOUR_API_KEY" \
  -p test-payload.json \
  https://obfmtiiimdafvfxyupce.supabase.co/functions/v1/mcp/mcp
```

Create `test-payload.json`:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "list_projects",
    "arguments": {}
  }
}
```

---

## Security Testing

### Test Invalid API Key

```bash
curl -X POST https://obfmtiiimdafvfxyupce.supabase.co/functions/v1/mcp/mcp \
  -H "Authorization: Bearer nc_invalid_key" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_projects","arguments":{}}}'

# Expected: Error response with "Invalid API key"
```

### Test Revoked API Key

```sql
-- Revoke the key
UPDATE public.api_keys
SET revoked_at = now()
WHERE key_hash = 'YOUR_KEY_HASH';
```

Then test - should fail with "Invalid API key"

### Test RLS Policies

Try to access another user's data - should be blocked by RLS.

---

## Monitoring

### Check Function Logs

```bash
# View recent logs
supabase functions logs mcp

# Follow logs in real-time
supabase functions logs mcp --follow
```

### Monitor in Supabase Dashboard

1. Go to **Edge Functions** → **mcp**
2. View **Invocations** chart
3. Check **Logs** tab for errors
4. Monitor **Performance** metrics
