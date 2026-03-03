/**
 * Global type definitions for BIBO app
 */

// Navigation
export type RootStackParamList = {
    Home: undefined;
    // Add more screens here as the app grows
    // Example:
    // Profile: { userId: string };
    // Settings: undefined;
};

// User
export interface User {
    id: string;
    email: string;
    created_at: string;
}

// Generic API response
export interface ApiResponse<T> {
    data: T | null;
    error: string | null;
    loading: boolean;
}
