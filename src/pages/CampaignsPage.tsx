import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useClients } from '@/hooks/useClients';
import { useIntegrations } from '@/hooks/useIntegrations';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Plus, CalendarClock, Users, Gift, Cake, Send, Megaphone, Pause, Play, Copy, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import type { CampaignType, CampaignStatus, ReactivationCampaign, CampaignMessage } from '@/types/database';

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
  const { campaigns, isLoading, createCampaign, updateCampaign, deleteCampaign } = useCampaigns(user?.id);
  const { clients } = useClients(user?.id);
  const { isConnected } = useIntegrations(user?.id);
  const { toast } = useToast();
  const [sendingCampaignId, setSendingCampaignId] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [campaignType, setCampaignType] = useState<CampaignType>('gap_filler');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [channel, setChannel] = useState<'sms' | 'email' | 'both'>('sms');
  const [selectedCampaign, setSelectedCampaign] = useState<ReactivationCampaign | null>(null);

  // Audience filters (Fix 9)
  const [filterDays, setFilterDays] = useState('');
  const [filterService, setFilterService] = useState('');
  const [filterMinVisits, setFilterMinVisits] = useState('');
  const [filterStatuses, setFilterStatuses] = useState<string[]>([]);
  const [filterTags, setFilterTags] = useState('');

  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      if (filterDays) {
        const days = parseInt(filterDays);
        if (!isNaN(days) && c.last_visit_date) {
          if (differenceInDays(new Date(), new Date(c.last_visit_date)) < days) return false;
        }
        if (!isNaN(days) && !c.last_visit_date) return true; // never visited = qualifies
      }
      if (filterService && c.last_service && !c.last_service.toLowerCase().includes(filterService.toLowerCase())) return false;
      if (filterMinVisits) {
        const min = parseInt(filterMinVisits);
        if (!isNaN(min) && (c.visit_count || 0) < min) return false;
      }
      if (filterStatuses.length > 0 && !filterStatuses.includes(c.status as string)) return false;
      if (filterTags) {
        const searchTags = filterTags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
        if (searchTags.length > 0 && !(c.tags || []).some(t => searchTags.includes(t.toLowerCase()))) return false;
      }
      return true;
    });
  }, [clients, filterDays, filterService, filterMinVisits, filterStatuses, filterTags]);

  // Campaign detail messages
  const { data: campaignMessages = [] } = useQuery({
    queryKey: ['campaign_messages', selectedCampaign?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_messages')
        .select('*, clients(full_name)')
        .eq('campaign_id', selectedCampaign!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as (CampaignMessage & { clients: { full_name: string } | null })[];
    },
    enabled: !!selectedCampaign?.id,
  });

  const smsSegments = Math.ceil(message.length / 160);
  const charColor = message.length <= 160 ? 'text-green-600' : message.length <= 320 ? 'text-amber-600' : 'text-red-600';

  const handleCreate = async () => {
    const targetCriteria: Record<string, unknown> = {};
    if (filterDays) targetCriteria.days_since_visit = parseInt(filterDays);
    if (filterService) targetCriteria.service_type = filterService;
    if (filterMinVisits) targetCriteria.min_visits = parseInt(filterMinVisits);
    if (filterStatuses.length) targetCriteria.statuses = filterStatuses;
    if (filterTags) targetCriteria.tags = filterTags;

    await createCampaign.mutateAsync({
      campaign_type: campaignType,
      name: name || CAMPAIGN_TYPES.find(t => t.value === campaignType)?.label || '',
      message_template: message,
      channel,
      target_criteria: Object.keys(targetCriteria).length > 0 ? targetCriteria : null,
    } as any);
    setWizardOpen(false);
    resetWizard();
    toast({ title: 'Campaign created!' });
  };

  const resetWizard = () => {
    setStep(1); setName(''); setMessage('');
    setFilterDays(''); setFilterService(''); setFilterMinVisits('');
    setFilterStatuses([]); setFilterTags('');
  };

  const startWizard = (type?: CampaignType) => {
    resetWizard();
    if (type) setCampaignType(type);
    setMessage(TEMPLATES[type || campaignType]?.[0] || '');
    setWizardOpen(true);
    setStep(type ? 2 : 1);
  };

  const handleTogglePause = async () => {
    if (!selectedCampaign) return;
    const newStatus = selectedCampaign.status === 'active' ? 'paused' : 'active';
    await updateCampaign.mutateAsync({ id: selectedCampaign.id, status: newStatus } as any);
    setSelectedCampaign({ ...selectedCampaign, status: newStatus as CampaignStatus });
    toast({ title: `Campaign ${newStatus}` });
  };

  const handleDuplicate = async () => {
    if (!selectedCampaign) return;
    await createCampaign.mutateAsync({
      campaign_type: selectedCampaign.campaign_type,
      name: `${selectedCampaign.name} (Copy)`,
      message_template: selectedCampaign.message_template,
      channel: selectedCampaign.channel,
      target_criteria: selectedCampaign.target_criteria,
    } as any);
    toast({ title: 'Campaign duplicated!' });
  };

  const handleDeleteCampaign = async () => {
    if (!selectedCampaign) return;
    await deleteCampaign.mutateAsync(selectedCampaign.id);
    setSelectedCampaign(null);
    toast({ title: 'Campaign deleted' });
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
            <Card key={campaign.id} className="border-none shadow-low hover:shadow-mid transition-all cursor-pointer" onClick={() => setSelectedCampaign(campaign)}>
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Campaign Wizard */}
      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
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
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Haven't visited in X+ days</Label>
                  <Input type="number" value={filterDays} onChange={(e) => setFilterDays(e.target.value)} placeholder="e.g. 45" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Service type</Label>
                  <Input value={filterService} onChange={(e) => setFilterService(e.target.value)} placeholder="e.g. Facial, Lash Lift" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Minimum visits</Label>
                  <Input type="number" value={filterMinVisits} onChange={(e) => setFilterMinVisits(e.target.value)} placeholder="e.g. 2" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Status</Label>
                  <div className="flex gap-3 flex-wrap">
                    {['active', 'lapsed', 'lost', 'new'].map(s => (
                      <label key={s} className="flex items-center gap-1.5 text-xs capitalize">
                        <Checkbox checked={filterStatuses.includes(s)} onCheckedChange={(checked) => {
                          setFilterStatuses(prev => checked ? [...prev, s] : prev.filter(x => x !== s));
                        }} />
                        {s}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Tags (comma-separated)</Label>
                  <Input value={filterTags} onChange={(e) => setFilterTags(e.target.value)} placeholder="e.g. VIP, sensitive skin" />
                </div>
              </div>
              <div className="rounded-lg bg-muted/50 p-4 text-center">
                <p className="text-2xl font-semibold">{filteredClients.length}</p>
                <p className="text-sm text-muted-foreground">clients targeted</p>
              </div>
              {filteredClients.length > 0 && (
                <div className="max-h-[200px] overflow-y-auto rounded-lg border p-2 space-y-1">
                  {filteredClients.map(c => (
                    <p key={c.id} className="text-xs text-muted-foreground">{c.full_name}</p>
                  ))}
                </div>
              )}
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
                <Label>Start from a template</Label>
                <Select onValueChange={(v) => { if (v === 'custom') setMessage(''); else setMessage(v); }}>
                  <SelectTrigger><SelectValue placeholder="Choose template..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Custom</SelectItem>
                    {(TEMPLATES[campaignType] || []).map((t, i) => (
                      <SelectItem key={i} value={t}>{t.slice(0, 50)}...</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Message Template</Label>
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} />
                <p className="text-xs text-muted-foreground">Variables: {'{client_name}'}, {'{last_service}'}, {'{booking_link}'}, {'{days_since_visit}'}</p>
                {(channel === 'sms' || channel === 'both') && (
                  <p className={`text-xs ${charColor}`}>
                    {message.length} / 160 characters
                    {message.length > 160 && ` (${smsSegments} SMS segments)`}
                  </p>
                )}
              </div>
              {/* Channel validation warnings */}
              {(channel === 'sms' || channel === 'both') && !isConnected('twilio') && (
                <Alert><AlertCircle className="h-4 w-4" /><AlertDescription>Connect Twilio in Settings to send SMS campaigns.</AlertDescription></Alert>
              )}
              {(channel === 'email' || channel === 'both') && !isConnected('resend') && (
                <Alert><AlertCircle className="h-4 w-4" /><AlertDescription>Connect Resend in Settings to send email campaigns.</AlertDescription></Alert>
              )}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                <Button
                  onClick={() => setStep(4)}
                  className="flex-1"
                  disabled={
                    ((channel === 'sms' || channel === 'both') && !isConnected('twilio')) ||
                    ((channel === 'email' || channel === 'both') && !isConnected('resend'))
                  }
                >Next</Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <p className="text-sm font-medium">Review your campaign</p>
              <div className="space-y-2 rounded-lg bg-muted/50 p-4 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="capitalize">{campaignType.replace(/_/g, ' ')}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Channel</span><span className="capitalize">{channel}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Target</span><span>{filteredClients.length} clients</span></div>
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

      {/* Campaign Detail Sheet */}
      <Sheet open={!!selectedCampaign} onOpenChange={() => setSelectedCampaign(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selectedCampaign && (
            <div className="space-y-6 mt-6">
              <SheetHeader>
                <SheetTitle>{selectedCampaign.name}</SheetTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={`${STATUS_STYLES[selectedCampaign.status as CampaignStatus]} text-xs capitalize border-none`}>{selectedCampaign.status}</Badge>
                  <Badge variant="outline" className="text-xs capitalize">{selectedCampaign.campaign_type?.replace(/_/g, ' ')}</Badge>
                  <Badge variant="outline" className="text-xs capitalize">{selectedCampaign.channel}</Badge>
                </div>
              </SheetHeader>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleTogglePause}>
                  {selectedCampaign.status === 'active' ? <><Pause className="h-3 w-3" /> Pause</> : <><Play className="h-3 w-3" /> Resume</>}
                </Button>
                <Button variant="outline" size="sm" onClick={handleDuplicate}><Copy className="h-3 w-3" /> Duplicate</Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm"><Trash2 className="h-3 w-3" /> Delete</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this campaign?</AlertDialogTitle>
                      <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteCampaign}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              {/* Performance Stats */}
              <div className="grid grid-cols-3 gap-3">
                <Card className="border-none shadow-low"><CardContent className="p-3 text-center"><p className="text-lg font-semibold">{selectedCampaign.send_count}</p><p className="text-xs text-muted-foreground">Sent</p></CardContent></Card>
                <Card className="border-none shadow-low"><CardContent className="p-3 text-center"><p className="text-lg font-semibold">{selectedCampaign.open_count}</p><p className="text-xs text-muted-foreground">Opened</p></CardContent></Card>
                <Card className="border-none shadow-low"><CardContent className="p-3 text-center"><p className="text-lg font-semibold">{selectedCampaign.booking_count}</p><p className="text-xs text-muted-foreground">Booked</p></CardContent></Card>
              </div>

              {/* Funnel Bar */}
              {(selectedCampaign.send_count ?? 0) > 0 && (
                <div className="space-y-1">
                  <div className="h-4 rounded-full bg-muted overflow-hidden flex">
                    <div className="bg-primary h-full" style={{ width: '100%' }} />
                  </div>
                  <div className="h-4 rounded-full bg-muted overflow-hidden flex">
                    <div className="bg-primary/60 h-full" style={{ width: `${((selectedCampaign.open_count ?? 0) / (selectedCampaign.send_count ?? 1)) * 100}%` }} />
                  </div>
                  <div className="h-4 rounded-full bg-muted overflow-hidden flex">
                    <div className="bg-accent h-full" style={{ width: `${((selectedCampaign.booking_count ?? 0) / (selectedCampaign.send_count ?? 1)) * 100}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Sent 100%</span>
                    <span>Opened {((selectedCampaign.open_count ?? 0) / Math.max(selectedCampaign.send_count ?? 1, 1) * 100).toFixed(0)}%</span>
                    <span>Booked {((selectedCampaign.booking_count ?? 0) / Math.max(selectedCampaign.send_count ?? 1, 1) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              )}

              {/* Message Template */}
              <div className="space-y-2">
                <h3 className="font-medium text-sm">Message Template</h3>
                <Card className="border-none bg-muted/50"><CardContent className="p-3 text-sm">{selectedCampaign.message_template}</CardContent></Card>
              </div>

              {/* Message Log */}
              <div className="space-y-2">
                <h3 className="font-medium text-sm">Message Log</h3>
                {campaignMessages.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No messages sent yet — campaign is in draft</p>
                ) : (
                  <div className="space-y-2">
                    {campaignMessages.map(m => (
                      <div key={m.id} className="text-xs p-2 rounded-lg bg-muted/30 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{m.clients?.full_name || 'Unknown'}</p>
                          <p className="text-muted-foreground">{m.sent_at ? format(new Date(m.sent_at), 'MMM d, HH:mm') : 'Pending'}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs capitalize">{m.channel}</Badge>
                          <Badge variant="outline" className="text-xs capitalize">{m.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
