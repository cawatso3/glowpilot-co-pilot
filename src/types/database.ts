export type BusinessType = 'esthetician' | 'nail_tech' | 'lash_artist' | 'hair_stylist' | 'other';
export type BookingPlatform = 'glossgenius' | 'vagaro' | 'square' | 'fresha' | 'acuity' | 'other' | 'none';
export type ContentType = 'educational' | 'transformation' | 'behind_the_scenes' | 'testimonial' | 'promotional' | 'trending' | 'personal';
export type ContentPlatform = 'tiktok' | 'instagram' | 'google_business' | 'all';
export type ContentStatus = 'idea' | 'planned' | 'filming' | 'editing' | 'scheduled' | 'published';
export type ClientStatus = 'active' | 'lapsed' | 'lost' | 'new';
export type AppointmentStatus = 'booked' | 'completed' | 'cancelled' | 'no_show';
export type AppointmentSource = 'manual' | 'reactivation_campaign' | 'referral' | 'walk_in' | 'online';
export type CampaignType = 'gap_filler' | 'lapsed_client' | 'seasonal_promo' | 'birthday';
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed';
export type CampaignChannel = 'sms' | 'email' | 'both';
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'clicked' | 'booked';
export type ReviewPlatform = 'google' | 'yelp' | 'facebook' | 'instagram' | 'other';
export type GapStatus = 'open' | 'campaign_sent' | 'filled' | 'ignored';

export type IntegrationProvider = 'acuity' | 'square' | 'vagaro' | 'tiktok' | 'instagram' | 'google_business' | 'twilio' | 'resend';
export type IntegrationStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
export type SyncType = 'appointments' | 'clients' | 'reviews' | 'content_publish' | 'gap_detection';
export type SyncStatus = 'running' | 'completed' | 'failed';

export interface Integration {
  id: string;
  user_id: string;
  provider: IntegrationProvider;
  status: IntegrationStatus;
  credentials: Record<string, unknown> | null;
  display_name: string | null;
  last_sync_at: string | null;
  last_error: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface SyncLog {
  id: string;
  user_id: string;
  provider: string;
  sync_type: SyncType;
  status: SyncStatus;
  records_synced: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

export interface Profile {
  id: string;
  full_name: string | null;
  business_name: string | null;
  business_type: BusinessType;
  phone: string | null;
  email: string | null;
  timezone: string;
  city: string | null;
  state: string | null;
  google_business_profile_url: string | null;
  booking_platform: BookingPlatform | null;
  booking_link: string | null;
  avatar_url: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContentIdea {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  content_type: ContentType;
  platform: ContentPlatform;
  status: ContentStatus;
  suggested_hook: string | null;
  talking_points: string[] | null;
  filming_notes: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  published_url: string | null;
  performance_notes: string | null;
  is_ai_suggested: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ContentCalendarSettings {
  id: string;
  user_id: string;
  posts_per_week_goal: number;
  preferred_filming_day: string | null;
  preferred_posting_times: Record<string, string> | null;
  content_pillars: string[];
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  last_service: string | null;
  last_visit_date: string | null;
  next_suggested_date: string | null;
  visit_count: number;
  lifetime_value: number;
  status: ClientStatus;
  tags: string[] | null;
  notes: string | null;
  referral_source: string | null;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  client_id: string | null;
  service_name: string | null;
  service_price: number | null;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  source: AppointmentSource;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReactivationCampaign {
  id: string;
  user_id: string;
  campaign_type: CampaignType;
  name: string;
  status: CampaignStatus;
  message_template: string;
  channel: CampaignChannel;
  target_criteria: Record<string, unknown> | null;
  send_count: number;
  open_count: number;
  booking_count: number;
  created_at: string;
  updated_at: string;
}

export interface CampaignMessage {
  id: string;
  campaign_id: string;
  client_id: string;
  user_id: string;
  channel: 'sms' | 'email';
  message_body: string;
  status: MessageStatus;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  client_id: string | null;
  platform: ReviewPlatform;
  rating: number | null;
  review_text: string | null;
  reviewer_name: string | null;
  review_date: string | null;
  response_text: string | null;
  responded_at: string | null;
  review_request_sent: boolean;
  request_sent_at: string | null;
  source_url: string | null;
  created_at: string;
}

export interface ReviewRequestSettings {
  id: string;
  user_id: string;
  auto_request_enabled: boolean;
  delay_after_appointment_hours: number;
  message_template: string;
  preferred_platform: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarGap {
  id: string;
  user_id: string;
  gap_date: string;
  gap_start_time: string;
  gap_end_time: string;
  duration_minutes: number;
  status: GapStatus;
  campaign_id: string | null;
  detected_at: string;
}
