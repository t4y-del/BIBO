import React, { useCallback, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Dimensions, RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlowBackground from '../components/GlowBackground';
import { useProfile } from '../hooks/useProfile';
import { useHabits } from '../hooks/useHabits';
import { useObjectives } from '../hooks/useObjectives';
import { useHomeStats } from '../hooks/useHomeStats';
import { useDolar } from '../hooks/useDolar';
import { useBtcPrice } from '../hooks/useBtcPrice';

const { width } = Dimensions.get('window');

interface Props {
    onNavigate?: (screen: string) => void;
}

/* ── Price display helper ── */
function fmtPrice(n: number | undefined): string {
    if (!n) return '…';
    if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2) + 'M';
    if (n >= 1000) return '$' + (n / 1000).toFixed(1) + 'K';
    return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export default function HomeScreen({ onNavigate }: Props) {
    const today = new Date();
    const dateStr = today.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
    const capitalDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

    const { profile } = useProfile();
    const { habits, loading: habitsLoading, refresh: refreshHabits, toggleHabit } = useHabits(today);
    const { objectives, loading: objLoading, refresh: refreshObj } = useObjectives('active');
    const { stats, upcomingEvents } = useHomeStats();
    const { blue, oficial, refresh: refreshDolar } = useDolar();
    const { price: btcPrice, refresh: refreshBtc } = useBtcPrice();

    const MARKET_CARDS = [
        { label: 'Dólar Blue', price: fmtPrice(blue?.venta), sub: blue ? `C: $${blue.compra}` : '', icon: '💵', color: '#4A9EFF' },
        { label: 'BTC', price: fmtPrice(btcPrice?.usd), sub: 'USD', icon: '₿', color: '#F7931A' },
        { label: 'Dólar Oficial', price: fmtPrice(oficial?.venta), sub: oficial ? `C: $${oficial.compra}` : '', icon: '🏦', color: '#2AC9A0' },
    ];

    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([refreshHabits(), refreshObj(), refreshDolar(), refreshBtc()]);
        setRefreshing(false);
    }, [refreshHabits, refreshObj, refreshDolar, refreshBtc]);

    const firstName = profile?.display_name ?? profile?.full_name?.split(' ')[0] ?? '..';
    const habitPct = habits.length > 0
        ? Math.round((habits.filter(h => !!h.log?.completed).length / habits.length) * 100)
        : 0;

    return (
        <GlowBackground>
            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C63FF" />}
            >
                {/* ── Header ────────────────────────────────── */}
                <View style={styles.header}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.dateText}>{capitalDate}</Text>
                        <Text style={styles.greeting}>Hola, {firstName} 👋</Text>
                        <Text style={styles.subGreet}>Mercado del día</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.avatar}
                        onPress={() => onNavigate?.('Profile')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.avatarEmoji}>😎</Text>
                    </TouchableOpacity>
                </View>

                {/* ── Market cards (live data) ── */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cryptoScroll}>
                    <View style={styles.cryptoRow}>
                        {MARKET_CARDS.map((c) => (
                            <View key={c.label} style={styles.cryptoCard}>
                                <View style={[styles.cryptoIconWrap, { backgroundColor: c.color + '22' }]}>
                                    <Text style={{ fontSize: 18 }}>{c.icon}</Text>
                                </View>
                                <Text style={styles.cryptoLabel}>{c.label}</Text>
                                <Text style={styles.cryptoPrice}>{c.price}</Text>
                                <Text style={styles.cryptoChange}>{c.sub}</Text>
                            </View>
                        ))}
                    </View>
                </ScrollView>

                {/* ── Stats grid ─────────────────────────────── */}
                <View style={styles.sectionRow}>
                    <Text style={styles.sectionTitle}>Resumen</Text>
                </View>
                <View style={styles.grid}>
                    <StatCard
                        icon="trophy-outline" color="#F7931A"
                        label="Objetivos activos"
                        value={objLoading ? '…' : String(stats.activeObjectives)}
                    />
                    <StatCard
                        icon="flame-outline" color="#FF5252"
                        label="Hábitos hoy"
                        value={habitsLoading ? '…' : `${stats.habitsCompletedToday}/${stats.totalHabitsToday}`}
                    />
                    <StatCard
                        icon="checkmark-circle-outline" color="#4CAF50"
                        label="% completado"
                        value={habitsLoading ? '…' : `${habitPct}%`}
                    />
                    <StatCard
                        icon="calendar-outline" color="#6C63FF"
                        label="Nivel"
                        value={profile ? `Nv. ${profile.nivel}` : '…'}
                    />
                </View>

                {/* ── Habits today ───────────────────────────── */}
                <View style={styles.sectionRow}>
                    <Text style={styles.sectionTitle}>Hábitos hoy</Text>
                    <TouchableOpacity onPress={() => onNavigate?.('Hábitos')}>
                        <Text style={styles.sectionLink}>Ver todos →</Text>
                    </TouchableOpacity>
                </View>

                {habitsLoading && !refreshing && (
                    <ActivityIndicator color="#6C63FF" style={{ marginVertical: 12 }} />
                )}

                {!habitsLoading && habits.length === 0 && (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyText}>Sin hábitos creados aún</Text>
                        <TouchableOpacity onPress={() => onNavigate?.('Hábitos')}>
                            <Text style={styles.emptyLink}>Crear uno →</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {habits.slice(0, 4).map((habit) => {
                    const done = !!habit.log?.completed;
                    return (
                        <TouchableOpacity
                            key={habit.id}
                            style={styles.habitRow}
                            onPress={() => toggleHabit(habit.id, done)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.habitIcon, { backgroundColor: habit.color + '22' }]}>
                                <Text style={{ fontSize: 18 }}>{habit.icon}</Text>
                            </View>
                            <View style={styles.habitInfo}>
                                <Text style={[styles.habitName, done && styles.doneName]}>{habit.name}</Text>
                                <Text style={styles.habitStreak}>🔥 {habit.streak} días</Text>
                            </View>
                            <View style={[styles.habitCheck, done && { backgroundColor: habit.color, borderColor: habit.color }]}>
                                {done && <Ionicons name="checkmark" size={14} color="#FFF" />}
                            </View>
                        </TouchableOpacity>
                    );
                })}

                {habits.length > 4 && (
                    <TouchableOpacity style={styles.showMoreBtn} onPress={() => onNavigate?.('Hábitos')}>
                        <Text style={styles.showMoreText}>Ver {habits.length - 4} más →</Text>
                    </TouchableOpacity>
                )}

                {/* ── Próximos Eventos ───────────────────────── */}
                <View style={styles.sectionRow}>
                    <Text style={styles.sectionTitle}>Próximos eventos</Text>
                    <TouchableOpacity onPress={() => onNavigate?.('Agenda')}>
                        <Text style={styles.sectionLink}>Ver agenda →</Text>
                    </TouchableOpacity>
                </View>

                {upcomingEvents.length === 0 && (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyText}>Sin eventos próximos</Text>
                        <TouchableOpacity onPress={() => onNavigate?.('Agenda')}>
                            <Text style={styles.emptyLink}>Agregar →</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {upcomingEvents.map((evt) => (
                    <View key={evt.id} style={[styles.evtCard, { borderLeftColor: evt.color }]}>
                        <View style={[styles.evtIconWrap, { backgroundColor: evt.color + '22' }]}>
                            <Text style={styles.evtTypeIcon}>
                                {evt.type === 'reminder' ? '🔔' : evt.type === 'milestone' ? '🏁' : '📅'}
                            </Text>
                        </View>
                        <View style={styles.evtInfo}>
                            <Text style={styles.evtTitle} numberOfLines={1}>{evt.title}</Text>
                            <Text style={styles.evtMeta}>
                                {new Date(evt.event_date + 'T00:00:00').toLocaleDateString('es-AR', {
                                    weekday: 'short', day: 'numeric', month: 'short',
                                })}
                                {evt.event_time ? `  ·  ${evt.event_time.slice(0, 5)}` : ''}
                            </Text>
                        </View>
                        <View style={[styles.evtTypePill, { backgroundColor: evt.color + '22' }]}>
                            <Text style={[styles.evtTypePillText, { color: evt.color }]}>
                                {evt.type === 'reminder' ? 'Recordatorio' : evt.type === 'milestone' ? 'Hito' : 'Evento'}
                            </Text>
                        </View>
                    </View>
                ))}

                {/* ── Objectives ─────────────────────────────── */}
                <View style={styles.sectionRow}>
                    <Text style={styles.sectionTitle}>Objetivos próximos</Text>
                    <TouchableOpacity onPress={() => onNavigate?.('Objetivos')}>
                        <Text style={styles.sectionLink}>Ver todos →</Text>
                    </TouchableOpacity>
                </View>

                {!objLoading && objectives.length === 0 && (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyText}>Sin objetivos activos</Text>
                        <TouchableOpacity onPress={() => onNavigate?.('Objetivos')}>
                            <Text style={styles.emptyLink}>Crear uno →</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {objectives.slice(0, 3).map((obj) => (
                    <View key={obj.id} style={[styles.objCard, { borderLeftColor: obj.color }]}>
                        <View style={styles.objHeader}>
                            <Text style={{ fontSize: 18 }}>{obj.icon}</Text>
                            <Text style={styles.objTitle} numberOfLines={1}>{obj.title}</Text>
                            <View style={[styles.objBadge, { backgroundColor: obj.color + '22' }]}>
                                <Text style={[styles.objBadgeText, { color: obj.color }]}>{obj.progress}%</Text>
                            </View>
                        </View>
                        <View style={styles.progressTrack}>
                            <View style={[styles.progressFill, { width: `${obj.progress}%` as any, backgroundColor: obj.color }]} />
                        </View>
                        <Text style={styles.objMeta}>
                            {obj.tasks.filter(t => t.completed).length}/{obj.tasks.length} tareas
                            {obj.deadline ? `  ·  ${obj.deadline}` : ''}
                        </Text>
                    </View>
                ))}

                <View style={{ height: 24 }} />
            </ScrollView>
        </GlowBackground>
    );
}

