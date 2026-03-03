import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    Modal, TextInput, KeyboardAvoidingView, Platform,
    ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { AgendaEvent } from '../hooks/useAgenda';

const COLORS = ['#2AC9A0', '#4CAF50', '#F7931A', '#00D9FF', '#FF5252', '#FF9800', '#E91E63', '#9C27B0'];
const TYPES: { key: 'event' | 'reminder' | 'milestone'; label: string; icon: string }[] = [
    { key: 'event', label: 'Evento', icon: '📅' },
    { key: 'reminder', label: 'Recordatorio', icon: '🔔' },
    { key: 'milestone', label: 'Hito', icon: '🏁' },
];

function toDateStr(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
}

export default function AddEventModal({
    visible, date, onClose, onCreated, createEvent,
}: {
    visible: boolean;
    date: Date;
    onClose: () => void;
    onCreated: () => void;
    createEvent: (params: {
        title: string; description?: string; event_date: string;
        event_time?: string; color?: string; type?: AgendaEvent['type'];
    }) => Promise<void>;
}) {

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [time, setTime] = useState('');
    const [color, setColor] = useState('#2AC9A0');
    const [type, setType] = useState<'event' | 'reminder' | 'milestone'>('event');
    const [loading, setLoading] = useState(false);

    const reset = () => {
        setTitle(''); setDescription(''); setTime(''); setColor('#2AC9A0'); setType('event');
    };

    const handleSave = async () => {
        if (!title.trim()) { Alert.alert('Ingresá un título'); return; }
        setLoading(true);
        try {
            await createEvent({
                title: title.trim(),
                description: description.trim() || undefined,
                event_date: toDateStr(date),
                event_time: time || undefined,
                color,
                type,
            });
            reset();
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
                    <Text style={styles.sheetTitle}>Nuevo evento</Text>
                    <Text style={styles.dateLabel}>
                        {date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </Text>

                    {/* Type selector */}
                    <View style={styles.typeRow}>
                        {TYPES.map((t) => (
                            <TouchableOpacity
                                key={t.key}
                                style={[styles.typeBtn, type === t.key && { borderColor: color, backgroundColor: color + '20' }]}
                                onPress={() => setType(t.key)}
                            >
                                <Text style={styles.typeIcon}>{t.icon}</Text>
                                <Text style={[styles.typeLabel, type === t.key && { color: '#1C1C1E' }]}>{t.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Title */}
                    <Text style={styles.label}>TÍTULO</Text>
                    <View style={styles.inputWrap}>
                        <TextInput
                            style={styles.input}
                            value={title}
                            onChangeText={setTitle}
                            placeholder="Ej: Reunión, clase de inglés..."
                            placeholderTextColor="#555"
                            autoFocus
                            maxLength={60}
                        />
                    </View>

                    {/* Description */}
                    <Text style={styles.label}>DESCRIPCIÓN (opcional)</Text>
                    <View style={[styles.inputWrap, { height: 64, alignItems: 'flex-start', paddingTop: 10 }]}>
                        <TextInput
                            style={[styles.input, { textAlignVertical: 'top' }]}
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Detalle del evento..."
                            placeholderTextColor="#555"
                            multiline
                            maxLength={100}
                        />
                    </View>

                    {/* Time */}
                    <Text style={styles.label}>HORA (opcional, HH:MM)</Text>
                    <View style={styles.inputWrap}>
                        <Ionicons name="time-outline" size={18} color="#8E8E93" />
                        <TextInput
                            style={styles.input}
                            value={time}
                            onChangeText={setTime}
                            placeholder="09:30"
                            placeholderTextColor="#555"
                            keyboardType="numbers-and-punctuation"
                            maxLength={5}
                        />
                    </View>

                    {/* Color */}
                    <Text style={styles.label}>COLOR</Text>
                    <View style={styles.colorRow}>
                        {COLORS.map((c) => (
                            <TouchableOpacity
                                key={c}
                                style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotActive]}
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
        padding: 24, paddingBottom: 40, borderTopWidth: 1, borderColor: 'rgba(60,60,67,0.12)',
    },
    handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#3A3A5A', alignSelf: 'center', marginBottom: 20 },
    sheetTitle: { fontSize: 22, fontWeight: '800', color: '#1C1C1E', marginBottom: 4 },
    dateLabel: { fontSize: 13, color: '#8E8E93', marginBottom: 20, textTransform: 'capitalize' },

    typeRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    typeBtn: {
        flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.08)', backgroundColor: '#E5E5EA',
        alignItems: 'center', gap: 4,
    },
    typeIcon: { fontSize: 18 },
    typeLabel: { fontSize: 11, fontWeight: '600', color: '#8E8E93' },

    label: { fontSize: 11, fontWeight: '700', color: '#8E8E93', letterSpacing: 1, marginBottom: 8 },
    inputWrap: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#E5E5EA',
        borderRadius: 14, paddingHorizontal: 14, height: 52, gap: 10, marginBottom: 16,
        borderWidth: 1, borderColor: 'rgba(60,60,67,0.12)',
    },
    input: { flex: 1, color: '#1C1C1E', fontSize: 15 },

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
