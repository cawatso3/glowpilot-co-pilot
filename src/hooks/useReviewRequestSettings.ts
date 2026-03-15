import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ReviewRequestSettings } from '@/types/database';

export function useReviewRequestSettings(userId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['review_request_settings', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('review_request_settings')
        .select('*')
        .eq('user_id', userId!)
        .maybeSingle();
      if (error) throw error;
      return data as ReviewRequestSettings | null;
    },
    enabled: !!userId,
  });

  const upsertSettings = useMutation({
    mutationFn: async (settings: Partial<ReviewRequestSettings>) => {
      const { data, error } = await supabase
        .from('review_request_settings')
        .upsert({ ...settings, user_id: userId! } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['review_request_settings', userId] }),
  });

  return { settings: query.data, isLoading: query.isLoading, upsertSettings };
}
