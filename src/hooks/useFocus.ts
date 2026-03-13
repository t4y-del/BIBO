import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface FocusSession {
    id: string;
    user_id: string;
    name: string | null;
    duration_seconds: number;
    session_date: string;
    created_at: string;
}

export function useFocus() {
    const userId = useAuth();
    const [sessions, setSessions] = useState<FocusSession[]>([]);
    const [loading, setLoading] = useState(true);

    // Timer state
    const [timerSeconds, setTimerSeconds] = useState(25 * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchSessions = useCallback(async () => {
        if (!userId) { setLoading(false); return; }
        setLoading(true);
        try {
            const { data } = await supabase
                .from('focus_sessions')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(50);
            setSessions(data ?? []);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => { fetchSessions(); }, [fetchSessions]);

    // Timer tick
    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => {
                setElapsed(prev => {
                    const next = prev + 1;
                    if (next >= timerSeconds) {
                        setIsRunning(false);
                        if (intervalRef.current) clearInterval(intervalRef.current);
                    }
                    return next;
                });
            }, 1000);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isRunning, timerSeconds]);

    const start = () => setIsRunning(true);
    const pause = () => setIsRunning(false);
    const reset = () => { setIsRunning(false); setElapsed(0); };

    const setDuration = (minutes: number) => {
        setTimerSeconds(minutes * 60);
        setElapsed(0);
        setIsRunning(false);
    };

    const remaining = Math.max(0, timerSeconds - elapsed);
    const isDone = elapsed >= timerSeconds && timerSeconds > 0;

    const saveSession = useCallback(async (name?: string) => {
        if (!userId) throw new Error('No autenticado');

        // Optimistic
        const tempId = 'temp-focus-' + Date.now();
        const sessionDate = new Date().toISOString().split('T')[0];
        const optimistic: FocusSession = {
            id: tempId, user_id: userId,
            name: name || null,
            duration_seconds: elapsed,
            session_date: sessionDate,
            created_at: new Date().toISOString(),
        };
        setSessions((prev) => [optimistic, ...prev]);
        setElapsed(0);
        setIsRunning(false);

        try {
            const { error } = await supabase.from('focus_sessions').insert({
                user_id: userId,
                name: name || null,
                duration_seconds: elapsed,
                session_date: sessionDate,
            });
            if (error) throw error;
            await fetchSessions();
        } catch (e) {
            await fetchSessions();
            throw e;
        }
    }, [userId, elapsed, fetchSessions]);

    const deleteSession = useCallback(async (sessionId: string) => {
        // Optimistic
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        const { error } = await supabase.from('focus_sessions').delete().eq('id', sessionId);
        if (error) await fetchSessions();
    }, [fetchSessions]);

    // Stats
    const todaySessions = sessions.filter(s => s.session_date === new Date().toISOString().split('T')[0]);
    const todayMinutes = Math.round(todaySessions.reduce((sum, s) => sum + s.duration_seconds, 0) / 60);

    return {
        sessions, loading, refresh: fetchSessions,
        remaining, elapsed, isRunning, isDone, timerSeconds,
        start, pause, reset, setDuration,
        saveSession, deleteSession,
        todaySessions, todayMinutes,
    };
}
