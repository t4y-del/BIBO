import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface JournalEntry {
    id: string;
    user_id: string;
    mood: string;
    content: string | null;
    entry_date: string;
    created_at: string;
    tags: string[];
}

export function useJournal() {
    const userId = useAuth();
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [todayMood, setTodayMood] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const today = new Date().toISOString().split('T')[0];

    const fetchEntries = useCallback(async () => {
        if (!userId) { setLoading(false); return; }
        setLoading(true);
        setError(null);
        try {
            const { data, error: err } = await supabase
                .from('journal_entries')
                .select('*')
                .eq('user_id', userId)
                .order('entry_date', { ascending: false })
                .limit(30);

            if (err) throw err;

            const entryIds = (data ?? []).map(e => e.id);
            let tagsMap = new Map<string, string[]>();

            if (entryIds.length > 0) {
                const { data: tagsData } = await supabase
                    .from('journal_tags')
                    .select('*')
                    .in('entry_id', entryIds);

                (tagsData ?? []).forEach(t => {
                    const existing = tagsMap.get(t.entry_id) ?? [];
                    existing.push(t.tag);
                    tagsMap.set(t.entry_id, existing);
                });
            }

            const combined: JournalEntry[] = (data ?? []).map(e => ({
                ...e,
                tags: tagsMap.get(e.id) ?? [],
            }));

            setEntries(combined);
            const todayEntry = combined.find(e => e.entry_date === today);
            setTodayMood(todayEntry?.mood ?? null);
        } catch (e: any) {
            setError(e.message ?? 'Error desconocido');
        } finally {
            setLoading(false);
        }
    }, [userId, today]);

    useEffect(() => { fetchEntries(); }, [fetchEntries]);

    const setMood = useCallback(async (mood: string) => {
        if (!userId) return;
        // Optimistic
        setTodayMood(mood);
        const { error: err } = await supabase
            .from('journal_entries')
            .upsert(
                { user_id: userId, mood, entry_date: today },
                { onConflict: 'user_id,entry_date' }
            );
        if (err) await fetchEntries();
        else await fetchEntries(); // get real data with id
    }, [userId, today, fetchEntries]);

    const addEntry = useCallback(async (params: { mood: string; content: string; tags?: string[] }) => {
        if (!userId) throw new Error('No autenticado');

        // Optimistic
        const tempId = 'temp-j-' + Date.now();
        const optimistic: JournalEntry = {
            id: tempId, user_id: userId,
            mood: params.mood, content: params.content,
            entry_date: today, created_at: new Date().toISOString(),
            tags: params.tags ?? [],
        };
        setEntries((prev) => [optimistic, ...prev.filter(e => e.entry_date !== today)]);
        setTodayMood(params.mood);

        try {
            const { data, error: err } = await supabase
                .from('journal_entries')
                .upsert(
                    { user_id: userId, mood: params.mood, content: params.content, entry_date: today },
                    { onConflict: 'user_id,entry_date' }
                )
                .select()
                .single();
            if (err) throw err;

            if (params.tags?.length && data) {
                await supabase.from('journal_tags').delete().eq('entry_id', data.id);
                const tagRows = params.tags.map(tag => ({ entry_id: data.id, tag }));
                await supabase.from('journal_tags').insert(tagRows);
            }
            await fetchEntries();
        } catch (e) {
            await fetchEntries();
            throw e;
        }
    }, [userId, today, fetchEntries]);

    const deleteEntry = useCallback(async (entryId: string) => {
        // Optimistic
        setEntries(prev => prev.filter(e => e.id !== entryId));
        const { error } = await supabase.from('journal_entries').delete().eq('id', entryId);
        if (error) await fetchEntries();
    }, [fetchEntries]);

    const updateEntry = useCallback(async (entryId: string, updates: { mood?: string; content?: string; tags?: string[] }) => {
        // Optimistic
        setEntries((prev) => prev.map(e => e.id === entryId ? {
            ...e,
            ...(updates.mood !== undefined ? { mood: updates.mood } : {}),
            ...(updates.content !== undefined ? { content: updates.content } : {}),
            ...(updates.tags !== undefined ? { tags: updates.tags } : {}),
        } : e));

        try {
            const { mood, content, tags } = updates;
            const updateObj: any = {};
            if (mood !== undefined) updateObj.mood = mood;
            if (content !== undefined) updateObj.content = content;

            if (Object.keys(updateObj).length > 0) {
                await supabase.from('journal_entries').update(updateObj).eq('id', entryId);
            }

            if (tags !== undefined) {
                await supabase.from('journal_tags').delete().eq('entry_id', entryId);
                if (tags.length > 0) {
                    await supabase.from('journal_tags').insert(tags.map(tag => ({ entry_id: entryId, tag })));
                }
            }
        } catch {
            await fetchEntries();
        }
    }, [fetchEntries]);

    return { entries, todayMood, loading, error, refresh: fetchEntries, setMood, addEntry, deleteEntry, updateEntry };
}
