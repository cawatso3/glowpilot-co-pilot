import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ContentIdea } from '@/types/database';

export function useContentIdeas(userId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['content_ideas', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_ideas')
        .select('*')
        .eq('user_id', userId!)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as ContentIdea[];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const createIdea = useMutation({
    mutationFn: async (idea: Partial<ContentIdea>) => {
      const { data, error } = await supabase
        .from('content_ideas')
        .insert({ ...idea, user_id: userId! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['content_ideas', userId] }),
  });

  const updateIdea = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ContentIdea> & { id: string }) => {
      const { data, error } = await supabase
        .from('content_ideas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['content_ideas', userId] }),
  });

  const deleteIdea = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('content_ideas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['content_ideas', userId] }),
  });

  return { ideas: query.data ?? [], isLoading: query.isLoading, createIdea, updateIdea, deleteIdea };
}
