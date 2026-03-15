import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Appointment } from '@/types/database';

export function useAppointments(userId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['appointments', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', userId!)
        .order('appointment_date', { ascending: true });
      if (error) throw error;
      return data as Appointment[];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const createAppointment = useMutation({
    mutationFn: async (appt: Partial<Appointment>) => {
      const { data, error } = await supabase
        .from('appointments')
        .insert({ ...appt, user_id: userId! } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments', userId] }),
  });

  const updateAppointment = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Appointment> & { id: string }) => {
      const { data, error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments', userId] }),
  });

  const deleteAppointment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments', userId] }),
  });

  return { appointments: query.data ?? [], isLoading: query.isLoading, createAppointment, updateAppointment, deleteAppointment };
}
