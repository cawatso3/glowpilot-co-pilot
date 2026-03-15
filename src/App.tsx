import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { AppLayout } from "@/components/layout/AppLayout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import ContentPlanner from "./pages/ContentPlanner";
import CalendarPage from "./pages/CalendarPage";
import ClientsPage from "./pages/ClientsPage";
import CampaignsPage from "./pages/CampaignsPage";
import ReviewsPage from "./pages/ReviewsPage";
import SettingsPage from "./pages/SettingsPage";
import OAuthCallback from "./pages/OAuthCallback";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { profile, isLoading } = useProfile(user?.id);

  if (loading || isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (profile && !profile.onboarding_completed) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/onboarding" element={<OnboardingGuard><Onboarding /></OnboardingGuard>} />
          <Route path="/auth/callback/:provider" element={<OAuthCallback />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route element={<AuthGuard><AppLayout /></AuthGuard>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/content" element={<ContentPlanner />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/campaigns" element={<CampaignsPage />} />
            <Route path="/reviews" element={<ReviewsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
