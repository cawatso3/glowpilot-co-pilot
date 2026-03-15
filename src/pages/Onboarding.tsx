import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { GlowPilotLogo } from '@/components/GlowPilotLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, ArrowRight, ArrowLeft, Check } from 'lucide-react';

const BUSINESS_TYPES = [
  { value: 'esthetician', label: 'Esthetician' },
  { value: 'nail_tech', label: 'Nail Technician' },
  { value: 'lash_artist', label: 'Lash Artist' },
  { value: 'hair_stylist', label: 'Hair Stylist' },
  { value: 'other', label: 'Other' },
];

const BOOKING_PLATFORMS = [
  { value: 'glossgenius', label: 'GlossGenius' },
  { value: 'vagaro', label: 'Vagaro' },
  { value: 'square', label: 'Square' },
  { value: 'fresha', label: 'Fresha' },
  { value: 'acuity', label: 'Acuity' },
  { value: 'other', label: 'Other' },
  { value: 'none', label: 'None yet' },
];

const PLATFORMS = ['TikTok', 'Instagram', 'Google Business Profile'];
const CHALLENGES = ['Staying consistent', 'Finding content ideas', 'Filling slow days', 'Getting reviews'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const { user } = useAuth();
  const { updateProfile } = useProfile(user?.id);
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('esthetician');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [bookingPlatform, setBookingPlatform] = useState('none');
  const [postsPerWeek, setPostsPerWeek] = useState(4);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [filmingDay, setFilmingDay] = useState('');
  const [challenges, setChallenges] = useState<string[]>([]);

  const handleFinish = async () => {
    await updateProfile.mutateAsync({
      full_name: fullName,
      business_name: businessName,
      business_type: businessType as any,
      city,
      state,
      booking_platform: bookingPlatform as any,
      onboarding_completed: true,
    });

    if (user?.id) {
      await supabase.from('content_calendar_settings').upsert({
        user_id: user.id,
        posts_per_week_goal: postsPerWeek,
        preferred_filming_day: filmingDay.toLowerCase() || null,
        content_pillars: ['educational', 'transformation', 'behind_the_scenes', 'promotional'],
      });
    }

    navigate('/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Progress */}
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="h-6 w-6" />
                <span className="font-display text-2xl font-semibold">Welcome to GlowPilot!</span>
              </div>
              <p className="text-muted-foreground">Let's set up your marketing co-pilot in 2 minutes. We help you stay consistent with YOUR content — no AI-generated posts, just smarter systems.</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
              </div>
              <div className="space-y-2">
                <Label>Business Name</Label>
                <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. Glow by Sarah" />
              </div>
            </div>
            <Button onClick={() => setStep(2)} className="w-full" disabled={!fullName}>
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="font-display text-2xl font-semibold">About Your Business</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Business Type</Label>
                <Select value={businessType} onValueChange={setBusinessType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="State" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Booking Platform</Label>
                <Select value={bookingPlatform} onValueChange={setBookingPlatform}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BOOKING_PLATFORMS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="h-4 w-4" /> Back</Button>
              <Button onClick={() => setStep(3)} className="flex-1">Next <ArrowRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="font-display text-2xl font-semibold">Your Content Goals</h2>
            <div className="space-y-4">
              <div className="space-y-3">
                <Label>Posts per week: {postsPerWeek}</Label>
                <Slider value={[postsPerWeek]} onValueChange={([v]) => setPostsPerWeek(v)} min={1} max={7} step={1} />
              </div>
              <div className="space-y-2">
                <Label>Platforms</Label>
                <div className="space-y-2">
                  {PLATFORMS.map((p) => (
                    <label key={p} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={selectedPlatforms.includes(p)}
                        onCheckedChange={(c) => setSelectedPlatforms(c ? [...selectedPlatforms, p] : selectedPlatforms.filter(x => x !== p))}
                      />
                      {p}
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Preferred Filming Day (optional)</Label>
                <Select value={filmingDay} onValueChange={setFilmingDay}>
                  <SelectTrigger><SelectValue placeholder="Choose a day" /></SelectTrigger>
                  <SelectContent>
                    {DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Biggest marketing challenge?</Label>
                <div className="space-y-2">
                  {CHALLENGES.map((c) => (
                    <label key={c} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={challenges.includes(c)}
                        onCheckedChange={(checked) => setChallenges(checked ? [...challenges, c] : challenges.filter(x => x !== c))}
                      />
                      {c}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)}><ArrowLeft className="h-4 w-4" /> Back</Button>
              <Button onClick={() => setStep(4)} className="flex-1">Next <ArrowRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-2">
              <h2 className="font-display text-2xl font-semibold flex items-center gap-2">
                You're all set! <Check className="h-6 w-6 text-primary" />
              </h2>
              <p className="text-muted-foreground">Here's a summary of your setup:</p>
            </div>
            <div className="space-y-3 rounded-lg bg-card p-4 shadow-low">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Name</span><span className="font-medium">{fullName}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Business</span><span className="font-medium">{businessName || '—'}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Type</span><span className="font-medium capitalize">{businessType.replace('_', ' ')}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Location</span><span className="font-medium">{city && state ? `${city}, ${state}` : '—'}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Posts/week goal</span><span className="font-medium">{postsPerWeek}</span></div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(3)}><ArrowLeft className="h-4 w-4" /> Back</Button>
              <Button onClick={handleFinish} variant="accent" className="flex-1" disabled={updateProfile.isPending}>
                {updateProfile.isPending ? 'Saving...' : 'Go to Dashboard'} <Sparkles className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
