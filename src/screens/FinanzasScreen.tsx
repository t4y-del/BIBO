import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Dimensions, RefreshControl, Alert, ActivityIndicator,
    Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBtcPrice, type PriceCurrency } from '../hooks/useBtcPrice';
import { useBtcData, type BtcPurchase } from '../hooks/useBtcData';
import { useSavings, type SavingsEntry } from '../hooks/useSavings';
import { useHideBalance, maskMoney } from '../contexts/HideBalanceContext';
import GlowBackground from '../components/GlowBackground';
import AddPurchaseModal from '../components/AddPurchaseModal';
import SwipeablePurchaseCard from '../components/SwipeablePurchaseCard';
import SwipeableSavingsCard from '../components/SwipeableSavingsCard';
import AddSavingsModal from '../components/AddSavingsModal';
import { LineChart } from 'react-native-gifted-charts';

const { width } = Dimensions.get('window');
const CHART_W = width - 36 - 32;
const CHART_H = 90;

type Tab = 'BTC' | 'Ahorros' | 'Resumen';

/* ── Currency display helpers ───────────────────────────── */

const CURRENCIES: { key: PriceCurrency; label: string; icon: string; color: string }[] = [
    { key: 'usd', label: 'USD', icon: '🇺🇸', color: '#4CAF50' },
    { key: 'ars', label: 'ARS', icon: '🇦🇷', color: '#74C0FC' },
    { key: 'usdt', label: 'USDT', icon: '🔵', color: '#26A17B' },
];

type PortfolioCurrency = 'ars' | 'usd' | 'usdt' | 'btc';
const PORTFOLIO_CURRENCIES: { key: PortfolioCurrency; label: string; icon: string }[] = [
    { key: 'ars', label: 'ARS', icon: '🇦🇷' },
    { key: 'usd', label: 'USD', icon: '🇺🇸' },
    { key: 'usdt', label: 'USDT', icon: '🔵' },
    { key: 'btc', label: 'BTC', icon: '₿' },
];

function fmt(n: number, currency: PriceCurrency | PortfolioCurrency): string {
    if (currency === 'btc') return n.toFixed(8) + ' ₿';
    const locale = currency === 'ars' ? 'es-AR' : 'en-US';
    const sym = currency === 'ars' ? '$' : currency === 'usdt' ? 'U$D ' : '$';
    if (n >= 1_000_000) return sym + (n / 1_000_000).toFixed(2) + 'M';
    return sym + n.toLocaleString(locale, { maximumFractionDigits: 0 });
}

