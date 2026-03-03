import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Modal,
    TextInput, KeyboardAvoidingView, Platform,
    ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BtcPurchase } from '../hooks/useBtcData';

type Currency = 'ARS' | 'USD';

const CURRENCY_OPTIONS: { key: Currency; label: string; icon: string; color: string }[] = [
    { key: 'ARS', label: 'Pesos ARS', icon: '🇦🇷', color: '#74C0FC' },
    { key: 'USD', label: 'Dólares USD', icon: '🇺🇸', color: '#4CAF50' },
];

function todayStr() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
}

/** Implied ARS-per-USD exchange rate derived from CoinGecko BTC prices */
function impliedRate(priceUsd: number | null, priceArs: number | null) {
    if (!priceUsd || !priceArs || priceUsd === 0) return null;
    return priceArs / priceUsd; // ARS per USD
}

export default function AddPurchaseModal({
    visible,
    currentPriceUsd,
    currentPriceArs,
    onClose,
    onSave,
}: {
    visible: boolean;
    currentPriceUsd: number | null;
    currentPriceArs: number | null;
    onClose: () => void;
    onSave: (params: {
        bought_at: string;
        btc_amount: number;
        price_usd: number;
        currency: 'USD' | 'ARS' | 'USDT';
        total_usd?: number;
        total_ars?: number;
        note?: string;
    }) => Promise<void>;
}) {
    const [currency, setCurrency] = useState<Currency>('ARS');
    const [priceUsd, setPriceUsd] = useState('');
    const [totalPaid, setTotalPaid] = useState('');
    const [btcAmount, setBtcAmount] = useState('');
    const [date, setDate] = useState(todayStr());
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [userEditedBtc, setUserEditedBtc] = useState(false);

    // Pre-fill price when modal opens or live price updates
    useEffect(() => {
        if (visible && currentPriceUsd && !priceUsd) {
            setPriceUsd(String(Math.round(currentPriceUsd)));
        }
    }, [visible, currentPriceUsd]);

    // Auto-calculate BTC whenever price or total changes (only if user hasn't edited it manually)
    useEffect(() => {
        if (userEditedBtc) return;
        const price = parseFloat(priceUsd.replace(/\./g, '').replace(',', '.'));
        const total = parseFloat(totalPaid.replace(/\./g, '').replace(',', '.'));
        if (!price || !total || isNaN(price) || isNaN(total) || price === 0) {
            setBtcAmount('');
            return;
        }
        let btc: number;
        if (currency === 'USD') {
            btc = total / price;
        } else {
            // ARS: derive exchange rate from live CoinGecko prices
            const rate = impliedRate(currentPriceUsd, currentPriceArs);
            if (!rate) { setBtcAmount(''); return; }
            btc = total / (price * rate);
        }
        setBtcAmount(btc.toFixed(8));
    }, [priceUsd, totalPaid, currency, userEditedBtc, currentPriceUsd, currentPriceArs]);

    const reset = () => {
        setCurrency('ARS');
        setPriceUsd(currentPriceUsd ? String(Math.round(currentPriceUsd)) : '');
        setTotalPaid('');
        setBtcAmount('');
        setDate(todayStr());
        setNote('');
        setUserEditedBtc(false);
    };

    const currInfo = CURRENCY_OPTIONS.find((c) => c.key === currency)!;

    const handleSave = async () => {
        const price = parseFloat(priceUsd.replace(/[,\.]/g, (m, i, s) =>
            s.indexOf(',') !== -1 && m === ',' ? '.' : m === '.' && s.indexOf(',') === -1 ? '' : ''
        ));
        const priceVal = parseFloat(priceUsd.replace(/\./g, '').replace(',', '.'));
        const totalVal = parseFloat(totalPaid.replace(/\./g, '').replace(',', '.'));
        const btcVal = parseFloat(btcAmount.replace(',', '.'));

        if (!priceUsd || isNaN(priceVal) || priceVal <= 0) {
            Alert.alert('Error', 'Ingresá el precio BTC/USD'); return;
        }
        if (!totalPaid || isNaN(totalVal) || totalVal <= 0) {
            Alert.alert('Error', `Ingresá el monto total en ${currency}`); return;
        }
        if (!btcAmount || isNaN(btcVal) || btcVal <= 0) {
            Alert.alert('Error', 'La cantidad de BTC no es válida'); return;
        }

        setLoading(true);
        try {
            await onSave({
                bought_at: date,
                btc_amount: btcVal,
                price_usd: priceVal,
                currency: currency as 'USD' | 'ARS' | 'USDT',
                total_usd: currency === 'USD' ? totalVal : undefined,
                total_ars: currency === 'ARS' ? totalVal : undefined,
                note: note.trim() || undefined,
            });
            reset();
            onClose();
        } catch (e: any) {
            Alert.alert('Error al guardar', e.message);
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
                    <View style={styles.titleRow}>
                        <Text style={styles.sheetTitle}>Registrar compra BTC</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={22} color="#8E8E93" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                        {/* ── 1. Precio BTC/USD ─────────────────────────── */}
                        <Text style={styles.label}>PRECIO BTC/USD AL COMPRAR</Text>
                        <View style={styles.inputWrap}>
                            <Text style={styles.inputPrefix}>🇺🇸</Text>
                            <TextInput
                                style={styles.input}
                                value={priceUsd}
                                onChangeText={(v) => { setPriceUsd(v); setUserEditedBtc(false); }}
                                placeholder="95000"
                                placeholderTextColor="#444"
                                keyboardType="number-pad"
                            />
                            <Text style={styles.inputSuffix}>USD</Text>
                        </View>

                        {/* ── 2. Moneda de pago + Monto total ───────────── */}
                        <Text style={styles.label}>MONEDA DE PAGO</Text>
                        <View style={styles.currencyRow}>
                            {CURRENCY_OPTIONS.map((opt) => (
                                <TouchableOpacity
                                    key={opt.key}
                                    style={[
                                        styles.currencyBtn,
                                        currency === opt.key && { borderColor: opt.color, backgroundColor: opt.color + '18' },
                                    ]}
                                    onPress={() => { setCurrency(opt.key); setUserEditedBtc(false); }}
                                >
                                    <Text style={styles.currencyIcon}>{opt.icon}</Text>
                                    <Text style={[
                                        styles.currencyLabel,
                                        currency === opt.key && { color: opt.color, fontWeight: '700' },
                                    ]}>{opt.key}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.label}>MONTO TOTAL PAGADO ({currency})</Text>
                        <View style={[styles.inputWrap, { borderColor: currInfo.color + '55' }]}>
                            <Text style={styles.inputPrefix}>{currInfo.icon}</Text>
                            <TextInput
                                style={styles.input}
                                value={totalPaid}
                                onChangeText={(v) => { setTotalPaid(v); setUserEditedBtc(false); }}
                                placeholder={currency === 'ARS' ? '300000' : '315'}
                                placeholderTextColor="#444"
                                keyboardType="number-pad"
                            />
                            <Text style={[styles.inputSuffix, { color: currInfo.color }]}>{currency}</Text>
                        </View>

                        {/* ── 3. BTC cantidad (auto-calc, editable) ──────── */}
                        <View style={styles.btcLabelRow}>
                            <Text style={styles.label}>CANTIDAD DE BTC COMPRADA</Text>
                            {!userEditedBtc && btcAmount !== '' && (
                                <Text style={styles.autoCalcBadge}>⚡ Auto-calculado</Text>
                            )}
                            {userEditedBtc && (
                                <TouchableOpacity onPress={() => setUserEditedBtc(false)}>
                                    <Text style={styles.recalcLink}>↺ Recalcular</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        <View style={[styles.inputWrap, userEditedBtc && { borderColor: '#F7931A55' }]}>
                            <Ionicons name="logo-bitcoin" size={18} color="#F7931A" />
                            <TextInput
                                style={styles.input}
                                value={btcAmount}
                                onChangeText={(v) => { setBtcAmount(v); setUserEditedBtc(true); }}
                                placeholder="0.00315000"
                                placeholderTextColor="#444"
                                keyboardType="decimal-pad"
                            />
                            <Text style={styles.inputSuffix}>BTC</Text>
                        </View>
                        {currency === 'ARS' && !currentPriceArs && !btcAmount && (
                            <Text style={styles.warningText}>
                                ⚠ Se necesita conexión para auto-calcular desde ARS
                            </Text>
                        )}

                        {/* ── Fecha ──────────────────────────────────────── */}
                        <Text style={styles.label}>FECHA (YYYY-MM-DD)</Text>
                        <View style={styles.inputWrap}>
                            <Ionicons name="calendar-outline" size={18} color="#8E8E93" />
                            <TextInput
                                style={styles.input}
                                value={date}
                                onChangeText={setDate}
                                placeholder="2026-02-25"
                                placeholderTextColor="#444"
                                keyboardType="numbers-and-punctuation"
                            />
                        </View>

                        {/* ── Nota ───────────────────────────────────────── */}
                        <Text style={styles.label}>NOTA (opcional)</Text>
                        <View style={styles.inputWrap}>
                            <TextInput
                                style={styles.input}
                                value={note}
                                onChangeText={setNote}
                                placeholder="Compra mensual, etc."
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
                                    : <Text style={styles.saveText}>Guardar compra</Text>}
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
        backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: 24, paddingBottom: 32, maxHeight: '92%',
        borderTopWidth: 1, borderColor: 'rgba(60,60,67,0.12)',
    },
    handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#2A2A4A', alignSelf: 'center', marginBottom: 20 },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    sheetTitle: { fontSize: 20, fontWeight: '800', color: '#1C1C1E' },

    label: { fontSize: 11, fontWeight: '700', color: '#6A6A8A', letterSpacing: 1, marginBottom: 8 },

    currencyRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    currencyBtn: {
        flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.08)', backgroundColor: '#E5E5EA',
        alignItems: 'center', gap: 6,
    },
    currencyIcon: { fontSize: 22 },
    currencyLabel: { fontSize: 13, fontWeight: '600', color: '#8E8E93' },

    inputWrap: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#E5E5EA',
        borderRadius: 14, paddingHorizontal: 14, height: 52, gap: 10, marginBottom: 16,
        borderWidth: 1.5, borderColor: 'rgba(60,60,67,0.12)',
    },
    input: { flex: 1, color: '#1C1C1E', fontSize: 15 },
    inputPrefix: { fontSize: 16, color: '#8E8E93', fontWeight: '700' },
    inputSuffix: { fontSize: 12, color: '#8E8E93', fontWeight: '600' },

    btcLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    autoCalcBadge: { fontSize: 11, color: '#26A17B', fontWeight: '600' },
    recalcLink: { fontSize: 11, color: '#F7931A', fontWeight: '600' },
    warningText: { fontSize: 11, color: '#F7931A', marginBottom: 12, marginTop: -8 },

    btnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
    cancelBtn: { flex: 1, height: 52, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
    cancelText: { color: '#8E8E93', fontWeight: '600', fontSize: 15 },
    saveBtn: { flex: 2, height: 52, borderRadius: 14, backgroundColor: '#F7931A', justifyContent: 'center', alignItems: 'center' },
    saveText: { color: '#1C1C1E', fontWeight: '800', fontSize: 15 },
});
