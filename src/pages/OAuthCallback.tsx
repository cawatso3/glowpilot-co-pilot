import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function OAuthCallback() {
  const { provider } = useParams<{ provider: string }>();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !provider) {
      setStatus('error');
      setErrorMsg('Missing authorization code or provider.');
      return;
    }

    (async () => {
      try {
        const { error } = await supabase.functions.invoke('oauth-callback', {
          body: { provider, code, state },
        });
        if (error) throw error;
        setStatus('success');
        setTimeout(() => window.close(), 2000);
      } catch (err: any) {
        setStatus('error');
        setErrorMsg(err.message || 'Connection failed. Please try again.');
      }
    })();
  }, [provider, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm border-none shadow-mid">
        <CardContent className="p-8 text-center space-y-4">
          {status === 'loading' && (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Connecting your {provider} account...</p>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle className="h-10 w-10 text-green-500 mx-auto" />
              <p className="font-medium">Connected! ✅</p>
              <p className="text-xs text-muted-foreground">This window will close automatically.</p>
            </>
          )}
          {status === 'error' && (
            <>
              <XCircle className="h-10 w-10 text-destructive mx-auto" />
              <p className="font-medium">Connection Failed</p>
              <p className="text-xs text-muted-foreground">{errorMsg}</p>
              <Button variant="outline" size="sm" onClick={() => window.close()}>Close Window</Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
