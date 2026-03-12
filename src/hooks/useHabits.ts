import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';

/* ── Types ──────────────────────────────────────────────── */

export interface Habit {
    id: string;
    user_id: string;
    name: string;
    icon: string;
    color: string;
    frequency: 'daily' | 'weekly';
    created_at: string;
}

export interface HabitLog {
    id: string;
    habit_id: string;
    log_date: string;
    completed: boolean;
}

export interface HabitWithLog extends Habit {
    log: HabitLog | null;
    streak: number;
}

interface HabitStats {
    totalActive: number;
    completedToday: number;
}

/* ── Helpers ────────────────────────────────────────────── */

function toDateStr(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
}

/* ── Hook ───────────────────────────────────────────────── */

export function useHabits(date: Date = new Date()) {
    const [habits, setHabits] = useState<HabitWithLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const dateStr = toDateStr(date);

    const fetchHabits = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No autenticado');

            // Fetch habits
            const { data: habitsData, error: habitsErr } = await supabase
                .from('habits')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: true });

            if (habitsErr) throw habitsErr;
            if (!habitsData?.length) { setHabits([]); return; }

            // Fetch logs for selected date
            const { data: logsData, error: logsErr } = await supabase
                .from('habit_logs')
                .select('*')
                .eq('user_id', user.id)
                .eq('log_date', dateStr);

            if (logsErr) throw logsErr;

            // Build a map: habit_id → log
            const logMap = new Map<string, HabitLog>();
            (logsData ?? []).forEach((l) => logMap.set(l.habit_id, l));

            // Compute streaks: count consecutive days completed up to today
            const today = toDateStr(new Date());
            const streakMap = new Map<string, number>();
            for (const habit of habitsData) {
                // Fetch last 90 days of logs for streak calc
                const { data: streakLogs } = await supabase
                    .from('habit_logs')
                    .select('log_date, completed')
                    .eq('habit_id', habit.id)
                    .eq('completed', true)
                    .order('log_date', { ascending: false })
                    .limit(90);

                let streak = 0;
                const logDates = new Set((streakLogs ?? []).map((l: any) => l.log_date));
                const cursor = new Date();
                // Start from today and walk back
                while (true) {
                    const ds = toDateStr(cursor);
                    if (logDates.has(ds)) {
                        streak++;
                        cursor.setDate(cursor.getDate() - 1);
                    } else {
                        break;
                    }
                }
                streakMap.set(habit.id, streak);
            }

            const combined: HabitWithLog[] = habitsData.map((h) => ({
                ...h,
                log: logMap.get(h.id) ?? null,
                streak: streakMap.get(h.id) ?? 0,
            }));

            setHabits(combined);
        } catch (e: any) {
            setError(e.message ?? 'Error desconocido');
        } finally {
            setLoading(false);
        }
    }, [dateStr]);

    useEffect(() => { fetchHabits(); }, [fetchHabits]);

    /* ── toggleHabit ─────────────────────────────────────── */
    const toggleHabit = useCallback(async (habitId: string, currentlyDone: boolean) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        if (currentlyDone) {
            // Remove log
            await supabase
                .from('habit_logs')
                .delete()
                .eq('habit_id', habitId)
                .eq('log_date', dateStr)
                .eq('user_id', user.id);
        } else {
            // Insert log
            await supabase
                .from('habit_logs')
                .upsert({ habit_id: habitId, user_id: user.id, log_date: dateStr, completed: true });
        }

        // Optimistic update
        setHabits((prev) => prev.map((h) => {
            if (h.id !== habitId) return h;
            const newLog = currentlyDone
                ? null
                : { id: '', habit_id: habitId, log_date: dateStr, completed: true };
            return { ...h, log: newLog, streak: currentlyDone ? Math.max(0, h.streak - 1) : h.streak + 1 };
        }));
    }, [dateStr]);

    /* ── deleteHabit ─────────────────────────────────────── */
    const deleteHabit = useCallback(async (habitId: string) => {
        await supabase.from('habits').delete().eq('id', habitId);
        setHabits((prev) => prev.filter((h) => h.id !== habitId));
    }, []);

    /* ── createHabit ────────────────────────────────────── */
    const createHabit = useCallback(async (params: {
        name: string;
        icon: string;
        color: string;
        frequency: string;
        active_days?: number[];
    }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No autenticado');

        const { error: insertErr } = await supabase.from('habits').insert({
            user_id: user.id,
            name: params.name,
            icon: params.icon,
            color: params.color,
            frequency: params.frequency,
        });

        if (insertErr) throw insertErr;
        await fetchHabits();
    }, [fetchHabits]);

    /* ── updateHabit ────────────────────────────────────── */
    const updateHabit = useCallback(async (habitId: string, updates: Partial<Pick<Habit, 'name' | 'icon' | 'color' | 'frequency'>>) => {
        const { error: err } = await supabase
            .from('habits')
            .update(updates)
            .eq('id', habitId);
        if (err) throw err;
        setHabits((prev) => prev.map((h) => (h.id === habitId ? { ...h, ...updates } : h)));
    }, []);

    /* ── Stats ───────────────────────────────────────────── */
    const stats: HabitStats = {
        totalActive: habits.length,
        completedToday: habits.filter((h) => !!h.log?.completed).length,
    };

    return { habits, loading, error, refresh: fetchHabits, toggleHabit, deleteHabit, updateHabit, createHabit, stats };
}
