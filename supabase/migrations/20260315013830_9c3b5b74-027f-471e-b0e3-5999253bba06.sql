
-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- PROFILES
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  business_name text,
  business_type text CHECK (business_type IN ('esthetician', 'nail_tech', 'lash_artist', 'hair_stylist', 'other')) DEFAULT 'esthetician',
  phone text,
  email text,
  timezone text DEFAULT 'America/New_York',
  city text,
  state text,
  google_business_profile_url text,
  booking_platform text CHECK (booking_platform IN ('glossgenius', 'vagaro', 'square', 'fresha', 'acuity', 'other', 'none')),
  booking_link text,
  avatar_url text,
  onboarding_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- CONTENT IDEAS
CREATE TABLE public.content_ideas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  content_type text CHECK (content_type IN ('educational', 'transformation', 'behind_the_scenes', 'testimonial', 'promotional', 'trending', 'personal')),
  platform text CHECK (platform IN ('tiktok', 'instagram', 'google_business', 'all')),
  status text CHECK (status IN ('idea', 'planned', 'filming', 'editing', 'scheduled', 'published')) DEFAULT 'idea',
  suggested_hook text,
  talking_points text[],
  filming_notes text,
  scheduled_date date,
  scheduled_time time,
  published_url text,
  performance_notes text,
  is_ai_suggested boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.content_ideas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own content ideas" ON public.content_ideas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own content ideas" ON public.content_ideas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own content ideas" ON public.content_ideas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own content ideas" ON public.content_ideas FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_content_ideas_updated_at BEFORE UPDATE ON public.content_ideas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- CONTENT CALENDAR SETTINGS
CREATE TABLE public.content_calendar_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  posts_per_week_goal integer DEFAULT 4,
  preferred_filming_day text,
  preferred_posting_times jsonb,
  content_pillars text[] DEFAULT '{"educational","transformation","behind_the_scenes","promotional"}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.content_calendar_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own calendar settings" ON public.content_calendar_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own calendar settings" ON public.content_calendar_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own calendar settings" ON public.content_calendar_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER update_content_calendar_settings_updated_at BEFORE UPDATE ON public.content_calendar_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- CLIENTS
CREATE TABLE public.clients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  full_name text NOT NULL,
  email text,
  phone text,
  last_service text,
  last_visit_date date,
  next_suggested_date date,
  visit_count integer DEFAULT 0,
  lifetime_value numeric(10,2) DEFAULT 0,
  status text CHECK (status IN ('active', 'lapsed', 'lost', 'new')) DEFAULT 'active',
  tags text[],
  notes text,
  referral_source text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own clients" ON public.clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own clients" ON public.clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own clients" ON public.clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own clients" ON public.clients FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- APPOINTMENTS
CREATE TABLE public.appointments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  service_name text,
  service_price numeric(10,2),
  appointment_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text CHECK (status IN ('booked', 'completed', 'cancelled', 'no_show')) DEFAULT 'booked',
  source text DEFAULT 'manual',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own appointments" ON public.appointments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own appointments" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own appointments" ON public.appointments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own appointments" ON public.appointments FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- REACTIVATION CAMPAIGNS
CREATE TABLE public.reactivation_campaigns (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  campaign_type text CHECK (campaign_type IN ('gap_filler', 'lapsed_client', 'seasonal_promo', 'birthday')),
  name text NOT NULL,
  status text CHECK (status IN ('draft', 'active', 'paused', 'completed')) DEFAULT 'draft',
  message_template text NOT NULL,
  channel text CHECK (channel IN ('sms', 'email', 'both')) DEFAULT 'sms',
  target_criteria jsonb,
  send_count integer DEFAULT 0,
  open_count integer DEFAULT 0,
  booking_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.reactivation_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own campaigns" ON public.reactivation_campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own campaigns" ON public.reactivation_campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own campaigns" ON public.reactivation_campaigns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own campaigns" ON public.reactivation_campaigns FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_reactivation_campaigns_updated_at BEFORE UPDATE ON public.reactivation_campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- CAMPAIGN MESSAGES
CREATE TABLE public.campaign_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid REFERENCES public.reactivation_campaigns(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  channel text CHECK (channel IN ('sms', 'email')) NOT NULL,
  message_body text NOT NULL,
  status text CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'clicked', 'booked')) DEFAULT 'pending',
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.campaign_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own messages" ON public.campaign_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own messages" ON public.campaign_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own messages" ON public.campaign_messages FOR UPDATE USING (auth.uid() = user_id);

-- REVIEWS
CREATE TABLE public.reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  platform text CHECK (platform IN ('google', 'yelp', 'facebook', 'instagram', 'other')),
  rating integer CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  reviewer_name text,
  review_date date,
  response_text text,
  responded_at timestamptz,
  review_request_sent boolean DEFAULT false,
  request_sent_at timestamptz,
  source_url text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own reviews" ON public.reviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- REVIEW REQUEST SETTINGS
CREATE TABLE public.review_request_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  auto_request_enabled boolean DEFAULT true,
  delay_after_appointment_hours integer DEFAULT 2,
  message_template text DEFAULT 'Hi {client_name}! Thank you for visiting today. If you loved your experience, I would really appreciate a quick Google review. It helps my small business so much! {review_link}',
  preferred_platform text DEFAULT 'google',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.review_request_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own review settings" ON public.review_request_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own review settings" ON public.review_request_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own review settings" ON public.review_request_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER update_review_request_settings_updated_at BEFORE UPDATE ON public.review_request_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- CALENDAR GAPS
CREATE TABLE public.calendar_gaps (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  gap_date date NOT NULL,
  gap_start_time time NOT NULL,
  gap_end_time time NOT NULL,
  duration_minutes integer,
  status text CHECK (status IN ('open', 'campaign_sent', 'filled', 'ignored')) DEFAULT 'open',
  campaign_id uuid REFERENCES public.reactivation_campaigns(id) ON DELETE SET NULL,
  detected_at timestamptz DEFAULT now()
);
ALTER TABLE public.calendar_gaps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own gaps" ON public.calendar_gaps FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own gaps" ON public.calendar_gaps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own gaps" ON public.calendar_gaps FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own gaps" ON public.calendar_gaps FOR DELETE USING (auth.uid() = user_id);
