import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    RefreshControl, ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useObjectives, Objective, ObjectiveTask } from '../hooks/useObjectives';
import AddObjectiveModal from '../components/AddObjectiveModal';
import EditObjectiveModal from '../components/EditObjectiveModal';
import SwipeableRow from '../components/SwipeableRow';
import GlowBackground from '../components/GlowBackground';

type FilterType = 'all' | 'active' | 'completed';

export default function ObjetivosScreen() {
    const [filter, setFilter] = useState<FilterType>('active');
    const { objectives, loading, error, refresh, toggleTask, updateObjective, deleteObjective, addTask, stats } =
        useObjectives(filter);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingObjective, setEditingObjective] = useState<Objective | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refresh();
        setRefreshing(false);
    }, [refresh]);

    const FILTERS: { key: FilterType; label: string }[] = [
        { key: 'active', label: 'En progreso' },
        { key: 'completed', label: 'Completados' },
        { key: 'all', label: 'Todos' },
    ];

    return (
        <GlowBackground variant="objectives">
            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2AC9A0" />
                }
            >
                {/* ── Header ──────────────────────────────────── */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerSub}>Seguimiento</Text>
                        <Text style={styles.title}>Objetivos</Text>
                    </View>
                    <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
                        <Ionicons name="add" size={22} color="#FFF" />
                    </TouchableOpacity>
                </View>

                {/* ── Summary ─────────────────────────────────── */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryValue}>{objectives.length}</Text>
                        <Text style={styles.summaryLabel}>Total</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryValue}>
                            {objectives.filter((o) => o.status === 'active').length}
                        </Text>
                        <Text style={styles.summaryLabel}>En progreso</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                        <Text style={[styles.summaryValue, { color: '#2AC9A0' }]}>{stats.totalProgress}%</Text>
                        <Text style={styles.summaryLabel}>Promedio</Text>
                    </View>
                </View>

                {/* ── Filter tabs ──────────────────────────────── */}
                <View style={styles.filterRow}>
                    {FILTERS.map((f) => (
                        <TouchableOpacity
                            key={f.key}
                            style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
                            onPress={() => setFilter(f.key)}
                        >
                            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
                                {f.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* ── Loading ─────────────────────────────────── */}
                {loading && !refreshing && (
                    <ActivityIndicator color="#2AC9A0" style={{ marginTop: 40 }} />
                )}

                {/* ── Empty state ─────────────────────────────── */}
                {!loading && objectives.length === 0 && (
                    <EmptyState onAdd={() => setShowAddModal(true)} />
                )}

                {/* ── Objectives list ─────────────────────────── */}
                {objectives.map((obj) => (
                    <SwipeableRow
                        key={obj.id}
                        onDelete={() => {
                            Alert.alert('Eliminar objetivo', `¿Eliminar "${obj.title}"?`, [
                                { text: 'Cancelar', style: 'cancel' },
                                { text: 'Eliminar', style: 'destructive', onPress: () => deleteObjective(obj.id) },
                            ]);
                        }}
                    >
                        <ObjectiveCard
                            objective={obj}
                            expanded={expandedId === obj.id}
                            onExpand={() => setExpandedId(expandedId === obj.id ? null : obj.id)}
                            onEdit={() => setEditingObjective(obj)}
                            onToggleTask={(taskId, done) => toggleTask(taskId, obj.id, done)}
                            onToggleComplete={async () => {
                                const newStatus = obj.status === 'completed' ? 'active' : 'completed';
                                await updateObjective(obj.id, { status: newStatus });
                                refresh();
                            }}
                            onAddTask={(text) => addTask(obj.id, text)}
                        />
                    </SwipeableRow>
                ))}

                <View style={{ height: 24 }} />
            </ScrollView>

            <AddObjectiveModal
                visible={showAddModal}
                onClose={() => setShowAddModal(false)}
                onCreated={() => { setShowAddModal(false); refresh(); }}
            />
            <EditObjectiveModal
                visible={!!editingObjective}
                objective={editingObjective}
                onClose={() => setEditingObjective(null)}
                onSave={async (id, updates) => {
                    await updateObjective(id, updates);
                    refresh();
                }}
            />
        </GlowBackground>
    );
}

/* ── ObjectiveCard ──────────────────────────────────────── */

function ObjectiveCard({
    objective, expanded, onExpand, onEdit, onToggleTask, onToggleComplete, onAddTask,
}: {
    objective: Objective;
    expanded: boolean;
    onExpand: () => void;
    onEdit: () => void;
    onToggleTask: (taskId: string, currentlyDone: boolean) => void;
    onToggleComplete: () => void;
    onAddTask: (text: string) => Promise<void>;
}) {
    const [newTask, setNewTask] = useState('');
    const [addingTask, setAddingTask] = useState(false);
    const isCompleted = objective.status === 'completed';
    const hasTasks = objective.tasks.length > 0;
    const effectiveProgress = isCompleted ? 100 : objective.progress;

    const handleAddTask = async () => {
        if (!newTask.trim()) return;
        setAddingTask(true);
        try {
            await onAddTask(newTask.trim());
            setNewTask('');
        } finally {
            setAddingTask(false);
        }
    };

    const deadlineDays = objective.deadline
        ? Math.ceil((new Date(objective.deadline).getTime() - Date.now()) / 86400000)
        : null;

    return (
        <View style={[styles.card, { borderLeftColor: objective.color, borderLeftWidth: 3 }]}>
            {/* Card header — tap to expand/collapse */}
            <TouchableOpacity style={styles.cardHeader} onPress={onExpand} activeOpacity={0.7}>
                <View style={[styles.cardIconWrap, { backgroundColor: objective.color + '22' }]}>
                    <Text style={styles.cardIcon}>{objective.icon}</Text>
                </View>
                <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{objective.title}</Text>
                    <View style={styles.cardMeta}>
                        {deadlineDays !== null && (
                            <View style={styles.badge}>
                                <Ionicons name="calendar-outline" size={10} color="#8E8E93" />
                                <Text style={styles.badgeText}>
                                    {deadlineDays > 0 ? `${deadlineDays}d` : 'Vencido'}
                                </Text>
                            </View>
                        )}
                        {hasTasks && (
                            <View style={styles.badge}>
                                <Ionicons name="checkmark-circle-outline" size={10} color="#8E8E93" />
                                <Text style={styles.badgeText}>
                                    {objective.tasks.filter((t) => t.completed).length}/{objective.tasks.length} subtareas
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
                <TouchableOpacity onPress={onEdit} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="create-outline" size={16} color="#8E8E93" />
                </TouchableOpacity>
                <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color="#8E8E93" />
            </TouchableOpacity>

            {/* Progress bar */}
            <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${effectiveProgress}%` as any, backgroundColor: objective.color }]} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, marginBottom: 4 }}>
                <Text style={styles.progressLabel}>{effectiveProgress}% completado</Text>
                <TouchableOpacity
                    onPress={onToggleComplete}
                    style={{
                        flexDirection: 'row', alignItems: 'center', gap: 4,
                        backgroundColor: isCompleted ? '#2AC9A020' : objective.color + '20',
                        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
                    }}
                >
                    <Ionicons
                        name={isCompleted ? 'refresh-outline' : 'checkmark-circle-outline'}
                        size={14}
                        color={isCompleted ? '#2AC9A0' : objective.color}
                    />
                    <Text style={{ fontSize: 11, fontWeight: '600', color: isCompleted ? '#2AC9A0' : objective.color }}>
                        {isCompleted ? 'Reabrir' : 'Completar'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Expanded tasks */}
            {expanded && (
                <View style={styles.tasks}>
                    {objective.tasks.map((task) => (
                        <TouchableOpacity
                            key={task.id}
                            style={styles.taskRow}
                            onPress={() => onToggleTask(task.id, task.completed)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.taskCheck,
                            task.completed && { backgroundColor: objective.color, borderColor: objective.color }]}>
                                {task.completed && <Ionicons name="checkmark" size={12} color="#FFF" />}
                            </View>
                            <Text style={[styles.taskTitle, task.completed && styles.taskTitleDone]}>
                                {task.title}
                            </Text>
                        </TouchableOpacity>
                    ))}

                    {/* Add task inline */}
                    <View style={styles.addTaskRow}>
                        <TextInput
                            style={styles.addTaskInput}
                            value={newTask}
                            onChangeText={setNewTask}
                            placeholder="Agregar tarea..."
                            placeholderTextColor="#555"
                            onSubmitEditing={handleAddTask}
                            returnKeyType="done"
                        />
                        <TouchableOpacity
                            style={[styles.addTaskBtn, { backgroundColor: objective.color }]}
                            onPress={handleAddTask}
                            disabled={addingTask}
                        >
                            {addingTask
                                ? <ActivityIndicator color="#FFF" size="small" />
                                : <Ionicons name="add" size={18} color="#FFF" />}
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
}

/* ── Empty State ────────────────────────────────────────── */

function EmptyState({ onAdd }: { onAdd: () => void }) {
    return (
        <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={styles.emptyTitle}>Sin objetivos todavía</Text>
            <Text style={styles.emptySub}>Definí tus metas y seguí tu progreso paso a paso</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={onAdd}>
                <Ionicons name="add" size={18} color="#FFF" />
                <Text style={styles.emptyBtnText}>Crear objetivo</Text>
            </TouchableOpacity>
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

    summaryCard: {
        backgroundColor: '#12122A', borderRadius: 18, padding: 18, marginBottom: 18,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    },
    summaryItem: { alignItems: 'center', gap: 4 },
    summaryValue: { fontSize: 26, fontWeight: '800', color: '#FFF' },
    summaryLabel: { fontSize: 11, color: '#7A7A9A' },
    summaryDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.08)' },

    filterRow: { flexDirection: 'row', marginBottom: 16, gap: 8 },
    filterBtn: {
        paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20,
        backgroundColor: '#14142A', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    },
    filterBtnActive: { backgroundColor: '#2AC9A0', borderColor: '#2AC9A0' },
    filterText: { fontSize: 13, fontWeight: '600', color: '#7A7A9A' },
    filterTextActive: { color: '#FFF' },

    card: {
        backgroundColor: '#12122A', borderRadius: 18, padding: 14,
        marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
    cardIconWrap: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    cardIcon: { fontSize: 22 },
    cardInfo: { flex: 1 },
    cardTitle: { fontSize: 15, fontWeight: '700', color: '#FFF', marginBottom: 4 },
    cardMeta: { flexDirection: 'row', gap: 8 },
    badge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#2A2A3E', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
    },
    badgeText: { fontSize: 11, color: '#7A7A9A' },

    progressTrack: { height: 6, backgroundColor: '#2A2A3E', borderRadius: 3, marginBottom: 4 },
    progressFill: { height: 6, borderRadius: 3 },
    progressLabel: { fontSize: 11, color: '#7A7A9A', marginBottom: 2 },

    tasks: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.08)', gap: 8 },
    taskRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    taskCheck: {
        width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#3A3A5A',
        justifyContent: 'center', alignItems: 'center',
    },
    taskTitle: { flex: 1, fontSize: 14, color: '#DDD' },
    taskTitleDone: { textDecorationLine: 'line-through', color: '#555570' },
    addTaskRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
    addTaskInput: {
        flex: 1, backgroundColor: '#14142A', borderRadius: 10, paddingHorizontal: 12,
        height: 38, color: '#FFF', fontSize: 13,
    },
    addTaskBtn: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },

    emptyWrap: { alignItems: 'center', paddingVertical: 60, gap: 10 },
    emptyEmoji: { fontSize: 48, marginBottom: 4 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },
    emptySub: { fontSize: 13, color: '#7A7A9A', textAlign: 'center', maxWidth: 240 },
    emptyBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#2AC9A0', paddingHorizontal: 20, paddingVertical: 12,
        borderRadius: 14, marginTop: 8,
    },
    emptyBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});
