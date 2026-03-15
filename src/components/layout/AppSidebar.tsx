import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, CalendarClock,
  Users, Megaphone, Star, Settings
} from 'lucide-react';
import { GlowPilotLogo } from '@/components/GlowPilotLogo';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Content', path: '/content', icon: CalendarDays },
  { label: 'Calendar', path: '/calendar', icon: CalendarClock },
  { label: 'Clients', path: '/clients', icon: Users },
  { label: 'Campaigns', path: '/campaigns', icon: Megaphone },
  { label: 'Reviews', path: '/reviews', icon: Star },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-sidebar border-r border-sidebar-border h-screen sticky top-0">
      <div className="p-6">
        <GlowPilotLogo />
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
