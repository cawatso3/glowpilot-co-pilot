import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useClients } from '@/hooks/useClients';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Plus, CalendarClock, Users, Gift, Cake, Send, Megaphone } from 'lucide-react';
import type { CampaignType, CampaignStatus } from '@/types/database';

const CAMPAIGN_TYPES: { value: CampaignType; label: string; icon: any; desc: string }[] = [
  { value: 'gap_filler', label: 'Fill Calendar Gaps', icon: CalendarClock, desc: 'Target clients who haven\'t visited recently to fill detected gaps' },
  { value: 'lapsed_client', label: 'Reactivate Lapsed', icon: Users, desc: 'Bring back clients who haven\'t visited in 45+ days' },
  { value: 'seasonal_promo', label: 'Seasonal Promotion', icon: Gift, desc: 'Run a seasonal special for active clients' },
  { value: 'birthday', label: 'Birthday Special', icon: Cake, desc: 'Celebrate clients with upcoming birthdays' },
];

const STATUS_STYLES: Record<CampaignStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  active: 'bg-green-100 text-green-700',
  paused: 'bg-amber-100 text-amber-700',
  completed: 'bg-blue-100 text-blue-700',
};

const TEMPLATES: Record<CampaignType, string[]> = {
  gap_filler: [
    'Hi {client_name}! I have a last-minute opening this week. Would you like to book a {last_service}? Book here: {booking_link}',
    'Hey {client_name}! A spot just opened up in my schedule. Treat yourself! Book now: {booking_link}',
  ],
  lapsed_client: [
    'Hi {client_name}! It\'s been {days_since_visit} days since your last visit. Missing you! Book your next appointment: {booking_link}',
    'Hey {client_name}! Your skin misses you 😊 It\'s been a while — time for a refresh? {booking_link}',
  ],
  seasonal_promo: [
    'Spring special! ✨ Get 15% off any facial this month. Book now: {booking_link}',
  ],
  birthday: [
    'Happy Birthday {client_name}! 🎂 Enjoy 20% off your next visit as our gift to you. Book here: {booking_link}',
  ],
};

export default function CampaignsPage() {
  const { user } = useAuth();
  const { campaigns, isLoading, createCampaign } = useCampaigns(user?.id);
  const { clients } = useClients(user?.id);
  const { toast } = useToast();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [campaignType, setCampaignType] = useState<CampaignType>('gap_filler');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [channel, setChannel] = useState<'sms' | 'email' | 'both'>('sms');

  const lapsedCount = clients.filter(c => c.status === 'lapsed').length;

  const handleCreate = async () => {
    await createCampaign.mutateAsync({
      campaign_type: campaignType,
      name: name || CAMPAIGN_TYPES.find(t => t.value === campaignType)?.label || '',
      message_template: message,
      channel,
    } as any);
    setWizardOpen(false);
    setStep(1);
    setName('');
    setMessage('');
    toast({ title: 'Campaign created!' });
  };

  const startWizard = (type?: CampaignType) => {
    if (type) setCampaignType(type);
    setMessage(TEMPLATES[type || campaignType]?.[0] || '');
    setWizardOpen(true);
    setStep(type ? 2 : 1);
  };

  if (isLoading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-lg" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Campaigns</h1>
        <Button size="sm" onClick={() => startWizard()}><Plus className="h-4 w-4" /> Create Campaign</Button>
      </div>

      {campaigns.length === 0 ? (
        <Card className="border-none shadow-low">
          <CardContent className="p-8 text-center space-y-4">
            <Megaphone className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">No campaigns yet. Create one to start re-engaging clients and filling gaps.</p>
            <Button onClick={() => startWizard()} variant="accent">Create Your First Campaign</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {campaigns.map(campaign => (
            <Card key={campaign.id} className="border-none shadow-low hover:shadow-mid transition-all">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{campaign.name}</h3>
                    <p className="text-xs text-muted-foreground capitalize">{campaign.campaign_type?.replace(/_/g, ' ')} · {campaign.channel}</p>
                  </div>
                  <Badge className={`${STATUS_STYLES[campaign.status as CampaignStatus]} text-xs capitalize border-none`}>{campaign.status}</Badge>
                </div>
                <div className="flex gap-4 text-xs">
                  <div><span className="font-semibold tabular-nums">{campaign.send_count}</span> sent</div>
                  <div><span className="font-semibold tabular-nums">{campaign.open_count}</span> opened</div>
                  <div><span className="font-semibold tabular-nums">{campaign.booking_count}</span> booked</div>
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={() => toast({ title: 'Coming soon', description: 'Campaign sending will be connected in the next update.' })}>
                  <Send className="h-4 w-4" /> Send Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Campaign Wizard */}
      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Create Campaign — Step {step}/4</DialogTitle></DialogHeader>

          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Choose campaign type:</p>
              {CAMPAIGN_TYPES.map(type => (
                <Card
                  key={type.value}
                  className={`border cursor-pointer transition-all ${campaignType === type.value ? 'ring-2 ring-primary' : 'hover:shadow-mid'}`}
                  onClick={() => { setCampaignType(type.value); setMessage(TEMPLATES[type.value][0]); }}
                >
                  <CardContent className="flex items-center gap-3 p-3">
                    <type.icon className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">{type.label}</p>
                      <p className="text-xs text-muted-foreground">{type.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button onClick={() => setStep(2)} className="w-full">Next</Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Define your audience</p>
              <div className="rounded-lg bg-muted/50 p-4 text-center">
                <p className="text-2xl font-semibold">{campaignType === 'lapsed_client' ? lapsedCount : clients.length}</p>
                <p className="text-sm text-muted-foreground">clients targeted</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button onClick={() => setStep(3)} className="flex-1">Next</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Campaign Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={CAMPAIGN_TYPES.find(t => t.value === campaignType)?.label} />
              </div>
              <div className="space-y-2">
                <Label>Channel</Label>
                <Select value={channel} onValueChange={(v) => setChannel(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Message Template</Label>
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} />
                <p className="text-xs text-muted-foreground">Variables: {'{client_name}'}, {'{last_service}'}, {'{booking_link}'}, {'{days_since_visit}'}</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                <Button onClick={() => setStep(4)} className="flex-1">Next</Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <p className="text-sm font-medium">Review your campaign</p>
              <div className="space-y-2 rounded-lg bg-muted/50 p-4 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="capitalize">{campaignType.replace(/_/g, ' ')}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Channel</span><span className="capitalize">{channel}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Target</span><span>{campaignType === 'lapsed_client' ? lapsedCount : clients.length} clients</span></div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
                <Button onClick={handleCreate} variant="accent" className="flex-1" disabled={createCampaign.isPending}>
                  Create Campaign
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
