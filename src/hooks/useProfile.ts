import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

export interface Profile {
    id: string;
    display_name: string | null;
    full_name: string | null;
    avatar_url: string | null;
    nivel: number;
    created_at: string;
}

export function useProfile() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        const fetchProfile = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data, error: err } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (err) throw err;
                if (mounted) setProfile(data);
            } catch (e: any) {
                if (mounted) setError(e.message);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchProfile();
        return () => { mounted = false; };
    }, []);

    const updateProfile = async (updates: Partial<Omit<Profile, 'id' | 'created_at'>>) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No session');

        const { data, error: err } = await supabase
            .from('profiles')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', user.id)
            .select()
            .single();

        if (err) throw err;
        setProfile(data);
        return data;
    };

    return { profile, loading, error, updateProfile };
}
