import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useJournal } from '../hooks/useJournal';
import SwipeableRow from '../components/SwipeableRow';
import GlowBackground from '../components/GlowBackground';
import { COLORS, RADII, SPACING } from '../config/theme';

const MOODS = [
    { emoji: '😤', label: 'Mal' },
    { emoji: '😐', label: 'Regular' },
    { emoji: '🙂', label: 'Bien' },
    { emoji: '😊', label: 'Genial' },
    { emoji: '🔥', label: 'Épico' },
];

export default function JournalScreen() {
    const { entries, todayMood, loading, addEntry, deleteEntry, setMood, refresh } = useJournal();
    const [showEditor, setShowEditor] = useState(false);
    const [content, setContent] = useState('');
    const [selectedMood, setSelectedMood] = useState('😊');
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = async () => { setRefreshing(true); await refresh(); setRefreshing(false); };

    const extractTags = (text: string): string[] => {
        const matches = text.match(/#\w+/g);
        return matches ? matches.map(t => t.slice(1)) : [];
    };

    const handleSave = async () => {
        if (!content.trim()) return;
        try {
            const tags = extractTags(content);
            await addEntry({ mood: selectedMood, content: content.trim(), tags });
            setContent('');
            setShowEditor(false);
        } catch (e: any) {
            Alert.alert('Error', e.message);
        }
    };

    const handleMoodSelect = async (mood: string) => {
        setSelectedMood(mood);
        try {
            await setMood(mood);
        } catch (e: any) {
            Alert.alert('Error', e.message);
        }
    };

    const renderHighlightedText = (text: string) => {
        const parts = text.split(/(#\w+)/g);
        return (
            <Text style={styles.entryText}>
                {parts.map((part, i) =>
                    part.startsWith('#') ? (
                        <Text key={i} style={styles.hashtagInline}>{part}</Text>
                    ) : (
                        <Text key={i}>{part}</Text>
                    )
                )}
            </Text>
        );
    };

    return (
        <GlowBackground variant="default">
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerDate}>Diario personal</Text>
                    <Text style={styles.headerTitle}>Journal 📓</Text>
                </View>
            </View>

            <ScrollView
                style={styles.scroll}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.teal} />}
            >
                {/* Mood selector */}
                <View style={styles.moodCard}>
                    <Text style={styles.moodLabel}>¿Cómo estás hoy?</Text>
                    <View style={styles.moodRow}>
                        {MOODS.map(m => (
                            <TouchableOpacity
                                key={m.emoji}
                                style={[
                                    styles.moodItem,
                                    todayMood === m.emoji && styles.moodItemActive,
                                ]}
                                onPress={() => handleMoodSelect(m.emoji)}
                            >
                                <Text style={styles.moodEmoji}>{m.emoji}</Text>
                                <Text style={[
                                    styles.moodItemLabel,
                                    todayMood === m.emoji && styles.moodItemLabelActive,
                                ]}>{m.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Section header */}
                <View style={styles.sectionRow}>
                    <Text style={styles.sectionTitle}>Entradas</Text>
                    <TouchableOpacity onPress={() => setShowEditor(!showEditor)}>
                        <Text style={styles.sectionAction}>+ Escribir</Text>
                    </TouchableOpacity>
                </View>

                {/* Editor */}
                {showEditor && (
                    <View style={styles.editorCard}>
                        <View style={styles.editorMoodRow}>
                            {MOODS.map(m => (
                                <TouchableOpacity
                                    key={m.emoji}
                                    onPress={() => setSelectedMood(m.emoji)}
                                    style={[styles.editorMoodBtn, selectedMood === m.emoji && styles.editorMoodBtnActive]}
                                >
                                    <Text style={{ fontSize: 20 }}>{m.emoji}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TextInput
                            style={styles.textArea}
                            placeholder="Escribe sobre tu día... usa #tags"
                            placeholderTextColor={COLORS.label3}
                            multiline
                            value={content}
                            onChangeText={setContent}
                        />
                        <View style={styles.editorActions}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => { setShowEditor(false); setContent(''); }}
                            >
                                <Text style={styles.cancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                                <Text style={styles.saveText}>Guardar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Entries list */}
                {loading && entries.length === 0 ? (
                    <ActivityIndicator color={COLORS.teal} style={{ marginTop: 30 }} />
                ) : entries.length === 0 ? (
                    <Text style={styles.empty}>Aún no tenés entradas. ¡Escribí tu primera!</Text>
                ) : (
                    entries.map((entry) => (
                        <SwipeableRow key={entry.id} onDelete={() => {
                            Alert.alert('Eliminar entrada', '¿Eliminar esta entrada?', [
                                { text: 'Cancelar', style: 'cancel' },
                                { text: 'Eliminar', style: 'destructive', onPress: () => deleteEntry(entry.id) },
                            ]);
                        }}>
                            <View style={styles.entryCard}>
                                <Text style={styles.entryDate}>
                                    {entry.entry_date === new Date().toISOString().split('T')[0]
                                        ? 'Hoy'
                                        : new Date(entry.entry_date + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
                                    }
                                </Text>
                                <Text style={styles.entryMood}>{entry.mood}</Text>
                                {entry.content && renderHighlightedText(entry.content)}
                                {entry.tags.length > 0 && (
                                    <View style={styles.tagsRow}>
                                        {entry.tags.map((tag, i) => (
                                            <View key={i} style={styles.tag}>
                                                <Text style={styles.tagText}>{tag}</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        </SwipeableRow>
                    ))
                )}
                <View style={{ height: 24 }} />
            </ScrollView>
        </GlowBackground>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: SPACING.xl, paddingTop: 50, paddingBottom: SPACING.lg },
    headerDate: { fontSize: 13, color: COLORS.label3, fontWeight: '500' },
    headerTitle: { fontSize: 28, fontWeight: '800', color: COLORS.label, letterSpacing: -0.5 },
    scroll: { flex: 1, paddingHorizontal: SPACING.xl },

    // Mood
    moodCard: { backgroundColor: COLORS.card, borderRadius: RADII.card, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.lg, marginBottom: 14 },
    moodLabel: { fontSize: 12, color: COLORS.label3, fontWeight: '600', marginBottom: 10 },
    moodRow: { flexDirection: 'row', justifyContent: 'space-between' },
    moodItem: { alignItems: 'center', padding: 4, borderRadius: 12 },
    moodItemActive: { borderWidth: 2, borderColor: COLORS.teal, borderRadius: 12, padding: 4 },
    moodEmoji: { fontSize: 26 },
    moodItemLabel: { fontSize: 9, color: COLORS.label3, marginTop: 3 },
    moodItemLabelActive: { color: COLORS.teal, fontWeight: '700' },

    // Section
    sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.label, letterSpacing: -0.3 },
    sectionAction: { fontSize: 13, color: COLORS.teal, fontWeight: '600' },

    // Editor
    editorCard: { backgroundColor: COLORS.card, borderRadius: RADII.card, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.lg, marginBottom: 14 },
    editorMoodRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    editorMoodBtn: { padding: 4, borderRadius: 8, borderWidth: 1.5, borderColor: 'transparent' },
    editorMoodBtnActive: { borderColor: COLORS.teal, backgroundColor: 'rgba(42,201,160,0.12)' },
    textArea: { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: RADII.input, padding: 14, color: COLORS.label, fontSize: 15, fontWeight: '600', minHeight: 100, textAlignVertical: 'top', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
    editorActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 12 },
    cancelBtn: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: RADII.button },
    cancelText: { color: COLORS.label3, fontWeight: '600', fontSize: 14 },
    saveBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: RADII.button, backgroundColor: COLORS.teal },
    saveText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

    // Entry
    entryCard: { backgroundColor: COLORS.card, borderRadius: RADII.card, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.lg },
    entryDate: { fontSize: 11, color: COLORS.label3, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
    entryMood: { fontSize: 22, marginBottom: 8 },
    entryText: { fontSize: 14, color: COLORS.label2, lineHeight: 22 },
    hashtagInline: { color: COLORS.teal, fontWeight: '700' },
    tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
    tag: { backgroundColor: 'rgba(42,201,160,0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADII.badge },
    tagText: { fontSize: 11, fontWeight: '700', color: COLORS.teal },

    empty: { color: COLORS.label3, fontSize: 14, textAlign: 'center', marginTop: 40 },
});
