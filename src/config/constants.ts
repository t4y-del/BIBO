/**
 * Global app constants
 */
export const APP_NAME = 'BIBO';

export const COLORS = {
    primary: '#6C63FF',
    primaryDark: '#5A52D5',
    secondary: '#FF6584',
    background: '#0F0F1A',
    surface: '#1A1A2E',
    surfaceLight: '#25253D',
    text: '#FFFFFF',
    textSecondary: '#A0A0B8',
    accent: '#00D9FF',
    success: '#4CAF50',
    warning: '#FFC107',
    error: '#FF5252',
} as const;

export const FONTS = {
    regular: 'System',
    bold: 'System',
} as const;

export const SPACING = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
} as const;

export const BORDER_RADIUS = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
} as const;
