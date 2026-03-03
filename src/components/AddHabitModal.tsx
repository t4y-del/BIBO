import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    Modal, ScrollView, KeyboardAvoidingView, Platform,
    ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHabits } from '../hooks/useHabits';

const { width, height } = Dimensions.get('window');

/* ── Constants ──────────────────────────────────────────── */

const ICONS = [
    '🏋️', '📚', '💧', '🧘', '🍎', '💊', '🚴', '✍️', '🎯', '🧹',
    '💤', '🧠', '🌅', '🎵', '☕', '🏃', '🧽', '💪', '🥗', '🎨',
    '🚶', '🌿', '⭐', '🔥', '💡',
];

const COLORS = [
    '#2AC9A0', '#4285F4', '#9C27B0', '#E91E63',
    '#F7931A', '#4CAF50', '#FF5252', '#00D9FF',
];

const DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
// Maps to JS getDay(): Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6, Sun=0
const DAYS_IDX = [1, 2, 3, 4, 5, 6, 0];

const DIFFICULTY = [
    { key: 'easy', label: 'Fácil', emoji: '😊', color: '#4CAF50' },
    { key: 'medium', label: 'Medio', emoji: '💪', color: '#FF9800' },
    { key: 'hard', label: 'Difícil', emoji: '🔥', color: '#FF5252' },
];

/* ── Types ──────────────────────────────────────────────── */

interface FormData {
    name: string;
    description: string;
    icon: string;
    color: string;
    activeDays: number[];   // DAYS_IDX subset
    timesPerDay: number;
    difficulty: string;
}

const INITIAL: FormData = {
    name: '',
    description: '',
    icon: '⭐',
    color: '#2AC9A0',
    activeDays: [1, 2, 3, 4, 5, 6, 0], // all days
    timesPerDay: 1,
    difficulty: 'medium',
};

/* ── Step indicator ─────────────────────────────────────── */

function StepDots({ step }: { step: number }) {
    return (
        <View style={sd.row}>
            {[0, 1, 2].map((i) => (
                <View key={i} style={[sd.dot, i === step && sd.dotActive, i < step && sd.dotDone]} />
            ))}
        </View>
    );
}
const sd = StyleSheet.create({
    row: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginBottom: 4 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D1D1D6' },
    dotActive: { width: 24, backgroundColor: '#2AC9A0' },
    dotDone: { backgroundColor: '#2AC9A088' },
});

/* ── Step 1: Info ───────────────────────────────────────── */

