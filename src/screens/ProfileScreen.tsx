import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
} from 'react-native';

interface Props {
    onBack: () => void;
    onLogout: () => void;
}

export default function ProfileScreen({ onBack, onLogout }: Props) {
    const [notifs, setNotifs] = useState(true);
    const [darkMode, setDarkMode] = useState(true);

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                {/* Back */}
                <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
                    <Text style={styles.backArrow}>←</Text>
                    <Text style={styles.backText}>Volver</Text>
                </TouchableOpacity>

                {/* Hero */}
                <View style={styles.hero}>
                    <View style={styles.heroBg} />
                    <View style={styles.avatarWrap}>
                        <View style={styles.avatarRing}>
                            <View style={styles.avatarInner}>
                                <Text style={styles.avatarEmoji}>😎</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.editBadge} activeOpacity={0.7}>
                            <Text style={styles.editBadgeIcon}>✏️</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.heroName}>X</Text>
                    <Text style={styles.heroHandle}>@x · miembro desde Enero 2026</Text>
                    <View style={styles.levelBadge}>
                        <Text style={styles.levelBadgeText}>⚡ Nivel 3 — Ejecutor</Text>
                    </View>
                </View>

                {/* Stats grid */}
                <View style={styles.statsCard}>
                    {stats.map((s, i) => (
                        <View key={i} style={[styles.statCell, i < stats.length - 1 && styles.statCellBorder]}>
                            <Text style={[styles.statVal, { color: s.color }]}>{s.icon}{s.val}</Text>
                            <Text style={styles.statLabel}>{s.label}</Text>
                        </View>
                    ))}
                </View>

                {/* CUENTA */}
                <Text style={styles.sectionTitle}>CUENTA</Text>
                <View style={styles.group}>
                    {cuentaItems.map((item, i) => (
                        <TouchableOpacity
                            key={i}
                            style={[styles.row, i < cuentaItems.length - 1 && styles.rowBorder]}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.rowIcon, { backgroundColor: item.iconBg }]}>
                                <Text style={styles.rowIconText}>{item.icon}</Text>
                            </View>
                            <View style={styles.rowInfo}>
                                <Text style={styles.rowTitle}>{item.title}</Text>
                                <Text style={styles.rowSub}>{item.sub}</Text>
                            </View>
                            <Text style={styles.rowChevron}>›</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* PREFERENCIAS */}
                <Text style={styles.sectionTitle}>PREFERENCIAS</Text>
                <View style={styles.group}>
                    {/* Notificaciones */}
                    <View style={[styles.row, styles.rowBorder]}>
                        <View style={[styles.rowIcon, { backgroundColor: 'rgba(255,59,48,0.1)' }]}>
                            <Text style={styles.rowIconText}>🔔</Text>
                        </View>
                        <View style={styles.rowInfo}>
                            <Text style={styles.rowTitle}>Notificaciones</Text>
                            <Text style={styles.rowSub}>Hábitos, recordatorios, BTC</Text>
                        </View>
                        <Switch
                            value={notifs}
                            onValueChange={setNotifs}
                            trackColor={{ false: '#D1D1D6', true: '#2AC9A0' }}
                            thumbColor="#FFF"
                        />
                    </View>

                    {/* Modo oscuro */}
                    <View style={[styles.row, styles.rowBorder]}>
                        <View style={[styles.rowIcon, { backgroundColor: 'rgba(42,201,160,0.1)' }]}>
                            <Text style={styles.rowIconText}>🌙</Text>
                        </View>
                        <View style={styles.rowInfo}>
                            <Text style={styles.rowTitle}>Modo oscuro</Text>
                            <Text style={styles.rowSub}>Siempre activo</Text>
                        </View>
                        <Switch
                            value={darkMode}
                            onValueChange={setDarkMode}
                            trackColor={{ false: '#D1D1D6', true: '#2AC9A0' }}
                            thumbColor="#FFF"
                        />
                    </View>

                    {/* Moneda */}
                    <TouchableOpacity style={[styles.row, styles.rowBorder]} activeOpacity={0.7}>
                        <View style={[styles.rowIcon, { backgroundColor: 'rgba(48,209,88,0.1)' }]}>
                            <Text style={styles.rowIconText}>🌎</Text>
                        </View>
                        <View style={styles.rowInfo}>
                            <Text style={styles.rowTitle}>Moneda</Text>
                            <Text style={styles.rowSub}>ARS · Peso Argentino</Text>
                        </View>
                        <Text style={styles.rowValue}>ARS ›</Text>
                    </TouchableOpacity>

                    {/* Inicio semana */}
                    <TouchableOpacity style={styles.row} activeOpacity={0.7}>
                        <View style={[styles.rowIcon, { backgroundColor: 'rgba(142,142,147,0.1)' }]}>
                            <Text style={styles.rowIconText}>📅</Text>
                        </View>
                        <View style={styles.rowInfo}>
                            <Text style={styles.rowTitle}>Inicio de semana</Text>
                            <Text style={styles.rowSub}>Lunes</Text>
                        </View>
                        <Text style={styles.rowValue}>Lun ›</Text>
                    </TouchableOpacity>
                </View>

                {/* APP */}
                <Text style={styles.sectionTitle}>APP</Text>
                <View style={styles.group}>
                    {/* Sync */}
                    <TouchableOpacity style={[styles.row, styles.rowBorder]} activeOpacity={0.7}>
                        <View style={[styles.rowIcon, { backgroundColor: 'rgba(0,122,255,0.1)' }]}>
                            <Text style={styles.rowIconText}>☁️</Text>
                        </View>
                        <View style={styles.rowInfo}>
                            <Text style={styles.rowTitle}>Sincronización</Text>
                            <Text style={styles.rowSub}>Supabase · última sync: ahora</Text>
                        </View>
                        <Text style={styles.rowActive}>● Activo</Text>
                    </TouchableOpacity>

                    {/* Export */}
                    <TouchableOpacity style={[styles.row, styles.rowBorder]} activeOpacity={0.7}>
                        <View style={[styles.rowIcon, { backgroundColor: 'rgba(42,201,160,0.1)' }]}>
                            <Text style={styles.rowIconText}>📤</Text>
                        </View>
                        <View style={styles.rowInfo}>
                            <Text style={styles.rowTitle}>Exportar datos</Text>
                            <Text style={styles.rowSub}>CSV · JSON · PDF</Text>
                        </View>
                        <Text style={styles.rowChevron}>›</Text>
                    </TouchableOpacity>

                    {/* Rate */}
                    <TouchableOpacity style={styles.row} activeOpacity={0.7}>
                        <View style={[styles.rowIcon, { backgroundColor: 'rgba(255,149,0,0.1)' }]}>
                            <Text style={styles.rowIconText}>⭐</Text>
                        </View>
                        <View style={styles.rowInfo}>
                            <Text style={styles.rowTitle}>Calificar BIBO</Text>
                            <Text style={styles.rowSub}>¿Te está ayudando?</Text>
                        </View>
                        <Text style={styles.rowChevron}>›</Text>
                    </TouchableOpacity>
                </View>

                {/* SESIÓN */}
                <Text style={styles.sectionTitle}>SESIÓN</Text>
                <View style={styles.group}>
                    <TouchableOpacity
                        style={[styles.row, styles.rowBorder]}
                        activeOpacity={0.7}
                        onPress={onLogout}
                    >
                        <View style={[styles.rowIcon, { backgroundColor: 'rgba(175,82,222,0.1)' }]}>
                            <Text style={styles.rowIconText}>🚪</Text>
                        </View>
                        <View style={styles.rowInfo}>
                            <Text style={styles.rowTitle}>Cerrar sesión</Text>
                        </View>
                        <Text style={styles.rowChevron}>›</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.row} activeOpacity={0.7}>
                        <View style={[styles.rowIcon, { backgroundColor: 'rgba(255,59,48,0.1)' }]}>
                            <Text style={styles.rowIconText}>🗑️</Text>
                        </View>
                        <View style={styles.rowInfo}>
                            <Text style={[styles.rowTitle, { color: '#FF5252' }]}>Eliminar cuenta</Text>
                            <Text style={styles.rowSub}>Esta acción es irreversible</Text>
                        </View>
                        <Text style={styles.rowChevron}>›</Text>
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <Text style={styles.footer}>BIBO v1.0.0 · Hecho con ⚡ en 2026</Text>
            </ScrollView>
        </View>
    );
}

