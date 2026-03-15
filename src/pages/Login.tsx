import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { GlowPilotLogo } from '@/components/GlowPilotLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const { signIn, signInWithMagicLink } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      navigate('/dashboard');
    }
    setLoading(false);
  };

  const handleMagicLink = async () => {
    if (!email) {
      toast({ title: 'Enter your email', description: 'Please enter your email address first.', variant: 'destructive' });
      return;
    }
    setMagicLinkLoading(true);
    const { error } = await signInWithMagicLink(email);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setMagicLinkSent(true);
    }
    setMagicLinkLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center"><GlowPilotLogo /></div>
          <p className="text-sm text-muted-foreground">Your marketing co-pilot for a thriving beauty business</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <hr className="flex-1 border-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <hr className="flex-1 border-border" />
        </div>

        {/* Magic Link */}
        {magicLinkSent ? (
          <Card className="border-none shadow-low">
            <CardContent className="p-4 text-center space-y-2">
              <p className="text-sm font-medium">Check your email! ✉️</p>
              <p className="text-xs text-muted-foreground">We sent a magic link to <strong>{email}</strong>. Click it to sign in.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-center text-muted-foreground">Sign in with magic link</p>
            <Button variant="outline" className="w-full" onClick={handleMagicLink} disabled={magicLinkLoading}>
              {magicLinkLoading ? 'Sending...' : 'Send Magic Link'}
            </Button>
          </div>
        )}

        <p className="text-sm text-center text-muted-foreground">
          Don't have an account? <Link to="/signup" className="text-primary hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
