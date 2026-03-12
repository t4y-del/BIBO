import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Modal,
    TextInput, KeyboardAvoidingView, Platform,
    ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SavingsEntry } from '../hooks/useSavings';

const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function todayStr() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
}

export default function AddSavingsModal({
    visible,
    currentYear,
    existingMonths,
    onClose,
    onSave,
    editEntry,
}: {
    visible: boolean;
    currentYear: number;
    existingMonths: number[];
    onClose: () => void;
    onSave: (params: { month: number; amount_ars: number; saved_at: string; note?: string }) => Promise<void>;
    editEntry?: SavingsEntry | null;
}) {
    const isEditing = !!editEntry;
    const currentMonth = new Date().getMonth() + 1;

    const [month, setMonth] = useState(currentMonth);
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(todayStr());
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);

    // Pre-fill when editing
    useEffect(() => {
        if (!visible) return;
        if (editEntry) {
            setMonth(editEntry.month);
            setAmount(String(Math.round(Number(editEntry.amount_ars))));
            setDate(editEntry.saved_at);
            setNote(editEntry.note ?? '');
        } else {
            reset();
        }
    }, [visible, editEntry]);

    const reset = () => {
        setMonth(currentMonth);
        setAmount('');
        setDate(todayStr());
        setNote('');
    };

    const handleSave = async () => {
        const amountVal = parseFloat(amount.replace(/\./g, '').replace(',', '.'));
        if (!amount || isNaN(amountVal) || amountVal <= 0) {
            Alert.alert('Error', 'Ingresá un monto válido'); return;
        }

        const alreadyExists = !isEditing && existingMonths.includes(month);
        const proceed = async () => {
            setLoading(true);
            try {
                await onSave({ month, amount_ars: amountVal, saved_at: date, note: note.trim() || undefined });
                reset();
                onClose();
            } catch (e: any) {
                Alert.alert('Error al guardar', e.message);
            } finally {
                setLoading(false);
            }
        };

        if (alreadyExists) {
            Alert.alert(
                'Reemplazar entrada',
                `Ya existe una entrada para ${MONTHS[month - 1]}. ¿Reemplazar?`,
                [{ text: 'Cancelar', style: 'cancel' }, { text: 'Reemplazar', onPress: proceed }]
            );
        } else {
            await proceed();
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
                    <View style={styles.titleRow}>
                        <Text style={styles.sheetTitle}>
                            {isEditing ? 'Editar ahorro' : 'Registrar ahorro'}
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={22} color="#7A7A9A" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                        {/* Mes selector */}
                        <Text style={styles.label}>MES</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                            <View style={styles.monthRow}>
                                {MONTHS.map((m, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        style={[styles.monthBtn, month === i + 1 && styles.monthBtnActive]}
                                        onPress={() => setMonth(i + 1)}
                                    >
                                        <Text style={[styles.monthBtnText, month === i + 1 && styles.monthBtnTextActive]}>
                                            {m.slice(0, 3).toUpperCase()}
                                        </Text>
                                        {existingMonths.includes(i + 1) && (
                                            <View style={styles.monthDot} />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        {/* Monto */}
                        <Text style={styles.label}>MONTO AHORRADO (ARS)</Text>
                        <View style={styles.inputWrap}>
                            <Text style={styles.inputPrefix}>🇦🇷</Text>
                            <TextInput
                                style={styles.input}
                                value={amount}
                                onChangeText={setAmount}
                                placeholder="500000"
                                placeholderTextColor="#444"
                                keyboardType="number-pad"
                            />
                            <Text style={styles.inputSuffix}>ARS</Text>
                        </View>

                        {/* Fecha */}
                        <Text style={styles.label}>FECHA (YYYY-MM-DD)</Text>
                        <View style={styles.inputWrap}>
                            <Ionicons name="calendar-outline" size={18} color="#7A7A9A" />
                            <TextInput
                                style={styles.input}
                                value={date}
                                onChangeText={setDate}
                                placeholder="2026-03-01"
                                placeholderTextColor="#444"
                                keyboardType="numbers-and-punctuation"
                            />
                        </View>

                        {/* Nota */}
                        <Text style={styles.label}>NOTA (opcional)</Text>
                        <View style={styles.inputWrap}>
                            <TextInput
                                style={styles.input}
                                value={note}
                                onChangeText={setNote}
                                placeholder="Sueldo, freelance, etc."
                                placeholderTextColor="#444"
                                maxLength={80}
                            />
                        </View>

                        <View style={styles.btnRow}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                                <Text style={styles.cancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.saveBtn, { opacity: loading ? 0.6 : 1 }]}
                                onPress={handleSave}
                                disabled={loading}
                            >
                                {loading
                                    ? <ActivityIndicator color="#FFF" size="small" />
                                    : <Text style={styles.saveText}>
                                        {isEditing ? 'Guardar cambios' : 'Guardar ahorro'}
                                    </Text>}
                            </TouchableOpacity>
                        </View>
                        <View style={{ height: 12 }} />
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)' },
    sheet: {
        backgroundColor: '#12122A', borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: 24, paddingBottom: 32, maxHeight: '85%',
        borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    },
    handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#2A2A4A', alignSelf: 'center', marginBottom: 20 },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    sheetTitle: { fontSize: 20, fontWeight: '800', color: '#FFF' },

    label: { fontSize: 11, fontWeight: '700', color: '#7A7A9A', letterSpacing: 1, marginBottom: 8 },

    monthRow: { flexDirection: 'row', gap: 8, paddingRight: 4 },
    monthBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: '#14142A', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.06)', alignItems: 'center', minWidth: 56 },
    monthBtnActive: { borderColor: '#2AC9A0', backgroundColor: '#2AC9A018' },
    monthBtnText: { fontSize: 11, fontWeight: '700', color: '#7A7A9A' },
    monthBtnTextActive: { color: '#2AC9A0' },
    monthDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#2AC9A0', marginTop: 4 },

    inputWrap: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#14142A',
        borderRadius: 14, paddingHorizontal: 14, height: 52, gap: 10, marginBottom: 16,
        borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.06)',
    },
    input: { flex: 1, color: '#FFF', fontSize: 15 },
    inputPrefix: { fontSize: 16 },
    inputSuffix: { fontSize: 12, color: '#2AC9A0', fontWeight: '600' },

    btnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
    cancelBtn: { flex: 1, height: 52, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
    cancelText: { color: '#7A7A9A', fontWeight: '600', fontSize: 15 },
    saveBtn: { flex: 2, height: 52, borderRadius: 14, backgroundColor: '#2AC9A0', justifyContent: 'center', alignItems: 'center' },
    saveText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
});
