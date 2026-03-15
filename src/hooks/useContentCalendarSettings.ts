import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ContentCalendarSettings } from '@/types/database';

export function useContentCalendarSettings(userId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['content_calendar_settings', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_calendar_settings')
        .select('*')
        .eq('user_id', userId!)
        .maybeSingle();
      if (error) throw error;
      return data as ContentCalendarSettings | null;
    },
    enabled: !!userId,
  });

  const upsertSettings = useMutation({
    mutationFn: async (settings: Partial<ContentCalendarSettings>) => {
      const { data, error } = await supabase
        .from('content_calendar_settings')
        .upsert({ ...settings, user_id: userId! } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['content_calendar_settings', userId] }),
  });

  return { settings: query.data, isLoading: query.isLoading, upsertSettings };
}
