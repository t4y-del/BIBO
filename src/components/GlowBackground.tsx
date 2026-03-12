import React from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Canvas, Circle, RadialGradient, vec, Blur, Group } from '@shopify/react-native-skia';

/**
 * Reusable background with Skia radial-gradient glow orbs.
 * Ultra-subtle — barely noticeable but adds depth and atmosphere.
 *
 * Usage:
 *   <GlowBackground variant="btc">
 *     <ScrollView>...</ScrollView>
 *   </GlowBackground>
 */

type Variant = 'default' | 'btc' | 'savings' | 'habits' | 'agenda' | 'objectives';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface OrbConfig {
    color: string;
    radius: number;
    cx: number;
    cy: number;
    opacity: number;
}

const GLOW_CONFIGS: Record<Variant, {
    bg: [string, string, string];
    orbs: OrbConfig[];
}> = {
    default: {
        bg: ['#070714', '#0A0A1A', '#0D0D22'],
        orbs: [
            { color: '#6C63FF', radius: 180, cx: SCREEN_W * 0.1, cy: SCREEN_H * 0.08, opacity: 0.07 },
            { color: '#2AC9A0', radius: 140, cx: SCREEN_W * 0.85, cy: SCREEN_H * 0.35, opacity: 0.05 },
            { color: '#6C63FF', radius: 120, cx: SCREEN_W * 0.15, cy: SCREEN_H * 0.7, opacity: 0.04 },
        ],
    },
    btc: {
        bg: ['#070714', '#0A0A1A', '#0F0E1A'],
        orbs: [
            { color: '#F7931A', radius: 200, cx: SCREEN_W * 0.15, cy: SCREEN_H * 0.05, opacity: 0.08 },
            { color: '#F7931A', radius: 130, cx: SCREEN_W * 0.9, cy: SCREEN_H * 0.3, opacity: 0.05 },
            { color: '#2AC9A0', radius: 100, cx: SCREEN_W * 0.2, cy: SCREEN_H * 0.65, opacity: 0.03 },
        ],
    },
    savings: {
        bg: ['#070714', '#0A0A1A', '#0A1218'],
        orbs: [
            { color: '#2AC9A0', radius: 200, cx: SCREEN_W * 0.15, cy: SCREEN_H * 0.05, opacity: 0.08 },
            { color: '#2AC9A0', radius: 130, cx: SCREEN_W * 0.85, cy: SCREEN_H * 0.35, opacity: 0.05 },
            { color: '#74C0FC', radius: 110, cx: SCREEN_W * 0.1, cy: SCREEN_H * 0.6, opacity: 0.03 },
        ],
    },
    habits: {
        bg: ['#070714', '#0A0A1A', '#0D0D22'],
        orbs: [
            { color: '#6C63FF', radius: 190, cx: SCREEN_W * 0.1, cy: SCREEN_H * 0.06, opacity: 0.08 },
            { color: '#A78BFA', radius: 130, cx: SCREEN_W * 0.85, cy: SCREEN_H * 0.4, opacity: 0.05 },
            { color: '#6C63FF', radius: 100, cx: SCREEN_W * 0.15, cy: SCREEN_H * 0.7, opacity: 0.03 },
        ],
    },
    agenda: {
        bg: ['#070714', '#0A0A1A', '#0D1018'],
        orbs: [
            { color: '#74C0FC', radius: 190, cx: SCREEN_W * 0.1, cy: SCREEN_H * 0.06, opacity: 0.07 },
            { color: '#6C63FF', radius: 130, cx: SCREEN_W * 0.85, cy: SCREEN_H * 0.35, opacity: 0.05 },
            { color: '#2AC9A0', radius: 100, cx: SCREEN_W * 0.1, cy: SCREEN_H * 0.65, opacity: 0.03 },
        ],
    },
    objectives: {
        bg: ['#070714', '#0A0A1A', '#100D18'],
        orbs: [
            { color: '#F59E0B', radius: 190, cx: SCREEN_W * 0.05, cy: SCREEN_H * 0.06, opacity: 0.07 },
            { color: '#6C63FF', radius: 140, cx: SCREEN_W * 0.85, cy: SCREEN_H * 0.4, opacity: 0.05 },
            { color: '#F59E0B', radius: 100, cx: SCREEN_W * 0.2, cy: SCREEN_H * 0.7, opacity: 0.03 },
        ],
    },
};

/** Convert hex #RRGGBB to rgba with alpha */
function hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function GlowBackground({
    children,
    variant = 'default',
}: {
    children: React.ReactNode;
    variant?: Variant;
}) {
    const config = GLOW_CONFIGS[variant];

    return (
        <View style={styles.container}>
            {/* Base gradient background */}
            <LinearGradient
                colors={config.bg as any}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* Skia canvas with blurred radial gradient orbs */}
            <Canvas style={[StyleSheet.absoluteFill, { zIndex: 1 }]}>
                <Group>
                    <Blur blur={40} />
                    {config.orbs.map((orb, i) => (
                        <Circle key={i} cx={orb.cx} cy={orb.cy} r={orb.radius}>
                            <RadialGradient
                                c={vec(orb.cx, orb.cy)}
                                r={orb.radius}
                                colors={[
                                    hexToRgba(orb.color, orb.opacity),
                                    hexToRgba(orb.color, orb.opacity * 0.4),
                                    'transparent',
                                ]}
                            />
                        </Circle>
                    ))}
                </Group>
            </Canvas>

            {/* Content on top */}
            <View style={[StyleSheet.absoluteFill, { zIndex: 2 }]}>
                {children}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#070714',
    },
});
