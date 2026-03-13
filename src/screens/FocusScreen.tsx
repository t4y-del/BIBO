import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocus } from '../hooks/useFocus';
import SwipeableRow from '../components/SwipeableRow';
import GlowBackground from '../components/GlowBackground';
import { COLORS, RADII, SPACING } from '../config/theme';

const DURATIONS = [15, 25, 45, 60]; // minutes

export default function FocusScreen() {
    const {
        sessions, loading, remaining, elapsed, isRunning, isDone, timerSeconds,
        start, pause, reset, setDuration, saveSession, deleteSession, refresh,
        todaySessions, todayMinutes,
    } = useFocus();
    const [sessionName, setSessionName] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [showNameInput, setShowNameInput] = useState(false);

    const onRefresh = async () => { setRefreshing(true); await refresh(); setRefreshing(false); };

    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    const progress = timerSeconds > 0 ? elapsed / timerSeconds : 0;

    const handleSave = async () => {
        if (elapsed < 60) {
            Alert.alert('Sesión muy corta', 'Necesitás al menos 1 minuto para guardar.');
            return;
        }
        try {
            await saveSession(sessionName.trim() || undefined);
            setSessionName('');
            setShowNameInput(false);
        } catch (e: any) {
            Alert.alert('Error', e.message);
        }
    };

    const formatDuration = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        if (m >= 60) {
            const h = Math.floor(m / 60);
            return `${h}h ${m % 60}m`;
        }
        return s > 0 ? `${m}m ${s}s` : `${m}m`;
    };

    return (
        <GlowBackground variant="default">
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerDate}>Productividad</Text>
                    <Text style={styles.headerTitle}>Focus ⏱</Text>
                </View>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={{ alignItems: 'center' }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.teal} />}
            >
                {/* Timer circle */}
                <View style={styles.timerCircle}>
                    {/* Progress ring */}
                    <View style={[styles.progressRing, { borderColor: `rgba(42,201,160,${0.3 + progress * 0.7})` }]} />
                    <Text style={styles.timerText}>
                        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                    </Text>
                    <Text style={styles.timerLabel}>
                        {isDone ? '¡Listo!' : isRunning ? 'Enfocando...' : 'Pomodoro'}
                    </Text>
                </View>

                {/* Duration pills */}
                <View style={styles.durationRow}>
                    {DURATIONS.map(d => (
                        <TouchableOpacity
                            key={d}
                            style={[styles.durationPill, timerSeconds === d * 60 && styles.durationPillActive]}
                            onPress={() => setDuration(d)}
                            disabled={isRunning}
                        >
                            <Text style={[styles.durationText, timerSeconds === d * 60 && styles.durationTextActive]}>
                                {d}m
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Controls */}
                <View style={styles.controlsRow}>
                    <TouchableOpacity style={styles.controlBtn} onPress={reset}>
                        <Ionicons name="refresh" size={20} color={COLORS.label2} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.playBtn, isDone && { backgroundColor: COLORS.green }]}
                        onPress={isRunning ? pause : isDone ? handleSave : start}
                    >
                        <Ionicons
                            name={isRunning ? 'pause' : isDone ? 'checkmark' : 'play'}
                            size={28}
                            color="#FFF"
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.controlBtn}
                        onPress={() => {
                            if (elapsed > 0) setShowNameInput(!showNameInput);
                        }}
                    >
                        <Ionicons name="save-outline" size={20} color={COLORS.label2} />
                    </TouchableOpacity>
                </View>

                {/* Save name input */}
                {(showNameInput || isDone) && (
                    <View style={styles.nameCard}>
                        <TextInput
                            style={styles.nameInput}
                            placeholder="Nombre de la sesión (opcional)"
                            placeholderTextColor={COLORS.label3}
                            value={sessionName}
                            onChangeText={setSessionName}
                        />
                        <TouchableOpacity style={styles.saveNameBtn} onPress={handleSave}>
                            <Text style={styles.saveNameText}>Guardar sesión</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Today stats */}
                <View style={styles.statsCard}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{todaySessions.length}</Text>
                        <Text style={styles.statLabel}>Sesiones hoy</Text>
                    </View>
                    <View style={[styles.statItem, styles.statBorder]}>
                        <Text style={[styles.statValue, { color: COLORS.teal }]}>{todayMinutes}m</Text>
                        <Text style={styles.statLabel}>Enfocado hoy</Text>
                    </View>
                </View>

                {/* Sessions history */}
                <View style={styles.sectionRow}>
                    <Text style={styles.sectionTitle}>Historial</Text>
                    <Text style={styles.sectionSub}>{sessions.length} sesiones</Text>
                </View>

                {sessions.map(s => (
                    <SwipeableRow
                        key={s.id}
                        onDelete={() => {
                            Alert.alert('Eliminar sesión', '¿Eliminar esta sesión?', [
                                { text: 'Cancelar', style: 'cancel' },
                                { text: 'Eliminar', style: 'destructive', onPress: () => deleteSession(s.id) },
                            ]);
                        }}
                    >
                        <View style={styles.sessionCard}>
                            <View style={styles.sessionIcon}>
                                <Ionicons name="timer-outline" size={20} color={COLORS.teal} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.sessionName}>{s.name || 'Sesión sin nombre'}</Text>
                                <Text style={styles.sessionDate}>
                                    {new Date(s.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                                    {' · '}
                                    {new Date(s.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </View>
                            <Text style={styles.sessionDuration}>{formatDuration(s.duration_seconds)}</Text>
                        </View>
                    </SwipeableRow>
                ))}

                <View style={{ height: 24 }} />
            </ScrollView>
        </GlowBackground>
    );
}

const styles = StyleSheet.create({
    header: { paddingHorizontal: SPACING.xl, paddingTop: 50, paddingBottom: SPACING.lg },
    headerDate: { fontSize: 13, color: COLORS.label3, fontWeight: '500' },
    headerTitle: { fontSize: 28, fontWeight: '800', color: COLORS.label, letterSpacing: -0.5 },
    scroll: { flex: 1, paddingHorizontal: SPACING.xl },

    // Timer
    timerCircle: {
        width: 180, height: 180, borderRadius: 90,
        backgroundColor: COLORS.card2, borderWidth: 3, borderColor: 'rgba(42,201,160,0.3)',
        alignItems: 'center', justifyContent: 'center',
        marginVertical: 24,
        shadowColor: COLORS.teal, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.15, shadowRadius: 40,
    },
    progressRing: {
        position: 'absolute', width: '100%', height: '100%', borderRadius: 90,
        borderWidth: 3,
    },
    timerText: { fontSize: 44, fontWeight: '800', color: COLORS.label, letterSpacing: -2 },
    timerLabel: { fontSize: 12, color: COLORS.label3, marginTop: 2 },

    // Durations
    durationRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    durationPill: {
        paddingVertical: 8, paddingHorizontal: 16, borderRadius: RADII.pill,
        borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)',
    },
    durationPillActive: { borderColor: COLORS.teal, backgroundColor: 'rgba(42,201,160,0.12)' },
    durationText: { fontSize: 13, fontWeight: '700', color: COLORS.label3 },
    durationTextActive: { color: COLORS.teal },

    // Controls
    controlsRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
    controlBtn: {
        width: 52, height: 52, borderRadius: 26,
        backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: COLORS.border,
        alignItems: 'center', justifyContent: 'center',
    },
    playBtn: {
        width: 68, height: 68, borderRadius: 34,
        backgroundColor: COLORS.teal, alignItems: 'center', justifyContent: 'center',
        shadowColor: COLORS.teal, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 20,
    },

    // Name input
    nameCard: {
        backgroundColor: COLORS.card, borderRadius: RADII.card, borderWidth: 1, borderColor: COLORS.border,
        padding: SPACING.lg, width: '100%', marginBottom: 16,
    },
    nameInput: {
        backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: RADII.input, padding: 12,
        color: COLORS.label, fontSize: 15, fontWeight: '600', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
        marginBottom: 10,
    },
    saveNameBtn: { backgroundColor: COLORS.teal, borderRadius: RADII.button, paddingVertical: 12, alignItems: 'center' },
    saveNameText: { color: '#FFF', fontWeight: '700', fontSize: 15 },

    // Stats
    statsCard: {
        flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: RADII.card,
        borderWidth: 1, borderColor: COLORS.border, width: '100%', marginBottom: 14,
    },
    statItem: { flex: 1, padding: 14, alignItems: 'center' },
    statBorder: { borderLeftWidth: 0.5, borderLeftColor: COLORS.separator },
    statValue: { fontSize: 22, fontWeight: '800', color: COLORS.label, letterSpacing: -0.5 },
    statLabel: { fontSize: 11, color: COLORS.label3, marginTop: 2 },

    // Section
    sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingVertical: 10 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.label, letterSpacing: -0.3 },
    sectionSub: { fontSize: 12, color: COLORS.label3 },

    // Session card
    sessionCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: COLORS.card, borderRadius: RADII.card,
        borderWidth: 1, borderColor: COLORS.border, padding: 14,
    },
    sessionIcon: {
        width: 42, height: 42, borderRadius: 13, backgroundColor: 'rgba(42,201,160,0.15)',
        alignItems: 'center', justifyContent: 'center',
    },
    sessionName: { fontSize: 15, fontWeight: '600', color: COLORS.label, letterSpacing: -0.2 },
    sessionDate: { fontSize: 12, color: COLORS.label3, marginTop: 2 },
    sessionDuration: { fontSize: 14, fontWeight: '700', color: COLORS.teal },
});
