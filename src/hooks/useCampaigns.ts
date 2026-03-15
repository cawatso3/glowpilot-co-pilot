import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ReactivationCampaign } from '@/types/database';

export function useCampaigns(userId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['campaigns', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reactivation_campaigns')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ReactivationCampaign[];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const createCampaign = useMutation({
    mutationFn: async (campaign: Partial<ReactivationCampaign>) => {
      const { data, error } = await supabase
        .from('reactivation_campaigns')
        .insert({ ...campaign, user_id: userId! } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns', userId] }),
  });

  const updateCampaign = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ReactivationCampaign> & { id: string }) => {
      const { data, error } = await supabase
        .from('reactivation_campaigns')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns', userId] }),
  });

  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reactivation_campaigns').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns', userId] }),
  });

  return { campaigns: query.data ?? [], isLoading: query.isLoading, createCampaign, updateCampaign, deleteCampaign };
}
