import { Flame } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Profile } from '@/types/database';

export function TopBar({ profile }: { profile: Profile | null | undefined }) {
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : '?';

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-4 lg:px-6">
      <div className="font-display font-semibold text-foreground">
        {profile?.business_name || 'GlowPilot'}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 text-sm font-medium text-accent">
          <Flame className="h-4 w-4" />
          <span>12-day streak!</span>
        </div>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
