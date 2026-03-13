import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADII, SPACING } from '../config/theme';

// All possible screens
export type TabName = 'Home' | 'Hábitos' | 'Finanzas' | 'Metas' | 'Objetivos' | 'Agenda' | 'Journal' | 'Focus';

// Main 4 tabs
const mainTabs: { name: TabName; icon: any; iconActive: any }[] = [
    { name: 'Home', icon: 'grid-outline', iconActive: 'grid' },
    { name: 'Hábitos', icon: 'radio-button-on-outline', iconActive: 'radio-button-on' },
    { name: 'Finanzas', icon: 'logo-bitcoin', iconActive: 'logo-bitcoin' },
    { name: 'Metas', icon: 'rocket-outline', iconActive: 'rocket' },
];

// "Más" overlay sections
const moreSections: { name: TabName; icon: string; bg: string }[] = [
    { name: 'Objetivos', icon: '🎯', bg: 'rgba(74,158,255,0.15)' },
    { name: 'Agenda', icon: '📅', bg: 'rgba(42,201,160,0.15)' },
    { name: 'Journal', icon: '📓', bg: 'rgba(191,90,242,0.15)' },
    { name: 'Focus', icon: '⏱', bg: 'rgba(255,149,0,0.15)' },
];

interface Props {
    active: TabName;
    onTabPress: (tab: TabName) => void;
}

export default function BottomTabBar({ active, onTabPress }: Props) {
    const [moreOpen, setMoreOpen] = useState(false);
    const slideAnim = useRef(new Animated.Value(0)).current;

    const isMainTab = mainTabs.some(t => t.name === active);
    const isMoreActive = moreOpen || !isMainTab;

    useEffect(() => {
        Animated.spring(slideAnim, {
            toValue: moreOpen ? 1 : 0,
            friction: 8,
            tension: 65,
            useNativeDriver: true,
        }).start();
    }, [moreOpen]);

    const overlayTranslateY = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [300, 0],
    });

    const backdropOpacity = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.5],
    });

    const handleMoreSection = (tab: TabName) => {
        setMoreOpen(false);
        onTabPress(tab);
    };

    return (
        <>
            {/* Backdrop */}
            {moreOpen && (
                <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
                    <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setMoreOpen(false)} />
                </Animated.View>
            )}

            {/* More overlay */}
            <Animated.View style={[styles.moreOverlay, { transform: [{ translateY: overlayTranslateY }] }]}>
                <View style={styles.moreHandle} />
                <Text style={styles.moreTitle}>Más secciones</Text>
                <View style={styles.moreGrid}>
                    {moreSections.map(s => (
                        <TouchableOpacity
                            key={s.name}
                            style={styles.moreItem}
                            onPress={() => handleMoreSection(s.name)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.moreIcon, { backgroundColor: s.bg }]}>
                                <Text style={{ fontSize: 24 }}>{s.icon}</Text>
                            </View>
                            <Text style={[styles.moreLbl, active === s.name && { color: COLORS.teal }]}>{s.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </Animated.View>

            {/* Tab bar */}
            <View style={styles.container}>
                {mainTabs.map(t => {
                    const isActive = active === t.name && !moreOpen;
                    return (
                        <TouchableOpacity
                            key={t.name}
                            style={styles.tab}
                            onPress={() => { setMoreOpen(false); onTabPress(t.name); }}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
                                <Ionicons
                                    name={isActive ? t.iconActive : t.icon}
                                    size={22}
                                    color={isActive ? COLORS.teal : 'rgba(255,255,255,0.3)'}
                                />
                            </View>
                            <Text style={[styles.label, isActive && styles.labelActive]}>{t.name}</Text>
                        </TouchableOpacity>
                    );
                })}

                {/* More button */}
                <TouchableOpacity
                    style={styles.tab}
                    onPress={() => setMoreOpen(!moreOpen)}
                    activeOpacity={0.7}
                >
                    <View style={[styles.iconWrap, isMoreActive && !isMainTab && styles.iconWrapActive]}>
                        <Text style={{
                            fontSize: 20,
                            letterSpacing: 2,
                            color: isMoreActive ? COLORS.teal : 'rgba(255,255,255,0.3)',
                        }}>•••</Text>
                    </View>
                    <Text style={[styles.label, isMoreActive && styles.labelActive]}>Más</Text>
                </TouchableOpacity>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: 'rgba(10,22,40,0.97)',
        borderTopWidth: 0.5,
        borderTopColor: COLORS.separator,
        paddingBottom: 24,
        paddingTop: 8,
    },
    tab: { flex: 1, alignItems: 'center', gap: 3 },
    iconWrap: { width: 44, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    iconWrapActive: { backgroundColor: 'rgba(42,201,160,0.12)' },
    label: { fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: '600' },
    labelActive: { color: COLORS.teal },

    // Backdrop
    backdrop: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: '#000', zIndex: 40,
    },

    // More overlay
    moreOverlay: {
        position: 'absolute', bottom: 83, left: 0, right: 0,
        backgroundColor: 'rgba(10,22,40,0.98)',
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        borderTopWidth: 1, borderTopColor: COLORS.border,
        padding: 20, paddingBottom: 8,
        zIndex: 50,
    },
    moreHandle: { width: 36, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
    moreTitle: { fontSize: 13, fontWeight: '700', color: COLORS.label3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 },
    moreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    moreItem: { width: '22%', alignItems: 'center', gap: 6, padding: 8, borderRadius: 16 },
    moreIcon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    moreLbl: { fontSize: 11, fontWeight: '600', color: COLORS.label2, textAlign: 'center' },
});
