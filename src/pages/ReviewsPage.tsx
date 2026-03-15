import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useReviews } from '@/hooks/useReviews';
import { useClients } from '@/hooks/useClients';
import { useReviewRequestSettings } from '@/hooks/useReviewRequestSettings';
import { useIntegrations } from '@/hooks/useIntegrations';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Star, Sparkles, Send, CheckCircle, AlertCircle, TrendingUp, TrendingDown, Minus, Save, RefreshCw, Loader2 } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, formatDistanceToNow } from 'date-fns';
import type { ReviewPlatform } from '@/types/database';

const PLATFORM_COLORS: Record<ReviewPlatform, string> = {
  google: 'bg-blue-100 text-blue-700',
  yelp: 'bg-red-100 text-red-700',
  facebook: 'bg-indigo-100 text-indigo-700',
  instagram: 'bg-pink-100 text-pink-700',
  other: 'bg-muted text-muted-foreground',
};

export default function ReviewsPage() {
  const { user } = useAuth();
  const { reviews, isLoading, createReview, updateReview } = useReviews(user?.id);
  const { clients } = useClients(user?.id);
  const { settings, isLoading: settingsLoading, upsertSettings } = useReviewRequestSettings(user?.id);
  const { isConnected, getIntegration } = useIntegrations(user?.id);
  const { toast } = useToast();
  const [syncingReviews, setSyncingReviews] = useState(false);
  const [postToGoogle, setPostToGoogle] = useState(false);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [manualRequestOpen, setManualRequestOpen] = useState(false);
  const [requestClientId, setRequestClientId] = useState('');
  const [requestPlatform, setRequestPlatform] = useState('google');

  // Settings form
  const [autoRequest, setAutoRequest] = useState(true);
  const [delayHours, setDelayHours] = useState('2');
  const [messageTemplate, setMessageTemplate] = useState('');
  const [preferredPlatform, setPreferredPlatform] = useState('google');

  useEffect(() => {
    if (settings) {
      setAutoRequest(settings.auto_request_enabled);
      setDelayHours(String(settings.delay_after_appointment_hours));
      setMessageTemplate(settings.message_template);
      setPreferredPlatform(settings.preferred_platform);
    }
  }, [settings]);

  const avgRating = reviews.filter(r => r.rating).length > 0
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.filter(r => r.rating).length).toFixed(1)
    : '—';
  const unreplied = reviews.filter(r => !r.response_text).length;
  const platformCounts = reviews.reduce((acc, r) => {
    const p = r.platform || 'other';
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Month-over-month trend
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));
  const thisMonthCount = reviews.filter(r => r.review_date && isWithinInterval(new Date(r.review_date), { start: thisMonthStart, end: thisMonthEnd })).length;
  const lastMonthCount = reviews.filter(r => r.review_date && isWithinInterval(new Date(r.review_date), { start: lastMonthStart, end: lastMonthEnd })).length;
  const trendDelta = thisMonthCount - lastMonthCount;

  const sentRequests = reviews.filter(r => r.review_request_sent).sort((a, b) => {
    const da = a.request_sent_at || a.created_at;
    const db = b.request_sent_at || b.created_at;
    return new Date(db).getTime() - new Date(da).getTime();
  });

  const handleRespond = async (reviewId: string) => {
    await updateReview.mutateAsync({ id: reviewId, response_text: responseText, responded_at: new Date().toISOString() });
    if (postToGoogle && isConnected('google_business')) {
      try {
        await supabase.functions.invoke('reply-gbp-review', { body: { review_id: reviewId, response_text: responseText } });
      } catch (err: any) {
        toast({ title: 'Could not post to Google', description: err.message, variant: 'destructive' });
      }
    }
    setRespondingTo(null);
    setResponseText('');
    setPostToGoogle(false);
    toast({ title: 'Response saved!' });
  };

  const handleSyncReviews = async () => {
    setSyncingReviews(true);
    try {
      const { error } = await supabase.functions.invoke('sync-gbp-reviews', { body: { user_id: user?.id } });
      if (error) throw error;
      toast({ title: 'Reviews synced!' });
    } catch (err: any) {
      toast({ title: 'Sync failed', description: err.message, variant: 'destructive' });
    } finally {
      setSyncingReviews(false);
    }
  };

  const handleSaveSettings = async () => {
    await upsertSettings.mutateAsync({
      auto_request_enabled: autoRequest,
      delay_after_appointment_hours: parseInt(delayHours) || 2,
      message_template: messageTemplate,
      preferred_platform: preferredPlatform,
    });
    toast({ title: 'Settings saved!' });
  };

  const handleSendManualRequest = async () => {
    const client = clients.find(c => c.id === requestClientId);
    await createReview.mutateAsync({
      client_id: requestClientId || null,
      platform: requestPlatform as ReviewPlatform,
      reviewer_name: client?.full_name || null,
      review_request_sent: true,
      request_sent_at: new Date().toISOString(),
    } as any);
    setManualRequestOpen(false);
    setRequestClientId('');
    toast({ title: 'Review request sent!', description: 'The request has been recorded. Actual sending will be connected in a future update.' });
  };

  if (isLoading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-lg" />)}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Reviews</h1>

      {/* Reputation Snapshot */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-low">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1 text-3xl font-display font-semibold">
              {avgRating} <Star className="h-6 w-6 text-warning fill-warning" />
            </div>
            <p className="text-xs text-muted-foreground">Average Rating</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-low">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-display font-semibold">{reviews.length}</div>
            <p className="text-xs text-muted-foreground">Total Reviews</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-low">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-display font-semibold text-accent">{unreplied}</div>
            <p className="text-xs text-muted-foreground">Need Response</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-low">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1 text-xl font-display font-semibold">
              {thisMonthCount}
              {trendDelta > 0 && <TrendingUp className="h-5 w-5 text-green-600" />}
              {trendDelta < 0 && <TrendingDown className="h-5 w-5 text-red-600" />}
              {trendDelta === 0 && <Minus className="h-5 w-5 text-muted-foreground" />}
            </div>
            <p className="text-xs text-muted-foreground">This month ({trendDelta >= 0 ? '+' : ''}{trendDelta} vs last)</p>
          </CardContent>
        </Card>
      </div>

      {/* Review Feed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Review Feed</h2>
          {isConnected('google_business') && (
            <div className="flex items-center gap-2">
              {getIntegration('google_business')?.last_sync_at && (
                <span className="text-xs text-muted-foreground">
                  Synced {formatDistanceToNow(new Date(getIntegration('google_business')!.last_sync_at!), { addSuffix: true })}
                </span>
              )}
              <Button variant="outline" size="sm" onClick={handleSyncReviews} disabled={syncingReviews}>
                {syncingReviews ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />} Sync Reviews
              </Button>
            </div>
          )}
        </div>
        {reviews.length === 0 ? (
          <Card className="border-none shadow-low"><CardContent className="p-8 text-center text-muted-foreground">No reviews yet. Send review requests after appointments to start building your reputation!</CardContent></Card>
        ) : (
          reviews.map(review => (
            <Card key={review.id} className="border-none shadow-low">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                      {review.reviewer_name?.[0] || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{review.reviewer_name || 'Anonymous'}</p>
                      <p className="text-xs text-muted-foreground">{review.review_date ? format(new Date(review.review_date), 'MMM d, yyyy') : '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${PLATFORM_COLORS[review.platform as ReviewPlatform]} text-xs capitalize border-none`}>{review.platform}</Badge>
                    {review.response_text ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-accent" />
                    )}
                  </div>
                </div>

                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < (review.rating || 0) ? 'text-warning fill-warning' : 'text-muted'}`} />
                  ))}
                </div>

                {review.review_text && <p className="text-sm">{review.review_text}</p>}

                {review.response_text ? (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Your Response:</p>
                    <p className="text-sm">{review.response_text}</p>
                  </div>
                ) : respondingTo === review.id ? (
                  <div className="space-y-2">
                    <Textarea value={responseText} onChange={(e) => setResponseText(e.target.value)} placeholder="Write your response..." rows={3} />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleRespond(review.id)} disabled={updateReview.isPending || !responseText}>
                        <Send className="h-4 w-4" /> Send
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => toast({ title: 'Coming soon', description: 'AI-powered response suggestions will be available in the next update.' })}>
                        <Sparkles className="h-4 w-4" /> Suggest
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setRespondingTo(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setRespondingTo(review.id)}>Write Response</Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Review Request Settings */}
      <div className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Review Request Settings</h2>
        {settingsLoading ? (
          <Skeleton className="h-40 rounded-lg" />
        ) : (
          <Card className="border-none shadow-low">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Auto-request after appointments</Label>
                <Switch checked={autoRequest} onCheckedChange={setAutoRequest} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Delay after appointment (hours)</Label>
                <Input type="number" value={delayHours} onChange={(e) => setDelayHours(e.target.value)} className="w-24" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Message template</Label>
                <Textarea value={messageTemplate} onChange={(e) => setMessageTemplate(e.target.value)} rows={3} />
                <p className="text-xs text-muted-foreground">Variables: {'{client_name}'}, {'{review_link}'}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Preferred platform</Label>
                <Select value={preferredPlatform} onValueChange={setPreferredPlatform}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="yelp">Yelp</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button size="sm" onClick={handleSaveSettings} disabled={upsertSettings.isPending}>
                <Save className="h-4 w-4" /> Save Settings
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Send Manual Request */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Sent Requests</h2>
          <Button variant="outline" size="sm" onClick={() => setManualRequestOpen(true)}>
            <Send className="h-4 w-4" /> Send Manual Request
          </Button>
        </div>
        {sentRequests.length === 0 ? (
          <Card className="border-none shadow-low"><CardContent className="p-4 text-center text-sm text-muted-foreground">No review requests sent yet</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {sentRequests.map(r => (
              <Card key={r.id} className="border-none shadow-low">
                <CardContent className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{r.reviewer_name || 'Unknown'}</span>
                    <Badge className={`${PLATFORM_COLORS[r.platform as ReviewPlatform]} text-xs capitalize border-none`}>{r.platform}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{r.request_sent_at ? format(new Date(r.request_sent_at), 'MMM d') : '—'}</span>
                    <Badge variant="outline" className="text-xs">{r.rating ? 'Review Received' : 'Awaiting Review'}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Manual Request Dialog */}
      <Dialog open={manualRequestOpen} onOpenChange={setManualRequestOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Send Review Request</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Client</Label>
              <Select value={requestClientId} onValueChange={setRequestClientId}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select value={requestPlatform} onValueChange={setRequestPlatform}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="yelp">Yelp</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {requestClientId && messageTemplate && (
              <Card className="border-none bg-muted/50">
                <CardContent className="p-3 text-sm">
                  {messageTemplate.replace('{client_name}', clients.find(c => c.id === requestClientId)?.full_name || 'Client')}
                </CardContent>
              </Card>
            )}
            <Button onClick={handleSendManualRequest} className="w-full" disabled={!requestClientId || createReview.isPending}>
              <Send className="h-4 w-4" /> Send Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
