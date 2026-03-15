import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { BottomNav } from './BottomNav';
import { TopBar } from './TopBar';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useContentIdeas } from '@/hooks/useContentIdeas';
import { useSeedData } from '@/hooks/useSeedData';

export function AppLayout() {
  const { user } = useAuth();
  const { profile } = useProfile(user?.id);
  const { ideas } = useContentIdeas(user?.id);
  useSeedData(user?.id, profile?.onboarding_completed);

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <TopBar profile={profile} contentIdeas={ideas} />
        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
