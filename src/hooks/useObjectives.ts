import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';

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
    const userId = useAuth();
    const [objectives, setObjectives] = useState<Objective[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchObjectives = useCallback(async () => {
        if (!userId) { setLoading(false); return; }
        setLoading(true);
        setError(null);
        try {
            let query = supabase
                .from('objectives')
                .select(`*, tasks:objective_tasks(*)`)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (filter === 'active') query = query.eq('status', 'active');
            if (filter === 'completed') query = query.eq('status', 'completed');

            const { data, error: err } = await query;
            if (err) throw err;

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
    }, [userId, filter]);

    useEffect(() => { fetchObjectives(); }, [fetchObjectives]);

    /* ── Objective Mutations ──────────────────────────────── */

    const createObjective = async (params: {
        title: string; description?: string; icon?: string;
        color?: string; deadline?: string;
    }) => {
        if (!userId) throw new Error('No session');

        // Optimistic insert
        const tempId = 'temp-' + Date.now();
        const optimistic: Objective = {
            id: tempId, user_id: userId,
            title: params.title,
            description: params.description ?? null,
            icon: params.icon ?? '🎯',
            color: params.color ?? '#6C63FF',
            deadline: params.deadline ?? null,
            status: 'active', progress: 0,
            created_at: new Date().toISOString(),
            tasks: [],
        };
        setObjectives((prev) => [optimistic, ...prev]);

        try {
            const { error: err } = await supabase.from('objectives').insert({
                user_id: userId,
                title: params.title,
                description: params.description ?? null,
                icon: params.icon ?? '🎯',
                color: params.color ?? '#6C63FF',
                deadline: params.deadline ?? null,
            });
            if (err) throw err;
            await fetchObjectives(); // get real ID
        } catch (e) {
            setObjectives((prev) => prev.filter((o) => o.id !== tempId));
            throw e;
        }
    };

    const updateObjective = async (
        objectiveId: string,
        updates: Partial<Pick<Objective, 'title' | 'description' | 'icon' | 'color' | 'deadline' | 'status'>>
    ) => {
        // Optimistic
        setObjectives((prev) =>
            prev.map((o) => (o.id === objectiveId ? { ...o, ...updates } : o))
        );
        const { error: err } = await supabase
            .from('objectives')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', objectiveId);
        if (err) {
            await fetchObjectives();
            throw err;
        }
    };

    const deleteObjective = async (objectiveId: string) => {
        // Optimistic
        const backup = objectives;
        setObjectives((prev) => prev.filter((o) => o.id !== objectiveId));
        const { error } = await supabase.from('objectives').delete().eq('id', objectiveId);
        if (error) {
            setObjectives(backup);
            throw error;
        }
    };

    /* ── Task Mutations ───────────────────────────────────── */

    const addTask = async (objectiveId: string, title: string) => {
        if (!userId) throw new Error('No session');

        const obj = objectives.find((o) => o.id === objectiveId);
        const sort_order = obj ? obj.tasks.length : 0;

        // Optimistic
        const tempTaskId = 'temp-task-' + Date.now();
        setObjectives((prev) => prev.map((o) => {
            if (o.id !== objectiveId) return o;
            const newTask: ObjectiveTask = {
                id: tempTaskId, objective_id: objectiveId, user_id: userId,
                title, completed: false, due_date: null, sort_order,
            };
            const tasks = [...o.tasks, newTask];
            const progress = Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100);
            return { ...o, tasks, progress };
        }));

        try {
            const { error: err } = await supabase.from('objective_tasks').insert({
                objective_id: objectiveId, user_id: userId, title, sort_order,
            });
            if (err) throw err;
            await fetchObjectives();
        } catch (e) {
            await fetchObjectives();
            throw e;
        }
    };

    const toggleTask = async (taskId: string, objectiveId: string, currentlyDone: boolean) => {
        // Optimistic: toggle task + recalc progress + auto-status
        setObjectives((prev) => prev.map((o) => {
            if (o.id !== objectiveId) return o;
            const tasks = o.tasks.map((t) =>
                t.id === taskId ? { ...t, completed: !currentlyDone } : t
            );
            const done = tasks.filter((t) => t.completed).length;
            const progress = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;
            const newStatus = progress === 100 ? 'completed' as const : 'active' as const;
            return { ...o, tasks, progress, status: newStatus };
        }));

        try {
            const { error: err } = await supabase
                .from('objective_tasks')
                .update({ completed: !currentlyDone })
                .eq('id', taskId);
            if (err) throw err;

            // If status changed, update objective too
            const obj = objectives.find((o) => o.id === objectiveId);
            if (obj) {
                const tasks = obj.tasks.map((t) =>
                    t.id === taskId ? { ...t, completed: !currentlyDone } : t
                );
                const done = tasks.filter((t) => t.completed).length;
                const progress = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;
                const newStatus = progress === 100 ? 'completed' : 'active';
                if (newStatus !== obj.status) {
                    await supabase
                        .from('objectives')
                        .update({ status: newStatus, updated_at: new Date().toISOString() })
                        .eq('id', objectiveId);
                }
            }
        } catch {
            await fetchObjectives();
        }
    };

    const deleteTask = async (taskId: string) => {
        // Optimistic
        setObjectives((prev) => prev.map((o) => {
            const tasks = o.tasks.filter((t) => t.id !== taskId);
            const done = tasks.filter((t) => t.completed).length;
            const progress = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;
            return { ...o, tasks, progress };
        }));
        const { error } = await supabase.from('objective_tasks').delete().eq('id', taskId);
        if (error) await fetchObjectives();
    };

    const totalProgress =
        objectives.length > 0
            ? Math.round(objectives.reduce((acc, o) => acc + o.progress, 0) / objectives.length)
            : 0;

    return {
        objectives, loading, error,
        refresh: fetchObjectives,
        createObjective, updateObjective, deleteObjective,
        addTask, toggleTask, deleteTask,
        stats: { total: objectives.length, totalProgress },
    };
}
