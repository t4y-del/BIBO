import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    RefreshControl, ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAgenda } from '../hooks/useAgenda';
import AddEventModal from '../components/AddEventModal';

const { width } = Dimensions.get('window');
const DAY_SIZE = Math.floor((width - 36 - 6 * 6) / 7);
const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS_ES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function toDateStr(d: Date) { return d.toISOString().split('T')[0]; }

export default function AgendaScreen() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [viewMonth, setViewMonth] = useState({ year: today.getFullYear(), month: today.getMonth() + 1 });
    const [selectedDate, setSelectedDate] = useState(today);
    const [showAddModal, setShowAddModal] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const { agenda, loading, eventDots, objectiveDeadlines, fetchMonthDots, refresh, createEvent, toggleHabit, toggleEvent, deleteEvent } =
        useAgenda(selectedDate);

    // Load month dots whenever viewMonth changes
    useEffect(() => { fetchMonthDots(viewMonth.year, viewMonth.month); }, [viewMonth]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refresh();
        setRefreshing(false);
    }, [refresh]);

    /* ── Calendar helpers ───────────────────────────── */
    const getDaysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();
    const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m - 1, 1).getDay();

    const prevMonth = () =>
        setViewMonth(({ year, month }) =>
            month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 }
        );
    const nextMonth = () =>
        setViewMonth(({ year, month }) =>
            month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 }
        );

    const daysInMonth = getDaysInMonth(viewMonth.year, viewMonth.month);
    const firstDay = getFirstDayOfMonth(viewMonth.year, viewMonth.month);
    const calCells = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
        i < firstDay ? null : i - firstDay + 1
    );

    /* ── render ─────────────────────────────────────── */
    const hasHabits = (agenda?.habits.length ?? 0) > 0;
    const hasEvents = (agenda?.events.length ?? 0) > 0;

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2AC9A0" />}
            >
                {/* ── Header ────────────────────────────────── */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerSub}>Planificación</Text>
                        <Text style={styles.title}>Agenda</Text>
                    </View>
                    <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
                        <Ionicons name="add" size={22} color="#FFF" />
                    </TouchableOpacity>
                </View>

                {/* ── Calendar card ─────────────────────────── */}
                <View style={styles.calCard}>
                    {/* Month navigator */}
                    <View style={styles.monthNav}>
                        <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
                            <Ionicons name="chevron-back" size={20} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.monthLabel}>
                            {MONTHS_ES[viewMonth.month - 1]} {viewMonth.year}
                        </Text>
                        <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
                            <Ionicons name="chevron-forward" size={20} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    {/* Day headers */}
                    <View style={styles.dayHeaders}>
                        {DAYS_ES.map((d) => (
                            <Text key={d} style={styles.dayHeader}>{d}</Text>
                        ))}
                    </View>

                    {/* Cells */}
                    <View style={styles.calGrid}>
                        {calCells.map((day, i) => {
                            if (day === null) return <View key={`e${i}`} style={styles.calCell} />;

                            const cellDate = new Date(viewMonth.year, viewMonth.month - 1, day);
                            cellDate.setHours(0, 0, 0, 0);
                            const dateStr = toDateStr(cellDate);
                            const isToday = dateStr === toDateStr(today);
                            const isSelected = dateStr === toDateStr(selectedDate);
                            const hasEvent = eventDots.has(dateStr);
                            const evtColor = eventDots.get(dateStr);
                            const objColor = objectiveDeadlines.get(dateStr);

                            return (
                                <TouchableOpacity
                                    key={day}
                                    style={[
                                        styles.calCell,
                                        isSelected && styles.calCellSelected,
                                        isToday && !isSelected && styles.calCellToday,
                                    ]}
                                    onPress={() => setSelectedDate(new Date(cellDate))}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[
                                        styles.calDayNum,
                                        isSelected && styles.calDayNumSelected,
                                        isToday && !isSelected && styles.calDayNumToday,
                                        cellDate < today && !isToday && styles.calDayNumPast,
                                    ]}>
                                        {day}
                                    </Text>
                                    {/* Dots row: event dot (own color) + objective dot (objective color) */}
                                    {!isSelected && (hasEvent || objColor) && (
                                        <View style={styles.dotsRow}>
                                            {hasEvent && <View style={[styles.calDot, { backgroundColor: evtColor }]} />}
                                            {objColor && <View style={[styles.calDot, { backgroundColor: objColor }]} />}
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* ── Selected date label ──────────────────── */}
                <Text style={styles.selectedDateLabel}>
                    {selectedDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </Text>

                {loading && !refreshing && <ActivityIndicator color="#2AC9A0" style={{ marginTop: 24 }} />}

                {/* ── Habits of the day ─────────────────────── */}
                {!loading && hasHabits && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>🔁 Hábitos del día</Text>
                        {agenda!.habits.map((habit) => {
                            const done = !!habit.log?.completed;
                            return (
                                <TouchableOpacity
                                    key={habit.id}
                                    style={styles.itemRow}
                                    onPress={() => toggleHabit(habit.id, done)}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.itemIcon, { backgroundColor: habit.color + '22' }]}>
                                        <Text style={{ fontSize: 18 }}>{habit.icon}</Text>
                                    </View>
                                    <Text style={[styles.itemTitle, done && styles.itemDone]}>{habit.name}</Text>
                                    <View style={[styles.itemCheck, done && { backgroundColor: habit.color, borderColor: habit.color }]}>
                                        {done && <Ionicons name="checkmark" size={14} color="#FFF" />}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                {/* ── Events of the day ─────────────────────── */}
                {!loading && hasEvents && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>📅 Eventos</Text>
                        {agenda!.events.map((event) => (
                            <View key={event.id} style={[styles.eventRow, { borderLeftColor: event.color }]}>
                                <View style={styles.eventInfo}>
                                    {event.event_time && (
                                        <Text style={styles.eventTime}>{event.event_time.slice(0, 5)}</Text>
                                    )}
                                    <Text style={[styles.itemTitle, event.completed && styles.itemDone]}>
                                        {event.title}
                                    </Text>
                                    {event.description && (
                                        <Text style={styles.eventDesc}>{event.description}</Text>
                                    )}
                                </View>
                                <TouchableOpacity
                                    style={[styles.itemCheck, event.completed && { backgroundColor: event.color, borderColor: event.color }]}
                                    onPress={() => toggleEvent(event.id, event.completed)}
                                >
                                    {event.completed && <Ionicons name="checkmark" size={14} color="#FFF" />}
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => Alert.alert('Eliminar', `¿Eliminar "${event.title}"?`, [
                                        { text: 'Cancelar', style: 'cancel' },
                                        { text: 'Eliminar', style: 'destructive', onPress: () => deleteEvent(event.id) },
                                    ])}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Ionicons name="trash-outline" size={16} color="#8E8E93" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}

                {/* ── Active objectives ─────────────────────── */}
                {!loading && (agenda?.objectives.length ?? 0) > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.sectionTitle}>🎯 Vence hoy</Text>
                            <View style={styles.deadlinePill}>
                                <Ionicons name="flag-outline" size={11} color="#FF9800" />
                                <Text style={styles.deadlinePillText}>
                                    {agenda!.objectives.length} objetivo{agenda!.objectives.length !== 1 ? 's' : ''}
                                </Text>
                            </View>
                        </View>
                        {agenda!.objectives.map((obj) => (
                            <View key={obj.id} style={[styles.objRow, { borderLeftColor: obj.color }]}>
                                <Text style={{ fontSize: 18 }}>{obj.icon}</Text>
                                <View style={styles.objInfo}>
                                    <Text style={styles.itemTitle}>{obj.title}</Text>
                                    <View style={styles.objProgress}>
                                        <View style={styles.progressTrack}>
                                            <View style={[styles.progressFill, { width: `${obj.progress}%` as any, backgroundColor: obj.color }]} />
                                        </View>
                                        <Text style={styles.progressLabel}>{obj.progress}%</Text>
                                    </View>
                                </View>
                                <View style={[styles.deadlineBadge, { backgroundColor: obj.color + '22' }]}>
                                    <Text style={[styles.deadlineBadgeText, { color: obj.color }]}>Hoy 📅</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* ── Empty day ────────────────────────────── */}
                {!loading && !hasHabits && !hasEvents && (agenda?.objectives.length ?? 0) === 0 && (
                    <View style={styles.emptyDay}>
                        <Text style={styles.emptyEmoji}>✨</Text>
                        <Text style={styles.emptyTitle}>Día libre</Text>
                        <Text style={styles.emptySub}>No hay hábitos ni eventos para este día</Text>
                        <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowAddModal(true)}>
                            <Ionicons name="add" size={16} color="#FFF" />
                            <Text style={styles.emptyBtnText}>Agregar evento</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={{ height: 24 }} />
            </ScrollView>

            <AddEventModal
                visible={showAddModal}
                date={selectedDate}
                createEvent={createEvent}
                onClose={() => setShowAddModal(false)}
                onCreated={() => setShowAddModal(false)}
            />
        </View>
    );
}

/* ── Styles ─────────────────────────────────────────────── */
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A1A' },
    scroll: { paddingHorizontal: 18, paddingTop: 56, paddingBottom: 12 },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
    headerSub: { fontSize: 13, color: '#7A7A9A', marginBottom: 4 },
    title: { fontSize: 30, fontWeight: '800', color: '#FFF', letterSpacing: -0.5 },
    addBtn: {
        width: 44, height: 44, borderRadius: 14, backgroundColor: '#2AC9A0',
        justifyContent: 'center', alignItems: 'center',
    },

    calCard: {
        backgroundColor: '#12122A', borderRadius: 20, padding: 16, marginBottom: 18,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    },
    monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    navBtn: { padding: 6 },
    monthLabel: { fontSize: 16, fontWeight: '700', color: '#FFF', textTransform: 'capitalize' },

    dayHeaders: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    dayHeader: { width: DAY_SIZE, textAlign: 'center', fontSize: 11, fontWeight: '600', color: '#7A7A9A' },

    calGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    calCell: {
        width: DAY_SIZE, height: DAY_SIZE, borderRadius: DAY_SIZE / 2,
        justifyContent: 'center', alignItems: 'center',
    },
    calCellSelected: { backgroundColor: '#2AC9A0' },
    calCellToday: { borderWidth: 1.5, borderColor: '#2AC9A0' },
    calDayNum: { fontSize: 14, fontWeight: '500', color: '#AAAACC' },
    calDayNumSelected: { color: '#FFF', fontWeight: '700' },
    calDayNumToday: { color: '#2AC9A0', fontWeight: '700' },
    calDayNumPast: { color: '#555570' },
    calDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#2AC9A0', marginTop: 2 },
    dotsRow: { flexDirection: 'row', gap: 3, justifyContent: 'center', marginTop: 2 },

    selectedDateLabel: {
        fontSize: 15, fontWeight: '700', color: '#FFF', marginBottom: 14,
        textTransform: 'capitalize',
    },

    section: { marginBottom: 18 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: '#FFF', marginBottom: 10 },

    itemRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: '#12122A', borderRadius: 16, padding: 12, marginBottom: 8,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    },
    itemIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    itemTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: '#FFF' },
    itemDone: { textDecorationLine: 'line-through', color: '#555570' },
    itemCheck: {
        width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#3A3A5A',
        justifyContent: 'center', alignItems: 'center',
    },

    eventRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: '#12122A', borderRadius: 16, padding: 12, marginBottom: 8,
        borderLeftWidth: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    },
    eventInfo: { flex: 1 },
    eventTime: { fontSize: 11, color: '#7A7A9A', marginBottom: 2 },
    eventDesc: { fontSize: 12, color: '#7A7A9A', marginTop: 2 },

    objRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: '#12122A', borderRadius: 16, padding: 12, marginBottom: 8,
        borderLeftWidth: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    },
    objInfo: { flex: 1 },
    objProgress: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
    progressTrack: { flex: 1, height: 4, backgroundColor: '#2A2A3E', borderRadius: 2 },
    progressFill: { height: 4, borderRadius: 2 },
    progressLabel: { fontSize: 11, color: '#7A7A9A', width: 30 },

    sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    deadlinePill: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#FF980022', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    },
    deadlinePillText: { fontSize: 11, fontWeight: '700', color: '#FF9800' },
    deadlineBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
    deadlineBadgeText: { fontSize: 11, fontWeight: '700' },

    emptyDay: { alignItems: 'center', paddingVertical: 40, gap: 8 },
    emptyEmoji: { fontSize: 40, marginBottom: 4 },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: '#FFF' },
    emptySub: { fontSize: 13, color: '#7A7A9A', textAlign: 'center' },
    emptyBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#2AC9A0', paddingHorizontal: 18, paddingVertical: 10,
        borderRadius: 12, marginTop: 8,
    },
    emptyBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
});
