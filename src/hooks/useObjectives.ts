import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';

/* ── Types ─────────────────────────────────────────────── */

export interface ObjectiveTask {
    id: string;
    objective_id: string;
    user_id: string;
    title: string;
    completed: boolean;
    due_date: string | null;
    sort_order: number;
}

export interface Objective {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    icon: string;
    color: string;
    deadline: string | null;
    status: 'active' | 'completed' | 'paused';
    progress: number;
    created_at: string;
    tasks: ObjectiveTask[];
}

/* ── Hook ───────────────────────────────────────────────── */

export function useObjectives(filter: 'all' | 'active' | 'completed' = 'all') {
    const [objectives, setObjectives] = useState<Objective[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchObjectives = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            let query = supabase
                .from('objectives')
                .select(`*, tasks:objective_tasks(*)`)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (filter === 'active') query = query.eq('status', 'active');
            if (filter === 'completed') query = query.eq('status', 'completed');

            const { data, error: err } = await query;
            if (err) throw err;

            // Sort tasks by sort_order
            const withSortedTasks = (data ?? []).map((obj: any) => ({
                ...obj,
                tasks: (obj.tasks ?? []).sort((a: ObjectiveTask, b: ObjectiveTask) =>
                    a.sort_order - b.sort_order
                ),
            }));

            setObjectives(withSortedTasks);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => { fetchObjectives(); }, [fetchObjectives]);

    /* ── Objective Mutations ──────────────────────────────── */

    const createObjective = async (params: {
        title: string; description?: string; icon?: string;
        color?: string; deadline?: string;
    }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No session');

        const { error: err } = await supabase.from('objectives').insert({
            user_id: user.id,
            title: params.title,
            description: params.description ?? null,
            icon: params.icon ?? '🎯',
            color: params.color ?? '#6C63FF',
            deadline: params.deadline ?? null,
        });
        if (err) throw err;
        await fetchObjectives();
    };

    const updateObjective = async (
        objectiveId: string,
        updates: Partial<Pick<Objective, 'title' | 'description' | 'icon' | 'color' | 'deadline' | 'status'>>
    ) => {
        const { error: err } = await supabase
            .from('objectives')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', objectiveId);
        if (err) throw err;
        setObjectives((prev) =>
            prev.map((o) => (o.id === objectiveId ? { ...o, ...updates } : o))
        );
    };

    const deleteObjective = async (objectiveId: string) => {
        await supabase.from('objectives').delete().eq('id', objectiveId);
        setObjectives((prev) => prev.filter((o) => o.id !== objectiveId));
    };

    /* ── Task Mutations ───────────────────────────────────── */

    const addTask = async (objectiveId: string, title: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No session');

        const obj = objectives.find((o) => o.id === objectiveId);
        const sort_order = obj ? obj.tasks.length : 0;

        const { error: err } = await supabase.from('objective_tasks').insert({
            objective_id: objectiveId,
            user_id: user.id,
            title,
            sort_order,
        });
        if (err) throw err;
        await fetchObjectives(); // triggers DB recalc of progress
    };

    const toggleTask = async (taskId: string, objectiveId: string, currentlyDone: boolean) => {
        const { error: err } = await supabase
            .from('objective_tasks')
            .update({ completed: !currentlyDone })
            .eq('id', taskId);
        if (err) throw err;

        // Optimistic update
        setObjectives((prev) =>
            prev.map((obj) => {
                if (obj.id !== objectiveId) return obj;
                const tasks = obj.tasks.map((t) =>
                    t.id === taskId ? { ...t, completed: !currentlyDone } : t
                );
                const done = tasks.filter((t) => t.completed).length;
                const progress = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;
                return { ...obj, tasks, progress };
            })
        );
    };

    const deleteTask = async (taskId: string) => {
        await supabase.from('objective_tasks').delete().eq('id', taskId);
        await fetchObjectives();
    };

    const totalProgress =
        objectives.length > 0
            ? Math.round(objectives.reduce((acc, o) => acc + o.progress, 0) / objectives.length)
            : 0;

    return {
        objectives,
        loading,
        error,
        refresh: fetchObjectives,
        createObjective,
        updateObjective,
        deleteObjective,
        addTask,
        toggleTask,
        deleteTask,
        stats: { total: objectives.length, totalProgress },
    };
}
