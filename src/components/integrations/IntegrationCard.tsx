import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConnectionStatusDot } from './ConnectionStatusDot';
import { RefreshCw, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Integration, IntegrationStatus } from '@/types/database';

interface IntegrationCardProps {
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
  integration: Integration | null;
  onConnect: () => void;
  onDisconnect: () => void;
  onSync?: () => void;
  isSyncing?: boolean;
  disabled?: boolean;
  disabledMessage?: string;
  noteText?: string;
  children?: React.ReactNode;
}

export function IntegrationCard({
  name, description, icon: Icon, category, integration, onConnect, onDisconnect, onSync, isSyncing,
  disabled, disabledMessage, noteText, children,
}: IntegrationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const status: IntegrationStatus = integration?.status as IntegrationStatus || 'disconnected';

  return (
    <Card className={`border-none shadow-low ${disabled ? 'opacity-60' : ''}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
              <Icon className="h-5 w-5 text-foreground/70" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-sm">{name}</h3>
                <Badge variant="outline" className="text-xs">{category}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
              {integration?.display_name && status === 'connected' && (
                <p className="text-xs text-primary mt-0.5">{integration.display_name}</p>
              )}
              {integration?.last_sync_at && status === 'connected' && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Last synced {formatDistanceToNow(new Date(integration.last_sync_at), { addSuffix: true })}
                </p>
              )}
              {status === 'error' && integration?.last_error && (
                <p className="text-xs text-destructive mt-0.5">{integration.last_error}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ConnectionStatusDot status={status} />
            {disabled ? (
              <span className="text-xs text-muted-foreground">{disabledMessage || 'Not available'}</span>
            ) : status === 'disconnected' ? (
              <Button size="sm" onClick={() => { onConnect(); setExpanded(true); }}>Connect</Button>
            ) : status === 'connecting' ? (
              <Button size="sm" disabled><Loader2 className="h-3 w-3 animate-spin" /> Connecting...</Button>
            ) : status === 'connected' ? (
              <div className="flex items-center gap-1">
                {onSync && (
                  <Button variant="outline" size="sm" onClick={onSync} disabled={isSyncing}>
                    <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} /> Sync
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={onDisconnect}>
                  Disconnect
                </Button>
              </div>
            ) : status === 'error' ? (
              <div className="flex items-center gap-1">
                <Button size="sm" onClick={onConnect}>Reconnect</Button>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={onDisconnect}>
                  Disconnect
                </Button>
              </div>
            ) : null}
          </div>
        </div>

        {noteText && <p className="text-xs text-muted-foreground bg-muted/30 rounded-md px-3 py-2">{noteText}</p>}

        {children && (
          <>
            <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {expanded ? 'Hide' : 'Configure'}
            </Button>
            {expanded && children}
          </>
        )}
      </CardContent>
    </Card>
  );
}
