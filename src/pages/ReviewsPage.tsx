import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useReviews } from '@/hooks/useReviews';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Star, Sparkles, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
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
  const { reviews, isLoading, updateReview } = useReviews(user?.id);
  const { toast } = useToast();
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');

  const avgRating = reviews.filter(r => r.rating).length > 0
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.filter(r => r.rating).length).toFixed(1)
    : '—';
  const unreplied = reviews.filter(r => !r.response_text).length;
  const platformCounts = reviews.reduce((acc, r) => {
    const p = r.platform || 'other';
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleRespond = async (reviewId: string) => {
    await updateReview.mutateAsync({ id: reviewId, response_text: responseText, responded_at: new Date().toISOString() });
    setRespondingTo(null);
    setResponseText('');
    toast({ title: 'Response saved!' });
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
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-1">
              {Object.entries(platformCounts).map(([p, count]) => (
                <Badge key={p} className={`${PLATFORM_COLORS[p as ReviewPlatform]} text-xs capitalize border-none`}>
                  {p}: {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Review Feed */}
      <div className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Review Feed</h2>
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

                {/* Stars */}
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

      {/* Review Requests */}
      <div className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Review Requests</h2>
        <Card className="border-none shadow-low">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Auto-request after appointments</Label>
              <Switch defaultChecked onCheckedChange={() => toast({ title: 'Coming soon', description: 'Auto-request will be configured in the next update.' })} />
            </div>
            <Button variant="outline" size="sm" onClick={() => toast({ title: 'Coming soon', description: 'Manual review requests will be available in the next update.' })}>
              <Send className="h-4 w-4" /> Send Manual Request
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
