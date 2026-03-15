
-- integrations table
CREATE TABLE public.integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider text NOT NULL,
  status text NOT NULL DEFAULT 'disconnected',
  credentials jsonb,
  display_name text,
  last_sync_at timestamptz,
  last_error text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own integrations" ON public.integrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own integrations" ON public.integrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own integrations" ON public.integrations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own integrations" ON public.integrations FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON public.integrations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- sync_logs table
CREATE TABLE public.sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider text NOT NULL,
  sync_type text NOT NULL,
  status text NOT NULL DEFAULT 'running',
  records_synced integer NOT NULL DEFAULT 0,
  error_message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sync logs" ON public.sync_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sync logs" ON public.sync_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
