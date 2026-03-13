import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';

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

/**
 * Compute streaks from a pre-fetched array of completed log dates.
 * Walks backward from today; streak breaks on first missing day.
 */
function computeStreak(completedDates: Set<string>): number {
    let streak = 0;
    const cursor = new Date();
    while (true) {
        const ds = toDateStr(cursor);
        if (completedDates.has(ds)) {
            streak++;
            cursor.setDate(cursor.getDate() - 1);
        } else {
            break;
        }
    }
    return streak;
}

/* ── Hook ───────────────────────────────────────────────── */

export function useHabits(date: Date = new Date()) {
    const userId = useAuth();
    const [habits, setHabits] = useState<HabitWithLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const dateStr = toDateStr(date);

    const fetchHabits = useCallback(async () => {
        if (!userId) { setLoading(false); return; }
        setLoading(true);
        setError(null);
        try {
            // ── 3 queries in PARALLEL (was N+2 sequential before) ──
            const [habitsRes, logsRes, allLogsRes] = await Promise.all([
                // 1. All habits
                supabase
                    .from('habits')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: true }),

                // 2. Logs for the selected date
                supabase
                    .from('habit_logs')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('log_date', dateStr),

                // 3. ALL completed logs from last 90 days (single batch!)
                supabase
                    .from('habit_logs')
                    .select('habit_id, log_date')
                    .eq('user_id', userId)
                    .eq('completed', true)
                    .gte('log_date', toDateStr(new Date(Date.now() - 90 * 86400000)))
                    .order('log_date', { ascending: false }),
            ]);

            if (habitsRes.error) throw habitsRes.error;
            if (logsRes.error) throw logsRes.error;
            // allLogsRes error is non-critical, just skip streaks

            const habitsData = habitsRes.data ?? [];
            if (!habitsData.length) { setHabits([]); return; }

            // Build log map for selected date
            const logMap = new Map<string, HabitLog>();
            (logsRes.data ?? []).forEach((l) => logMap.set(l.habit_id, l));

            // Build streak map from batch query (in-memory computation)
            const streakMap = new Map<string, number>();
            if (!allLogsRes.error && allLogsRes.data) {
                // Group logs by habit_id
                const logsByHabit = new Map<string, Set<string>>();
                for (const log of allLogsRes.data) {
                    if (!logsByHabit.has(log.habit_id)) {
                        logsByHabit.set(log.habit_id, new Set());
                    }
                    logsByHabit.get(log.habit_id)!.add(log.log_date);
                }
                // Compute streak for each habit
                for (const habit of habitsData) {
                    const dates = logsByHabit.get(habit.id) ?? new Set();
                    streakMap.set(habit.id, computeStreak(dates));
                }
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
    }, [userId, dateStr]);

    useEffect(() => { fetchHabits(); }, [fetchHabits]);

    /* ── toggleHabit ─────────────────────────────────────── */
    const toggleHabit = useCallback(async (habitId: string, currentlyDone: boolean) => {
        if (!userId) return;

        // Optimistic update FIRST
        setHabits((prev) => prev.map((h) => {
            if (h.id !== habitId) return h;
            const newLog = currentlyDone
                ? null
                : { id: 'temp', habit_id: habitId, log_date: dateStr, completed: true };
            return { ...h, log: newLog, streak: currentlyDone ? Math.max(0, h.streak - 1) : h.streak + 1 };
        }));

        // Then DB operation (fire-and-forget with error handling)
        try {
            if (currentlyDone) {
                await supabase
                    .from('habit_logs')
                    .delete()
                    .eq('habit_id', habitId)
                    .eq('log_date', dateStr)
                    .eq('user_id', userId);
            } else {
                await supabase
                    .from('habit_logs')
                    .upsert({ habit_id: habitId, user_id: userId, log_date: dateStr, completed: true });
            }
        } catch {
            // Rollback on error
            await fetchHabits();
        }
    }, [userId, dateStr, fetchHabits]);

    /* ── deleteHabit ─────────────────────────────────────── */
    const deleteHabit = useCallback(async (habitId: string) => {
        // Optimistic
        setHabits((prev) => prev.filter((h) => h.id !== habitId));
        const { error } = await supabase.from('habits').delete().eq('id', habitId);
        if (error) await fetchHabits(); // rollback
    }, [fetchHabits]);

    /* ── createHabit ────────────────────────────────────── */
    const createHabit = useCallback(async (params: {
        name: string;
        icon: string;
        color: string;
        frequency: string;
        active_days?: number[];
    }) => {
        if (!userId) throw new Error('No autenticado');

        // Optimistic insert
        const tempId = 'temp-' + Date.now();
        const optimistic: HabitWithLog = {
            id: tempId,
            user_id: userId,
            name: params.name,
            icon: params.icon,
            color: params.color,
            frequency: params.frequency as 'daily' | 'weekly',
            created_at: new Date().toISOString(),
            log: null,
            streak: 0,
        };
        setHabits((prev) => [...prev, optimistic]);

        try {
            const { error: insertErr } = await supabase.from('habits').insert({
                user_id: userId,
                name: params.name,
                icon: params.icon,
                color: params.color,
                frequency: params.frequency,
            });
            if (insertErr) throw insertErr;
            // Refresh to get real ID
            await fetchHabits();
        } catch (e) {
            // Rollback
            setHabits((prev) => prev.filter((h) => h.id !== tempId));
            throw e;
        }
    }, [userId, fetchHabits]);

    /* ── updateHabit ────────────────────────────────────── */
    const updateHabit = useCallback(async (habitId: string, updates: Partial<Pick<Habit, 'name' | 'icon' | 'color' | 'frequency'>>) => {
        // Optimistic
        setHabits((prev) => prev.map((h) => (h.id === habitId ? { ...h, ...updates } : h)));
        const { error: err } = await supabase
            .from('habits')
            .update(updates)
            .eq('id', habitId);
        if (err) {
            await fetchHabits(); // rollback
            throw err;
        }
    }, [fetchHabits]);

    /* ── Stats ───────────────────────────────────────────── */
    const stats: HabitStats = {
        totalActive: habits.length,
        completedToday: habits.filter((h) => !!h.log?.completed).length,
    };

    return { habits, loading, error, refresh: fetchHabits, toggleHabit, deleteHabit, updateHabit, createHabit, stats };
}
