/**
 * Design tokens extracted from the HTML reference (Style-Estructure-Base).
 * Use these constants throughout the app for consistent styling.
 */

export const COLORS = {
    // Backgrounds
    bg: '#060e1c',
    bg2: '#0a1628',
    bg3: '#0f1e35',
    card: '#132035',
    card2: '#1a2a45',

    // Borders
    border: 'rgba(255,255,255,0.08)',
    separator: 'rgba(255,255,255,0.07)',

    // Accent colors
    teal: '#2AC9A0',
    blue: '#4A9EFF',
    btc: '#F7931A',
    green: '#30D158',
    red: '#FF3B30',
    purple: '#BF5AF2',
    orange: '#FF9500',
    pink: '#FF375F',
    yellow: '#FFD60A',

    // Text
    label: '#FFFFFF',
    label2: 'rgba(255,255,255,0.65)',
    label3: 'rgba(255,255,255,0.35)',
} as const;

export const RADII = {
    card: 20,
    icon: 13,
    pill: 24,
    button: 14,
    input: 12,
    badge: 20,
    large: 22,
} as const;

export const SPACING = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    screenPadding: 20,
} as const;

export const FONT = {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
    black: '900' as const,
};

export const FONT_SIZE = {
    xs: 9,
    sm: 11,
    body: 13,
    md: 15,
    lg: 18,
    xl: 22,
    xxl: 28,
    hero: 38,
} as const;
