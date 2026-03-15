import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, CalendarClock,
  Users, Megaphone, Star, Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Home', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Content', path: '/content', icon: CalendarDays },
  { label: 'Calendar', path: '/calendar', icon: CalendarClock },
  { label: 'Clients', path: '/clients', icon: Users },
  { label: 'Reviews', path: '/reviews', icon: Star },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex lg:hidden h-16 bg-card border-t border-border">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path ||
          (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 text-xs transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
