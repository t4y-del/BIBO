import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

export interface HomeStats {
    // Objectives
    activeObjectives: number;
    totalObjectives: number;
    // Habits
    habitsCompletedToday: number;
    totalHabitsToday: number;
    // Streak (longest current streak across all habits)
    longestStreakToday: number;
}

export interface UpcomingEvent {
    id: string;
    title: string;
    description: string | null;
    event_date: string;
    event_time: string | null;
    color: string;
    type: 'event' | 'reminder' | 'milestone';
    completed: boolean;
}

function toDateStr(d: Date) { return d.toISOString().split('T')[0]; }

function addDays(d: Date, n: number) {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
}

export function useHomeStats() {
    const [stats, setStats] = useState<HomeStats>({
        activeObjectives: 0,
        totalObjectives: 0,
        habitsCompletedToday: 0,
        totalHabitsToday: 0,
        longestStreakToday: 0,
    });
    const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        const fetchStats = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const today = toDateStr(new Date());
                const in7Days = toDateStr(addDays(new Date(), 7));

                const [objRes, habitRes, logRes, eventsRes] = await Promise.all([
                    supabase
                        .from('objectives')
                        .select('status', { count: 'exact' })
                        .eq('user_id', user.id),
                    supabase
                        .from('habits')
                        .select('id', { count: 'exact' })
                        .eq('user_id', user.id)
                        .eq('is_active', true),
                    supabase
                        .from('habit_logs')
                        .select('completed')
                        .eq('user_id', user.id)
                        .eq('log_date', today),
                    // Next 7 days of events (not completed)
                    supabase
                        .from('agenda_events')
                        .select('id, title, description, event_date, event_time, color, type, completed')
                        .eq('user_id', user.id)
                        .eq('completed', false)
                        .gte('event_date', today)
                        .lte('event_date', in7Days)
                        .order('event_date')
                        .order('event_time', { nullsFirst: true })
                        .limit(5),
                ]);

                if (!mounted) return;

                const objectives = objRes.data ?? [];
                const activeObjectives = objectives.filter((o: any) => o.status === 'active').length;
                const totalObjectives = objectives.length;

                const totalHabitsToday = habitRes.count ?? 0;
                const logs = logRes.data ?? [];
                const habitsCompletedToday = logs.filter((l: any) => l.completed).length;

                setStats({
                    activeObjectives,
                    totalObjectives,
                    habitsCompletedToday,
                    totalHabitsToday,
                    longestStreakToday: 0,
                });

                setUpcomingEvents((eventsRes.data ?? []) as UpcomingEvent[]);
            } catch (e: any) {
                if (mounted) setError(e.message);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchStats();
        return () => { mounted = false; };
    }, []);

    return { stats, upcomingEvents, loading, error };
}