/* ── Static data ─────────────────────────── */

const stats = [
    { val: '7', label: 'OBJETIVOS', color: '#2AC9A0', icon: '' },
    { val: '5', label: 'HÁBITOS', color: '#4CAF50', icon: '' },
    { val: '12', label: 'RACHA DÍAS', color: '#FF9800', icon: '🔥' },
    { val: '2', label: 'BTC COMPRAS', color: '#FFC107', icon: '' },
];

const cuentaItems = [
    { icon: '👤', iconBg: 'rgba(175,82,222,0.1)', title: 'Editar perfil', sub: 'Nombre, foto, handle' },
    { icon: '✉️', iconBg: 'rgba(0,122,255,0.1)', title: 'Email', sub: 'x@gmail.com' },
    { icon: '🔒', iconBg: 'rgba(48,209,88,0.1)', title: 'Cambiar contraseña', sub: 'Última vez: hace 30 días' },
];

/* ── Styles ─────────────────────────────── */

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F2F2F7' },
    scroll: { paddingBottom: 40 },

    backBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 18, paddingTop: 54, marginBottom: 8,
    },
    backArrow: { fontSize: 22, color: '#1C1C1E' },
    backText: { fontSize: 15, color: '#636366' },

    /* Hero */
    hero: { alignItems: 'center', paddingBottom: 24, position: 'relative', overflow: 'hidden' },
    heroBg: {
        position: 'absolute', top: 0, width: '100%', height: 130,
        backgroundColor: 'rgba(42,201,160,0.15)', opacity: 0.9,
    },
    avatarWrap: { marginTop: 20, marginBottom: 12 },
    avatarRing: {
        width: 96, height: 96, borderRadius: 48,
        borderWidth: 3, borderColor: '#9B8AFF',
        justifyContent: 'center', alignItems: 'center',
        backgroundColor: 'rgba(108,99,255,0.15)',
    },
    avatarInner: {
        width: 84, height: 84, borderRadius: 42,
        backgroundColor: '#E8A0E8',
        justifyContent: 'center', alignItems: 'center',
    },
    avatarEmoji: { fontSize: 42 },
    editBadge: {
        position: 'absolute', bottom: 0, right: -2,
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: '#2AC9A0', justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: '#F2F2F7',
    },
    editBadgeIcon: { fontSize: 12 },

    heroName: { fontSize: 26, fontWeight: '800', color: '#1C1C1E', marginBottom: 4 },
    heroHandle: { fontSize: 13, color: '#8E8E93', marginBottom: 12 },
    levelBadge: {
        paddingHorizontal: 18, paddingVertical: 8, borderRadius: 22,
        backgroundColor: 'rgba(108,99,255,0.2)', borderWidth: 1, borderColor: 'rgba(108,99,255,0.4)',
    },
    levelBadgeText: { fontSize: 14, fontWeight: '700', color: '#9B8AFF' },

    /* Stats */
    statsCard: {
        flexDirection: 'row', backgroundColor: '#FFFFFF',
        marginHorizontal: 18, borderRadius: 18, overflow: 'hidden',
        marginBottom: 28, borderWidth: 1, borderColor: 'rgba(60,60,67,0.08)',
    },
    statCell: { flex: 1, paddingVertical: 16, alignItems: 'center' },
    statCellBorder: { borderRightWidth: 1, borderRightColor: 'rgba(60,60,67,0.12)' },
    statVal: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
    statLabel: { fontSize: 9, fontWeight: '700', color: '#8E8E93', letterSpacing: 0.5, textAlign: 'center' },

    /* Section title */
    sectionTitle: {
        fontSize: 11, fontWeight: '700', color: '#8E8E93', letterSpacing: 1.5,
        paddingHorizontal: 18, marginBottom: 10,
    },

    /* Group/rows */
    group: {
        backgroundColor: '#FFFFFF', marginHorizontal: 18, borderRadius: 18,
        overflow: 'hidden', marginBottom: 24,
        borderWidth: 1, borderColor: 'rgba(60,60,67,0.08)',
    },
    row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(60,60,67,0.12)' },
    rowIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    rowIconText: { fontSize: 18 },
    rowInfo: { flex: 1 },
    rowTitle: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
    rowSub: { fontSize: 12, color: '#6A6A8A', marginTop: 2 },
    rowChevron: { fontSize: 22, color: '#8E8E93' },
    rowValue: { fontSize: 13, color: '#8E8E93', fontWeight: '600' },
    rowActive: { fontSize: 12, fontWeight: '700', color: '#4CAF50' },

    footer: { textAlign: 'center', fontSize: 12, color: '#383860', marginTop: 8 },
});
