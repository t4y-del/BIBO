import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';

/* ── Types ─────────────────────────────────────────────── */

export interface BtcPurchase {
    id: string;
    user_id: string;
    bought_at: string;
    btc_amount: number;
    price_usd: number;
    total_usd: number | null;
    total_ars: number | null;
    total_usdt: number | null;
    currency: 'USD' | 'ARS' | 'USDT';
    note: string | null;
}

export interface BtcGoal {
    id: string;
    user_id: string;
    year: number;
    target_ars: number | null;
    target_usd: number | null;
    target_purchases: number | null;
}

export interface BtcStats {
    totalBtc: number;
    totalArs: number;
    totalUsd: number;
    totalUsdt: number;
    purchaseCount: number;
}

/* ── Helpers ────────────────────────────────────────────── */

function deriveStats(list: BtcPurchase[]): BtcStats {
    return {
        totalBtc: list.reduce((s, p) => s + Number(p.btc_amount), 0),
        totalArs: list.reduce((s, p) => s + Number(p.total_ars ?? 0), 0),
        totalUsd: list.reduce((s, p) => s + Number(p.total_usd ?? 0), 0),
        totalUsdt: list.reduce((s, p) => s + Number(p.total_usdt ?? 0), 0),
        purchaseCount: list.length,
    };
}

/* ── Hook ───────────────────────────────────────────────── */

export function useBtcData(year: number = new Date().getFullYear()) {
    const userId = useAuth();
    const [purchases, setPurchases] = useState<BtcPurchase[]>([]);
    const [goal, setGoal] = useState<BtcGoal | null>(null);
    const [stats, setStats] = useState<BtcStats>({
        totalBtc: 0, totalArs: 0, totalUsd: 0, totalUsdt: 0, purchaseCount: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!userId) { setLoading(false); return; }
        setLoading(true);
        setError(null);
        try {
            const yearStart = `${year}-01-01`;
            const yearEnd = `${year}-12-31`;

            const [purchasesRes, goalRes] = await Promise.all([
                supabase
                    .from('btc_purchases')
                    .select('*')
                    .eq('user_id', userId)
                    .gte('bought_at', yearStart)
                    .lte('bought_at', yearEnd)
                    .order('bought_at', { ascending: false }),
                supabase
                    .from('btc_goals')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('year', year)
                    .maybeSingle(),
            ]);

            if (purchasesRes.error) throw purchasesRes.error;

            const list: BtcPurchase[] = purchasesRes.data ?? [];
            setPurchases(list);
            setGoal(goalRes.data ?? null);
            setStats(deriveStats(list));
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [userId, year]);

    useEffect(() => { fetchData(); }, [fetchData]);

    /* ── Mutations ─────────────────────────────────────── */

    const addPurchase = async (params: {
        bought_at: string;
        btc_amount: number;
        price_usd: number;
        currency: 'USD' | 'ARS' | 'USDT';
        total_usd?: number;
        total_ars?: number;
        total_usdt?: number;
        note?: string;
    }): Promise<string> => {
        if (!userId) throw new Error('Sin sesión');

        // Optimistic
        const tempId = 'temp-btc-' + Date.now();
        const optimistic: BtcPurchase = {
            id: tempId, user_id: userId, ...params,
            total_usd: params.total_usd ?? null,
            total_ars: params.total_ars ?? null,
            total_usdt: params.total_usdt ?? null,
            note: params.note ?? null,
        };
        setPurchases((prev) => {
            const next = [optimistic, ...prev];
            setStats(deriveStats(next));
            return next;
        });

        try {
            const { data, error: err } = await supabase.from('btc_purchases').insert({
                user_id: userId, ...params,
            }).select('id').single();
            if (err) throw err;
            await fetchData();
            return data.id;
        } catch (e) {
            await fetchData(); // rollback
            throw e;
        }
    };

    const deletePurchase = async (id: string) => {
        // Optimistic
        setPurchases((prev) => {
            const next = prev.filter((p) => p.id !== id);
            setStats(deriveStats(next));
            return next;
        });
        const { error } = await supabase.from('btc_purchases').delete().eq('id', id);
        if (error) await fetchData();
    };

    const saveGoal = async (params: {
        target_ars?: number;
        target_usd?: number;
        target_purchases?: number;
    }) => {
        if (!userId) throw new Error('Sin sesión');
        const { error: err } = await supabase.from('btc_goals').upsert(
            { user_id: userId, year, ...params },
            { onConflict: 'user_id,year' }
        );
        if (err) throw err;
        await fetchData();
    };

    const updatePurchase = async (id: string, params: {
        bought_at: string;
        btc_amount: number;
        price_usd: number;
        currency: 'USD' | 'ARS' | 'USDT';
        total_usd?: number | null;
        total_ars?: number | null;
        total_usdt?: number | null;
        note?: string | null;
    }) => {
        // Optimistic
        setPurchases((prev) => {
            const next = prev.map((p) => p.id === id ? { ...p, ...params } as BtcPurchase : p);
            setStats(deriveStats(next));
            return next;
        });
        const { error: err } = await supabase
            .from('btc_purchases')
            .update(params)
            .eq('id', id);
        if (err) {
            await fetchData();
            throw err;
        }
    };

    return { purchases, goal, stats, loading, error, refresh: fetchData, addPurchase, updatePurchase, deletePurchase, saveGoal };
}
