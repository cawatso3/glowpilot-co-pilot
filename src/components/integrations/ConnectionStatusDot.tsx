import type { IntegrationStatus } from '@/types/database';
import { cn } from '@/lib/utils';

interface ConnectionStatusDotProps {
  status: IntegrationStatus;
  size?: 'sm' | 'md';
}

const STATUS_CLASSES: Record<IntegrationStatus, string> = {
  disconnected: 'bg-muted-foreground/40',
  connecting: 'bg-yellow-400 animate-pulse',
  connected: 'bg-green-500',
  error: 'bg-red-500',
};

export function ConnectionStatusDot({ status, size = 'sm' }: ConnectionStatusDotProps) {
  return (
    <span
      className={cn(
        'inline-block rounded-full shrink-0',
        size === 'sm' ? 'h-2 w-2' : 'h-3 w-3',
        STATUS_CLASSES[status]
      )}
    />
  );
}
