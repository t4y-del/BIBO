import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Modal, TextInput, KeyboardAvoidingView, Platform,
    ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useObjectives } from '../hooks/useObjectives';

const ICONS = ['🎯', '🏆', '📚', '💪', '🌍', '💡', '🚀', '🎓', '🏠', '💰', '🎵', '❤️', '🌱', '✈️', '🔬'];
const COLORS = ['#2AC9A0', '#4CAF50', '#F7931A', '#00D9FF', '#FF5252', '#FF9800', '#E91E63', '#9C27B0'];

export default function AddObjectiveModal({
    visible, onClose, onCreated,
}: {
    visible: boolean; onClose: () => void; onCreated: () => void;
}) {
    const { createObjective } = useObjectives();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [icon, setIcon] = useState('🎯');
    const [color, setColor] = useState('#2AC9A0');
    const [deadline, setDeadline] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!title.trim()) { Alert.alert('Ingresá un nombre para el objetivo'); return; }
        setLoading(true);
        try {
            await createObjective({
                title: title.trim(),
                description: description.trim() || undefined,
                icon, color,
                deadline: deadline || undefined,
            });
            setTitle(''); setDescription(''); setIcon('🎯'); setColor('#2AC9A0'); setDeadline('');
            onCreated();
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
                    <Text style={styles.title}>Nuevo objetivo</Text>

                    {/* Title */}
                    <Text style={styles.label}>NOMBRE</Text>
                    <View style={styles.inputWrap}>
                        <Text style={styles.selectedIcon}>{icon}</Text>
                        <TextInput
                            style={styles.input}
                            value={title}
                            onChangeText={setTitle}
                            placeholder="Ej: Terminar curso de React..."
                            placeholderTextColor="#555"
                            autoFocus
                            maxLength={60}
                        />
                    </View>

                    {/* Description */}
                    <Text style={styles.label}>DESCRIPCIÓN (opcional)</Text>
                    <View style={[styles.inputWrap, { height: 72, alignItems: 'flex-start', paddingTop: 12 }]}>
                        <TextInput
                            style={[styles.input, { height: 48, textAlignVertical: 'top' }]}
                            value={description}
                            onChangeText={setDescription}
                            placeholder="¿Por qué es importante para vos?"
                            placeholderTextColor="#555"
                            multiline
                            maxLength={120}
                        />
                    </View>

                    {/* Deadline */}
                    <Text style={styles.label}>FECHA LÍMITE (opcional, YYYY-MM-DD)</Text>
                    <View style={styles.inputWrap}>
                        <Ionicons name="calendar-outline" size={18} color="#8E8E93" />
                        <TextInput
                            style={styles.input}
                            value={deadline}
                            onChangeText={setDeadline}
                            placeholder="2026-12-31"
                            placeholderTextColor="#555"
                            keyboardType="numbers-and-punctuation"
                            maxLength={10}
                        />
                    </View>

                    {/* Icon picker */}
                    <Text style={styles.label}>ÍCONO</Text>
                    <View style={styles.picker}>
                        {ICONS.map((ic) => (
                            <TouchableOpacity
                                key={ic}
                                style={[styles.iconBtn, icon === ic && { borderColor: color, borderWidth: 2 }]}
                                onPress={() => setIcon(ic)}
                            >
                                <Text style={styles.iconBtnText}>{ic}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Color picker */}
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

                    {/* Buttons */}
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
        backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: 24, paddingBottom: 40,
        borderTopWidth: 1, borderColor: 'rgba(60,60,67,0.12)',
    },
    handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#3A3A5A', alignSelf: 'center', marginBottom: 20 },
    title: { fontSize: 22, fontWeight: '800', color: '#1C1C1E', marginBottom: 20 },
    label: { fontSize: 11, fontWeight: '700', color: '#8E8E93', letterSpacing: 1, marginBottom: 8 },
    inputWrap: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#E5E5EA',
        borderRadius: 14, paddingHorizontal: 14, height: 52, gap: 10, marginBottom: 16,
        borderWidth: 1, borderColor: 'rgba(60,60,67,0.12)',
    },
    selectedIcon: { fontSize: 20 },
    input: { flex: 1, color: '#1C1C1E', fontSize: 15 },
    picker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    iconBtn: {
        width: 44, height: 44, borderRadius: 12, backgroundColor: '#E5E5EA',
        justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'transparent',
    },
    iconBtnText: { fontSize: 22 },
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
    saveText: { color: '#1C1C1E', fontWeight: '700', fontSize: 15 },
});
