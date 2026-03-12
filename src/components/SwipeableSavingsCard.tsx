import React, { useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Dimensions,
    Animated, PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SavingsEntry } from '../hooks/useSavings';

const SCREEN_W = Dimensions.get('window').width;
const DELETE_THRESHOLD = SCREEN_W * 0.35;

const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const MONTH_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function SwipeableSavingsCard({
    entry,
    monthlyTarget,
    onEdit,
    onDelete,
    isNew,
}: {
    entry: SavingsEntry;
    monthlyTarget: number;
    onEdit: () => void;
    onDelete: () => void;
    isNew?: boolean;
}) {
    const translateX = useRef(new Animated.Value(0)).current;
    const containerOpacity = useRef(new Animated.Value(1)).current;
    const highlightOpacity = useRef(new Animated.Value(0)).current;
    const isDeleting = useRef(false);

    // Green flash for new entries
    useEffect(() => {
        if (isNew) {
            Animated.sequence([
                Animated.timing(highlightOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: false,
                }),
                Animated.timing(highlightOpacity, {
                    toValue: 0,
                    duration: 2500,
                    useNativeDriver: false,
                }),
            ]).start();
        }
    }, [isNew]);

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gs) =>
                Math.abs(gs.dx) > 15 && Math.abs(gs.dy) < 10,
            onPanResponderMove: (_, gs) => {
                if (gs.dx > 0) translateX.setValue(gs.dx);
            },
            onPanResponderRelease: (_, gs) => {
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
                            Animated.timing(containerOpacity, {
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

    const greenBg = highlightOpacity.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(42,201,160,0)', 'rgba(42,201,160,0.25)'],
    });

    // Calculations
    const ok = monthlyTarget > 0 && Number(entry.amount_ars) >= monthlyTarget;
    const pct = monthlyTarget > 0
        ? Math.min(100, (Number(entry.amount_ars) / monthlyTarget) * 100)
        : 100;

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

                {/* Swipeable card */}
                <Animated.View
                    style={[styles.entryCard, { transform: [{ translateX }] }]}
                    {...panResponder.panHandlers}
                >
                    <TouchableOpacity
                        style={styles.cardTouchable}
                        onPress={onEdit}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.checkWrap, { backgroundColor: ok ? '#2AC9A020' : '#2A2A3E' }]}>
                            <Ionicons
                                name={ok ? 'checkmark' : 'time-outline'}
                                size={18}
                                color={ok ? '#2AC9A0' : '#7A7A9A'}
                            />
                        </View>
                        <View style={styles.entryInfo}>
                            <Text style={styles.entryMonth}>
                                {MONTH_NAMES[entry.month - 1]} {entry.year}
                            </Text>
                            <Text style={styles.entrySub}>
                                {ok ? 'Meta cumplida' : 'Parcial'} · {entry.saved_at.slice(8)} {MONTH_SHORT[entry.month - 1]}
                            </Text>
                            <View style={styles.entryBar}>
                                <View style={[styles.entryBarFill, {
                                    width: `${pct}%` as any,
                                    backgroundColor: ok ? '#2AC9A0' : '#74C0FC',
                                }]} />
                            </View>
                        </View>
                        <View style={styles.entryRight}>
                            <Text style={styles.entryAmount}>
                                ${Number(entry.amount_ars).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                            </Text>
                            <Text style={[styles.entryPct, { color: ok ? '#2AC9A0' : '#74C0FC' }]}>
                                {ok ? '✓ ' : ''}{pct.toFixed(0)}%
                            </Text>
                        </View>
                    </TouchableOpacity>

                    {/* Green flash overlay */}
                    <Animated.View style={[styles.greenOverlay, { backgroundColor: greenBg }]} />
                </Animated.View>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    swipeContainer: { position: 'relative' },
    deleteBg: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingLeft: 24,
        gap: 4,
    },
    deleteText: { color: '#FFF', fontSize: 11, fontWeight: '700', marginTop: 2 },
    entryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#12122A',
        borderRadius: 16,
        padding: 14,
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    cardTouchable: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    checkWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    entryInfo: { flex: 1 },
    entryMonth: { fontSize: 15, fontWeight: '700', color: '#FFF', marginBottom: 2 },
    entrySub: { fontSize: 11, color: '#7A7A9A', marginBottom: 6 },
    entryBar: { height: 3, backgroundColor: '#2A2A3E', borderRadius: 2, overflow: 'hidden' },
    entryBarFill: { height: '100%', borderRadius: 2 },
    entryRight: { alignItems: 'flex-end', gap: 2 },
    entryAmount: { fontSize: 15, fontWeight: '800', color: '#FFF' },
    entryPct: { fontSize: 12, fontWeight: '700' },
    greenOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        borderRadius: 16,
        pointerEvents: 'none',
    },
});
