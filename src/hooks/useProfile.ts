import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Profile {
    id: string;
    display_name: string | null;
    full_name: string | null;
    avatar_url: string | null;
    nivel: number;
    created_at: string;
}

export function useProfile() {
    const userId = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProfile = useCallback(async () => {
        if (!userId) { setLoading(false); return; }
        try {
            const { data, error: err } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
            if (err) throw err;
            setProfile(data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => { fetchProfile(); }, [fetchProfile]);

    const updateProfile = async (updates: Partial<Omit<Profile, 'id' | 'created_at'>>) => {
        if (!userId) throw new Error('No session');
        // Optimistic
        setProfile((prev) => prev ? { ...prev, ...updates } : prev);
        const { data, error: err } = await supabase
            .from('profiles')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', userId)
            .select()
            .single();
        if (err) {
            await fetchProfile(); // rollback
            throw err;
        }
        setProfile(data);
        return data;
    };

    return { profile, loading, error, updateProfile, refresh: fetchProfile };
}
