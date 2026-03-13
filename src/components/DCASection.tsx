import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    TextInput, ActivityIndicator, ScrollView,
} from 'react-native';
import { useDCA, DCAParams } from '../hooks/useDCA';
import { COLORS, RADII, SPACING } from '../config/theme';

const FREQUENCIES = [
    { value: 'monthly' as const, label: 'Mensual' },
    { value: 'weekly' as const, label: 'Semanal' },
    { value: 'bi-weekly' as const, label: 'Quincenal' },
    { value: 'daily' as const, label: 'Diario' },
];

export default function DCASection() {
    const { result, loading, error, calculate } = useDCA();

    const [amount, setAmount] = useState('100');
    const [frequency, setFrequency] = useState<DCAParams['frequency']>('monthly');
    const [startDate, setStartDate] = useState('2023-01-01');
    const [duration, setDuration] = useState('2');

    const handleCalculate = () => {
        const amt = parseFloat(amount);
        const dur = parseFloat(duration);
        if (!amt || !startDate || !dur) return;
        calculate({ amount: amt, frequency, duration: dur, startDate });
    };

    const m = result?.metrics;
    const isProfit = m ? m.percentageChange >= 0 : false;

    return (
        <View>
            {/* Form */}
            <View style={styles.formCard}>
                <View style={styles.grid}>
                    <View style={styles.gridItem}>
                        <Text style={styles.label}>Monto (USD)</Text>
                        <TextInput
                            style={styles.input}
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="numeric"
                            placeholder="100"
                            placeholderTextColor={COLORS.label3}
                        />
                    </View>
                    <View style={styles.gridItem}>
                        <Text style={styles.label}>Duración (años)</Text>
                        <TextInput
                            style={styles.input}
                            value={duration}
                            onChangeText={setDuration}
                            keyboardType="numeric"
                            placeholder="2"
                            placeholderTextColor={COLORS.label3}
                        />
                    </View>
                </View>

                {/* Frequency pills */}
                <Text style={styles.label}>Frecuencia</Text>
                <View style={styles.freqRow}>
                    {FREQUENCIES.map(f => (
                        <TouchableOpacity
                            key={f.value}
                            style={[styles.freqPill, frequency === f.value && styles.freqPillActive]}
                            onPress={() => setFrequency(f.value)}
                        >
                            <Text style={[styles.freqText, frequency === f.value && styles.freqTextActive]}>
                                {f.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>Desde (YYYY-MM-DD)</Text>
                <TextInput
                    style={styles.input}
                    value={startDate}
                    onChangeText={setStartDate}
                    placeholder="2023-01-01"
                    placeholderTextColor={COLORS.label3}
                />

                <TouchableOpacity style={styles.calcBtn} onPress={handleCalculate} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.calcBtnText}>₿  Calcular DCA</Text>
                    )}
                </TouchableOpacity>

                {error && <Text style={styles.errorText}>{error}</Text>}
            </View>

            {/* Result */}
            {m && (
                <>
                    <View style={styles.resultCard}>
                        <Text style={styles.resultLabel}>Valor actual del portfolio</Text>
                        <Text style={styles.resultBig}>${Math.round(m.totalValue).toLocaleString()}</Text>
                        <View style={[styles.badge, isProfit ? styles.badgeUp : styles.badgeDown]}>
                            <Text style={[styles.badgeText, { color: isProfit ? COLORS.green : COLORS.red }]}>
                                {isProfit ? '▲ +' : '▼ '}{Math.abs(m.percentageChange).toFixed(1)}%
                            </Text>
                        </View>

                        <View style={styles.statsRow}>
                            <View style={styles.stat}>
                                <Text style={styles.statValue}>${Math.round(m.totalInvested).toLocaleString()}</Text>
                                <Text style={styles.statLabel}>Invertido</Text>
                            </View>
                            <View style={[styles.stat, styles.statBorder]}>
                                <Text style={styles.statValue}>{m.totalBTC.toFixed(6)} ₿</Text>
                                <Text style={styles.statLabel}>BTC acum.</Text>
                            </View>
                            <View style={[styles.stat, styles.statBorder]}>
                                <Text style={styles.statValue}>{m.numberOfPurchases}</Text>
                                <Text style={styles.statLabel}>Compras</Text>
                            </View>
                            <View style={[styles.stat, styles.statBorder]}>
                                <Text style={styles.statValue}>${Math.round(m.averagePrice).toLocaleString()}</Text>
                                <Text style={styles.statLabel}>Prom.</Text>
                            </View>
                        </View>
                    </View>

                    {/* Purchases */}
                    {result?.purchases && result.purchases.length > 0 && (
                        <View style={styles.purchasesCard}>
                            <Text style={styles.purchasesTitle}>Últimas compras</Text>
                            {result.purchases.slice(-5).reverse().map((p, i) => {
                                const date = new Date(p.timestamp || p.date || '').toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
                                return (
                                    <View key={i} style={styles.purchaseRow}>
                                        <View>
                                            <Text style={styles.purchaseDate}>{date}</Text>
                                            <Text style={styles.purchasePrice}>${Math.round(p.price || p.btcPrice || 0).toLocaleString()} USD/BTC</Text>
                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={styles.purchaseBtc}>{(p.btcPurchased || p.btc || 0).toFixed(6)} ₿</Text>
                                            <Text style={styles.purchaseUsd}>${Math.round(p.usdSpent || parseFloat(amount))} USD</Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    formCard: { backgroundColor: COLORS.card, borderRadius: RADII.large, borderWidth: 1, borderColor: COLORS.border, padding: 18, marginHorizontal: SPACING.xl, marginBottom: 14 },
    grid: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    gridItem: { flex: 1 },
    label: { fontSize: 11, fontWeight: '700', color: COLORS.label3, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
    input: { backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: RADII.input, padding: 10, color: COLORS.label, fontSize: 15, fontWeight: '600', marginBottom: 10 },
    freqRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
    freqPill: { flex: 1, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center' },
    freqPillActive: { borderColor: COLORS.btc, backgroundColor: 'rgba(247,147,26,0.12)' },
    freqText: { fontSize: 11, fontWeight: '700', color: COLORS.label3 },
    freqTextActive: { color: COLORS.btc },
    calcBtn: { backgroundColor: COLORS.btc, borderRadius: RADII.button, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
    calcBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
    errorText: { color: COLORS.red, fontSize: 13, textAlign: 'center', fontWeight: '600', marginTop: 8 },

    // Result
    resultCard: {
        marginHorizontal: SPACING.xl, marginBottom: 14, padding: 16, borderRadius: 18,
        borderWidth: 1, borderColor: 'rgba(247,147,26,0.25)',
        backgroundColor: 'rgba(247,147,26,0.06)',
    },
    resultLabel: { fontSize: 12, color: COLORS.label3, marginBottom: 4 },
    resultBig: { fontSize: 32, fontWeight: '800', color: COLORS.label, letterSpacing: -1 },
    badge: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 4, borderRadius: RADII.badge, marginTop: 6 },
    badgeUp: { backgroundColor: 'rgba(48,209,88,0.15)' },
    badgeDown: { backgroundColor: 'rgba(255,59,48,0.15)' },
    badgeText: { fontSize: 11, fontWeight: '700' },
    statsRow: { flexDirection: 'row', marginTop: 12 },
    stat: { flex: 1, alignItems: 'center' },
    statBorder: { borderLeftWidth: 0.5, borderLeftColor: 'rgba(255,255,255,0.1)' },
    statValue: { fontSize: 14, fontWeight: '800', color: COLORS.label, letterSpacing: -0.3 },
    statLabel: { fontSize: 10, color: COLORS.label3, marginTop: 2 },

    // Purchases
    purchasesCard: { marginHorizontal: SPACING.xl, marginBottom: 14, padding: 16, backgroundColor: COLORS.card, borderRadius: RADII.card, borderWidth: 1, borderColor: COLORS.border },
    purchasesTitle: { fontSize: 13, fontWeight: '700', color: COLORS.label, marginBottom: 10 },
    purchaseRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: COLORS.separator },
    purchaseDate: { fontSize: 12, fontWeight: '600', color: COLORS.label2 },
    purchasePrice: { fontSize: 11, color: COLORS.label3, marginTop: 1 },
    purchaseBtc: { fontSize: 12, fontWeight: '700', color: COLORS.btc },
    purchaseUsd: { fontSize: 11, color: COLORS.label3, marginTop: 1 },
});
