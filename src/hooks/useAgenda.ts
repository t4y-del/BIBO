import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { HabitWithLog } from './useHabits';
import type { Objective } from './useObjectives';

/* ── Types ─────────────────────────────────────────────── */

export interface AgendaEvent {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    event_date: string;
    event_time: string | null;
    color: string;
    type: 'event' | 'reminder' | 'milestone';
    completed: boolean;
}

export interface AgendaDay {
    date: string;
    habits: HabitWithLog[];
    objectives: Objective[];
    events: AgendaEvent[];
    hasContent: boolean;
}

function toDateStr(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

/* ── Hook ───────────────────────────────────────────────── */

export function useAgenda(date: Date = new Date()) {
    const userId = useAuth();
    const dateStr = toDateStr(date);
    const [agenda, setAgenda] = useState<AgendaDay | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [eventDots, setEventDots] = useState<Map<string, string>>(new Map());
    const [objectiveDeadlines, setObjectiveDeadlines] = useState<Map<string, string>>(new Map());

    const loadedMonth = useRef<string>('');

    /* ── fetch day data ─────────────────────────────────── */
    const fetchDay = useCallback(async () => {
        if (!userId) { setLoading(false); return; }
        setLoading(true);
        setError(null);
        try {
            const [habitsRes, logsRes, eventsRes, objectivesRes] = await Promise.all([
                supabase.from('habits').select('*').eq('user_id', userId).eq('is_active', true),
                supabase.from('habit_logs').select('*').eq('user_id', userId).eq('log_date', dateStr),
                supabase.from('agenda_events').select('*')
                    .eq('user_id', userId).eq('event_date', dateStr).order('event_time'),
                supabase.from('objectives')
                    .select('*, tasks:objective_tasks(*)')
                    .eq('user_id', userId)
                    .eq('deadline', dateStr)
                    .neq('status', 'completed'),
            ]);

            if (habitsRes.error) throw habitsRes.error;
            if (logsRes.error) throw logsRes.error;
            if (eventsRes.error) throw eventsRes.error;

            const logMap = new Map((logsRes.data ?? []).map((l: any) => [l.habit_id, l]));
            const habitsWithLogs: HabitWithLog[] = (habitsRes.data ?? []).map((h: any) => ({
                ...h, log: logMap.get(h.id) ?? null, streak: 0,
            }));

            setAgenda({
                date: dateStr,
                habits: habitsWithLogs,
                objectives: (objectivesRes.data ?? []).map((o: any) => ({
                    ...o, tasks: (o.tasks ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
                })),
                events: eventsRes.data ?? [],
                hasContent:
                    habitsWithLogs.length > 0 ||
                    (eventsRes.data ?? []).length > 0 ||
                    (objectivesRes.data ?? []).length > 0,
            });
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [userId, dateStr]);

    /* ── fetch month dots ───────────────────────────────── */
    const fetchMonthDots = useCallback(async (year: number, month: number) => {
        if (!userId) return;

        const start = `${year}-${String(month).padStart(2, '0')}-01`;
        const end = `${year}-${String(month).padStart(2, '0')}-31`;

        const [eventsRes, objectivesRes] = await Promise.all([
            supabase.from('agenda_events')
                .select('event_date, color')
                .eq('user_id', userId)
                .gte('event_date', start)
                .lte('event_date', end),
            supabase.from('objectives')
                .select('deadline, color')
                .eq('user_id', userId)
                .neq('status', 'completed')
                .gte('deadline', start)
                .lte('deadline', end)
                .not('deadline', 'is', null),
        ]);

        const evtMap = new Map<string, string>();
        for (const e of (eventsRes.data ?? [])) {
            evtMap.set(e.event_date, e.color ?? '#6C63FF');
        }

        const deadlineMap = new Map<string, string>();
        for (const obj of (objectivesRes.data ?? [])) {
            if (obj.deadline) deadlineMap.set(obj.deadline, obj.color ?? '#6C63FF');
        }

        setEventDots(evtMap);
        setObjectiveDeadlines(deadlineMap);
        loadedMonth.current = `${year}-${month}`;
    }, [userId]);

    /* ── auto-load dots for the month of the current view date ── */
    useEffect(() => {
        const y = date.getFullYear();
        const m = date.getMonth() + 1;
        const key = `${y}-${m}`;
        if (loadedMonth.current !== key) {
            fetchMonthDots(y, m);
        }
    }, [date, fetchMonthDots]);

    useEffect(() => { fetchDay(); }, [fetchDay]);

    /* ── Event mutations ────────────────────────────────── */

    const createEvent = async (params: {
        title: string; description?: string; event_date: string;
        event_time?: string; color?: string; type?: AgendaEvent['type'];
    }) => {
        if (!userId) throw new Error('No session');

        // Optimistic
        const tempId = 'temp-evt-' + Date.now();
        const optimistic: AgendaEvent = {
            id: tempId, user_id: userId,
            title: params.title,
            description: params.description ?? null,
            event_date: params.event_date,
            event_time: params.event_time ?? null,
            color: params.color ?? '#6C63FF',
            type: params.type ?? 'event',
            completed: false,
        };
        if (params.event_date === dateStr) {
            setAgenda((prev) => prev
                ? { ...prev, events: [...prev.events, optimistic], hasContent: true }
                : prev);
        }

        try {
            const { error: err } = await supabase.from('agenda_events').insert({
                user_id: userId, ...params,
            });
            if (err) throw err;
            const d = new Date(params.event_date + 'T12:00:00');
            await Promise.all([
                fetchDay(),
                fetchMonthDots(d.getFullYear(), d.getMonth() + 1),
            ]);
        } catch (e) {
            await fetchDay();
            throw e;
        }
    };

    const toggleEvent = async (eventId: string, currentlyDone: boolean) => {
        // Optimistic
        setAgenda((prev) => prev
            ? { ...prev, events: prev.events.map((e) => e.id === eventId ? { ...e, completed: !currentlyDone } : e) }
            : prev
        );
        const { error } = await supabase.from('agenda_events').update({ completed: !currentlyDone }).eq('id', eventId);
        if (error) await fetchDay();
    };

    const deleteEvent = async (eventId: string) => {
        // Optimistic
        setAgenda((prev) => prev
            ? { ...prev, events: prev.events.filter((e) => e.id !== eventId) }
            : prev
        );
        const { error } = await supabase.from('agenda_events').delete().eq('id', eventId);
        if (error) await fetchDay();
    };

    /* ── Habit mutations ────────────────────────────────── */

    const toggleHabit = async (habitId: string, currentlyDone: boolean) => {
        if (!userId) return;

        // Optimistic
        setAgenda((prev) => prev
            ? {
                ...prev, habits: prev.habits.map((h) =>
                    h.id === habitId
                        ? { ...h, log: currentlyDone ? null : { id: 'temp', user_id: userId, habit_id: habitId, log_date: dateStr, completed: true, note: null } as any }
                        : h)
            }
            : prev
        );

        try {
            if (currentlyDone) {
                await supabase.from('habit_logs').delete()
                    .eq('user_id', userId).eq('habit_id', habitId).eq('log_date', dateStr);
            } else {
                await supabase.from('habit_logs').upsert({
                    user_id: userId, habit_id: habitId, log_date: dateStr, completed: true,
                });
            }
        } catch {
            await fetchDay();
        }
    };

    return {
        agenda, loading, error,
        eventDots, objectiveDeadlines,
        refresh: fetchDay, fetchMonthDots,
        createEvent, toggleHabit, toggleEvent, deleteEvent,
    };
}