function Step1({ data, onChange }: { data: FormData; onChange: (d: Partial<FormData>) => void }) {
    return (
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Preview card */}
            <View style={[s.previewCard, { borderColor: data.color + '40', backgroundColor: data.color + '12' }]}>
                <View style={[s.previewIconWrap, { backgroundColor: data.color + '25' }]}>
                    <Text style={s.previewIconEmoji}>{data.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={s.previewName}>{data.name || 'Mi hábito'}</Text>
                    <Text style={s.previewDesc} numberOfLines={1}>
                        {data.description || 'Todos los días'}
                    </Text>
                </View>
            </View>

            {/* Name */}
            <Text style={s.label}>NOMBRE DEL HÁBITO</Text>
            <View style={s.inputWrap}>
                <TextInput
                    style={s.input}
                    value={data.name}
                    onChangeText={(v) => onChange({ name: v })}
                    placeholder="Ej: Ejercicio diario"
                    placeholderTextColor="#555"
                    maxLength={50}
                />
            </View>

            {/* Description */}
            <View style={[s.inputWrap, { height: 68, alignItems: 'flex-start', paddingTop: 12 }]}>
                <TextInput
                    style={[s.input, { textAlignVertical: 'top' }]}
                    value={data.description}
                    onChangeText={(v) => onChange({ description: v })}
                    placeholder="Descripción opcional..."
                    placeholderTextColor="#555"
                    multiline
                    maxLength={100}
                />
            </View>

            {/* Icon */}
            <Text style={s.label}>ÍCONO</Text>
            <View style={s.iconGrid}>
                {ICONS.map((ic) => (
                    <TouchableOpacity
                        key={ic}
                        style={[s.iconBtn, data.icon === ic && { borderColor: data.color, backgroundColor: data.color + '20' }]}
                        onPress={() => onChange({ icon: ic })}
                    >
                        <Text style={s.iconBtnEmoji}>{ic}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Color */}
            <Text style={s.label}>COLOR</Text>
            <View style={s.colorRow}>
                {COLORS.map((c) => (
                    <TouchableOpacity
                        key={c}
                        style={[s.colorDot, { backgroundColor: c }, data.color === c && s.colorDotActive]}
                        onPress={() => onChange({ color: c })}
                    >
                        {data.color === c && <Ionicons name="checkmark" size={14} color="#FFF" />}
                    </TouchableOpacity>
                ))}
            </View>

            <View style={{ height: 16 }} />
        </ScrollView>
    );
}

/* ── Step 2: Frequency ──────────────────────────────────── */

function Step2({ data, onChange }: { data: FormData; onChange: (d: Partial<FormData>) => void }) {
    const toggleDay = (idx: number) => {
        const current = data.activeDays;
        const next = current.includes(idx)
            ? current.filter((d) => d !== idx)
            : [...current, idx];
        if (next.length > 0) onChange({ activeDays: next });
    };

    return (
        <ScrollView showsVerticalScrollIndicator={false}>
            {/* Days of week */}
            <Text style={s.label}>DÍAS DE LA SEMANA</Text>
            <View style={s.daysRow}>
                {DAYS.map((d, i) => {
                    const idx = DAYS_IDX[i];
                    const active = data.activeDays.includes(idx);
                    return (
                        <TouchableOpacity
                            key={d}
                            style={[s.dayBtn, active && { backgroundColor: data.color, borderColor: data.color }]}
                            onPress={() => toggleDay(idx)}
                        >
                            <Text style={[s.dayBtnText, active && s.dayBtnTextActive]}>{d}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Quick selects */}
            <View style={s.quickRow}>
                {[
                    { label: 'Todos los días', days: [0, 1, 2, 3, 4, 5, 6] },
                    { label: 'Días de semana', days: [1, 2, 3, 4, 5] },
                    { label: 'Fines de semana', days: [0, 6] },
                ].map((preset) => {
                    const isActive = JSON.stringify([...preset.days].sort()) ===
                        JSON.stringify([...data.activeDays].sort());
                    return (
                        <TouchableOpacity
                            key={preset.label}
                            style={[s.quickBtn, isActive && { borderColor: data.color, backgroundColor: data.color + '20' }]}
                            onPress={() => onChange({ activeDays: preset.days })}
                        >
                            <Text style={[s.quickBtnText, isActive && { color: data.color }]}>{preset.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Times per day */}
            <Text style={s.label}>VECES POR DÍA</Text>
            <View style={s.stepperCard}>
                <Ionicons name="repeat-outline" size={20} color="#8E8E93" />
                <Text style={s.stepperLabel}>Veces por día</Text>
                <View style={s.stepperControls}>
                    <TouchableOpacity
                        style={s.stepperBtn}
                        onPress={() => onChange({ timesPerDay: Math.max(1, data.timesPerDay - 1) })}
                    >
                        <Ionicons name="remove" size={18} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={s.stepperValue}>{data.timesPerDay}</Text>
                    <TouchableOpacity
                        style={s.stepperBtn}
                        onPress={() => onChange({ timesPerDay: Math.min(10, data.timesPerDay + 1) })}
                    >
                        <Ionicons name="add" size={18} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Difficulty */}
            <Text style={s.label}>DIFICULTAD</Text>
            <View style={s.diffRow}>
                {DIFFICULTY.map((d) => (
                    <TouchableOpacity
                        key={d.key}
                        style={[
                            s.diffBtn,
                            data.difficulty === d.key && { borderColor: d.color, backgroundColor: d.color + '20' },
                        ]}
                        onPress={() => onChange({ difficulty: d.key })}
                    >
                        <Text style={s.diffEmoji}>{d.emoji}</Text>
                        <Text style={[s.diffLabel, data.difficulty === d.key && { color: d.color }]}>
                            {d.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={{ height: 16 }} />
        </ScrollView>
    );
}

/* ── Step 3: Confirm ────────────────────────────────────── */

function Step3({ data }: { data: FormData }) {
    const activeDayNames = DAYS.filter((_, i) => data.activeDays.includes(DAYS_IDX[i]));
    const diff = DIFFICULTY.find((d) => d.key === data.difficulty)!;

    return (
        <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={s.confirmTitle}>¡Todo listo! 🎉</Text>
            <Text style={s.confirmSub}>Revisá el resumen antes de guardar</Text>

            {/* Big preview card */}
            <View style={[s.confirmCard, { borderColor: data.color + '40' }]}>
                {/* Header */}
                <View style={s.confirmHeader}>
                    <View style={[s.confirmIconWrap, { backgroundColor: data.color + '25' }]}>
                        <Text style={s.confirmIconEmoji}>{data.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={s.confirmName}>{data.name}</Text>
                        {data.description ? (
                            <Text style={s.confirmDescription}>{data.description}</Text>
                        ) : null}
                    </View>
                    <View style={[s.colorChip, { backgroundColor: data.color }]} />
                </View>

                <View style={s.divider} />

                {/* Details */}
                <View style={s.confirmRows}>
                    <ConfirmRow icon="calendar-outline" label="Días">
                        <Text style={s.confirmRowValue}>
                            {activeDayNames.length === 7
                                ? 'Todos los días'
                                : activeDayNames.join(' · ')}
                        </Text>
                    </ConfirmRow>
                    <ConfirmRow icon="repeat-outline" label="Frecuencia">
                        <Text style={s.confirmRowValue}>
                            {data.timesPerDay}× por día
                        </Text>
                    </ConfirmRow>
                    <ConfirmRow icon="speedometer-outline" label="Dificultad">
                        <Text style={[s.confirmRowValue, { color: diff.color }]}>
                            {diff.emoji} {diff.label}
                        </Text>
                    </ConfirmRow>
                </View>
            </View>

            <View style={{ height: 16 }} />
        </ScrollView>
    );
}

function ConfirmRow({ icon, label, children }: {
    icon: keyof typeof Ionicons.glyphMap; label: string; children: React.ReactNode;
}) {
    return (
        <View style={s.confirmRow}>
            <Ionicons name={icon} size={16} color="#8E8E93" />
            <Text style={s.confirmRowLabel}>{label}</Text>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>{children}</View>
        </View>
    );
}

/* ── Main modal ─────────────────────────────────────────── */

export default function AddHabitModal({
    visible, onClose, onCreated,
}: {
    visible: boolean;
    onClose: () => void;
    onCreated: () => void;
}) {
    const { createHabit } = useHabits();
    const [step, setStep] = useState(0);
    const [data, setData] = useState<FormData>(INITIAL);
    const [loading, setLoading] = useState(false);

    const update = (patch: Partial<FormData>) => setData((prev) => ({ ...prev, ...patch }));

    const handleClose = () => {
        setStep(0);
        setData(INITIAL);
        onClose();
    };

    const handleNext = () => {
        if (step === 0 && !data.name.trim()) {
            Alert.alert('Ingresá un nombre para el hábito');
            return;
        }
        setStep((s) => s + 1);
    };

    const handleBack = () => setStep((s) => s - 1);

    const handleSave = async () => {
        setLoading(true);
        try {
            await createHabit({
                name: data.name.trim(),
                icon: data.icon,
                color: data.color,
                frequency: data.activeDays.length === 7 ? 'daily'
                    : data.activeDays.length === 5 && !data.activeDays.includes(0) && !data.activeDays.includes(6)
                        ? 'weekdays' : 'custom',
                active_days: data.activeDays,
            });
            setStep(0);
            setData(INITIAL);
            onCreated();
        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setLoading(false);
        }
    };

    const STEP_TITLES = ['Nuevo hábito', 'Frecuencia', 'Confirmar'];

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={s.container}>
                {/* ── Top bar ─────────────────────────────── */}
                <View style={s.topBar}>
                    <TouchableOpacity style={s.topSide} onPress={step === 0 ? handleClose : handleBack}>
                        <Text style={s.topLeft}>{step === 0 ? 'Cancelar' : '← Atrás'}</Text>
                    </TouchableOpacity>
                    <View style={s.topCenter}>
                        <Text style={s.topTitle}>{STEP_TITLES[step]}</Text>
                        <StepDots step={step} />
                    </View>
                    <View style={s.topSide}>
                        {step < 2 ? (
                            <TouchableOpacity onPress={handleNext}>
                                <Text style={[s.topRight, { color: data.color }]}>Siguiente</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity onPress={handleSave} disabled={loading}>
                                {loading
                                    ? <ActivityIndicator color={data.color} />
                                    : <Text style={[s.topRight, { color: data.color }]}>Guardar</Text>}
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* ── Content ─────────────────────────────── */}
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <View style={s.content}>
                        {step === 0 && <Step1 data={data} onChange={update} />}
                        {step === 1 && <Step2 data={data} onChange={update} />}
                        {step === 2 && <Step3 data={data} />}
                    </View>
                </KeyboardAvoidingView>

                {/* ── Bottom CTA ──────────────────────────── */}
                <View style={s.bottomBar}>
                    {step < 2 ? (
                        <TouchableOpacity
                            style={[s.nextBtn, { backgroundColor: data.color }]}
                            onPress={handleNext}
                            activeOpacity={0.85}
                        >
                            <Text style={s.nextBtnText}>Siguiente</Text>
                            <Ionicons name="arrow-forward" size={18} color="#FFF" />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[s.nextBtn, { backgroundColor: data.color, opacity: loading ? 0.6 : 1 }]}
                            onPress={handleSave}
                            disabled={loading}
                            activeOpacity={0.85}
                        >
                            {loading
                                ? <ActivityIndicator color="#FFF" />
                                : <>
                                    <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" />
                                    <Text style={s.nextBtnText}>Crear hábito</Text>
                                </>}
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Modal>
    );
}

/* ── Styles ─────────────────────────────────────────────── */

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F2F2F7' },

    topBar: {
        flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20,
        paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1,
        borderColor: 'rgba(60,60,67,0.12)',
    },
    topSide: { width: 80 },
    topCenter: { flex: 1, alignItems: 'center', gap: 6 },
    topTitle: { fontSize: 16, fontWeight: '700', color: '#1C1C1E' },
    topLeft: { fontSize: 15, color: '#8E8E93', paddingTop: 2 },
    topRight: { fontSize: 15, fontWeight: '700', paddingTop: 2, textAlign: 'right' },

    content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },

    bottomBar: {
        paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 20, paddingTop: 12,
        borderTopWidth: 1, borderColor: 'rgba(60,60,67,0.12)',
    },
    nextBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        height: 54, borderRadius: 16,
        shadowColor: '#2AC9A0', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
    },
    nextBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },

    /* Preview card (step 1) */
    previewCard: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        padding: 14, borderRadius: 18, borderWidth: 1.5, marginBottom: 24,
    },
    previewIconWrap: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    previewIconEmoji: { fontSize: 28 },
    previewName: { fontSize: 16, fontWeight: '700', color: '#1C1C1E', marginBottom: 3 },
    previewDesc: { fontSize: 12, color: '#8E8E93' },

    label: { fontSize: 11, fontWeight: '700', color: '#8E8E93', letterSpacing: 1, marginBottom: 10, marginTop: 2 },

    inputWrap: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
        borderRadius: 14, paddingHorizontal: 14, height: 52, gap: 10, marginBottom: 14,
        borderWidth: 1, borderColor: 'rgba(60,60,67,0.12)',
    },
    input: { flex: 1, color: '#1C1C1E', fontSize: 15 },

    iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
    iconBtn: {
        width: 48, height: 48, borderRadius: 14, backgroundColor: '#FFFFFF',
        justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'transparent',
    },
    iconBtnEmoji: { fontSize: 24 },

    colorRow: { flexDirection: 'row', gap: 10, marginBottom: 4, flexWrap: 'wrap' },
    colorDot: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    colorDotActive: { borderWidth: 3, borderColor: '#FFF' },

    /* Step 2 */
    daysRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    dayBtn: {
        flex: 1, height: 44, borderRadius: 12, backgroundColor: '#FFFFFF',
        borderWidth: 1.5, borderColor: 'rgba(60,60,67,0.12)',
        justifyContent: 'center', alignItems: 'center',
    },
    dayBtnText: { fontSize: 13, fontWeight: '700', color: '#8E8E93' },
    dayBtnTextActive: { color: '#FFF' },

    quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 },
    quickBtn: {
        paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
        backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(60,60,67,0.12)',
    },
    quickBtnText: { fontSize: 12, fontWeight: '600', color: '#8E8E93' },

    stepperCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 22,
        borderWidth: 1, borderColor: 'rgba(60,60,67,0.12)',
    },
    stepperLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: '#3A3A3C' },
    stepperControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    stepperBtn: {
        width: 34, height: 34, borderRadius: 10, backgroundColor: '#E5E5EA',
        justifyContent: 'center', alignItems: 'center',
    },
    stepperValue: { fontSize: 20, fontWeight: '800', color: '#1C1C1E', minWidth: 24, textAlign: 'center' },

    diffRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
    diffBtn: {
        flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: '#FFFFFF',
        borderWidth: 1.5, borderColor: 'rgba(60,60,67,0.12)',
        alignItems: 'center', gap: 6,
    },
    diffEmoji: { fontSize: 24 },
    diffLabel: { fontSize: 12, fontWeight: '700', color: '#8E8E93' },

    /* Step 3 */
    confirmTitle: { fontSize: 26, fontWeight: '800', color: '#1C1C1E', marginBottom: 4 },
    confirmSub: { fontSize: 13, color: '#8E8E93', marginBottom: 24 },

    confirmCard: {
        backgroundColor: '#FFFFFF', borderRadius: 22, borderWidth: 1.5,
        overflow: 'hidden',
    },
    confirmHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18 },
    confirmIconWrap: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    confirmIconEmoji: { fontSize: 30 },
    confirmName: { fontSize: 18, fontWeight: '800', color: '#1C1C1E', marginBottom: 2 },
    confirmDescription: { fontSize: 12, color: '#8E8E93' },
    colorChip: { width: 14, height: 14, borderRadius: 7 },

    divider: { height: 1, backgroundColor: 'rgba(60,60,67,0.12)' },

    confirmRows: { padding: 18, gap: 14 },
    confirmRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    confirmRowLabel: { fontSize: 14, color: '#8E8E93', flex: 0, minWidth: 80 },
    confirmRowValue: { fontSize: 14, fontWeight: '600', color: '#1C1C1E', textAlign: 'right' },
});
