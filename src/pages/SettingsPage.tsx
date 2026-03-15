import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useContentCalendarSettings } from '@/hooks/useContentCalendarSettings';
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
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Save, LogOut, Link as LinkIcon } from 'lucide-react';
import type { BusinessType, BookingPlatform } from '@/types/database';

const INTEGRATIONS = [
  { name: 'GlossGenius', category: 'Booking', desc: 'Sync appointments and client data' },
  { name: 'Vagaro', category: 'Booking', desc: 'Import bookings and gaps automatically' },
  { name: 'Square', category: 'Booking', desc: 'Sync Square appointments' },
  { name: 'TikTok', category: 'Social', desc: 'Auto-publish content to TikTok' },
  { name: 'Instagram', category: 'Social', desc: 'Schedule and publish to Instagram' },
  { name: 'Google Business', category: 'Reviews', desc: 'Pull reviews and manage your profile' },
  { name: 'Twilio (SMS)', category: 'Messaging', desc: 'Send SMS campaigns to clients' },
  { name: 'SendGrid (Email)', category: 'Messaging', desc: 'Send email campaigns' },
];

const CONTENT_PILLARS = ['educational', 'transformation', 'behind_the_scenes', 'testimonial', 'promotional', 'trending', 'personal'];
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { profile, isLoading, updateProfile } = useProfile(user?.id);
  const { settings: calSettings, isLoading: calLoading, upsertSettings } = useContentCalendarSettings(user?.id);
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

  // Content preferences state
  const [postsGoal, setPostsGoal] = useState(4);
  const [filmingDay, setFilmingDay] = useState('');
  const [contentPillars, setContentPillars] = useState<string[]>(['educational', 'transformation', 'behind_the_scenes', 'promotional']);
  const [tiktokTime, setTiktokTime] = useState('');
  const [instagramTime, setInstagramTime] = useState('');

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
      preferred_filming_day: filmingDay || null,
      content_pillars: contentPillars,
      preferred_posting_times: Object.keys(postingTimes).length > 0 ? postingTimes : null,
    });
    toast({ title: 'Content preferences saved!' });
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (isLoading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-lg" />)}</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-destructive hover:text-destructive">
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
          {calLoading ? (
            <Skeleton className="h-20 rounded-lg" />
          ) : (
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
                        onCheckedChange={(checked) => {
                          setContentPillars(prev => checked ? [...prev, p] : prev.filter(x => x !== p));
                        }}
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
      <Card className="border-none shadow-low">
        <CardHeader><CardTitle className="text-lg">Integrations</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {INTEGRATIONS.map(int => (
            <div key={int.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <LinkIcon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{int.name}</p>
                  <p className="text-xs text-muted-foreground">{int.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">Coming Soon</Badge>
                <Button variant="outline" size="sm" onClick={() => { console.log(`Connect ${int.name} clicked`); toast({ title: 'Coming soon', description: `${int.name} integration will be available in the next update.` }); }}>
                  Connect
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

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
