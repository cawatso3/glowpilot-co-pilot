import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { IntegrationProvider } from '@/types/database';

interface OAuthConnectionButtonProps {
  provider: IntegrationProvider;
  label: string;
  onSuccess?: () => void;
}

export function OAuthConnectionButton({ provider, label, onSuccess }: OAuthConnectionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleClick = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('oauth-init', {
        body: { provider },
      });
      if (error) throw error;
      if (data?.url) {
        const w = 800, h = 600;
        const left = window.screenX + (window.innerWidth - w) / 2;
        const top = window.screenY + (window.innerHeight - h) / 2;
        window.open(data.url, `${provider}_oauth`, `width=${w},height=${h},left=${left},top=${top}`);
        onSuccess?.();
      } else {
        throw new Error('No authorization URL returned');
      }
    } catch (err: any) {
      toast({ title: 'Connection failed', description: err.message || 'Could not start OAuth flow. The edge function may not be deployed yet.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button size="sm" onClick={handleClick} disabled={isLoading}>
      {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
      {label}
    </Button>
  );
}
