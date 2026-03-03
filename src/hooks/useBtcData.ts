import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';

/* ── Types ─────────────────────────────────────────────── */

export interface BtcPurchase {
    id: string;
    user_id: string;
    bought_at: string;          // YYYY-MM-DD
    btc_amount: number;          // BTC bought
    price_usd: number;          // BTC/USD price at purchase
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
    totalBtc: number;   // sum of btc_amount
    totalArs: number;   // sum of total_ars (only ARS purchases)
    totalUsd: number;   // sum of total_usd (only USD purchases)
    totalUsdt: number;   // sum of total_usdt (only USDT purchases)
    purchaseCount: number;
}

/* ── Hook ───────────────────────────────────────────────── */

export function useBtcData(year: number = new Date().getFullYear()) {
    const [purchases, setPurchases] = useState<BtcPurchase[]>([]);
    const [goal, setGoal] = useState<BtcGoal | null>(null);
    const [stats, setStats] = useState<BtcStats>({
        totalBtc: 0, totalArs: 0, totalUsd: 0, totalUsdt: 0, purchaseCount: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const yearStart = `${year}-01-01`;
            const yearEnd = `${year}-12-31`;

            const [purchasesRes, goalRes] = await Promise.all([
                supabase
                    .from('btc_purchases')
                    .select('*')
                    .eq('user_id', user.id)
                    .gte('bought_at', yearStart)
                    .lte('bought_at', yearEnd)
                    .order('bought_at', { ascending: false }),
                supabase
                    .from('btc_goals')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('year', year)
                    .maybeSingle(),
            ]);

            if (purchasesRes.error) throw purchasesRes.error;

            const list: BtcPurchase[] = purchasesRes.data ?? [];
            setPurchases(list);
            setGoal(goalRes.data ?? null);

            // Derive stats
            const totalBtc = list.reduce((s, p) => s + Number(p.btc_amount), 0);
            const totalArs = list.reduce((s, p) => s + Number(p.total_ars ?? 0), 0);
            const totalUsd = list.reduce((s, p) => s + Number(p.total_usd ?? 0), 0);
            const totalUsdt = list.reduce((s, p) => s + Number(p.total_usdt ?? 0), 0);
            setStats({ totalBtc, totalArs, totalUsd, totalUsdt, purchaseCount: list.length });
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [year]);

    useEffect(() => { fetch(); }, [fetch]);

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
    }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Sin sesión');
        const { error: err } = await supabase.from('btc_purchases').insert({
            user_id: user.id, ...params,
        });
        if (err) throw err;
        await fetch();
    };

    const deletePurchase = async (id: string) => {
        await supabase.from('btc_purchases').delete().eq('id', id);
        setPurchases((prev) => prev.filter((p) => p.id !== id));
        setStats((prev) => {
            const removed = purchases.find((p) => p.id === id);
            if (!removed) return prev;
            return {
                ...prev,
                totalBtc: prev.totalBtc - Number(removed.btc_amount),
                totalArs: prev.totalArs - Number(removed.total_ars ?? 0),
                totalUsd: prev.totalUsd - Number(removed.total_usd ?? 0),
                totalUsdt: prev.totalUsdt - Number(removed.total_usdt ?? 0),
                purchaseCount: prev.purchaseCount - 1,
            };
        });
    };

    const saveGoal = async (params: {
        target_ars?: number;
        target_usd?: number;
        target_purchases?: number;
    }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Sin sesión');
        const { error: err } = await supabase.from('btc_goals').upsert(
            { user_id: user.id, year, ...params },
            { onConflict: 'user_id,year' }
        );
        if (err) throw err;
        await fetch();
    };

    return { purchases, goal, stats, loading, error, refresh: fetch, addPurchase, deletePurchase, saveGoal };
}
