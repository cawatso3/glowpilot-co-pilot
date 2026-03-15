import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useContentCalendarSettings } from '@/hooks/useContentCalendarSettings';
import { useIntegrations } from '@/hooks/useIntegrations';
import { useSyncLogs } from '@/hooks/useSyncLogs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';

import { Save, LogOut, Calendar, CreditCard, Scissors, Sparkles, Video, Camera, MapPin, MessageSquare, Mail, Brain, ChevronDown, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { IntegrationCard } from '@/components/integrations/IntegrationCard';
import { ApiKeyConnectionForm } from '@/components/integrations/ApiKeyConnectionForm';
import { OAuthConnectionButton } from '@/components/integrations/OAuthConnectionButton';
import { ConnectionStatusDot } from '@/components/integrations/ConnectionStatusDot';
import { formatDistanceToNow } from 'date-fns';
import type { BusinessType, BookingPlatform, IntegrationProvider } from '@/types/database';

const CONTENT_PILLARS = ['educational', 'transformation', 'behind_the_scenes', 'testimonial', 'promotional', 'trending', 'personal'];
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { profile, isLoading, updateProfile } = useProfile(user?.id);
  const { settings: calSettings, isLoading: calLoading, upsertSettings } = useContentCalendarSettings(user?.id);
  const { integrations, isLoading: intLoading, upsertIntegration, deleteIntegration, getIntegration, isConnected } = useIntegrations(user?.id);
  const { data: syncLogs = [] } = useSyncLogs(user?.id);
  const { toast } = useToast();

  const [form, setForm] = useState({
    business_name: '',
    business_type: 'esthetician' as BusinessType,
    city: '',
    state: '',
    phone: '',
    booking_link: '',
    google_business_profile_url: '',
    booking_platform: 'none' as BookingPlatform,
  });

  const [postsGoal, setPostsGoal] = useState(4);
  const [filmingDay, setFilmingDay] = useState('none');
  const [contentPillars, setContentPillars] = useState<string[]>(['educational', 'transformation', 'behind_the_scenes', 'promotional']);
  const [tiktokTime, setTiktokTime] = useState('');
  const [instagramTime, setInstagramTime] = useState('');
  const [connectingProvider, setConnectingProvider] = useState<IntegrationProvider | null>(null);
  const [syncingProvider, setSyncingProvider] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setForm({
        business_name: profile.business_name || '',
        business_type: profile.business_type as BusinessType,
        city: profile.city || '',
        state: profile.state || '',
        phone: profile.phone || '',
        booking_link: profile.booking_link || '',
        google_business_profile_url: profile.google_business_profile_url || '',
        booking_platform: (profile.booking_platform as BookingPlatform) || 'none',
      });
    }
  }, [profile]);

  useEffect(() => {
    if (calSettings) {
      setPostsGoal(calSettings.posts_per_week_goal ?? 4);
      setFilmingDay(calSettings.preferred_filming_day || 'none');
      setContentPillars(calSettings.content_pillars || ['educational', 'transformation', 'behind_the_scenes', 'promotional']);
      const times = calSettings.preferred_posting_times as Record<string, string> | null;
      setTiktokTime(times?.tiktok || '');
      setInstagramTime(times?.instagram || '');
    }
  }, [calSettings]);

  const handleSave = async () => {
    await updateProfile.mutateAsync(form);
    toast({ title: 'Settings saved!' });
  };

  const handleSaveContent = async () => {
    const postingTimes: Record<string, string> = {};
    if (tiktokTime) postingTimes.tiktok = tiktokTime;
    if (instagramTime) postingTimes.instagram = instagramTime;
    await upsertSettings.mutateAsync({
      posts_per_week_goal: postsGoal,
      preferred_filming_day: filmingDay === 'none' ? null : filmingDay,
      content_pillars: contentPillars,
      preferred_posting_times: Object.keys(postingTimes).length > 0 ? postingTimes : null,
    });
    toast({ title: 'Content preferences saved!' });
  };

  const handleApiKeyConnect = async (provider: IntegrationProvider, credentials: Record<string, string>) => {
    setConnectingProvider(provider);
    try {
      const { error } = await supabase.functions.invoke('test-connection', { body: { provider, credentials } });
      if (error) throw error;
      await upsertIntegration.mutateAsync({
        provider,
        status: 'connected',
        credentials: credentials as any,
        display_name: credentials.phone_number || credentials.user_id || null,
      });
      toast({ title: `${provider} connected!` });
    } catch (err: any) {
      await upsertIntegration.mutateAsync({ provider, status: 'error', last_error: err.message });
      toast({ title: 'Connection failed', description: err.message || 'Could not verify credentials. The edge function may not be deployed yet.', variant: 'destructive' });
    } finally {
      setConnectingProvider(null);
    }
  };

  const handleDisconnect = async (provider: IntegrationProvider) => {
    await deleteIntegration.mutateAsync(provider);
    toast({ title: 'Disconnected' });
  };

  const handleSync = async (provider: IntegrationProvider, fnName: string) => {
    setSyncingProvider(provider);
    try {
      const { error } = await supabase.functions.invoke(fnName, { body: { user_id: user?.id } });
      if (error) throw error;
      await upsertIntegration.mutateAsync({ provider, last_sync_at: new Date().toISOString() });
      toast({ title: 'Sync complete!' });
    } catch (err: any) {
      toast({ title: 'Sync failed', description: err.message || 'Edge function may not be deployed yet.', variant: 'destructive' });
    } finally {
      setSyncingProvider(null);
    }
  };

  if (isLoading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-lg" />)}</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <Button variant="ghost" size="sm" onClick={() => signOut()} className="text-destructive hover:text-destructive">
          <LogOut className="h-4 w-4" /> Sign Out
        </Button>
      </div>

      {/* Business Profile */}
      <Card className="border-none shadow-low">
        <CardHeader><CardTitle className="text-lg">Business Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Business Name</Label>
              <Input value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Business Type</Label>
              <Select value={form.business_type} onValueChange={(v) => setForm({ ...form, business_type: v as BusinessType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="esthetician">Esthetician</SelectItem>
                  <SelectItem value="nail_tech">Nail Technician</SelectItem>
                  <SelectItem value="lash_artist">Lash Artist</SelectItem>
                  <SelectItem value="hair_stylist">Hair Stylist</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
            <div className="space-y-2"><Label>State</Label><Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
          </div>
          <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="space-y-2"><Label>Booking Link</Label><Input value={form.booking_link} onChange={(e) => setForm({ ...form, booking_link: e.target.value })} placeholder="https://..." /></div>
          <div className="space-y-2"><Label>Google Business URL</Label><Input value={form.google_business_profile_url} onChange={(e) => setForm({ ...form, google_business_profile_url: e.target.value })} placeholder="https://..." /></div>
          <div className="space-y-2">
            <Label>Booking Platform</Label>
            <Select value={form.booking_platform} onValueChange={(v) => setForm({ ...form, booking_platform: v as BookingPlatform })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="glossgenius">GlossGenius</SelectItem>
                <SelectItem value="vagaro">Vagaro</SelectItem>
                <SelectItem value="square">Square</SelectItem>
                <SelectItem value="fresha">Fresha</SelectItem>
                <SelectItem value="acuity">Acuity</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSave} disabled={updateProfile.isPending}>
            <Save className="h-4 w-4" /> {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      {/* Content Preferences */}
      <Card className="border-none shadow-low">
        <CardHeader><CardTitle className="text-lg">Content Preferences</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {calLoading ? <Skeleton className="h-20 rounded-lg" /> : (
            <>
              <div className="space-y-3">
                <Label>Posts per week goal: {postsGoal}</Label>
                <Slider value={[postsGoal]} onValueChange={([v]) => setPostsGoal(v)} min={1} max={7} step={1} />
              </div>
              <div className="space-y-2">
                <Label>Preferred filming day</Label>
                <Select value={filmingDay} onValueChange={setFilmingDay}>
                  <SelectTrigger><SelectValue placeholder="No preference" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No preference</SelectItem>
                    {DAYS_OF_WEEK.map(d => <SelectItem key={d} value={d.toLowerCase()}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Content pillars</Label>
                <div className="flex flex-wrap gap-3">
                  {CONTENT_PILLARS.map(p => (
                    <label key={p} className="flex items-center gap-1.5 text-sm capitalize">
                      <Checkbox
                        checked={contentPillars.includes(p)}
                        onCheckedChange={(checked) => setContentPillars(prev => checked ? [...prev, p] : prev.filter(x => x !== p))}
                      />
                      {p.replace(/_/g, ' ')}
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>TikTok posting time</Label>
                  <Input type="time" value={tiktokTime} onChange={(e) => setTiktokTime(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Instagram posting time</Label>
                  <Input type="time" value={instagramTime} onChange={(e) => setInstagramTime(e.target.value)} />
                </div>
              </div>
              <Button onClick={handleSaveContent} disabled={upsertSettings.isPending}>
                <Save className="h-4 w-4" /> Save Content Preferences
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Integrations */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Integrations</h2>

        {/* Booking Platforms */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Booking Platforms</h3>

          <IntegrationCard
            name="Acuity Scheduling" description="Sync appointments, clients, and availability. Powers gap detection." icon={Calendar} category="Booking"
            integration={getIntegration('acuity')}
            onConnect={() => {}} onDisconnect={() => handleDisconnect('acuity')}
            onSync={() => handleSync('acuity', 'sync-acuity')} isSyncing={syncingProvider === 'acuity'}
          >
            <ApiKeyConnectionForm
              provider="acuity"
              fields={[
                { key: 'user_id', label: 'Acuity User ID', type: 'text', placeholder: 'Your Acuity User ID' },
                { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'Your Acuity API key' },
              ]}
              onSubmit={(creds) => handleApiKeyConnect('acuity', creds)}
              onCancel={() => {}}
              isLoading={connectingProvider === 'acuity'}
              helpLink="https://help.acuityscheduling.com/hc/en-us/articles/4402393545869-Finding-Your-API-Credentials"
            />
          </IntegrationCard>

          <IntegrationCard
            name="Square Appointments" description="Import appointments and client data from Square." icon={CreditCard} category="Booking"
            integration={getIntegration('square')}
            onConnect={() => {}} onDisconnect={() => handleDisconnect('square')}
          >
            <div className="pt-3 border-t border-border">
              <OAuthConnectionButton provider="square" label="Connect Square Account" />
            </div>
          </IntegrationCard>

          <IntegrationCard
            name="Vagaro" description="Receive appointment and client webhooks from Vagaro." icon={Scissors} category="Booking"
            integration={getIntegration('vagaro')}
            onConnect={() => {}} onDisconnect={() => handleDisconnect('vagaro')}
            noteText="Requires Vagaro's Webhooks & APIs premium feature ($10/mo). Contact Vagaro Enterprise Sales to enable."
          >
            <ApiKeyConnectionForm
              provider="vagaro"
              fields={[{ key: 'webhook_secret', label: 'Webhook Secret', type: 'password', placeholder: 'Your Vagaro webhook secret' }]}
              onSubmit={(creds) => handleApiKeyConnect('vagaro', creds)}
              onCancel={() => {}}
              isLoading={connectingProvider === 'vagaro'}
            />
          </IntegrationCard>

          <Card className="border-none shadow-low">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                  <Sparkles className="h-5 w-5 text-foreground/70" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm">GlossGenius</h3>
                    <Badge variant="outline" className="text-xs">Booking</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Import clients and appointments via CSV export or Google Calendar sync.</p>
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm" onClick={() => toast({ title: 'Coming soon', description: 'CSV import will be available when the edge function is deployed.' })}>
                      <Upload className="h-3 w-3" /> Import CSV
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Or connect your Google account below — GlowPilot will read your GlossGenius appointments from your synced Google Calendar.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <IntegrationCard
            name="Fresha" description="Fresha does not offer API access." icon={Calendar} category="Booking"
            integration={null}
            onConnect={() => {}} onDisconnect={() => {}}
            disabled disabledMessage="Not available"
            noteText="Not available — Fresha does not provide API access for third-party integrations. You can manually add appointments in the Calendar page."
          />
        </div>

        {/* Social Media */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Social Media</h3>

          <IntegrationCard
            name="TikTok" description="Upload content as drafts to TikTok. Add sounds and effects in the app, then publish." icon={Video} category="Social"
            integration={getIntegration('tiktok')}
            onConnect={() => {}} onDisconnect={() => handleDisconnect('tiktok')}
            noteText="Videos uploaded through GlowPilot appear as drafts in your TikTok app for final editing."
          >
            <div className="pt-3 border-t border-border">
              <OAuthConnectionButton provider="tiktok" label="Connect TikTok Account" />
            </div>
          </IntegrationCard>

          <IntegrationCard
            name="Instagram" description="Publish photos, Reels, and carousels. View post performance insights." icon={Camera} category="Social"
            integration={getIntegration('instagram')}
            onConnect={() => {}} onDisconnect={() => handleDisconnect('instagram')}
          >
            <div className="pt-3 border-t border-border">
              <OAuthConnectionButton provider="instagram" label="Connect Instagram via Facebook" />
            </div>
          </IntegrationCard>

          <IntegrationCard
            name="Google Business Profile" description="Pull reviews, reply to reviews, and publish Google Business posts." icon={MapPin} category="Reviews & Local"
            integration={getIntegration('google_business')}
            onConnect={() => {}} onDisconnect={() => handleDisconnect('google_business')}
            onSync={() => handleSync('google_business', 'sync-gbp-reviews')} isSyncing={syncingProvider === 'google_business'}
          >
            <div className="pt-3 border-t border-border">
              <OAuthConnectionButton provider="google_business" label="Connect Google Business" />
            </div>
          </IntegrationCard>
        </div>

        {/* Messaging */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Messaging</h3>

          <IntegrationCard
            name="Twilio (SMS)" description="Send SMS campaigns and review requests to clients." icon={MessageSquare} category="Messaging"
            integration={getIntegration('twilio')}
            onConnect={() => {}} onDisconnect={() => handleDisconnect('twilio')}
            noteText="US business SMS requires A2P 10DLC registration. Complete this in your Twilio console."
          >
            <ApiKeyConnectionForm
              provider="twilio"
              fields={[
                { key: 'account_sid', label: 'Account SID', type: 'text', placeholder: 'Your Twilio Account SID' },
                { key: 'auth_token', label: 'Auth Token', type: 'password', placeholder: 'Your Twilio Auth Token' },
                { key: 'phone_number', label: 'Phone Number', type: 'text', placeholder: '+15017122661' },
              ]}
              onSubmit={(creds) => handleApiKeyConnect('twilio', creds)}
              onCancel={() => {}}
              isLoading={connectingProvider === 'twilio'}
              helpLink="https://www.twilio.com/docs/usage/api#authenticate-with-http"
            />
          </IntegrationCard>

          <IntegrationCard
            name="Resend (Email)" description="Send email campaigns, review requests, and automated follow-ups." icon={Mail} category="Messaging"
            integration={getIntegration('resend')}
            onConnect={() => {}} onDisconnect={() => handleDisconnect('resend')}
          >
            <ApiKeyConnectionForm
              provider="resend"
              fields={[{ key: 'api_key', label: 'API Key', type: 'password', placeholder: 'Your Resend API key' }]}
              onSubmit={(creds) => handleApiKeyConnect('resend', creds)}
              onCancel={() => {}}
              isLoading={connectingProvider === 'resend'}
              helpLink="https://resend.com/api-keys"
            />
          </IntegrationCard>
        </div>

        {/* Recent Sync Activity */}
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between text-sm">
              Recent Sync Activity
              <ChevronDown className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="border-none shadow-low mt-2">
              <CardContent className="p-4">
                {syncLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center">No sync activity yet</p>
                ) : (
                  <div className="space-y-2">
                    {syncLogs.map(log => (
                      <div key={log.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2">
                          <ConnectionStatusDot status={log.status === 'running' ? 'connecting' : log.status === 'completed' ? 'connected' : 'error'} />
                          <span className="capitalize">{log.provider}</span>
                          <span className="text-muted-foreground">{log.sync_type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>{log.records_synced} records</span>
                          <span className="text-muted-foreground">{formatDistanceToNow(new Date(log.started_at), { addSuffix: true })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Notifications */}
      <Card className="border-none shadow-low">
        <CardHeader><CardTitle className="text-lg">Notifications</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {['Daily briefing email', 'Gap alert notifications', 'Review alert notifications', 'Content reminder notifications'].map(pref => (
            <div key={pref} className="flex items-center justify-between">
              <Label className="text-sm">{pref}</Label>
              <Switch defaultChecked onCheckedChange={() => toast({ title: 'Coming soon', description: 'Notification preferences will be configurable in the next update.' })} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card className="border-none shadow-low">
        <CardHeader><CardTitle className="text-lg">Subscription & Billing</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Free Plan</p>
              <p className="text-xs text-muted-foreground">Basic features included</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => toast({ title: 'Coming soon', description: 'Billing will be available soon.' })}>
              Manage Subscription
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
