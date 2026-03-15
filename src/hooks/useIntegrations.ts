import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Integration, IntegrationProvider } from '@/types/database';

export function useIntegrations(userId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['integrations', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', userId!)
        .order('provider');
      if (error) throw error;
      return (data ?? []) as unknown as Integration[];
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
  });

  const upsertIntegration = useMutation({
    mutationFn: async (integration: Partial<Integration> & { provider: IntegrationProvider }) => {
      const { data, error } = await supabase
        .from('integrations')
        .upsert(
          { ...integration, user_id: userId! } as any,
          { onConflict: 'user_id,provider' }
        )
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Integration;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['integrations', userId] }),
  });

  const deleteIntegration = useMutation({
    mutationFn: async (provider: IntegrationProvider) => {
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('user_id', userId!)
        .eq('provider', provider);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['integrations', userId] }),
  });

  const getIntegration = (provider: IntegrationProvider) =>
    query.data?.find(i => i.provider === provider) || null;

  const isConnected = (provider: IntegrationProvider) =>
    getIntegration(provider)?.status === 'connected';

  return {
    integrations: query.data ?? [],
    isLoading: query.isLoading,
    upsertIntegration,
    deleteIntegration,
    getIntegration,
    isConnected,
  };
}
