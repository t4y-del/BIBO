import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGoals, Goal } from '../hooks/useGoals';
import SwipeableRow from '../components/SwipeableRow';
import GlowBackground from '../components/GlowBackground';
import { COLORS, RADII, SPACING } from '../config/theme';

type PeriodTab = 'annual' | 'monthly' | 'weekly';

const PERIOD_LABELS: Record<PeriodTab, string> = { annual: 'Anual', monthly: 'Mensual', weekly: 'Semanal' };

const QUARTER_COLORS: Record<string, string> = {
    Q1: COLORS.teal, Q2: COLORS.pink, Q3: COLORS.purple, Q4: COLORS.orange,
};

export default function MetasScreen() {
    const [period, setPeriod] = useState<PeriodTab>('annual');
    const { goals, vision, loading, activeGoals, completedGoals, avgProgress, createGoal, updateGoal, deleteGoal, saveVision, refresh } = useGoals(period);
    const [refreshing, setRefreshing] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [editingVision, setEditingVision] = useState(false);
    const [visionInput, setVisionInput] = useState(vision);

    // Add form state
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newQuarter, setNewQuarter] = useState('Q1');
    const [newIcon, setNewIcon] = useState('🎯');
    const [newColor, setNewColor] = useState<string>(COLORS.teal);

    const onRefresh = async () => { setRefreshing(true); await refresh(); setRefreshing(false); };

    const handleCreate = async () => {
        if (!newTitle.trim()) return;
        try {
            await createGoal({
                title: newTitle.trim(),
                description: newDesc.trim() || undefined,
                quarter: period === 'annual' ? newQuarter : undefined,
                icon: newIcon,
                color: newColor,
            });
            setNewTitle(''); setNewDesc(''); setShowAdd(false);
        } catch (e: any) {
            Alert.alert('Error', e.message);
        }
    };

    const handleSaveVision = async () => {
        try {
            await saveVision(visionInput);
            setEditingVision(false);
        } catch (e: any) {
            Alert.alert('Error', e.message);
        }
    };

    // Sync visionInput when vision changes
    React.useEffect(() => { setVisionInput(vision); }, [vision]);

    const ICONS = ['🎯', '🚀', '💰', '🏠', '✈️', '📱', '📚', '💪', '🎓', '₿'];
    const GOAL_COLORS = [COLORS.teal, COLORS.pink, COLORS.purple, COLORS.orange, COLORS.blue, COLORS.btc, COLORS.green];

    return (
        <GlowBackground variant="objectives">
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerDate}>Planificación</Text>
                    <Text style={styles.headerTitle}>Mis Metas 🚀</Text>
                </View>
            </View>

            {/* Period tabs */}
            <View style={styles.pillSwitch}>
                {(['annual', 'monthly', 'weekly'] as PeriodTab[]).map(p => (
                    <TouchableOpacity
                        key={p}
                        style={[styles.pill, period === p && styles.pillActive]}
                        onPress={() => setPeriod(p)}
                    >
                        <Text style={[styles.pillText, period === p && styles.pillTextActive]}>
                            {PERIOD_LABELS[p]}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView
                style={styles.scroll}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.teal} />}
            >
                {/* Vision (annual only) */}
                {period === 'annual' && (
                    <TouchableOpacity
                        style={styles.visionCard}
                        onPress={() => setEditingVision(true)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.visionLabel}>⭐ Visión {new Date().getFullYear()}</Text>
                        {editingVision ? (
                            <View>
                                <TextInput
                                    style={styles.visionInput}
                                    value={visionInput}
                                    onChangeText={setVisionInput}
                                    placeholder="Escribe tu visión para el año..."
                                    placeholderTextColor={COLORS.label3}
                                    multiline
                                />
                                <TouchableOpacity style={styles.visionSaveBtn} onPress={handleSaveVision}>
                                    <Text style={styles.visionSaveText}>Guardar</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <>
                                <Text style={styles.visionText}>
                                    {vision ? `"${vision}"` : 'Tocá para escribir tu visión del año'}
                                </Text>
                                <Text style={styles.visionSub}>Tu norte para todas las decisiones del año</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}

                {/* Section header */}
                <View style={styles.sectionRow}>
                    <Text style={styles.sectionTitle}>
                        {period === 'annual' ? `Objetivos ${new Date().getFullYear()}` : period === 'monthly' ? 'Sprint del mes' : 'Esta semana'}
                    </Text>
                    <TouchableOpacity onPress={() => setShowAdd(!showAdd)}>
                        <Text style={styles.sectionAction}>+ Nuevo</Text>
                    </TouchableOpacity>
                </View>

                {/* Add form */}
                {showAdd && (
                    <View style={styles.addCard}>
                        <TextInput
                            style={styles.input}
                            placeholder="Título de la meta"
                            placeholderTextColor={COLORS.label3}
                            value={newTitle}
                            onChangeText={setNewTitle}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Descripción (opcional)"
                            placeholderTextColor={COLORS.label3}
                            value={newDesc}
                            onChangeText={setNewDesc}
                        />
                        {period === 'annual' && (
                            <View style={styles.quarterRow}>
                                {['Q1', 'Q2', 'Q3', 'Q4'].map(q => (
                                    <TouchableOpacity
                                        key={q}
                                        style={[styles.quarterBtn, newQuarter === q && { borderColor: QUARTER_COLORS[q], backgroundColor: QUARTER_COLORS[q] + '22' }]}
                                        onPress={() => setNewQuarter(q)}
                                    >
                                        <Text style={[styles.quarterText, newQuarter === q && { color: QUARTER_COLORS[q] }]}>{q}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                        <View style={styles.iconRow}>
                            {ICONS.map(ic => (
                                <TouchableOpacity key={ic} onPress={() => setNewIcon(ic)} style={[styles.iconBtn, newIcon === ic && styles.iconBtnActive]}>
                                    <Text style={{ fontSize: 20 }}>{ic}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <View style={styles.colorRow}>
                            {GOAL_COLORS.map(c => (
                                <TouchableOpacity
                                    key={c}
                                    style={[styles.colorDot, { backgroundColor: c }, newColor === c && styles.colorDotActive]}
                                    onPress={() => setNewColor(c)}
                                />
                            ))}
                        </View>
                        <TouchableOpacity style={styles.createBtn} onPress={handleCreate}>
                            <Text style={styles.createBtnText}>Crear meta</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Goals list */}
                {loading ? (
                    <ActivityIndicator color={COLORS.teal} style={{ marginTop: 30 }} />
                ) : goals.length === 0 ? (
                    <Text style={styles.empty}>No tenés metas todavía. ¡Creá tu primera!</Text>
                ) : (
                    goals.map(goal => (
                        <SwipeableRow
                            key={goal.id}
                            onDelete={() => {
                                Alert.alert('Eliminar meta', `¿Eliminar "${goal.title}"?`, [
                                    { text: 'Cancelar', style: 'cancel' },
                                    { text: 'Eliminar', style: 'destructive', onPress: () => deleteGoal(goal.id) },
                                ]);
                            }}
                        >
                            <GoalCard
                                goal={goal}
                                onToggle={async () => {
                                    const newStatus = goal.status === 'completed' ? 'active' : 'completed';
                                    const newProgress = newStatus === 'completed' ? 100 : goal.progress;
                                    await updateGoal(goal.id, { status: newStatus, progress: newProgress });
                                }}
                                onUpdateProgress={async (p: number) => {
                                    await updateGoal(goal.id, { progress: p });
                                }}
                            />
                        </SwipeableRow>
                    ))
                )}

                <View style={{ height: 24 }} />
            </ScrollView>
        </GlowBackground>
    );
}

function GoalCard({ goal, onToggle, onUpdateProgress }: { goal: Goal; onToggle: () => void; onUpdateProgress: (p: number) => void }) {
    const isCompleted = goal.status === 'completed';
    const qColor = goal.quarter ? QUARTER_COLORS[goal.quarter] ?? goal.color : goal.color;

    return (
        <View style={styles.goalCard}>
            <View style={[styles.goalPeriod, { backgroundColor: qColor + '1A' }]}>
                {goal.quarter ? (
                    <>
                        <Text style={[styles.goalPLabel, { color: qColor }]}>{goal.quarter}</Text>
                    </>
                ) : (
                    <Text style={{ fontSize: 20 }}>{goal.icon}</Text>
                )}
            </View>
            <View style={{ flex: 1 }}>
                <Text style={[styles.goalTitle, isCompleted && { textDecorationLine: 'line-through', opacity: 0.5 }]}>{goal.icon} {goal.title}</Text>
                {goal.description && <Text style={styles.goalSub}>{goal.description}</Text>}
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${isCompleted ? 100 : goal.progress}%`, backgroundColor: goal.color }]} />
                </View>
            </View>
            <TouchableOpacity onPress={onToggle}>
                <Text style={[styles.goalProgress, { color: goal.color }]}>
                    {isCompleted ? '✓' : `${goal.progress}%`}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    header: { paddingHorizontal: SPACING.xl, paddingTop: 50, paddingBottom: 4 },
    headerDate: { fontSize: 13, color: COLORS.label3, fontWeight: '500' },
    headerTitle: { fontSize: 28, fontWeight: '800', color: COLORS.label, letterSpacing: -0.5 },
    scroll: { flex: 1, paddingHorizontal: SPACING.xl },

    // Pills
    pillSwitch: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADII.pill, padding: 3, marginHorizontal: SPACING.xl, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
    pill: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 20 },
    pillActive: { backgroundColor: COLORS.teal, shadowColor: COLORS.teal, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 2 } },
    pillText: { fontSize: 13, fontWeight: '700', color: COLORS.label3 },
    pillTextActive: { color: '#FFF' },

    // Vision
    visionCard: {
        padding: 18, borderRadius: RADII.large,
        backgroundColor: 'rgba(191,90,242,0.08)', borderWidth: 1, borderColor: 'rgba(191,90,242,0.2)',
        marginBottom: 12,
    },
    visionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', color: COLORS.purple, marginBottom: 6 },
    visionText: { fontSize: 17, fontWeight: '700', color: COLORS.label, marginBottom: 4 },
    visionSub: { fontSize: 12, color: COLORS.label3 },
    visionInput: { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: RADII.input, padding: 12, color: COLORS.label, fontSize: 15, fontWeight: '600', minHeight: 60, textAlignVertical: 'top', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', marginBottom: 10 },
    visionSaveBtn: { backgroundColor: COLORS.purple, borderRadius: RADII.button, paddingVertical: 10, alignItems: 'center' },
    visionSaveText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

    // Section
    sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.label, letterSpacing: -0.3 },
    sectionAction: { fontSize: 13, color: COLORS.teal, fontWeight: '600' },

    // Add form
    addCard: { backgroundColor: COLORS.card, borderRadius: RADII.card, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.lg, marginBottom: 14 },
    input: { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: RADII.input, padding: 12, color: COLORS.label, fontSize: 15, fontWeight: '600', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', marginBottom: 10 },
    quarterRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
    quarterBtn: { flex: 1, paddingVertical: 8, borderRadius: RADII.button, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center' },
    quarterText: { fontSize: 13, fontWeight: '700', color: COLORS.label3 },
    iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
    iconBtn: { padding: 6, borderRadius: 8, borderWidth: 1.5, borderColor: 'transparent' },
    iconBtnActive: { borderColor: COLORS.teal, backgroundColor: 'rgba(42,201,160,0.12)' },
    colorRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    colorDot: { width: 28, height: 28, borderRadius: 14 },
    colorDotActive: { borderWidth: 3, borderColor: '#FFF' },
    createBtn: { backgroundColor: COLORS.teal, borderRadius: RADII.button, paddingVertical: 12, alignItems: 'center' },
    createBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },

    // Goal card
    goalCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: COLORS.card, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, padding: 14,
    },
    goalPeriod: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    goalPLabel: { fontSize: 8, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    goalTitle: { fontSize: 14, fontWeight: '700', color: COLORS.label, letterSpacing: -0.2 },
    goalSub: { fontSize: 11, color: COLORS.label3, marginTop: 2 },
    progressBar: { height: 3, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, marginTop: 6, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 3 },
    goalProgress: { fontSize: 12, fontWeight: '700' },

    empty: { color: COLORS.label3, fontSize: 14, textAlign: 'center', marginTop: 40 },
});
