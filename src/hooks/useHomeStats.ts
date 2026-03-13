import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface HomeStats {
    activeObjectives: number;
    totalObjectives: number;
    habitsCompletedToday: number;
    totalHabitsToday: number;
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
    const userId = useAuth();
    const [stats, setStats] = useState<HomeStats>({
        activeObjectives: 0, totalObjectives: 0,
        habitsCompletedToday: 0, totalHabitsToday: 0,
        longestStreakToday: 0,
    });
    const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) { setLoading(false); return; }
        let mounted = true;

        const fetchStats = async () => {
            try {
                const today = toDateStr(new Date());
                const in7Days = toDateStr(addDays(new Date(), 7));

                // All queries in parallel — no getUser() call
                const [objRes, habitRes, logRes, eventsRes] = await Promise.all([
                    supabase
                        .from('objectives')
                        .select('status', { count: 'exact' })
                        .eq('user_id', userId),
                    supabase
                        .from('habits')
                        .select('id', { count: 'exact' })
                        .eq('user_id', userId)
                        .eq('is_active', true),
                    supabase
                        .from('habit_logs')
                        .select('completed')
                        .eq('user_id', userId)
                        .eq('log_date', today),
                    supabase
                        .from('agenda_events')
                        .select('id, title, description, event_date, event_time, color, type, completed')
                        .eq('user_id', userId)
                        .eq('completed', false)
                        .gte('event_date', today)
                        .lte('event_date', in7Days)
                        .order('event_date')
                        .order('event_time', { nullsFirst: true })
                        .limit(5),
                ]);

                if (!mounted) return;

                const objectives = objRes.data ?? [];
                setStats({
                    activeObjectives: objectives.filter((o: any) => o.status === 'active').length,
                    totalObjectives: objectives.length,
                    totalHabitsToday: habitRes.count ?? 0,
                    habitsCompletedToday: (logRes.data ?? []).filter((l: any) => l.completed).length,
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
    }, [userId]);

    return { stats, upcomingEvents, loading, error };
}
