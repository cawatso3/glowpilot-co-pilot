import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays, subDays } from 'date-fns';

export function useSeedData(userId: string | undefined, onboardingCompleted: boolean | undefined) {
  const seeded = useRef(false);

  useEffect(() => {
    if (!userId || !onboardingCompleted || seeded.current) return;
    seeded.current = true;

    const seed = async () => {
      // Check if user already has data
      const { count } = await supabase
        .from('content_ideas')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      if (count && count > 0) return;

      const today = new Date();

      // Seed content ideas
      await supabase.from('content_ideas').insert([
        { user_id: userId, title: 'Morning Skincare Routine', description: 'Walk through your personal morning skincare routine', content_type: 'behind_the_scenes', platform: 'tiktok', status: 'idea', suggested_hook: 'POV: You\'re watching a licensed esthetician\'s morning routine...', talking_points: ['Cleanser choice', 'SPF importance', 'Layering order'], sort_order: 0 },
        { user_id: userId, title: 'Before & After: Lash Lift', description: 'Show the transformation of a classic lash lift', content_type: 'transformation', platform: 'instagram', status: 'planned', suggested_hook: 'This transformation took just 45 minutes ✨', scheduled_date: format(addDays(today, 2), 'yyyy-MM-dd'), sort_order: 1 },
        { user_id: userId, title: '3 Tips for Skin Hydration', description: 'Share your top hydration tips for clients', content_type: 'educational', platform: 'all', status: 'idea', suggested_hook: 'Your skin is dehydrated, not dry. Here\'s the difference...', talking_points: ['Hydration vs moisture', 'Hyaluronic acid', 'Water intake'], sort_order: 2 },
        { user_id: userId, title: 'Client Appreciation Post', description: 'Thank your loyal clients', content_type: 'personal', platform: 'instagram', status: 'idea', sort_order: 3 },
        { user_id: userId, title: 'Spring Facial Special', description: 'Promote your spring brightening facial', content_type: 'promotional', platform: 'all', status: 'scheduled', scheduled_date: format(addDays(today, 5), 'yyyy-MM-dd'), scheduled_time: '14:00', sort_order: 4 },
      ]);

      // Seed clients
      const { data: clients } = await supabase.from('clients').insert([
        { user_id: userId, full_name: 'Emma Wilson', email: 'emma@example.com', phone: '555-0101', last_service: 'Hydrating Facial', last_visit_date: format(subDays(today, 52), 'yyyy-MM-dd'), visit_count: 8, lifetime_value: 960, status: 'lapsed', tags: ['VIP', 'sensitive skin'] },
        { user_id: userId, full_name: 'Sophia Chen', email: 'sophia@example.com', phone: '555-0102', last_service: 'Lash Lift & Tint', last_visit_date: format(subDays(today, 12), 'yyyy-MM-dd'), visit_count: 15, lifetime_value: 2250, status: 'active', tags: ['VIP', 'monthly regular'] },
        { user_id: userId, full_name: 'Olivia Martinez', email: 'olivia@example.com', phone: '555-0103', last_service: 'Chemical Peel', last_visit_date: format(subDays(today, 5), 'yyyy-MM-dd'), visit_count: 3, lifetime_value: 450, status: 'active' },
      ]).select();

      // Seed appointments
      if (clients) {
        await supabase.from('appointments').insert([
          { user_id: userId, client_id: clients[1].id, service_name: 'Lash Lift & Tint', service_price: 150, appointment_date: format(today, 'yyyy-MM-dd'), start_time: '10:00', end_time: '11:00', status: 'booked' },
          { user_id: userId, client_id: clients[2].id, service_name: 'Follow-up Facial', service_price: 120, appointment_date: format(addDays(today, 1), 'yyyy-MM-dd'), start_time: '14:00', end_time: '15:00', status: 'booked' },
        ]);
      }

      // Seed calendar gaps
      await supabase.from('calendar_gaps').insert([
        { user_id: userId, gap_date: format(today, 'yyyy-MM-dd'), gap_start_time: '13:00', gap_end_time: '15:00', duration_minutes: 120, status: 'open' },
        { user_id: userId, gap_date: format(addDays(today, 2), 'yyyy-MM-dd'), gap_start_time: '11:00', gap_end_time: '13:00', duration_minutes: 120, status: 'open' },
        { user_id: userId, gap_date: format(addDays(today, 4), 'yyyy-MM-dd'), gap_start_time: '09:00', gap_end_time: '11:00', duration_minutes: 120, status: 'open' },
      ]);

      // Seed reviews
      await supabase.from('reviews').insert([
        { user_id: userId, platform: 'google', rating: 5, review_text: 'Absolutely amazing experience! My skin has never looked better.', reviewer_name: 'Sarah K.', review_date: format(subDays(today, 3), 'yyyy-MM-dd') },
        { user_id: userId, platform: 'google', rating: 5, review_text: 'So professional and knowledgeable. Already booked my next appointment!', reviewer_name: 'Jessica L.', review_date: format(subDays(today, 7), 'yyyy-MM-dd'), response_text: 'Thank you so much Jessica! Can\'t wait to see you again! 💛', responded_at: subDays(today, 6).toISOString() },
        { user_id: userId, platform: 'yelp', rating: 4, review_text: 'Great service, very relaxing atmosphere. Would love more evening availability.', reviewer_name: 'Amanda R.', review_date: format(subDays(today, 14), 'yyyy-MM-dd') },
      ]);

      // Seed content calendar settings
      await supabase.from('content_calendar_settings').insert({
        user_id: userId,
        posts_per_week_goal: 4,
        preferred_filming_day: 'sunday',
        content_pillars: ['educational', 'transformation', 'behind_the_scenes', 'promotional'],
      });
    };

    seed().catch(console.error);
  }, [userId, onboardingCompleted]);
}
