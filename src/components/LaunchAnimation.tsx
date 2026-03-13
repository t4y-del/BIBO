import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Easing, Platform, Image } from 'react-native';

const { width, height } = Dimensions.get('window');

// Animation lasts ~2s total (faster than HTML version)
const TOTAL_MS = 2000;

interface Props {
    onFinish: () => void;
}

export default function LaunchAnimation({ onFinish }: Props) {
    // ── Animated values ──
    const fadeIn = useRef(new Animated.Value(0)).current;
    const rocketY = useRef(new Animated.Value(0)).current;
    const rocketScale = useRef(new Animated.Value(1)).current;
    const flameOpacity = useRef(new Animated.Value(0)).current;
    const flameScale = useRef(new Animated.Value(0.3)).current;
    const glowOpacity = useRef(new Animated.Value(0)).current;
    const glowScale = useRef(new Animated.Value(0)).current;
    const flashOpacity = useRef(new Animated.Value(0)).current;
    const hudOpacity = useRef(new Animated.Value(0)).current;
    const successOpacity = useRef(new Animated.Value(0)).current;
    const successScale = useRef(new Animated.Value(0)).current;

    // Smoke particles
    const smokeAnims = useRef(
        Array.from({ length: 8 }, () => ({
            y: new Animated.Value(0),
            x: new Animated.Value(0),
            opacity: new Animated.Value(0),
            scale: new Animated.Value(0.5),
        }))
    ).current;

    // Rocket shake
    const shakeX = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // ── 1. Fade in overlay ──
        Animated.timing(fadeIn, { toValue: 1, duration: 200, useNativeDriver: true }).start();

        // ── 2. Flash bang ──
        Animated.sequence([
            Animated.delay(150),
            Animated.timing(flashOpacity, { toValue: 0.6, duration: 80, useNativeDriver: true }),
            Animated.timing(flashOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start();

        // ── 3. HUD text ──
        Animated.sequence([
            Animated.delay(100),
            Animated.timing(hudOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
            Animated.delay(1400),
            Animated.timing(hudOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start();

        // ── 4. Flame ignition ──
        Animated.sequence([
            Animated.delay(100),
            Animated.parallel([
                Animated.timing(flameOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
                Animated.timing(flameScale, { toValue: 1, duration: 300, useNativeDriver: true }),
            ]),
        ]).start();

        // ── 5. Ground glow ──
        Animated.sequence([
            Animated.delay(150),
            Animated.parallel([
                Animated.timing(glowOpacity, { toValue: 0.8, duration: 200, useNativeDriver: true }),
                Animated.timing(glowScale, { toValue: 1, duration: 300, useNativeDriver: true }),
            ]),
            Animated.delay(800),
            Animated.parallel([
                Animated.timing(glowOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
                Animated.timing(glowScale, { toValue: 0.5, duration: 400, useNativeDriver: true }),
            ]),
        ]).start();

        // ── 6. Rocket shake then launch ──
        // Shake for 300ms
        const shakeAnim = Animated.loop(
            Animated.sequence([
                Animated.timing(shakeX, { toValue: 2, duration: 30, useNativeDriver: true, easing: Easing.linear }),
                Animated.timing(shakeX, { toValue: -2, duration: 30, useNativeDriver: true, easing: Easing.linear }),
                Animated.timing(shakeX, { toValue: 1.5, duration: 25, useNativeDriver: true, easing: Easing.linear }),
                Animated.timing(shakeX, { toValue: -1.5, duration: 25, useNativeDriver: true, easing: Easing.linear }),
                Animated.timing(shakeX, { toValue: 0, duration: 20, useNativeDriver: true, easing: Easing.linear }),
            ]),
            { iterations: 3 }
        );

        Animated.sequence([
            Animated.delay(100),
            shakeAnim,
            // Launch upward
            Animated.parallel([
                Animated.timing(rocketY, {
                    toValue: -height * 1.2,
                    duration: 1200,
                    useNativeDriver: true,
                    easing: Easing.bezier(0.4, 0, 0.2, 1),
                }),
                Animated.timing(rocketScale, {
                    toValue: 0.4,
                    duration: 1200,
                    useNativeDriver: true,
                    easing: Easing.bezier(0.4, 0, 0.2, 1),
                }),
            ]),
        ]).start();

        // ── 7. Smoke particles ──
        smokeAnims.forEach((s, i) => {
            const delay = 150 + i * 60;
            const spreadX = (Math.random() - 0.5) * 80;
            Animated.sequence([
                Animated.delay(delay),
                Animated.parallel([
                    Animated.timing(s.opacity, { toValue: 0.5, duration: 150, useNativeDriver: true }),
                    Animated.timing(s.y, { toValue: -60 - Math.random() * 40, duration: 700, useNativeDriver: true }),
                    Animated.timing(s.x, { toValue: spreadX, duration: 700, useNativeDriver: true }),
                    Animated.timing(s.scale, { toValue: 2 + Math.random(), duration: 700, useNativeDriver: true }),
                ]),
                Animated.timing(s.opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
            ]).start();
        });

        // ── 8. Success screen ──
        Animated.sequence([
            Animated.delay(TOTAL_MS - 400),
            Animated.parallel([
                Animated.timing(successOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
                Animated.spring(successScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
            ]),
        ]).start();

        // ── 9. Finish callback ──
        const timer = setTimeout(onFinish, TOTAL_MS + 600);
        return () => clearTimeout(timer);
    }, []);

    return (
        <Animated.View style={[styles.overlay, { opacity: fadeIn }]}>
            {/* Stars background */}
            <View style={styles.stars}>
                {Array.from({ length: 30 }).map((_, i) => (
                    <View
                        key={i}
                        style={[styles.star, {
                            top: `${Math.random() * 100}%` as any,
                            left: `${Math.random() * 100}%` as any,
                            width: Math.random() > 0.7 ? 2 : 1,
                            height: Math.random() > 0.7 ? 2 : 1,
                            opacity: 0.3 + Math.random() * 0.7,
                        }]}
                    />
                ))}
            </View>

            {/* Flash */}
            <Animated.View style={[styles.flash, { opacity: flashOpacity }]} />

            {/* HUD text */}
            <Animated.View style={[styles.hud, { opacity: hudOpacity }]}>
                <Text style={styles.hudText}>⚡ IGNICIÓN — DESPEGUE</Text>
            </Animated.View>

            {/* Ground glow */}
            <Animated.View style={[styles.groundGlow, {
                opacity: glowOpacity,
                transform: [{ scale: glowScale }],
            }]} />

            {/* Smoke particles */}
            {smokeAnims.map((s, i) => (
                <Animated.View
                    key={i}
                    style={[styles.smoke, {
                        opacity: s.opacity,
                        transform: [
                            { translateX: s.x },
                            { translateY: Animated.add(s.y, new Animated.Value(height * 0.55)) },
                            { scale: s.scale },
                        ],
                    }]}
                />
            ))}

            {/* Rocket assembly */}
            <Animated.View style={[styles.rocketContainer, {
                transform: [
                    { translateX: shakeX },
                    { translateY: rocketY },
                    { scale: rocketScale },
                ],
            }]}>
                {/* Rocket PNG */}
                <Image
                    source={require('../../assets/cohete-login-animation.png')}
                    style={styles.rocketImage}
                    resizeMode="contain"
                />

                {/* Extra animated flames below the rocket */}
                <Animated.View style={[styles.flameContainer, {
                    opacity: flameOpacity,
                    transform: [{ scaleY: flameScale }],
                }]}>
                    <View style={[styles.flame, styles.flame3]} />
                    <View style={[styles.flame, styles.flame2]} />
                    <View style={[styles.flame, styles.flame1]} />
                </Animated.View>
            </Animated.View>

            {/* Success screen */}
            <Animated.View style={[styles.success, {
                opacity: successOpacity,
                transform: [{ scale: successScale }],
            }]}>
                <Text style={styles.successIcon}>🚀</Text>
                <Text style={styles.successTitle}>BIENVENIDO</Text>
                <Text style={styles.successSub}>MISIÓN EN CURSO</Text>
            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#020817',
        zIndex: 999,
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    stars: { ...StyleSheet.absoluteFillObject },
    star: {
        position: 'absolute',
        backgroundColor: '#fff',
        borderRadius: 1,
    },
    flash: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,180,80,0.3)',
        zIndex: 1000,
    },
    hud: {
        position: 'absolute',
        top: 60,
        alignSelf: 'center',
        zIndex: 1001,
    },
    hudText: {
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        fontSize: 13,
        letterSpacing: 4,
        color: '#ff8c42',
        textShadowColor: 'rgba(255,122,61,0.6)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 16,
    },

    // Ground glow
    groundGlow: {
        position: 'absolute',
        bottom: height * 0.28,
        alignSelf: 'center',
        width: 200,
        height: 60,
        borderRadius: 100,
        backgroundColor: 'rgba(255,140,30,0.5)',
        shadowColor: '#ff8c42',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 40,
    },

    // Smoke
    smoke: {
        position: 'absolute',
        alignSelf: 'center',
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(180,180,180,0.35)',
    },

    // Rocket
    rocketContainer: {
        position: 'absolute',
        bottom: height * 0.30,
        alignSelf: 'center',
        alignItems: 'center',
    },
    rocketImage: {
        width: 120,
        height: 160,
    },

    // Flames
    flameContainer: {
        alignItems: 'center',
        marginTop: -4,
    },
    flame: {
        borderRadius: 50,
    },
    flame1: {
        width: 22,
        height: 44,
        backgroundColor: '#ffe066',
        shadowColor: '#ff9500',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.6,
        shadowRadius: 16,
        marginBottom: -8,
        zIndex: 3,
    },
    flame2: {
        width: 34,
        height: 60,
        backgroundColor: '#ff8c42',
        shadowColor: '#ff5c00',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        marginBottom: -14,
        zIndex: 2,
    },
    flame3: {
        width: 44,
        height: 72,
        backgroundColor: '#c0392b',
        shadowColor: '#c82800',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 24,
        zIndex: 1,
    },

    // Success
    success: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#020817',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1002,
    },
    successIcon: {
        fontSize: 52,
        marginBottom: 16,
        textShadowColor: '#ff8c42',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: 6,
        color: '#f0f4ff',
        textShadowColor: 'rgba(255,140,60,0.6)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20,
    },
    successSub: {
        marginTop: 8,
        fontSize: 11,
        letterSpacing: 3,
        color: '#7a8aaa',
    },
});

