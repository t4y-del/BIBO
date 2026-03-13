import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabase';

interface AuthState {
    userId: string | null;
    loading: boolean;
}

const AuthContext = createContext<AuthState>({ userId: null, loading: true });

/**
 * Provides `userId` to the entire app tree.
 * Replaces per-hook `supabase.auth.getUser()` calls (each ~200-400ms)
 * with a single context read (~0ms).
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<AuthState>({ userId: null, loading: true });

    useEffect(() => {
        // 1) Read cached session (synchronous from AsyncStorage)
        supabase.auth.getSession().then(({ data: { session } }) => {
            setState({ userId: session?.user?.id ?? null, loading: false });
        });

        // 2) Listen for auth changes (login, logout, token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setState({ userId: session?.user?.id ?? null, loading: false });
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={state}>
            {children}
        </AuthContext.Provider>
    );
}

/**
 * Returns the current user ID.
 * Throws if called before auth is resolved — use `useAuthLoading()` to guard.
 */
export function useAuth(): string | null {
    return useContext(AuthContext).userId;
}

export function useAuthLoading(): boolean {
    return useContext(AuthContext).loading;
}
