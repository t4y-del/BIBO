import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Goal {
    id: string;
    user_id: string;
    period: 'annual' | 'monthly' | 'weekly';
    title: string;
    description: string | null;
    icon: string;
    color: string;
    progress: number;
    quarter: string | null;
    target_date: string | null;
    status: string;
    created_at: string;
}

export function useGoals(period: 'annual' | 'monthly' | 'weekly' = 'annual') {
    const userId = useAuth();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [vision, setVision] = useState<string>('');
    const [loading, setLoading] = useState(true);

    const currentYear = new Date().getFullYear();

    const fetchGoals = useCallback(async () => {
        if (!userId) { setLoading(false); return; }
        setLoading(true);
        try {
            const goalsPromise = supabase
                .from('goals')
                .select('*')
                .eq('user_id', userId)
                .eq('period', period)
                .order('created_at', { ascending: true });

            const visionPromise = period === 'annual'
                ? supabase
                    .from('goal_vision')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('year', currentYear)
                    .maybeSingle()
                : null;

            const [goalsRes, visionRes] = await Promise.all([
                goalsPromise,
                visionPromise,
            ]);

            setGoals(goalsRes.data ?? []);
            if (period === 'annual' && visionRes) {
                setVision(visionRes.data?.vision_text ?? '');
            }
        } finally {
            setLoading(false);
        }
    }, [userId, period, currentYear]);

    useEffect(() => { fetchGoals(); }, [fetchGoals]);

    const createGoal = useCallback(async (params: {
        title: string;
        description?: string;
        icon?: string;
        color?: string;
        quarter?: string;
        target_date?: string;
    }) => {
        if (!userId) throw new Error('No autenticado');

        // Optimistic
        const tempId = 'temp-goal-' + Date.now();
        const optimistic: Goal = {
            id: tempId, user_id: userId, period,
            title: params.title,
            description: params.description ?? null,
            icon: params.icon ?? '🎯',
            color: params.color ?? '#2AC9A0',
            progress: 0,
            quarter: params.quarter ?? null,
            target_date: params.target_date ?? null,
            status: 'active',
            created_at: new Date().toISOString(),
        };
        setGoals((prev) => [...prev, optimistic]);

        try {
            const { error } = await supabase.from('goals').insert({
                user_id: userId, period,
                title: params.title,
                description: params.description,
                icon: params.icon ?? '🎯',
                color: params.color ?? '#2AC9A0',
                quarter: params.quarter,
                target_date: params.target_date,
            });
            if (error) throw error;
            await fetchGoals();
        } catch (e) {
            setGoals((prev) => prev.filter(g => g.id !== tempId));
            throw e;
        }
    }, [userId, period, fetchGoals]);

    const updateGoal = useCallback(async (goalId: string, updates: Partial<Goal>) => {
        // Optimistic
        setGoals(prev => prev.map(g => g.id === goalId ? { ...g, ...updates } : g));
        const { error } = await supabase.from('goals').update(updates).eq('id', goalId);
        if (error) {
            await fetchGoals();
            throw error;
        }
    }, [fetchGoals]);

    const deleteGoal = useCallback(async (goalId: string) => {
        // Optimistic
        setGoals(prev => prev.filter(g => g.id !== goalId));
        const { error } = await supabase.from('goals').delete().eq('id', goalId);
        if (error) await fetchGoals();
    }, [fetchGoals]);

    const saveVision = useCallback(async (text: string) => {
        if (!userId) throw new Error('No autenticado');
        // Optimistic
        setVision(text);
        const { error } = await supabase.from('goal_vision').upsert(
            { user_id: userId, year: currentYear, vision_text: text },
            { onConflict: 'user_id,year' }
        );
        if (error) await fetchGoals();
    }, [userId, currentYear, fetchGoals]);

    // Stats
    const activeGoals = goals.filter(g => g.status === 'active');
    const completedGoals = goals.filter(g => g.status === 'completed');
    const avgProgress = activeGoals.length > 0
        ? Math.round(activeGoals.reduce((s, g) => s + g.progress, 0) / activeGoals.length)
        : 0;

    return {
        goals, vision, loading, refresh: fetchGoals,
        createGoal, updateGoal, deleteGoal, saveVision,
        activeGoals, completedGoals, avgProgress,
    };
}
