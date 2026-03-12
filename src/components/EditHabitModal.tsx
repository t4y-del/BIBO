import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    Modal, TextInput, KeyboardAvoidingView, Platform,
    ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { HabitWithLog } from '../hooks/useHabits';

const ICONS = ['💪', '📚', '🏃', '💧', '🧘', '🎵', '✍️', '🥗', '😴', '🚿', '💊', '🌱', '🧠', '🎯', '❤️'];
const COLORS = ['#6C63FF', '#2AC9A0', '#4CAF50', '#F7931A', '#00D9FF', '#FF5252', '#FF9800', '#E91E63'];

export default function EditHabitModal({
    visible, habit, onClose, onSave,
}: {
    visible: boolean;
    habit: HabitWithLog | null;
    onClose: () => void;
    onSave: (id: string, updates: { name: string; icon: string; color: string }) => Promise<void>;
}) {
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('💪');
    const [color, setColor] = useState('#6C63FF');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (habit) {
            setName(habit.name);
            setIcon(habit.icon);
            setColor(habit.color);
        }
    }, [habit]);

    const handleSave = async () => {
        if (!habit || !name.trim()) { Alert.alert('Ingresá un nombre'); return; }
        setLoading(true);
        try {
            await onSave(habit.id, { name: name.trim(), icon, color });
            onClose();
        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
            <KeyboardAvoidingView
                style={styles.overlay}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

                <View style={styles.sheet}>
                    <View style={styles.handle} />
                    <Text style={styles.title}>Editar hábito</Text>

                    <Text style={styles.label}>NOMBRE</Text>
                    <View style={styles.inputWrap}>
                        <Text style={{ fontSize: 20 }}>{icon}</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="Nombre del hábito"
                            placeholderTextColor="#555"
                            maxLength={60}
                        />
                    </View>

                    <Text style={styles.label}>ÍCONO</Text>
                    <View style={styles.picker}>
                        {ICONS.map((ic) => (
                            <TouchableOpacity
                                key={ic}
                                style={[styles.iconBtn, icon === ic && { borderColor: color, borderWidth: 2 }]}
                                onPress={() => setIcon(ic)}
                            >
                                <Text style={{ fontSize: 22 }}>{ic}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>COLOR</Text>
                    <View style={styles.colorRow}>
                        {COLORS.map((c) => (
                            <TouchableOpacity
                                key={c}
                                style={[styles.colorDot, { backgroundColor: c },
                                color === c && styles.colorDotActive]}
                                onPress={() => setColor(c)}
                            />
                        ))}
                    </View>

                    <View style={styles.btnRow}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                            <Text style={styles.cancelText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.saveBtn, { backgroundColor: color, opacity: loading ? 0.6 : 1 }]}
                            onPress={handleSave}
                            disabled={loading}
                        >
                            {loading
                                ? <ActivityIndicator color="#FFF" size="small" />
                                : <Text style={styles.saveText}>Guardar</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
    sheet: {
        backgroundColor: '#1A1A2E', borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: 24, paddingBottom: 40,
        borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    },
    handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#3A3A5A', alignSelf: 'center', marginBottom: 20 },
    title: { fontSize: 22, fontWeight: '800', color: '#FFF', marginBottom: 20 },
    label: { fontSize: 11, fontWeight: '700', color: '#8E8E93', letterSpacing: 1, marginBottom: 8 },
    inputWrap: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#12122A',
        borderRadius: 14, paddingHorizontal: 14, height: 52, gap: 10, marginBottom: 16,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    },
    input: { flex: 1, color: '#FFF', fontSize: 15 },
    picker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    iconBtn: {
        width: 44, height: 44, borderRadius: 12, backgroundColor: '#12122A',
        justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'transparent',
    },
    colorRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
    colorDot: { width: 32, height: 32, borderRadius: 16 },
    colorDotActive: { borderWidth: 3, borderColor: '#FFF', transform: [{ scale: 1.15 }] },
    btnRow: { flexDirection: 'row', gap: 12 },
    cancelBtn: {
        flex: 1, height: 52, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center', alignItems: 'center',
    },
    cancelText: { color: '#8E8E93', fontWeight: '600', fontSize: 15 },
    saveBtn: { flex: 2, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    saveText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});
