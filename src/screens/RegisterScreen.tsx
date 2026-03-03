import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { supabase } from '../config/supabase';

const { height } = Dimensions.get('window');

interface Props {
    onNavigate: (screen: string) => void;
}

export default function RegisterScreen({ onNavigate }: Props) {
    const [authMethod, setAuthMethod] = useState<'Email' | 'Google' | 'Apple'>('Email');
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [accepted, setAccepted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRegister = async () => {
        setError(null);
        if (!nombre.trim()) { setError('Ingresá tu nombre'); return; }
        if (!email.trim()) { setError('Ingresá tu email'); return; }
        if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
        if (!accepted) { setError('Debés aceptar los términos'); return; }

        setLoading(true);
        try {
            const { error: signUpError } = await supabase.auth.signUp({
                email: email.trim().toLowerCase(),
                password,
                options: {
                    data: {
                        full_name: `${nombre.trim()} ${apellido.trim()}`.trim(),
                        display_name: nombre.trim(),
                    },
                },
            });
            if (signUpError) throw signUpError;
            onNavigate('Home');
        } catch (e: any) {
            const msg = e?.message ?? 'Error al crear la cuenta';
            if (msg.includes('already registered') || msg.includes('already exists')) {
                setError('Este email ya está registrado. ¿Querés iniciar sesión?');
            } else {
                setError(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    const strength = getPasswordStrength(password);

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header */}
                <TouchableOpacity style={styles.backBtn} onPress={() => onNavigate('Welcome')}>
                    <Text style={styles.backArrow}>←</Text>
                    <Text style={styles.backText}>Volver</Text>
                </TouchableOpacity>

                {/* Brand */}
                <Text style={styles.brand}>⚡ BIBO</Text>

                {/* Heading */}
                <Text style={styles.heading}>
                    <Text style={styles.headingWhite}>Creá tu{'\n'}</Text>
                    <Text style={styles.headingGreen}>cuenta </Text>
                    <Text style={styles.headingEmoji}>🚀</Text>
                </Text>
                <Text style={styles.subheading}>
                    Empezá a construir la mejor versión de vos.
                </Text>

                {/* Auth method tabs */}
                <View style={styles.tabs}>
                    {(['Email', 'Google', 'Apple'] as const).map((m) => (
                        <TouchableOpacity
                            key={m}
                            style={[styles.tab, authMethod === m && styles.tabActive]}
                            onPress={() => setAuthMethod(m)}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.tabText, authMethod === m && styles.tabTextActive]}>{m}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {authMethod === 'Email' && (
                    <>
                        {/* Profile photo */}
                        <View style={styles.photoRow}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarEmoji}>😎</Text>
                            </View>
                            <View style={styles.photoInfo}>
                                <Text style={styles.photoTitle}>Foto de perfil</Text>
                                <Text style={styles.photoSub}>Opcional · JPG, PNG hasta 5MB</Text>
                            </View>
                            <TouchableOpacity>
                                <Text style={styles.photoChange}>CAMBIAR</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Name fields */}
                        <View style={styles.nameRow}>
                            <View style={styles.nameField}>
                                <Text style={styles.label}>NOMBRE</Text>
                                <View style={styles.inputWrap}>
                                    <Text style={styles.inputIcon}>👤</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={nombre}
                                        onChangeText={setNombre}
                                        placeholder="Nombre"
                                        placeholderTextColor="#555"
                                    />
                                </View>
                            </View>
                            <View style={styles.nameField}>
                                <Text style={styles.label}>APELLIDO</Text>
                                <View style={styles.inputWrap}>
                                    <Text style={styles.inputIcon}>—</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={apellido}
                                        onChangeText={setApellido}
                                        placeholder="Opcional"
                                        placeholderTextColor="#555"
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Email */}
                        <Text style={styles.label}>EMAIL</Text>
                        <View style={styles.inputWrap}>
                            <Text style={styles.inputIcon}>✉️</Text>
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="tu@email.com"
                                placeholderTextColor="#555"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        {/* Password */}
                        <Text style={styles.label}>CONTRASEÑA</Text>
                        <View style={styles.inputWrap}>
                            <Text style={styles.inputIcon}>🔒</Text>
                            <TextInput
                                style={styles.input}
                                value={password}
                                onChangeText={setPassword}
                                placeholder="••••••••"
                                placeholderTextColor="#555"
                                secureTextEntry={!showPass}
                            />
                            <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                                <Text style={styles.eyeIcon}>{showPass ? '🙈' : '👁️'}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Strength bar */}
                        {password.length > 0 && (
                            <>
                                <View style={styles.strengthBar}>
                                    <View style={[styles.strengthSeg, { backgroundColor: strength >= 1 ? '#FF5252' : '#D1D1D6' }]} />
                                    <View style={[styles.strengthSeg, { backgroundColor: strength >= 2 ? '#FF9800' : '#D1D1D6' }]} />
                                    <View style={[styles.strengthSeg, { backgroundColor: strength >= 3 ? '#2AC9A0' : '#D1D1D6' }]} />
                                    <View style={[styles.strengthSeg, { backgroundColor: strength >= 4 ? '#4CAF50' : '#D1D1D6' }]} />
                                </View>
                                <Text style={[styles.strengthLabel, { color: strengthColor(strength) }]}>
                                    {strengthText(strength)} {strength >= 3 ? '✓' : ''}
                                </Text>
                            </>
                        )}

                        {/* Terms */}
                        <TouchableOpacity style={styles.termsRow} onPress={() => setAccepted(!accepted)} activeOpacity={0.7}>
                            <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
                                {accepted && <Text style={styles.checkMark}>✓</Text>}
                            </View>
                            <Text style={styles.termsText}>
                                Acepto los <Text style={styles.termsLink}>Términos de uso</Text> y la{' '}
                                <Text style={styles.termsLink}>Política de privacidad</Text> de BIBO
                            </Text>
                        </TouchableOpacity>

                        {/* Error message */}
                        {error && (
                            <View style={styles.errorBox}>
                                <Text style={styles.errorText}>⚠️ {error}</Text>
                            </View>
                        )}

                        {/* Register button */}
                        <TouchableOpacity
                            style={[styles.registerBtn, loading && { opacity: 0.6 }]}
                            activeOpacity={0.8}
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            {loading
                                ? <ActivityIndicator color="#FFF" />
                                : <Text style={styles.registerBtnText}>Crear cuenta</Text>}
                        </TouchableOpacity>
                    </>
                )}

                {authMethod !== 'Email' && (
                    <View style={styles.socialPlaceholder}>
                        <Text style={styles.socialText}>
                            Registro con {authMethod} próximamente
                        </Text>
                    </View>
                )}

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>¿Ya tenés cuenta? </Text>
                    <TouchableOpacity onPress={() => onNavigate('Login')}>
                        <Text style={styles.footerLink}>Iniciá sesión</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

function getPasswordStrength(p: string): number {
    if (!p) return 0;
    let s = 0;
    if (p.length >= 6) s++;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
    if (/[0-9!@#$%^&*]/.test(p)) s++;
    return s;
}
function strengthText(s: number) {
    return ['', 'Débil', 'Regular', 'Buena', 'Contraseña fuerte'][s] ?? '';
}
function strengthColor(s: number) {
    return ['#555', '#FF5252', '#FF9800', '#2AC9A0', '#4CAF50'][s] ?? '#555';
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A1A' },
    scroll: { paddingHorizontal: 24, paddingTop: 54, paddingBottom: 40 },

    backBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
    backArrow: { fontSize: 22, color: '#FFF' },
    backText: { fontSize: 15, color: '#7A7A9A' },

    brand: { fontSize: 16, fontWeight: '700', color: '#9B8AFF', marginBottom: 20, letterSpacing: 2 },

    heading: { marginBottom: 8 },
    headingWhite: { fontSize: 34, fontWeight: '800', color: '#FFF', lineHeight: 40 },
    headingGreen: { fontSize: 34, fontWeight: '800', color: '#4CAF50', lineHeight: 40 },
    headingEmoji: { fontSize: 30 },

    subheading: { fontSize: 14, color: '#7A7A9A', marginBottom: 24 },

    tabs: {
        flexDirection: 'row', backgroundColor: '#14142A', borderRadius: 14,
        padding: 4, marginBottom: 24,
    },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
    tabActive: { backgroundColor: '#2AC9A0' },
    tabText: { fontSize: 14, fontWeight: '600', color: '#7A7A9A' },
    tabTextActive: { color: '#FFF' },

    photoRow: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#12122A',
        borderRadius: 16, padding: 14, marginBottom: 24, gap: 12,
    },
    avatar: {
        width: 50, height: 50, borderRadius: 25, backgroundColor: '#2A2A3E',
        justifyContent: 'center', alignItems: 'center',
    },
    avatarEmoji: { fontSize: 26 },
    photoInfo: { flex: 1 },
    photoTitle: { fontSize: 14, fontWeight: '700', color: '#FFF' },
    photoSub: { fontSize: 11, color: '#7A7A9A', marginTop: 2 },
    photoChange: { fontSize: 13, fontWeight: '700', color: '#2AC9A0' },

    nameRow: { flexDirection: 'row', gap: 12, marginBottom: 4 },
    nameField: { flex: 1 },

    label: { fontSize: 11, fontWeight: '700', color: '#7A7A9A', letterSpacing: 1, marginBottom: 8, marginTop: 16 },

    inputWrap: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#14142A',
        borderRadius: 14, paddingHorizontal: 14, height: 52, gap: 10,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    },
    inputIcon: { fontSize: 16 },
    input: { flex: 1, color: '#FFF', fontSize: 15 },
    eyeIcon: { fontSize: 18, padding: 4 },

    strengthBar: { flexDirection: 'row', gap: 4, marginTop: 10 },
    strengthSeg: { flex: 1, height: 4, borderRadius: 2 },
    strengthLabel: { fontSize: 12, marginTop: 6, fontWeight: '600' },

    termsRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 20, gap: 10 },
    checkbox: {
        width: 22, height: 22, borderRadius: 6, borderWidth: 2,
        borderColor: '#2AC9A0', justifyContent: 'center', alignItems: 'center', marginTop: 1,
    },
    checkboxChecked: { backgroundColor: '#2AC9A0' },
    checkMark: { color: '#FFF', fontSize: 13, fontWeight: '800' },
    termsText: { flex: 1, fontSize: 13, color: '#7A7A9A', lineHeight: 19 },
    termsLink: { color: '#2AC9A0', fontWeight: '600' },

    registerBtn: {
        width: '100%', paddingVertical: 17, borderRadius: 16, backgroundColor: '#2AC9A0',
        alignItems: 'center', marginTop: 24,
        shadowColor: '#2AC9A0', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
    },
    registerBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },

    socialPlaceholder: {
        paddingVertical: 60, alignItems: 'center', justifyContent: 'center',
    },
    socialText: { fontSize: 15, color: '#7A7A9A' },

    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
    footerText: { fontSize: 14, color: '#7A7A9A' },
    footerLink: { fontSize: 14, color: '#2AC9A0', fontWeight: '700' },

    errorBox: {
        backgroundColor: '#FF525220', borderRadius: 12, padding: 12, marginTop: 16,
        borderWidth: 1, borderColor: '#FF525240',
    },
    errorText: { fontSize: 13, color: '#FF7070', fontWeight: '500', lineHeight: 18 },
});
