import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, RefreshControl, Dimensions, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHabits, HabitWithLog } from '../hooks/useHabits';
import AddHabitModal from '../components/AddHabitModal';

const { width } = Dimensions.get('window');

const DAYS_ES = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

export default function HabitosScreen() {
    const today = new Date();
    const [selectedDate, setSelectedDate] = useState(today);
    const { habits, loading, error, refresh, toggleHabit, deleteHabit, stats } = useHabits(selectedDate);
    const [showAddModal, setShowAddModal] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refresh();
        setRefreshing(false);
    }, [refresh]);

    // Build week strip: today ± 3 days
    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - 3 + i);
        return d;
    });

    const pct = stats.totalActive > 0
        ? Math.round((stats.completedToday / stats.totalActive) * 100)
        : 0;

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C63FF" />}
            >
                {/* ── Header ─────────────────────────────────── */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.dateText}>{today.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}</Text>
                        <Text style={styles.title}>Hábitos</Text>
                    </View>
                    <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
                        <Ionicons name="add" size={22} color="#FFF" />
                    </TouchableOpacity>
                </View>

                {/* ── Week strip ──────────────────────────────── */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekScroll}>
                    <View style={styles.weekRow}>
                        {weekDays.map((d, i) => {
                            const isToday = d.toDateString() === today.toDateString();
                            const isSelected = d.toDateString() === selectedDate.toDateString();
                            return (
                                <TouchableOpacity
                                    key={i}
                                    style={[styles.dayBtn, isSelected && styles.dayBtnActive]}
                                    onPress={() => setSelectedDate(new Date(d))}
                                >
                                    <Text style={[styles.dayLabel, isSelected && styles.dayLabelActive]}>
                                        {DAYS_ES[d.getDay()]}
                                    </Text>
                                    <Text style={[styles.dayNumber, isSelected && styles.dayNumberActive]}>
                                        {d.getDate()}
                                    </Text>
                                    {isToday && <View style={[styles.todayDot, isSelected && styles.todayDotActive]} />}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </ScrollView>

                {/* ── Summary card ────────────────────────────── */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryLeft}>
                        <Text style={styles.summaryPct}>{pct}%</Text>
                        <Text style={styles.summaryLabel}>Completados hoy</Text>
                        <Text style={styles.summarySub}>{stats.completedToday} de {stats.totalActive} hábitos</Text>
                    </View>
                    {/* Ring progress */}
                    <View style={styles.ringWrap}>
                        <View style={[styles.ringOuter, { borderColor: '#2A2A3E' }]}>
                            <View style={[styles.ringInner, { borderColor: pct >= 100 ? '#4CAF50' : '#6C63FF' }]}>
                                <Text style={styles.ringText}>{pct}%</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* ── Habits list ─────────────────────────────── */}
                <View style={styles.sectionRow}>
                    <Text style={styles.sectionTitle}>Mis hábitos</Text>
                    <Text style={styles.sectionSub}>{stats.completedToday}/{stats.totalActive}</Text>
                </View>

                {loading && !refreshing && (
                    <ActivityIndicator color="#6C63FF" style={{ marginTop: 40 }} />
                )}

                {!loading && habits.length === 0 && (
                    <EmptyState onAdd={() => setShowAddModal(true)} />
                )}

                {habits.map((habit) => (
                    <HabitCard
                        key={habit.id}
                        habit={habit}
                        onToggle={() => toggleHabit(habit.id, !!habit.log?.completed)}
                        onDelete={() => deleteHabit(habit.id)}
                    />
                ))}

                {/* Stats bottom cards */}
                {habits.length > 0 && (
                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <Ionicons name="flame" size={22} color="#FF9800" />
                            <Text style={styles.statValue}>
                                {Math.max(...habits.map((h) => h.streak), 0)}
                            </Text>
                            <Text style={styles.statLabel}>Mejor racha</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Ionicons name="checkmark-circle" size={22} color="#4CAF50" />
                            <Text style={styles.statValue}>{pct}%</Text>
                            <Text style={styles.statLabel}>Cumplimiento</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Ionicons name="list" size={22} color="#6C63FF" />
                            <Text style={styles.statValue}>{stats.totalActive}</Text>
                            <Text style={styles.statLabel}>Total activos</Text>
                        </View>
                    </View>
                )}

                <View style={{ height: 24 }} />
            </ScrollView>

            {/* ── Add Habit Modal ─────────────────────────── */}
            <AddHabitModal
                visible={showAddModal}
                onClose={() => setShowAddModal(false)}
                onCreated={() => { setShowAddModal(false); refresh(); }}
            />
        </View>
    );
}

/* ── Sub-components ─────────────────────────────────────── */

function HabitCard({
    habit, onToggle, onDelete,
}: {
    habit: HabitWithLog;
    onToggle: () => void;
    onDelete: () => void;
}) {
    const done = !!habit.log?.completed;

    return (
        <View style={[styles.habitCard, done && styles.habitCardDone]}>
            {/* Icon */}
            <View style={[styles.habitIcon, { backgroundColor: habit.color + '22' }]}>
                <Text style={styles.habitIconEmoji}>{habit.icon}</Text>
            </View>

            {/* Info */}
            <View style={styles.habitInfo}>
                <Text style={[styles.habitName, done && styles.habitNameDone]}>{habit.name}</Text>
                <View style={styles.habitMeta}>
                    <Ionicons name="flame" size={12} color="#FF9800" />
                    <Text style={styles.habitStreak}> {habit.streak} días</Text>
                </View>
            </View>

            {/* Delete */}
            <TouchableOpacity onPress={onDelete} style={styles.deleteBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="trash-outline" size={16} color="#555570" />
            </TouchableOpacity>

            {/* Check */}
            <TouchableOpacity
                onPress={onToggle}
                style={[styles.checkBtn, done && { backgroundColor: habit.color, borderColor: habit.color }]}
                activeOpacity={0.7}
            >
                {done && <Ionicons name="checkmark" size={18} color="#FFF" />}
            </TouchableOpacity>
        </View>
    );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
    return (
        <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>🌱</Text>
            <Text style={styles.emptyTitle}>Sin hábitos todavía</Text>
            <Text style={styles.emptySub}>Creá tu primer hábito y empezá a construir rachas</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={onAdd}>
                <Ionicons name="add" size={18} color="#FFF" />
                <Text style={styles.emptyBtnText}>Crear hábito</Text>
            </TouchableOpacity>
        </View>
    );
}

/* ── Styles ─────────────────────────────────────────────── */

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A1A' },
    scroll: { paddingHorizontal: 18, paddingTop: 56, paddingBottom: 12 },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
    dateText: { fontSize: 13, color: '#7A7A9A', marginBottom: 4 },
    title: { fontSize: 30, fontWeight: '800', color: '#FFF', letterSpacing: -0.5 },
    addBtn: {
        width: 44, height: 44, borderRadius: 14, backgroundColor: '#6C63FF',
        justifyContent: 'center', alignItems: 'center',
    },

    weekScroll: { marginBottom: 20 },
    weekRow: { flexDirection: 'row', gap: 8, paddingRight: 4 },
    dayBtn: {
        width: 48, paddingVertical: 10, borderRadius: 14,
        backgroundColor: '#12122A', alignItems: 'center', gap: 4,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
    },
    dayBtnActive: { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
    dayLabel: { fontSize: 11, fontWeight: '600', color: '#555570' },
    dayLabelActive: { color: '#FFF' },
    dayNumber: { fontSize: 16, fontWeight: '700', color: '#CCC' },
    dayNumberActive: { color: '#FFF' },
    todayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#6C63FF' },
    todayDotActive: { backgroundColor: '#FFF' },

    summaryCard: {
        backgroundColor: '#12122A', borderRadius: 20, padding: 20,
        marginBottom: 24, flexDirection: 'row', alignItems: 'center',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
    },
    summaryLeft: { flex: 1 },
    summaryPct: { fontSize: 40, fontWeight: '800', color: '#6C63FF' },
    summaryLabel: { fontSize: 14, fontWeight: '600', color: '#FFF', marginTop: 2 },
    summarySub: { fontSize: 12, color: '#7A7A9A', marginTop: 4 },
    ringWrap: { width: 80, height: 80, justifyContent: 'center', alignItems: 'center' },
    ringOuter: { width: 80, height: 80, borderRadius: 40, borderWidth: 8, justifyContent: 'center', alignItems: 'center' },
    ringInner: { width: 60, height: 60, borderRadius: 30, borderWidth: 6, justifyContent: 'center', alignItems: 'center' },
    ringText: { fontSize: 12, fontWeight: '700', color: '#FFF' },

    sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },
    sectionSub: { fontSize: 14, color: '#7A7A9A' },

    habitCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#12122A',
        borderRadius: 18, padding: 14, marginBottom: 10, gap: 12,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
    },
    habitCardDone: { opacity: 0.7 },
    habitIcon: { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    habitIconEmoji: { fontSize: 22 },
    habitInfo: { flex: 1 },
    habitName: { fontSize: 15, fontWeight: '600', color: '#FFF', marginBottom: 3 },
    habitNameDone: { textDecorationLine: 'line-through', color: '#7A7A9A' },
    habitMeta: { flexDirection: 'row', alignItems: 'center' },
    habitStreak: { fontSize: 12, color: '#7A7A9A' },
    deleteBtn: { padding: 4 },
    checkBtn: {
        width: 32, height: 32, borderRadius: 16,
        borderWidth: 2, borderColor: '#2A2A3E',
        justifyContent: 'center', alignItems: 'center',
    },

    statsRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
    statCard: {
        flex: 1, backgroundColor: '#12122A', borderRadius: 16, padding: 14,
        alignItems: 'center', gap: 6,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
    },
    statValue: { fontSize: 22, fontWeight: '800', color: '#FFF' },
    statLabel: { fontSize: 10, color: '#7A7A9A', textAlign: 'center' },

    emptyWrap: { alignItems: 'center', paddingVertical: 60, gap: 10 },
    emptyEmoji: { fontSize: 48, marginBottom: 4 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },
    emptySub: { fontSize: 13, color: '#7A7A9A', textAlign: 'center', maxWidth: 240 },
    emptyBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#6C63FF', paddingHorizontal: 20, paddingVertical: 12,
        borderRadius: 14, marginTop: 8,
    },
    emptyBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});
