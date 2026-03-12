import React, { useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Dimensions,
    Animated, PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BtcPurchase } from '../hooks/useBtcData';

const SCREEN_W = Dimensions.get('window').width;
const DELETE_THRESHOLD = SCREEN_W * 0.35;

function fmtDate(d: string) {
    const date = new Date(d + 'T12:00:00');
    return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function SwipeablePurchaseCard({
    purchase,
    currentPriceUsd,
    onEdit,
    onDelete,
    isNew,
}: {
    purchase: BtcPurchase;
    currentPriceUsd: number;
    onEdit: () => void;
    onDelete: () => void;
    isNew?: boolean;
}) {
    const translateX = useRef(new Animated.Value(0)).current;
    const cardHeight = useRef(new Animated.Value(1)).current; // 1 = full, 0 = collapsed
    const highlightOpacity = useRef(new Animated.Value(0)).current;
    const isDeleting = useRef(false);

    // Green flash for new purchases
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
            onMoveShouldSetPanResponder: (_, gs) => {
                // Only respond to horizontal swipes
                return Math.abs(gs.dx) > 15 && Math.abs(gs.dy) < 10;
            },
            onPanResponderMove: (_, gs) => {
                // Only allow swiping right
                if (gs.dx > 0) {
                    translateX.setValue(gs.dx);
                }
            },
            onPanResponderRelease: (_, gs) => {
                if (gs.dx > DELETE_THRESHOLD && !isDeleting.current) {
                    // Past threshold → delete
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
                    ]).start(() => {
                        onDelete();
                    });
                } else {
                    // Snap back
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

    const containerMaxHeight = cardHeight.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 120], // generous max
    });

    const containerOpacity = cardHeight.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 0.5, 1],
    });

    const greenBg = highlightOpacity.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(42,201,160,0)', 'rgba(42,201,160,0.25)'],
    });

    // Calculations
    const costUsd = Number(purchase.btc_amount) * Number(purchase.price_usd);
    const currentUsd = Number(purchase.btc_amount) * currentPriceUsd;
    const plUsd = currentUsd - costUsd;
    const plPct = costUsd > 0 ? (plUsd / costUsd) * 100 : 0;
    const isPos = plUsd >= 0;

    const paid = purchase.currency === 'ARS'
        ? `$${Number(purchase.total_ars ?? 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS`
        : purchase.currency === 'USDT'
            ? `$${Number(purchase.total_usdt ?? 0).toLocaleString()} USDT`
            : `$${Number(purchase.total_usd ?? 0).toLocaleString()} USD`;

    return (
        <Animated.View style={{
            overflow: 'hidden',
            opacity: containerOpacity,
            marginBottom: 10,
        }}>
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
                    style={[styles.purchaseCard, { transform: [{ translateX }] }]}
                    {...panResponder.panHandlers}
                >
                    <TouchableOpacity
                        style={styles.cardTouchable}
                        onPress={onEdit}
                        activeOpacity={0.7}
                    >
                        <View style={styles.purchaseIconWrap}>
                            <Ionicons name="logo-bitcoin" size={22} color="#F7931A" />
                        </View>
                        <View style={styles.purchaseInfo}>
                            <Text style={styles.purchaseMonth}>{fmtDate(purchase.bought_at)}</Text>
                            <Text style={styles.purchaseSub}>
                                Precio: ${Number(purchase.price_usd).toLocaleString('en-US', { maximumFractionDigits: 0 })} USD · {Number(purchase.btc_amount).toFixed(6)} ₿
                            </Text>
                            <Text style={styles.purchaseSub2}>{paid}</Text>
                        </View>
                        <View style={styles.purchaseRight}>
                            <Text style={[styles.purchasePl, { color: isPos ? '#4CAF50' : '#FF5252' }]}>
                                {isPos ? '+' : ''}{plPct.toFixed(1)}%
                            </Text>
                            <Text style={styles.purchasePlAbs}>
                                {isPos ? '+' : ''}${Math.abs(plUsd).toFixed(0)} USD
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
    swipeContainer: {
        position: 'relative',
    },
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
    purchaseCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#12122A',
        borderRadius: 18,
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
    purchaseIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#2A2A3E',
        justifyContent: 'center',
        alignItems: 'center',
    },
    purchaseInfo: { flex: 1, gap: 3 },
    purchaseMonth: { fontSize: 14, fontWeight: '700', color: '#FFF' },
    purchaseSub: { fontSize: 11, color: '#7A7A9A' },
    purchaseSub2: { fontSize: 11, color: '#555570', fontWeight: '600' },
    purchaseRight: { alignItems: 'flex-end', gap: 2 },
    purchasePl: { fontSize: 14, fontWeight: '800' },
    purchasePlAbs: { fontSize: 11, color: '#7A7A9A' },
    greenOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        borderRadius: 18,
        pointerEvents: 'none',
    },
});