function fmtDate(d: string) {
    const [y, m, day] = d.split('-');
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${day} ${months[parseInt(m) - 1]} ${y}`;
}

/* ════════════════════════════════════════════════════════════
   MAIN SCREEN
════════════════════════════════════════════════════════════ */
export default function FinanzasScreen() {
    const [tab, setTab] = useState<Tab>('BTC');
    const now = new Date();
    const glowVariant = tab === 'BTC' ? 'btc' : tab === 'Ahorros' ? 'savings' : 'default';

    return (
        <GlowBackground variant={glowVariant}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.dateText}>
                            {now.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                        </Text>
                        <Text style={styles.title}>Finanzas</Text>
                    </View>
                </View>

                {/* Tab switcher */}
                <View style={styles.tabBar}>
                    {(['BTC', 'Ahorros', 'Resumen'] as Tab[]).map((t) => (
                        <TouchableOpacity
                            key={t}
                            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
                            onPress={() => setTab(t)}
                        >
                            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {tab === 'BTC' && <BTCSection />}
                {tab === 'Ahorros' && <AhorrosSection />}
                {tab === 'Resumen' && <ResumenSection />}
            </ScrollView>
        </GlowBackground>
    );
}

/* ════════════════════════════════════════════════════════════
   BTC SECTION  (real data)
════════════════════════════════════════════════════════════ */
function BTCSection() {
    const { price, loading: priceLoading, minutesSince, refresh: refreshPrice } = useBtcPrice();
    const { purchases, goal, stats, loading: dataLoading, refresh: refreshData, addPurchase, updatePurchase, deletePurchase, saveGoal } = useBtcData();
    const { hidden, toggle } = useHideBalance();

    const [priceCurrency, setPriceCurrency] = useState<PriceCurrency>('usd');
    const [portfolioCurrency, setPortfolioCurrency] = useState<'ars' | 'usd'>('ars');
    const [showAddPurchase, setShowAddPurchase] = useState(false);
    const [editingPurchase, setEditingPurchase] = useState<BtcPurchase | null>(null);
    const [showGoalModal, setShowGoalModal] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [newPurchaseId, setNewPurchaseId] = useState<string | null>(null);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([refreshPrice(), refreshData()]);
        setRefreshing(false);
    }, [refreshPrice, refreshData]);

    /* ── Portfolio calculation ─────────────────────────── */
    const currentBtcPriceUsd = price?.usd ?? 0;

    const portfolioArs = price ? stats.totalBtc * price.ars : null;
    const portfolioUsd = price ? stats.totalBtc * price.usd : null;
    const portfolioVal = portfolioCurrency === 'ars' ? portfolioArs : portfolioUsd;

    // P&L: current portfolio in USD vs invested in USD
    const investedUsd = stats.totalBtc > 0
        ? purchases.reduce((s, p) => s + (Number(p.btc_amount) * Number(p.price_usd)), 0)
        : 0;
    const currentUsd = stats.totalBtc * currentBtcPriceUsd;
    const plUsd = currentUsd - investedUsd;
    const plPct = investedUsd > 0 ? (plUsd / investedUsd) * 100 : 0;
    const plPositive = plUsd >= 0;

    /* ── Goal stats ────────────────────────────────────── */
    const targetPurchases = goal?.target_purchases ?? 12;
    const goalPct = targetPurchases > 0
        ? Math.min(100, (stats.purchaseCount / targetPurchases) * 100)
        : 0;
    const goalArs = goal?.target_ars ?? 0;
    const currentYear = new Date().getFullYear();

    return (
        <>
            {/* ── Portfolio card ─────────────────────────── */}
            <View style={styles.portfolioCard}>
                <View style={styles.cardGlow} />

                {/* Header: label + currency toggle + P&L */}
                <View style={styles.portfolioTopRow}>
                    <Text style={styles.portfolioLabel}>Portfolio Bitcoin</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {/* Toggle ARS / USD */}
                        <TouchableOpacity
                            style={styles.portfolioCurrencyToggle}
                            onPress={() => setPortfolioCurrency((c) => c === 'ars' ? 'usd' : 'ars')}
                        >
                            <Text style={styles.portfolioCurrencyToggleIcon}>
                                {portfolioCurrency === 'ars' ? '🇦🇷' : '🇺🇸'}
                            </Text>
                            <Text style={styles.portfolioCurrencyToggleLabel}>{portfolioCurrency.toUpperCase()}</Text>
                            <Ionicons name="swap-horizontal" size={12} color="#8E8E93" />
                        </TouchableOpacity>

                        {investedUsd > 0 && !priceLoading && (
                            <View style={[styles.changePill, { backgroundColor: plPositive ? '#4CAF5020' : '#FF525220' }]}>
                                <Ionicons
                                    name={plPositive ? 'trending-up' : 'trending-down'}
                                    size={12} color={plPositive ? '#4CAF50' : '#FF5252'}
                                />
                                <Text style={[styles.changePillText, { color: plPositive ? '#4CAF50' : '#FF5252' }]}>
                                    {' '}{plPositive ? '+' : ''}{plPct.toFixed(1)}%
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {(dataLoading || priceLoading)
                    ? <ActivityIndicator color="#F7931A" style={{ marginVertical: 20 }} />
                    : <>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <Text style={styles.portfolioAmount}>
                                {hidden ? '$ ****' : (portfolioVal !== null ? fmt(portfolioVal, portfolioCurrency) : '—')}
                            </Text>
                            <TouchableOpacity onPress={toggle} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <Ionicons name={hidden ? 'eye-off-outline' : 'eye-outline'} size={22} color="#7A7A9A" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.portfolioSubLabel}>valor actual de tus BTC</Text>
                    </>
                }

                <View style={styles.cardDivider} />

                <View style={styles.cardStats}>
                    <View style={styles.cardStat}>
                        <Text style={[styles.cardStatVal, { color: '#F7931A' }]} numberOfLines={1}>
                            {dataLoading ? '—' : (hidden ? '$ ****' : `$${stats.totalArs.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`)}
                        </Text>
                        <Text style={[styles.cardStatLabel, { color: '#F7931A' }]}>Invertido ARS</Text>
                    </View>
                    <View style={styles.cardStatDiv} />
                    <View style={styles.cardStat}>
                        <Text style={styles.cardStatVal}>
                            {dataLoading ? '—' : (hidden ? '****₿' : stats.totalBtc.toFixed(6) + '₿')}
                        </Text>
                        <Text style={styles.cardStatLabel}>BTC acumulado</Text>
                    </View>
                    <View style={styles.cardStatDiv} />
                    <View style={styles.cardStat}>
                        <Text style={styles.cardStatVal}>
                            {dataLoading ? '—' : `${stats.purchaseCount}/${targetPurchases}`}
                        </Text>
                        <Text style={styles.cardStatLabel}>Compras {currentYear}</Text>
                    </View>
                </View>
            </View>

            {/* ── Precio BTC ─────────────────────────────── */}
            <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>Precio BTC</Text>
                <TouchableOpacity onPress={refreshPrice} style={styles.refreshBtn}>
                    <Ionicons name="refresh-outline" size={14} color="#8E8E93" />
                    <Text style={styles.refreshText}>
                        {minutesSince !== null ? `hace ${minutesSince}m` : '—'}
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.chartCard}>
                {/* Currency selector */}
                <View style={styles.currencyTabRow}>
                    {CURRENCIES.map((c) => (
                        <TouchableOpacity
                            key={c.key}
                            style={[
                                styles.currencyTab,
                                priceCurrency === c.key && { backgroundColor: c.color + '22', borderColor: c.color },
                            ]}
                            onPress={() => setPriceCurrency(c.key)}
                        >
                            <Text style={styles.currencyTabIcon}>{c.icon}</Text>
                            <Text style={[
                                styles.currencyTabLabel,
                                priceCurrency === c.key && { color: c.color, fontWeight: '700' },
                            ]}>{c.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {priceLoading
                    ? <ActivityIndicator color="#F7931A" style={{ marginVertical: 20 }} />
                    : price
                        ? <>
                            <Text style={styles.bigPrice}>
                                {fmt(price[priceCurrency], priceCurrency)}
                            </Text>
                            <Text style={styles.bigPriceSub}>por 1 BTC</Text>
                        </>
                        : <Text style={styles.errorText}>Sin conexión — precio no disponible</Text>
                }
            </View>

            {/* ── Mis compras ────────────────────────────── */}
            <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>Mis compras</Text>
                <TouchableOpacity onPress={() => setShowAddPurchase(true)}>
                    <Text style={styles.actionLink}>+ Registrar</Text>
                </TouchableOpacity>
            </View>

            {dataLoading && (
                <ActivityIndicator color="#F7931A" style={{ marginBottom: 16 }} />
            )}

            {!dataLoading && purchases.length === 0 && (
                <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>Sin compras registradas</Text>
                    <TouchableOpacity onPress={() => setShowAddPurchase(true)}>
                        <Text style={styles.emptyLink}>Registrar primera compra →</Text>
                    </TouchableOpacity>
                </View>
            )}

            {purchases.map((p) => (
                <SwipeablePurchaseCard
                    key={p.id}
                    purchase={p}
                    currentPriceUsd={currentBtcPriceUsd}
                    isNew={p.id === newPurchaseId}
                    onEdit={() => {
                        setEditingPurchase(p);
                        setShowAddPurchase(true);
                    }}
                    onDelete={() => deletePurchase(p.id)}
                />
            ))}

            {/* ── Meta anual ─────────────────────────────── */}
            <View style={[styles.sectionRow, { marginTop: 8 }]}>
                <Text style={styles.sectionTitle}>Meta anual {currentYear}</Text>
                <TouchableOpacity onPress={() => setShowGoalModal(true)} style={styles.editGoalBtn}>
                    <Ionicons name="create-outline" size={14} color="#F7931A" />
                    <Text style={styles.editGoalText}>Configurar</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.goalCard}>
                {goal ? (
                    <>
                        <View style={styles.goalHeader}>
                            <Text style={styles.goalAmount}>
                                {goalArs > 0 ? `$${goalArs.toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS` : `${targetPurchases} compras`}
                            </Text>
                            <View style={styles.goalPctPill}>
                                <Text style={styles.goalPctText}>{goalPct.toFixed(1)}%</Text>
                            </View>
                        </View>
                        <Text style={styles.goalSub}>
                            {goalArs > 0
                                ? `Meta: $${(goalArs / 12).toLocaleString('es-AR', { maximumFractionDigits: 0 })} × 12 meses`
                                : `${targetPurchases} compras objetivo`}
                        </Text>

                        <View style={styles.goalBarBg}>
                            <View style={[styles.goalBarFill, { width: `${goalPct}%` as any }]} />
                        </View>

                        <View style={styles.goalStats}>
                            <View style={styles.goalStat}>
                                <Text style={styles.goalStatVal}>{stats.purchaseCount}</Text>
                                <Text style={styles.goalStatLabel}>Compras hechas</Text>
                            </View>
                            <View style={styles.cardStatDiv} />
                            <View style={styles.goalStat}>
                                <Text style={styles.goalStatVal}>{Math.max(0, targetPurchases - stats.purchaseCount)}</Text>
                                <Text style={styles.goalStatLabel}>Restantes</Text>
                            </View>
                            <View style={styles.cardStatDiv} />
                            <View style={styles.goalStat}>
                                <Text style={[styles.goalStatVal, { color: '#F7931A' }]}>{goalPct.toFixed(0)}%</Text>
                                <Text style={styles.goalStatLabel}>Completado</Text>
                            </View>
                        </View>
                    </>
                ) : (
                    <View style={{ alignItems: 'center', paddingVertical: 16, gap: 8 }}>
                        <Ionicons name="flag-outline" size={32} color="#8E8E93" />
                        <Text style={styles.emptyText}>Sin meta configurada</Text>
                        <TouchableOpacity onPress={() => setShowGoalModal(true)}>
                            <Text style={styles.emptyLink}>Configurar meta {currentYear} →</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            <View style={{ height: 24 }} />

            {/* ── Modals ─────────────────────────────────── */}
            <AddPurchaseModal
                visible={showAddPurchase}
                currentPriceUsd={price?.usd ?? null}
                currentPriceArs={price?.ars ?? null}
                editPurchase={editingPurchase}
                onClose={() => { setShowAddPurchase(false); setEditingPurchase(null); }}
                onSave={async (params) => {
                    if (editingPurchase) {
                        await updatePurchase(editingPurchase.id, {
                            ...params,
                            total_usd: params.total_usd ?? null,
                            total_ars: params.total_ars ?? null,
                            note: params.note ?? null,
                        });
                    } else {
                        const newId = await addPurchase(params);
                        setNewPurchaseId(newId);
                        setTimeout(() => setNewPurchaseId(null), 3500);
                    }
                    setShowAddPurchase(false);
                    setEditingPurchase(null);
                }}
            />

            <GoalModal
                visible={showGoalModal}
                goal={goal}
                onClose={() => setShowGoalModal(false)}
                onSave={async (params) => { await saveGoal(params); setShowGoalModal(false); }}
            />
        </>
    );
}



/* ════════════════════════════════════════════════════════════
   GOAL MODAL (inline, simpler than a full bottom sheet)
════════════════════════════════════════════════════════════ */
function GoalModal({
    visible, goal, onClose, onSave,
}: {
    visible: boolean;
    goal: any;
    onClose: () => void;
    onSave: (params: { target_ars?: number; target_purchases?: number }) => Promise<void>;
}) {
    const [targetArs, setTargetArs] = useState(String(goal?.target_ars ?? ''));
    const [targetPurchases, setTargetPurchases] = useState(String(goal?.target_purchases ?? '12'));
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        const ars = parseFloat(targetArs.replace(/\./g, '').replace(',', '.'));
        const purchases = parseInt(targetPurchases);
        if (isNaN(ars) && isNaN(purchases)) {
            Alert.alert('Ingresá al menos un valor'); return;
        }
        setLoading(true);
        try {
            await onSave({
                target_ars: isNaN(ars) ? undefined : ars,
                target_purchases: isNaN(purchases) ? undefined : purchases,
            });
        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} animationType="fade" transparent>
            <KeyboardAvoidingView
                style={styles.goalOverlay}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
                <View style={styles.goalModalBox}>
                    <Text style={styles.goalModalTitle}>🎯 Configurar meta anual</Text>

                    <Text style={styles.label}>META EN ARS (total año)</Text>
                    <View style={styles.inputWrap}>
                        <Text style={styles.inputPrefix}>🇦🇷</Text>
                        <TextInput
                            style={styles.input}
                            value={targetArs}
                            onChangeText={setTargetArs}
                            placeholder="3600000"
                            placeholderTextColor="#444"
                            keyboardType="number-pad"
                        />
                        <Text style={styles.inputSuffix}>ARS</Text>
                    </View>

                    <Text style={styles.label}>NÚMERO DE COMPRAS OBJETIVO</Text>
                    <View style={styles.inputWrap}>
                        <Ionicons name="repeat-outline" size={18} color="#8E8E93" />
                        <TextInput
                            style={styles.input}
                            value={targetPurchases}
                            onChangeText={setTargetPurchases}
                            placeholder="12"
                            placeholderTextColor="#444"
                            keyboardType="number-pad"
                        />
                        <Text style={styles.inputSuffix}>compras</Text>
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
                                : <Text style={styles.saveText}>Guardar</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

/* ════════════════════════════════════════════════════════════
   AHORROS — real data
════════════════════════════════════════════════════════════ */
const MONTH_NAMES_SHORT = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
const MONTH_NAMES_LONG = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function fmtArs(n: number): string {
    if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2).replace('.', ',') + 'M';
    if (n >= 1_000) return '$' + (n / 1_000).toFixed(0) + 'K';
    return '$' + n.toFixed(0);
}

function AhorrosSection() {
    const currentYear = new Date().getFullYear();
    const { entries, goal, stats, loading, refresh, addEntry, updateEntry, deleteEntry, saveGoal } = useSavings(currentYear);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingEntry, setEditingEntry] = useState<SavingsEntry | null>(null);
    const [showGoalModal, setShowGoalModal] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [goalInput, setGoalInput] = useState('');
    const [goalLoading, setGoalLoading] = useState(false);
    const [newEntryId, setNewEntryId] = useState<string | null>(null);
    const { hidden, toggle } = useHideBalance();

    const onRefresh = useCallback(async () => {
        setRefreshing(true); await refresh(); setRefreshing(false);
    }, [refresh]);

    // Build full 12-month map
    const currentMonth = new Date().getMonth() + 1;
    const monthMap = new Map(entries.map((e) => [e.month, e]));
    const monthlyTarget = stats.monthlyTarget;
    const annualTarget = monthlyTarget * 12;

    // Build chart data arrays (12 months)
    let runningReal = 0;
    const months12 = Array.from({ length: 12 }, (_, i) => i + 1);
    const chartData = months12.map((m) => {
        if (m <= currentMonth) runningReal += Number(monthMap.get(m)?.amount_ars ?? 0);
        const real = m <= currentMonth ? runningReal : null;
        const proj = monthlyTarget > 0 ? monthlyTarget * m : null;
        return { month: m, real: real ?? undefined, proj: proj ?? undefined };
    });

    const pctProgress = annualTarget > 0 ? Math.min(100, (stats.totalArs / annualTarget) * 100) : 0;
    const existingMonths = entries.map((e) => e.month);

    const handleSaveGoal = async () => {
        const val = parseFloat(goalInput.replace(/\./g, '').replace(',', '.'));
        if (isNaN(val) || val <= 0) { Alert.alert('Error', 'Ingresá un monto válido'); return; }
        setGoalLoading(true);
        try { await saveGoal(val); setGoalInput(''); setShowGoalModal(false); }
        catch (e: any) { Alert.alert('Error', e.message); }
        finally { setGoalLoading(false); }
    };

    return (
        <>

            {/* ── Summary card ─────────────────────────── */}
            <View style={styles.savingsSummaryCard}>
                <View style={[styles.cardGlow, { backgroundColor: '#2AC9A011' }]} />
                <View style={styles.portfolioTopRow}>
                    <Text style={styles.portfolioLabel}>Ahorros acumulados {currentYear}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {stats.compliance >= 100 && !loading && (
                            <View style={[styles.changePill, { backgroundColor: '#4CAF5020' }]}>
                                <Ionicons name="trending-up" size={12} color="#4CAF50" />
                                <Text style={[styles.changePillText, { color: '#4CAF50' }]}> En meta</Text>
                            </View>
                        )}
                    </View>
                </View>

                {loading
                    ? <ActivityIndicator color="#2AC9A0" style={{ marginVertical: 20 }} />
                    : <>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <Text style={styles.savingsAmount}>
                                {hidden ? '$ ****' : `$${stats.totalArs.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`}
                            </Text>
                            <TouchableOpacity onPress={toggle} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <Ionicons name={hidden ? 'eye-off-outline' : 'eye-outline'} size={22} color="#7A7A9A" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.portfolioSubLabel}>ARS · {currentYear}</Text>
                    </>
                }

                <View style={styles.cardDivider} />
                <View style={styles.cardStats}>
                    <View style={styles.cardStat}>
                        <Text style={[styles.cardStatVal, { color: '#2AC9A0' }]}>
                            {monthlyTarget > 0 ? `$${(monthlyTarget / 1000).toFixed(0)}K` : '—'}
                        </Text>
                        <Text style={styles.cardStatLabel}>Meta mensual</Text>
                    </View>
                    <View style={styles.cardStatDiv} />
                    <View style={styles.cardStat}>
                        <Text style={styles.cardStatVal}>{stats.monthsOk}/{currentMonth}</Text>
                        <Text style={styles.cardStatLabel}>Meses OK</Text>
                    </View>
                    <View style={styles.cardStatDiv} />
                    <View style={styles.cardStat}>
                        <Text style={[styles.cardStatVal, { color: stats.compliance >= 100 ? '#4CAF50' : '#FFF' }]}>
                            {stats.compliance}%
                        </Text>
                        <Text style={styles.cardStatLabel}>Cumplimiento</Text>
                    </View>
                </View>
            </View>

            {/* ── Proyección anual ────────────────────────── */}
            <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>Proyección anual</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {annualTarget > 0 && (
                        <Text style={styles.sectionSub}>
                            Meta: ${(annualTarget / 1_000_000).toFixed(1).replace('.', ',')}M
                        </Text>
                    )}
                    <TouchableOpacity
                        style={styles.editGoalBtn}
                        onPress={() => { setGoalInput(String(monthlyTarget || '')); setShowGoalModal(true); }}
                    >
                        <Ionicons name="create-outline" size={14} color="#2AC9A0" />
                        <Text style={[styles.editGoalText, { color: '#2AC9A0' }]}>Meta</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.chartCard}>
                {/* Header row: subtitle + % */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={styles.chartSubtitle}>Acumulado vs proyectado</Text>
                    {annualTarget > 0 && (
                        <Text style={[styles.chartBadge, { color: pctProgress >= 100 ? '#4CAF50' : '#2AC9A0' }]}>
                            {pctProgress.toFixed(1)}%
                        </Text>
                    )}
                </View>

                {/* Gifted LineChart */}
                {(() => {
                    const realData = chartData
                        .filter(d => d.real !== undefined)
                        .map(d => ({
                            value: d.real!,
                            label: MONTH_NAMES_SHORT[d.month - 1][0],
                            labelTextStyle: { color: d.month === currentMonth ? '#2AC9A0' : '#8E8E93', fontSize: 9 },
                        }));
                    const projData = annualTarget > 0
                        ? chartData.map(d => ({
                            value: d.proj!,
                            label: '',
                        }))
                        : undefined;
                    const chartW = width - 36 - 32 - 40;
                    return (
                        <LineChart
                            data={realData}
                            data2={projData}
                            width={chartW}
                            height={140}
                            spacing={chartW / Math.max(realData.length - 1, 1)}
                            initialSpacing={0}
                            endSpacing={0}
                            color1="#2AC9A0"
                            color2="rgba(38,217,150,0.3)"
                            thickness={3}
                            thickness2={2}
                            hideDataPoints={false}
                            dataPointsColor1="#2AC9A0"
                            dataPointsRadius={4}
                            hideDataPoints2
                            dashWidth={6}
                            dashGap={4}
                            curved
                            curvature={0.2}
                            areaChart
                            startFillColor="rgba(38,217,150,0.15)"
                            endFillColor="rgba(38,217,150,0.01)"
                            startOpacity={0.3}
                            endOpacity={0}
                            yAxisColor="transparent"
                            xAxisColor="rgba(60,60,67,0.12)"
                            yAxisTextStyle={{ color: '#8E8E93', fontSize: 9 }}
                            xAxisLabelTextStyle={{ color: '#8E8E93', fontSize: 9 }}
                            noOfSections={4}
                            maxValue={Math.max(annualTarget, realData.reduce((a, d) => Math.max(a, d.value), 0) * 1.15, 1)}
                            formatYLabel={(v) => {
                                const n = Number(v);
                                if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
                                if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
                                return `${n}`;
                            }}
                            rulesColor="rgba(60,60,67,0.08)"
                            rulesType="dashed"
                            showVerticalLines={false}
                        />
                    );
                })()}

                {/* Legend */}
                <View style={styles.chartLegend}>
                    <View style={styles.chartLegendItem}>
                        <View style={[styles.chartLegendLine, { backgroundColor: '#2AC9A0' }]} />
                        <Text style={styles.chartLegendLabel}>Real</Text>
                    </View>
                    {annualTarget > 0 && (
                        <View style={styles.chartLegendItem}>
                            <View style={[styles.chartLegendLine, { backgroundColor: 'rgba(38,217,150,0.35)' }]} />
                            <Text style={styles.chartLegendLabel}>Proyectado</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* ── Historial ──────────────────────────────── */}
            <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>Historial</Text>
                <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addEntryBtn}>
                    <Text style={styles.addEntryText}>+ Agregar</Text>
                </TouchableOpacity>
            </View>

            {!loading && entries.length === 0 && (
                <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>Sin ahorros registrados</Text>
                    <TouchableOpacity onPress={() => setShowAddModal(true)}>
                        <Text style={styles.emptyLink}>Registrar primer ahorro →</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Historical entries: all months with entries (descending) */}
            {[...entries].reverse().map((entry) => (
                <SwipeableSavingsCard
                    key={entry.id}
                    entry={entry}
                    monthlyTarget={monthlyTarget}
                    isNew={entry.id === newEntryId}
                    onEdit={() => {
                        setEditingEntry(entry);
                        setShowAddModal(true);
                    }}
                    onDelete={() => deleteEntry(entry.id)}
                />
            ))}

            {/* ── Año completo (grid 3 columnas × 4 filas) ───── */}
            <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Año completo</Text>
            <View style={styles.yearGrid}>
                {months12.map((m) => {
                    const entry = monthMap.get(m);
                    const ok = entry && monthlyTarget > 0 && Number(entry.amount_ars) >= monthlyTarget;
                    const future = m > currentMonth;
                    return (
                        <View key={m} style={[styles.yearCell, future && { opacity: 0.4 }]}>
                            <Text style={[styles.yearCellMonth, ok && { color: '#2AC9A0' }]}>
                                {MONTH_NAMES_SHORT[m - 1]}
                            </Text>
                            {ok
                                ? <Ionicons name="checkmark-circle" size={22} color="#2AC9A0" />
                                : <Text style={styles.yearCellDash}>—</Text>
                            }
                            <Text style={[styles.yearCellAmt, ok && { color: '#2AC9A0' }]}>
                                {entry ? fmtArs(Number(entry.amount_ars)) : '$0'}
                            </Text>
                        </View>
                    );
                })}
            </View>

            <View style={{ height: 24 }} />

            {/* ── Modals ────────────────────────────────── */}
            <AddSavingsModal
                visible={showAddModal}
                currentYear={currentYear}
                existingMonths={existingMonths}
                editEntry={editingEntry}
                onClose={() => { setShowAddModal(false); setEditingEntry(null); }}
                onSave={async (params) => {
                    if (editingEntry) {
                        await updateEntry(editingEntry.id, params);
                    } else {
                        const newId = await addEntry(params);
                        setNewEntryId(newId);
                        setTimeout(() => setNewEntryId(null), 3500);
                    }
                    setShowAddModal(false);
                    setEditingEntry(null);
                }}
            />

            {/* Goal modal */}
            <Modal visible={showGoalModal} animationType="fade" transparent>
                <KeyboardAvoidingView style={styles.goalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setShowGoalModal(false)} />
                    <View style={styles.goalModalBox}>
                        <Text style={styles.goalModalTitle}>🎯 Meta mensual de ahorro</Text>
                        <Text style={styles.label}>MONTO MENSUAL OBJETIVO (ARS)</Text>
                        <View style={styles.inputWrap}>
                            <Text style={styles.inputPrefix}>🇦🇷</Text>
                            <TextInput
                                style={styles.input}
                                value={goalInput}
                                onChangeText={setGoalInput}
                                placeholder="500000"
                                placeholderTextColor="#444"
                                keyboardType="number-pad"
                            />
                            <Text style={[styles.inputSuffix, { color: '#2AC9A0' }]}>ARS/mes</Text>
                        </View>
                        {goalInput !== '' && (
                            <Text style={{ color: '#8E8E93', fontSize: 12, marginBottom: 12 }}>
                                Meta anual: ${(parseFloat(goalInput.replace(/\./g, '').replace(',', '.')) * 12 || 0)
                                    .toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS
                            </Text>
                        )}
                        <View style={styles.btnRow}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowGoalModal(false)}>
                                <Text style={styles.cancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.saveBtn, { backgroundColor: '#2AC9A0', opacity: goalLoading ? 0.6 : 1 }]}
                                onPress={handleSaveGoal} disabled={goalLoading}
                            >
                                {goalLoading
                                    ? <ActivityIndicator color="#FFF" size="small" />
                                    : <Text style={styles.saveText}>Guardar</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </>
    );
}

/* ════════════════════════════════════════════════════════════
   RESUMEN — real data
════════════════════════════════════════════════════════════ */
function ResumenSection() {
    const currentYear = new Date().getFullYear();
    const { price, loading: priceLoading } = useBtcPrice();
    const { stats: btcStats } = useBtcData();
    const { stats: savStats, loading: savLoading } = useSavings(currentYear);

    const btcValueArs = price ? btcStats.totalBtc * price.ars : null;
    const btcValueUsd = price ? btcStats.totalBtc * price.usd : null;
    const savTotalArs = savStats.totalArs;

    const totalArs = (btcValueArs ?? 0) + savTotalArs;
    const btcPct = totalArs > 0 ? (btcValueArs ?? 0) / totalArs * 100 : 0;
    const savPct = totalArs > 0 ? savTotalArs / totalArs * 100 : 0;

    const loading = priceLoading || savLoading;

    return (
        <>
            {/* ── Patrimonio total ───────────────────────── */}
            <View style={styles.portfolioCard}>
                <View style={[styles.cardGlow, { backgroundColor: '#2ac9a011' }]} />
                <Text style={styles.portfolioLabel}>Patrimonio total {currentYear}</Text>
                {loading
                    ? <ActivityIndicator color="#2AC9A0" style={{ marginVertical: 20 }} />
                    : <>
                        <Text style={[styles.portfolioAmount, { color: '#ffffffff' }]}>
                            ${totalArs.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                        </Text>
                        <Text style={styles.portfolioSubLabel}>ARS combinado</Text>

                        {/* Distribution bar */}
                        {totalArs > 0 && (
                            <View style={{ marginTop: 12, marginBottom: 4 }}>
                                <View style={styles.distBar}>
                                    <View style={[styles.distBarBtc, { flex: btcPct }]} />
                                    <View style={[styles.distBarSav, { flex: savPct }]} />
                                </View>
                                <View style={styles.distLegend}>
                                    <View style={styles.distLegendItem}>
                                        <View style={[styles.distDot, { backgroundColor: '#F7931A' }]} />
                                        <Text style={styles.distLegendText}>BTC {btcPct.toFixed(0)}%</Text>
                                    </View>
                                    <View style={styles.distLegendItem}>
                                        <View style={[styles.distDot, { backgroundColor: '#2AC9A0' }]} />
                                        <Text style={styles.distLegendText}>Ahorros {savPct.toFixed(0)}%</Text>
                                    </View>
                                </View>
                            </View>
                        )}
                    </>
                }
            </View>

            {/* ── Breakdown cards ────────────────────────── */}
            <View style={styles.resumenCardsRow}>
                {/* BTC card */}
                <View style={styles.resumenMiniCard}>
                    <View style={[styles.resumenMiniIcon, { backgroundColor: '#F7931A20' }]}>
                        <Ionicons name="logo-bitcoin" size={22} color="#F7931A" />
                    </View>
                    <Text style={styles.resumenMiniLabel}>Bitcoin</Text>
                    {loading
                        ? <ActivityIndicator color="#F7931A" size="small" />
                        : <>
                            <Text style={[styles.resumenMiniVal, { color: '#F7931A' }]}>
                                {btcValueArs !== null ? `$${(btcValueArs / 1_000_000).toFixed(2)}M` : '—'} ARS
                            </Text>
                            <Text style={styles.resumenMiniSub}>
                                {btcValueUsd !== null ? `$${btcValueUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })} USD` : ''}
                            </Text>
                            <Text style={styles.resumenMiniSub}>{btcStats.totalBtc.toFixed(6)} ₿</Text>
                            <Text style={styles.resumenMiniSub2}>{btcStats.purchaseCount} compras</Text>
                        </>
                    }
                </View>

                {/* Savings card */}
                <View style={styles.resumenMiniCard}>
                    <View style={[styles.resumenMiniIcon, { backgroundColor: '#2AC9A020' }]}>
                        <Ionicons name="wallet-outline" size={22} color="#2AC9A0" />
                    </View>
                    <Text style={styles.resumenMiniLabel}>Ahorros</Text>
                    {savLoading
                        ? <ActivityIndicator color="#2AC9A0" size="small" />
                        : <>
                            <Text style={[styles.resumenMiniVal, { color: '#2AC9A0' }]}>
                                ${savTotalArs.toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS
                            </Text>
                            <Text style={styles.resumenMiniSub}>{savStats.monthsOk} meses OK</Text>
                            <Text style={styles.resumenMiniSub2}>{savStats.compliance}% cumplimiento</Text>
                        </>
                    }
                </View>
            </View>

            <View style={{ height: 24 }} />
        </>
    );
}

/* ════════════════════════════════════════════════════════════
   STYLES
════════════════════════════════════════════════════════════ */
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A1A' },
    scroll: { paddingHorizontal: 18, paddingTop: 56, paddingBottom: 30 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },

    dateText: { fontSize: 13, color: '#7A7A9A', marginBottom: 4, textTransform: 'capitalize' },
    title: { fontSize: 30, fontWeight: '800', color: '#FFF', letterSpacing: -0.5, marginBottom: 18 },

    tabBar: { flexDirection: 'row', backgroundColor: '#14142A', borderRadius: 14, padding: 4, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center' },
    tabBtnActive: { backgroundColor: '#1E1E38' },
    tabText: { fontSize: 14, fontWeight: '600', color: '#7A7A9A' },
    tabTextActive: { color: '#FFF' },

    /* Portfolio */
    portfolioCard: { backgroundColor: '#12122A', borderRadius: 22, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' },
    cardGlow: { position: 'absolute', right: -30, top: -30, width: 160, height: 160, borderRadius: 80, backgroundColor: '#F7931A0A' },
    portfolioTopRow: { marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    portfolioLabel: { fontSize: 13, color: '#7A7A9A' },
    portfolioAmount: { fontSize: 36, fontWeight: '800', color: '#FFF', letterSpacing: -1, marginBottom: 8 },
    portfolioSubRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    portfolioCurrency: { fontSize: 13, color: '#7A7A9A' },
    portfolioValueRows: { gap: 8, marginBottom: 8 },
    portfolioValueRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    portfolioFlag: { fontSize: 18, width: 28 },
    portfolioValueLabel: { fontSize: 12, fontWeight: '700', color: '#7A7A9A', width: 44 },
    portfolioValueNum: { fontSize: 22, fontWeight: '800', color: '#FFF', flex: 1 },
    portfolioSubLabel: { fontSize: 12, color: '#7A7A9A', marginTop: 2, marginBottom: 12 },
    portfolioCurrencyToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: '#2A2A3E', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    portfolioCurrencyToggleIcon: { fontSize: 14 },
    portfolioCurrencyToggleLabel: { fontSize: 12, fontWeight: '700', color: '#AAAACC' },
    changePill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
    changePillText: { fontSize: 12, fontWeight: '700' },
    cardDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: 16 },
    cardStats: { flexDirection: 'row', alignItems: 'center' },
    cardStat: { flex: 1, alignItems: 'center' },
    cardStatVal: { fontSize: 15, fontWeight: '800', color: '#FFF', marginBottom: 3 },
    cardStatLabel: { fontSize: 10, color: '#7A7A9A', textAlign: 'center' },
    cardStatDiv: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.08)' },

    /* Mini tab (portfolio currency) */
    miniTabRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
    miniTab: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: '#2A2A3E', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    miniTabActive: { backgroundColor: '#F7931A22', borderColor: '#F7931A66' },
    miniTabText: { fontSize: 11, fontWeight: '600', color: '#AAAACC' },

    /* Section row */
    sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },
    actionLink: { fontSize: 14, fontWeight: '600', color: '#4CAF50' },
    refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    refreshText: { fontSize: 12, color: '#7A7A9A' },

    /* Precio BTC chart card */
    chartCard: { backgroundColor: '#12122A', borderRadius: 20, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    currencyTabRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    currencyTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: '#14142A' },
    currencyTabIcon: { fontSize: 16 },
    currencyTabLabel: { fontSize: 12, fontWeight: '600', color: '#7A7A9A' },
    bigPrice: { fontSize: 38, fontWeight: '800', color: '#FFF', letterSpacing: -1, textAlign: 'center', marginBottom: 4 },
    bigPriceSub: { fontSize: 13, color: '#7A7A9A', textAlign: 'center' },
    errorText: { fontSize: 13, color: '#FF5252', textAlign: 'center', paddingVertical: 12 },

    /* Purchases */
    purchaseCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#12122A', borderRadius: 18, padding: 14, marginBottom: 10, gap: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    purchaseIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#2A2A3E', justifyContent: 'center', alignItems: 'center' },
    purchaseInfo: { flex: 1, gap: 3 },
    purchaseMonth: { fontSize: 14, fontWeight: '700', color: '#FFF' },
    purchaseSub: { fontSize: 11, color: '#7A7A9A' },
    purchaseSub2: { fontSize: 11, color: '#555570', fontWeight: '600' },
    purchaseRight: { alignItems: 'flex-end', gap: 2 },
    purchasePl: { fontSize: 14, fontWeight: '800' },
    purchasePlAbs: { fontSize: 11, color: '#7A7A9A' },

    /* Goal */
    editGoalBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    editGoalText: { fontSize: 13, fontWeight: '600', color: '#F7931A' },
    goalCard: { backgroundColor: '#12122A', borderRadius: 20, padding: 18, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    goalAmount: { fontSize: 18, fontWeight: '800', color: '#FFF' },
    goalPctPill: { backgroundColor: '#F7931A22', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: '#F7931A44' },
    goalPctText: { fontSize: 13, fontWeight: '700', color: '#F7931A' },
    goalSub: { fontSize: 12, color: '#7A7A9A', marginBottom: 14 },
    goalBarBg: { height: 6, backgroundColor: '#2A2A3E', borderRadius: 3, overflow: 'hidden', marginBottom: 16 },
    goalBarFill: { height: '100%', backgroundColor: '#F7931A', borderRadius: 3 },
    goalStats: { flexDirection: 'row', alignItems: 'center' },
    goalStat: { flex: 1, alignItems: 'center' },
    goalStatVal: { fontSize: 22, fontWeight: '800', color: '#FFF', marginBottom: 3 },
    goalStatLabel: { fontSize: 10, color: '#7A7A9A', textAlign: 'center' },

    /* Goal modal */
    goalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)' },
    goalModalBox: { backgroundColor: '#12122A', borderRadius: 24, padding: 24, width: width - 48, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    goalModalTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', marginBottom: 20 },

    /* Shared form */
    label: { fontSize: 11, fontWeight: '700', color: '#7A7A9A', letterSpacing: 1, marginBottom: 8 },
    inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#14142A', borderRadius: 14, paddingHorizontal: 14, height: 52, gap: 10, marginBottom: 16, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.06)' },
    input: { flex: 1, color: '#FFF', fontSize: 15 },
    inputPrefix: { fontSize: 16, color: '#7A7A9A', fontWeight: '700' },
    inputSuffix: { fontSize: 12, color: '#7A7A9A', fontWeight: '600' },
    btnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
    cancelBtn: { flex: 1, height: 52, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
    cancelText: { color: '#7A7A9A', fontWeight: '600', fontSize: 15 },
    saveBtn: { flex: 2, height: 52, borderRadius: 14, backgroundColor: '#F7931A', justifyContent: 'center', alignItems: 'center' },
    saveText: { color: '#FFF', fontWeight: '800', fontSize: 15 },

    /* Empty states */
    emptyCard: { backgroundColor: '#12122A', borderRadius: 16, padding: 24, marginBottom: 16, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    emptyText: { color: '#7A7A9A', fontSize: 14 },
    emptyLink: { color: '#F7931A', fontWeight: '600', fontSize: 13 },

    /* Resumen — old mockup kept for compatibility */
    resumenCard: { backgroundColor: '#12122A', borderRadius: 20, overflow: 'hidden', marginTop: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    resumenTitle: { fontSize: 15, fontWeight: '700', color: '#FFF', padding: 16, paddingBottom: 8 },
    resumenRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
    resumenRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
    resumenDot: { width: 8, height: 8, borderRadius: 4 },
    resumenLabel: { fontSize: 14, color: '#AAAACC' },
    resumenVal: { fontSize: 14, fontWeight: '700' },

    /* Resumen — new real data */
    resumenCardsRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
    resumenMiniCard: { flex: 1, backgroundColor: '#12122A', borderRadius: 18, padding: 16, gap: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    resumenMiniIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
    resumenMiniLabel: { fontSize: 12, fontWeight: '700', color: '#7A7A9A', letterSpacing: 0.5 },
    resumenMiniVal: { fontSize: 16, fontWeight: '800', color: '#FFF', marginTop: 4 },
    resumenMiniSub: { fontSize: 12, color: '#7A7A9A' },
    resumenMiniSub2: { fontSize: 11, color: '#7A7A9A' },

    /* Distribution bar */
    distBar: { flexDirection: 'row', height: 6, borderRadius: 3, overflow: 'hidden', backgroundColor: '#2A2A3E' },
    distBarBtc: { backgroundColor: '#F7931A', borderRadius: 3 },
    distBarSav: { backgroundColor: '#2AC9A0', borderRadius: 3 },
    distLegend: { flexDirection: 'row', gap: 16, marginTop: 8 },
    distLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    distDot: { width: 8, height: 8, borderRadius: 4 },
    distLegendText: { fontSize: 12, color: '#7A7A9A', fontWeight: '600' },

    /* Ahorros summary card */
    savingsSummaryCard: { backgroundColor: '#12122A', borderRadius: 22, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' },
    savingsAmount: { fontSize: 34, fontWeight: '800', color: '#2AC9A0', letterSpacing: -1, marginBottom: 4 },
    sectionSub: { fontSize: 13, color: '#7A7A9A' },
    addEntryBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: '#2AC9A018', borderWidth: 1, borderColor: '#2AC9A040' },
    addEntryText: { color: '#2AC9A0', fontWeight: '700', fontSize: 14 },

    /* Chart */
    chartSubtitle: { fontSize: 13, color: '#7A7A9A', fontWeight: '600' },
    chartBadge: { fontSize: 15, fontWeight: '800' },
    chartSegment: { position: 'absolute', height: 2, borderRadius: 1, transformOrigin: 'left center' },
    chartDot: { position: 'absolute', width: 10, height: 10, borderRadius: 5 },
    chartYLabel: { position: 'absolute', right: 0, fontSize: 10, color: '#7A7A9A' },
    chartXRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
    chartXLabel: { fontSize: 10, color: '#7A7A9A', fontWeight: '600' },
    chartLegend: { flexDirection: 'row', gap: 16, marginTop: 8 },
    chartLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    chartLegendLine: { width: 16, height: 2, borderRadius: 1 },
    chartLegendLabel: { fontSize: 11, color: '#7A7A9A' },

    /* Savings history entry */
    savingsEntryCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#12122A', borderRadius: 16, padding: 14, marginBottom: 10, gap: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    savingsEntryCheck: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    savingsEntryInfo: { flex: 1 },
    savingsEntryMonth: { fontSize: 15, fontWeight: '700', color: '#FFF', marginBottom: 2 },
    savingsEntrySub: { fontSize: 11, color: '#7A7A9A', marginBottom: 6 },
    savingsEntryBar: { height: 3, backgroundColor: '#2A2A3E', borderRadius: 2, overflow: 'hidden' },
    savingsEntryBarFill: { height: '100%', borderRadius: 2 },
    savingsEntryRight: { alignItems: 'flex-end', gap: 2 },
    savingsEntryAmount: { fontSize: 15, fontWeight: '800', color: '#FFF' },
    savingsEntryPct: { fontSize: 12, fontWeight: '700' },

    /* Year grid */
    yearGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    yearCell: { width: '30%', backgroundColor: '#12122A', borderRadius: 14, padding: 12, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    yearCellMonth: { fontSize: 11, fontWeight: '700', color: '#7A7A9A', letterSpacing: 1 },
    yearCellDash: { fontSize: 20, color: '#2A2A3E' },
    yearCellAmt: { fontSize: 11, fontWeight: '700', color: '#7A7A9A' },
});

