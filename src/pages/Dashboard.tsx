import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useContentIdeas } from '@/hooks/useContentIdeas';
import { useClients } from '@/hooks/useClients';
import { useAppointments } from '@/hooks/useAppointments';
import { useCalendarGaps } from '@/hooks/useCalendarGaps';
import { useReviews } from '@/hooks/useReviews';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, CalendarClock, Star, Users, Smartphone, MessageSquare, RefreshCw } from 'lucide-react';
import { format, isToday, addDays, startOfWeek, isSameDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile(user?.id);
  const { ideas } = useContentIdeas(user?.id);
  const { clients } = useClients(user?.id);
  const { appointments } = useAppointments(user?.id);
  const { gaps } = useCalendarGaps(user?.id);
  const { reviews } = useReviews(user?.id);
  const navigate = useNavigate();

  const todayAppts = appointments.filter(a => isToday(new Date(a.appointment_date)) && a.status === 'booked');
  const nextAppt = todayAppts[0];
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const thisWeekPosts = ideas.filter(i => i.scheduled_date && new Date(i.scheduled_date) >= weekStart && (i.status === 'scheduled' || i.status === 'published')).length;
  const postsGoal = 4;
  const openGaps = gaps.filter(g => g.status === 'open').length;
  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.filter(r => r.rating).length).toFixed(1) : '—';
  const unrepliedReviews = reviews.filter(r => !r.response_text).length;
  const lapsedClients = clients.filter(c => c.status === 'lapsed').length;
  const scheduledContent = ideas.find(i => i.scheduled_date && isToday(new Date(i.scheduled_date)));

  if (profileLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-lg" />)}
        </div>
      </div>
    );
  }

  const overviewCards = [
    { label: "Today's Appointments", value: todayAppts.length, sub: nextAppt ? `Next: ${nextAppt.start_time.slice(0,5)}` : 'Free today', icon: CalendarDays, color: 'text-primary' },
    { label: "This Week's Posts", value: `${thisWeekPosts}/${postsGoal}`, sub: 'planned', icon: Smartphone, color: 'text-primary' },
    { label: 'Calendar Gaps', value: openGaps, sub: 'open this week', icon: CalendarClock, color: openGaps > 2 ? 'text-accent' : 'text-primary' },
    { label: 'Review Score', value: avgRating, sub: `${reviews.length} reviews`, icon: Star, color: 'text-warning' },
  ];

  const actionItems = [
    scheduledContent && { icon: Smartphone, text: `Post scheduled — "${scheduledContent.title}"`, action: () => navigate('/content') },
    unrepliedReviews > 0 && { icon: MessageSquare, text: `${unrepliedReviews} review${unrepliedReviews > 1 ? 's' : ''} need responses`, action: () => navigate('/reviews') },
    openGaps > 0 && { icon: CalendarClock, text: `${openGaps} calendar gap${openGaps > 1 ? 's' : ''} detected — Send a campaign?`, action: () => navigate('/calendar') },
    lapsedClients > 0 && { icon: RefreshCw, text: `${lapsedClients} client${lapsedClients > 1 ? 's' : ''} overdue for rebooking`, action: () => navigate('/clients') },
  ].filter(Boolean) as { icon: any; text: string; action: () => void }[];

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">
        {profile?.full_name ? `Good ${new Date().getHours() < 12 ? 'morning' : 'afternoon'}, ${profile.full_name.split(' ')[0]}` : 'Dashboard'}
      </h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewCards.map((card) => (
          <Card key={card.label} className="bg-card border-none shadow-low hover:shadow-mid transition-all hover:-translate-y-0.5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{card.label}</span>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <div className="text-2xl font-display font-semibold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Items */}
      <div className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Action Items</h2>
        {actionItems.length === 0 ? (
          <Card className="bg-card border-none shadow-low">
            <CardContent className="p-4 text-center text-muted-foreground">
              Nothing to do right now — you're on top of it! ✨
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {actionItems.map((item, i) => (
              <Card
                key={i}
                className="bg-card border-none shadow-low hover:shadow-mid cursor-pointer transition-all hover:-translate-y-0.5"
                onClick={item.action}
              >
                <CardContent className="flex items-center gap-3 p-3">
                  <item.icon className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-sm">{item.text}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Week at a Glance */}
      <div className="space-y-3">
        <h2 className="font-display text-lg font-semibold">This Week at a Glance</h2>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {weekDays.map((day) => {
            const hasContent = ideas.some(i => i.scheduled_date && isSameDay(new Date(i.scheduled_date), day));
            const hasAppt = appointments.some(a => isSameDay(new Date(a.appointment_date), day));
            const hasGap = gaps.some(g => isSameDay(new Date(g.gap_date), day) && g.status === 'open');
            return (
              <Card key={day.toISOString()} className={`flex-1 min-w-[4rem] border-none shadow-low ${isToday(day) ? 'ring-2 ring-primary' : ''}`}>
                <CardContent className="p-3 text-center">
                  <div className="text-xs text-muted-foreground">{format(day, 'EEE')}</div>
                  <div className="text-lg font-semibold">{format(day, 'd')}</div>
                  <div className="flex justify-center gap-1 mt-1">
                    {hasContent && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
                    {hasAppt && <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />}
                    {hasGap && <div className="h-1.5 w-1.5 rounded-full bg-accent" />}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
