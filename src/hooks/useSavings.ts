import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';

/* ── Types ──────────────────────────────────────────────── */

export interface SavingsEntry {
    id: string;
    user_id: string;
    year: number;
    month: number;   // 1-12
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
    totalArs: number;  // accumulated this year
    monthsOk: number;  // months that met the monthly target
    compliance: number;  // % months OK / months elapsed
    monthlyTarget: number;
}

/* ── Hook ───────────────────────────────────────────────── */

export function useSavings(year: number = new Date().getFullYear()) {
    const [entries, setEntries] = useState<SavingsEntry[]>([]);
    const [goal, setGoal] = useState<SavingsGoal | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No autenticado');

            const [entriesRes, goalRes] = await Promise.all([
                supabase
                    .from('savings_entries')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('year', year)
                    .order('month', { ascending: true }),
                supabase
                    .from('savings_goals')
                    .select('*')
                    .eq('user_id', user.id)
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
    }, [year]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    /* ── addEntry ─────────────────────────────────────────── */
    const addEntry = useCallback(async (params: {
        month: number;
        amount_ars: number;
        saved_at: string;
        note?: string;
    }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No autenticado');

        const { error } = await supabase
            .from('savings_entries')
            .upsert({
                user_id: user.id,
                year,
                month: params.month,
                amount_ars: params.amount_ars,
                saved_at: params.saved_at,
                note: params.note ?? null,
            }, { onConflict: 'user_id,year,month' });

        if (error) throw error;
        await fetchAll();
    }, [year, fetchAll]);

    /* ── deleteEntry ──────────────────────────────────────── */
    const deleteEntry = useCallback(async (id: string) => {
        const { error } = await supabase.from('savings_entries').delete().eq('id', id);
        if (error) throw error;
        setEntries((prev) => prev.filter((e) => e.id !== id));
    }, []);

    /* ── saveGoal ─────────────────────────────────────────── */
    const saveGoal = useCallback(async (monthlyTarget: number) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No autenticado');

        const { data, error } = await supabase
            .from('savings_goals')
            .upsert({ user_id: user.id, year, monthly_target: monthlyTarget }, { onConflict: 'user_id,year' })
            .select()
            .single();

        if (error) throw error;
        setGoal(data as SavingsGoal);
    }, [year]);

    /* ── Computed stats ───────────────────────────────────── */
    const monthlyTarget = goal?.monthly_target ?? 0;
    const totalArs = entries.reduce((s, e) => s + Number(e.amount_ars), 0);
    const currentMonth = new Date().getMonth() + 1; // 1-indexed
    const monthsElapsed = Math.min(currentMonth, 12);
    const monthsOk = entries.filter((e) => Number(e.amount_ars) >= monthlyTarget && monthlyTarget > 0).length;
    const compliance = monthsElapsed > 0 ? Math.round((monthsOk / monthsElapsed) * 100) : 0;

    const stats: SavingsStats = { totalArs, monthsOk, compliance, monthlyTarget };

    return { entries, goal, stats, loading, error, refresh: fetchAll, addEntry, deleteEntry, saveGoal };
}
