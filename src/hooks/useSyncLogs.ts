import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { SyncLog } from '@/types/database';

export function useSyncLogs(userId: string | undefined, limit = 10) {
  return useQuery({
    queryKey: ['sync_logs', userId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sync_logs')
        .select('*')
        .eq('user_id', userId!)
        .order('started_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as unknown as SyncLog[];
    },
    enabled: !!userId,
    staleTime: 15 * 1000,
  });
}
