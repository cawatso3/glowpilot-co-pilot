import { Flame } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format, subDays } from 'date-fns';
import type { Profile, ContentIdea } from '@/types/database';

function calculateStreak(ideas: ContentIdea[]): number {
  const publishedDates = ideas
    .filter(i => i.status === 'published' && i.scheduled_date)
    .map(i => i.scheduled_date!)
    .sort()
    .reverse();

  if (publishedDates.length === 0) return 0;

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  if (!publishedDates.includes(todayStr) && !publishedDates.includes(yesterdayStr)) {
    return 0;
  }

  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const dateStr = format(subDays(new Date(), i), 'yyyy-MM-dd');
    if (publishedDates.includes(dateStr)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return streak;
}

export function TopBar({ profile, contentIdeas = [] }: { profile: Profile | null | undefined; contentIdeas?: ContentIdea[] }) {
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : '?';

  const streak = calculateStreak(contentIdeas);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-4 lg:px-6">
      <div className="font-display font-semibold text-foreground">
        {profile?.business_name || 'GlowPilot'}
      </div>
      <div className="flex items-center gap-3">
        {streak > 0 && (
          <div className="flex items-center gap-1 text-sm font-medium text-accent">
            <Flame className="h-4 w-4" />
            <span>{streak}-day streak!</span>
          </div>
        )}
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