/* ── Sub-components ─────────────────────────────────────── */

function StatCard({ icon, color, label, value }: {
    icon: keyof typeof Ionicons.glyphMap; color: string; label: string; value: string;
}) {
    return (
        <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: color + '22' }]}>
                <Ionicons name={icon} size={20} color={color} />
            </View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

/* ── Styles ─────────────────────────────────────────────── */

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A1A' },
    scroll: { paddingHorizontal: 18, paddingTop: 56, paddingBottom: 24 },

    header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20, gap: 12 },
    dateText: { fontSize: 12, color: '#7A7A9A', marginBottom: 2 },
    greeting: { fontSize: 26, fontWeight: '800', color: '#FFF', letterSpacing: -0.5 },
    subGreet: { fontSize: 13, color: '#7A7A9A', marginTop: 2 },
    avatar: {
        width: 48, height: 48, borderRadius: 24, backgroundColor: '#1E1E3A',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: '#6C63FF44',
    },
    avatarEmoji: { fontSize: 24 },

    cryptoScroll: { marginBottom: 24 },
    cryptoRow: { flexDirection: 'row', gap: 10, paddingRight: 4 },
    cryptoCard: {
        width: 96, backgroundColor: '#12122A', borderRadius: 18, padding: 12, gap: 5,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)', alignItems: 'flex-start',
    },
    cryptoIconWrap: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    cryptoLabel: { fontSize: 12, fontWeight: '700', color: '#FFF', marginTop: 2 },
    cryptoPrice: { fontSize: 13, fontWeight: '700', color: '#FFF' },
    cryptoChange: { fontSize: 11, fontWeight: '600' },

    sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 17, fontWeight: '700', color: '#FFF' },
    sectionLink: { fontSize: 13, color: '#6C63FF', fontWeight: '600' },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
    statCard: {
        width: (width - 46) / 2, backgroundColor: '#12122A', borderRadius: 18, padding: 14,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)', gap: 6,
    },
    statIconWrap: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    statValue: { fontSize: 22, fontWeight: '800', color: '#FFF' },
    statLabel: { fontSize: 11, color: '#7A7A9A' },

    habitRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: '#12122A', borderRadius: 16, padding: 12, marginBottom: 8,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
    },
    habitIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    habitInfo: { flex: 1 },
    habitName: { fontSize: 14, fontWeight: '600', color: '#FFF', marginBottom: 2 },
    doneName: { textDecorationLine: 'line-through', color: '#555570' },
    habitStreak: { fontSize: 11, color: '#7A7A9A' },
    habitCheck: {
        width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#2A2A3E',
        justifyContent: 'center', alignItems: 'center',
    },

    showMoreBtn: { marginBottom: 8, alignItems: 'center', paddingVertical: 8 },
    showMoreText: { color: '#6C63FF', fontWeight: '600', fontSize: 13 },

    emptyCard: {
        backgroundColor: '#12122A', borderRadius: 16, padding: 16, marginBottom: 8,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    emptyText: { color: '#555570', fontSize: 13 },
    emptyLink: { color: '#6C63FF', fontWeight: '600', fontSize: 13 },

    evtCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: '#12122A', borderRadius: 16, padding: 12, marginBottom: 8,
        borderLeftWidth: 3, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
    },
    evtIconWrap: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    evtTypeIcon: { fontSize: 18 },
    evtInfo: { flex: 1 },
    evtTitle: { fontSize: 14, fontWeight: '600', color: '#FFF', marginBottom: 2 },
    evtMeta: { fontSize: 11, color: '#7A7A9A', textTransform: 'capitalize' },
    evtTypePill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
    evtTypePillText: { fontSize: 10, fontWeight: '700' },

    objCard: {
        backgroundColor: '#12122A', borderRadius: 16, padding: 14, marginBottom: 8,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)', borderLeftWidth: 3,
    },
    objHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    objTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: '#FFF' },
    objBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    objBadgeText: { fontSize: 11, fontWeight: '700' },
    progressTrack: { height: 5, backgroundColor: '#1A1A34', borderRadius: 3, marginBottom: 6 },
    progressFill: { height: 5, borderRadius: 3 },
    objMeta: { fontSize: 11, color: '#7A7A9A' },
});
