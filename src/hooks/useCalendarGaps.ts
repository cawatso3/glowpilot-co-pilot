import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CalendarGap } from '@/types/database';

export function useCalendarGaps(userId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['calendar_gaps', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calendar_gaps')
        .select('*')
        .eq('user_id', userId!)
        .order('gap_date', { ascending: true });
      if (error) throw error;
      return data as CalendarGap[];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const updateGap = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CalendarGap> & { id: string }) => {
      const { data, error } = await supabase
        .from('calendar_gaps')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['calendar_gaps', userId] }),
  });

  return { gaps: query.data ?? [], isLoading: query.isLoading, updateGap };
}
