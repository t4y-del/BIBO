import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';

/* ── Types ──────────────────────────────────────────────── */

export interface SavingsEntry {
    id: string;
    user_id: string;
    year: number;
    month: number;
    amount_ars: number;
    saved_at: string;
    note: string | null;
}

export interface SavingsGoal {
    id: string;
    user_id: string;
    year: number;
    monthly_target: number;
}

export interface SavingsStats {
    totalArs: number;
    monthsOk: number;
    compliance: number;
    monthlyTarget: number;
}

/* ── Hook ───────────────────────────────────────────────── */

export function useSavings(year: number = new Date().getFullYear()) {
    const userId = useAuth();
    const [entries, setEntries] = useState<SavingsEntry[]>([]);
    const [goal, setGoal] = useState<SavingsGoal | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAll = useCallback(async () => {
        if (!userId) { setLoading(false); return; }
        setLoading(true);
        setError(null);
        try {
            const [entriesRes, goalRes] = await Promise.all([
                supabase
                    .from('savings_entries')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('year', year)
                    .order('month', { ascending: true }),
                supabase
                    .from('savings_goals')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('year', year)
                    .maybeSingle(),
            ]);

            if (entriesRes.error) throw entriesRes.error;
            if (goalRes.error) throw goalRes.error;

            setEntries((entriesRes.data ?? []) as SavingsEntry[]);
            setGoal(goalRes.data as SavingsGoal | null);
        } catch (e: any) {
            setError(e.message ?? 'Error desconocido');
        } finally {
            setLoading(false);
        }
    }, [userId, year]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    /* ── addEntry ─────────────────────────────────────────── */
    const addEntry = useCallback(async (params: {
        month: number;
        amount_ars: number;
        saved_at: string;
        note?: string;
    }): Promise<string> => {
        if (!userId) throw new Error('No autenticado');

        // Optimistic
        const tempId = 'temp-sav-' + Date.now();
        const optimistic: SavingsEntry = {
            id: tempId, user_id: userId, year,
            month: params.month,
            amount_ars: params.amount_ars,
            saved_at: params.saved_at,
            note: params.note ?? null,
        };
        setEntries((prev) => [...prev, optimistic].sort((a, b) => a.month - b.month));

        try {
            const { data, error } = await supabase
                .from('savings_entries')
                .upsert({
                    user_id: userId, year,
                    month: params.month,
                    amount_ars: params.amount_ars,
                    saved_at: params.saved_at,
                    note: params.note ?? null,
                }, { onConflict: 'user_id,year,month' })
                .select('id')
                .single();
            if (error) throw error;
            await fetchAll();
            return data.id;
        } catch (e) {
            await fetchAll();
            throw e;
        }
    }, [userId, year, fetchAll]);

    /* ── updateEntry ──────────────────────────────────────── */
    const updateEntry = useCallback(async (id: string, params: {
        month: number;
        amount_ars: number;
        saved_at: string;
        note?: string;
    }) => {
        // Optimistic
        setEntries((prev) => prev.map((e) => e.id === id ? {
            ...e, month: params.month, amount_ars: params.amount_ars,
            saved_at: params.saved_at, note: params.note ?? null,
        } : e));

        const { error } = await supabase
            .from('savings_entries')
            .update({
                month: params.month,
                amount_ars: params.amount_ars,
                saved_at: params.saved_at,
                note: params.note ?? null,
            })
            .eq('id', id);
        if (error) {
            await fetchAll();
            throw error;
        }
    }, [fetchAll]);

    /* ── deleteEntry ──────────────────────────────────────── */
    const deleteEntry = useCallback(async (id: string) => {
        // Optimistic
        setEntries((prev) => prev.filter((e) => e.id !== id));
        const { error } = await supabase.from('savings_entries').delete().eq('id', id);
        if (error) await fetchAll();
    }, [fetchAll]);

    /* ── saveGoal ─────────────────────────────────────────── */
    const saveGoal = useCallback(async (monthlyTarget: number) => {
        if (!userId) throw new Error('No autenticado');

        // Optimistic
        setGoal((prev) => prev
            ? { ...prev, monthly_target: monthlyTarget }
            : { id: 'temp', user_id: userId, year, monthly_target: monthlyTarget }
        );

        const { data, error } = await supabase
            .from('savings_goals')
            .upsert({ user_id: userId, year, monthly_target: monthlyTarget }, { onConflict: 'user_id,year' })
            .select()
            .single();
        if (error) {
            await fetchAll();
            throw error;
        }
        setGoal(data as SavingsGoal);
    }, [userId, year, fetchAll]);

    /* ── Computed stats ───────────────────────────────────── */
    const monthlyTarget = goal?.monthly_target ?? 0;
    const totalArs = entries.reduce((s, e) => s + Number(e.amount_ars), 0);
    const currentMonth = new Date().getMonth() + 1;
    const monthsElapsed = Math.min(currentMonth, 12);
    const monthsOk = entries.filter((e) => Number(e.amount_ars) >= monthlyTarget && monthlyTarget > 0).length;
    const compliance = monthsElapsed > 0 ? Math.round((monthsOk / monthsElapsed) * 100) : 0;

    const stats: SavingsStats = { totalArs, monthsOk, compliance, monthlyTarget };

    return { entries, goal, stats, loading, error, refresh: fetchAll, addEntry, updateEntry, deleteEntry, saveGoal };
}
