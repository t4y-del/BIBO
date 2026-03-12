import React, { useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, Dimensions,
    Animated, PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SCREEN_W = Dimensions.get('window').width;
const DELETE_THRESHOLD = SCREEN_W * 0.35;

/**
 * Generic swipeable row wrapper with Apple-style trembling.
 * Swipe right → progressive red background + increasing shake → delete on threshold.
 */
export default function SwipeableRow({
    children,
    onDelete,
}: {
    children: React.ReactNode;
    onDelete: () => void;
}) {
    const translateX = useRef(new Animated.Value(0)).current;
    const shakeY = useRef(new Animated.Value(0)).current;
    const cardHeight = useRef(new Animated.Value(1)).current;
    const isDeleting = useRef(false);
    const swipeProgress = useRef(0); // 0-1 ratio of how close to threshold
    const shakeLoop = useRef<Animated.CompositeAnimation | null>(null);

    // Start/update shake animation based on swipe progress
    const startShake = () => {
        if (shakeLoop.current) shakeLoop.current.stop();

        const runShakeCycle = () => {
            const progress = swipeProgress.current;
            if (progress < 0.15 || isDeleting.current) {
                shakeY.setValue(0);
                return;
            }

            // Amplitude: 0.5px at start → 4px near threshold
            const amplitude = 0.5 + progress * 3.5;
            // Duration: slower at start → very fast near threshold
            const duration = Math.max(25, 80 - progress * 55);

            Animated.sequence([
                Animated.timing(shakeY, {
                    toValue: amplitude,
                    duration,
                    useNativeDriver: false,
                }),
                Animated.timing(shakeY, {
                    toValue: -amplitude,
                    duration,
                    useNativeDriver: false,
                }),
                Animated.timing(shakeY, {
                    toValue: amplitude * 0.6,
                    duration: duration * 0.8,
                    useNativeDriver: false,
                }),
                Animated.timing(shakeY, {
                    toValue: -amplitude * 0.6,
                    duration: duration * 0.8,
                    useNativeDriver: false,
                }),
            ]).start(({ finished }) => {
                if (finished && swipeProgress.current > 0.15 && !isDeleting.current) {
                    runShakeCycle();
                } else {
                    shakeY.setValue(0);
                }
            });
        };

        runShakeCycle();
    };

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gs) =>
                Math.abs(gs.dx) > 15 && Math.abs(gs.dy) < 10,
            onPanResponderGrant: () => {
                swipeProgress.current = 0;
            },
            onPanResponderMove: (_, gs) => {
                if (gs.dx > 0) {
                    translateX.setValue(gs.dx);
                    const newProgress = Math.min(1, gs.dx / DELETE_THRESHOLD);
                    const wasBelow = swipeProgress.current < 0.15;
                    swipeProgress.current = newProgress;

                    // Start shake if we just crossed the threshold
                    if (wasBelow && newProgress >= 0.15) {
                        startShake();
                    }
                }
            },
            onPanResponderRelease: (_, gs) => {
                swipeProgress.current = 0;
                if (shakeLoop.current) shakeLoop.current.stop();
                shakeY.setValue(0);

                if (gs.dx > DELETE_THRESHOLD && !isDeleting.current) {
                    isDeleting.current = true;
                    Animated.parallel([
                        Animated.timing(translateX, {
                            toValue: SCREEN_W,
                            duration: 200,
                            useNativeDriver: false,
                        }),
                        Animated.sequence([
                            Animated.delay(100),
                            Animated.timing(cardHeight, {
                                toValue: 0,
                                duration: 250,
                                useNativeDriver: false,
                            }),
                        ]),
                    ]).start(() => onDelete());
                } else {
                    Animated.spring(translateX, {
                        toValue: 0,
                        friction: 8,
                        tension: 60,
                        useNativeDriver: false,
                    }).start();
                }
            },
        })
    ).current;

    // Interpolations
    const bgColor = translateX.interpolate({
        inputRange: [0, DELETE_THRESHOLD * 0.5, DELETE_THRESHOLD],
        outputRange: ['rgba(255,82,82,0)', 'rgba(255,82,82,0.3)', 'rgba(255,82,82,0.85)'],
        extrapolate: 'clamp',
    });

    const deleteIconOpacity = translateX.interpolate({
        inputRange: [0, DELETE_THRESHOLD * 0.3, DELETE_THRESHOLD * 0.6],
        outputRange: [0, 0.3, 1],
        extrapolate: 'clamp',
    });

    const deleteIconScale = translateX.interpolate({
        inputRange: [0, DELETE_THRESHOLD * 0.4, DELETE_THRESHOLD],
        outputRange: [0.5, 0.8, 1.2],
        extrapolate: 'clamp',
    });

    const containerOpacity = cardHeight.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 0.5, 1],
    });

    return (
        <Animated.View style={{ overflow: 'hidden', opacity: containerOpacity, marginBottom: 10 }}>
            <View style={styles.swipeContainer}>
                {/* Red delete background */}
                <Animated.View style={[styles.deleteBg, { backgroundColor: bgColor }]}>
                    <Animated.View style={{
                        opacity: deleteIconOpacity,
                        transform: [{ scale: deleteIconScale }],
                        alignItems: 'center',
                    }}>
                        <Ionicons name="trash" size={24} color="#FFF" />
                        <Text style={styles.deleteText}>Eliminar</Text>
                    </Animated.View>
                </Animated.View>

                {/* Swipeable content with shake */}
                <Animated.View
                    style={{
                        transform: [
                            { translateX },
                            { translateY: shakeY },
                        ],
                    }}
                    {...panResponder.panHandlers}
                >
                    {children}
                </Animated.View>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    swipeContainer: { position: 'relative' },
    deleteBg: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingLeft: 24,
        gap: 4,
    },
    deleteText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '700',
        marginTop: 2,
    },
});
