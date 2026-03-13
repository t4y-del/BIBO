import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { supabase } from '../config/supabase';
import LaunchAnimation from '../components/LaunchAnimation';

interface Props {
    onNavigate: (screen: string) => void;
}

export default function LoginScreen({ onNavigate }: Props) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [launching, setLaunching] = useState(false);

    const handleLogin = async () => {
        setError(null);
        if (!email.trim()) { setError('Ingresá tu email'); return; }
        if (!password) { setError('Ingresá tu contraseña'); return; }

        setLoading(true);
        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: email.trim().toLowerCase(),
                password,
            });
            if (signInError) throw signInError;
            // Show launch animation, then navigate
            setLoading(false);
            setLaunching(true);
        } catch (e: any) {
            const msg = e?.message ?? 'Error al iniciar sesión';
            if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
                setError('Email o contraseña incorrectos');
            } else if (msg.includes('Email not confirmed')) {
                setError('Confirmá tu email antes de ingresar — revisá tu bandeja de entrada');
            } else {
                setError(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {launching && <LaunchAnimation onFinish={() => onNavigate('Home')} />}
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
                        <Text style={styles.headingWhite}>Bienvenido{'\n'}de </Text>
                        <Text style={styles.headingYellow}>vuelta </Text>
                        <Text style={styles.headingEmoji}>👋</Text>
                    </Text>
                    <Text style={styles.subheading}>
                        Iniciá sesión para retomar tus objetivos donde los dejaste.
                    </Text>

                    {/* Social buttons (placeholder) */}
                    <View style={styles.socialRow}>
                        <TouchableOpacity style={styles.socialBtn} activeOpacity={0.7}>
                            <Text style={styles.socialIcon}>G</Text>
                            <Text style={styles.socialText}>Google</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.socialBtn} activeOpacity={0.7}>
                            <Text style={styles.socialIcon}></Text>
                            <Text style={styles.socialText}>Apple</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Divider */}
                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>O CON EMAIL</Text>
                        <View style={styles.dividerLine} />
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
                            autoCorrect={false}
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

                    {/* Forgot */}
                    <TouchableOpacity style={styles.forgotRow}>
                        <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
                    </TouchableOpacity>

                    {/* Error */}
                    {error && (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>⚠️ {error}</Text>
                        </View>
                    )}

                    {/* Login button */}
                    <TouchableOpacity
                        style={[styles.loginBtn, loading && { opacity: 0.6 }]}
                        activeOpacity={0.8}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading
                            ? <ActivityIndicator color="#FFF" />
                            : <Text style={styles.loginBtnText}>Iniciar sesión</Text>}
                    </TouchableOpacity>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>¿No tenés cuenta? </Text>
                        <TouchableOpacity onPress={() => onNavigate('Register')}>
                            <Text style={styles.footerLink}>Registrate</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A1A' },
    scroll: { paddingHorizontal: 24, paddingTop: 54, paddingBottom: 40 },

    backBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
    backArrow: { fontSize: 22, color: '#FFF' },
    backText: { fontSize: 15, color: '#7A7A9A' },

    brand: { fontSize: 16, fontWeight: '700', color: '#9B8AFF', marginBottom: 20, letterSpacing: 2 },

    heading: { marginBottom: 8 },
    headingWhite: { fontSize: 34, fontWeight: '800', color: '#FFF', lineHeight: 42 },
    headingYellow: { fontSize: 34, fontWeight: '800', color: '#FFCA28', lineHeight: 42 },
    headingEmoji: { fontSize: 30 },

    subheading: { fontSize: 14, color: '#7A7A9A', marginBottom: 28, lineHeight: 20 },

    socialRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    socialBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: '#14142A',
    },
    socialIcon: { fontSize: 18, color: '#FFF', fontWeight: '700' },
    socialText: { fontSize: 14, fontWeight: '600', color: '#FFF' },

    divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 12 },
    dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
    dividerText: { fontSize: 12, color: '#555', fontWeight: '600', letterSpacing: 1 },

    label: { fontSize: 11, fontWeight: '700', color: '#7A7A9A', letterSpacing: 1, marginBottom: 8, marginTop: 8 },

    inputWrap: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#14142A',
        borderRadius: 14, paddingHorizontal: 14, height: 52, gap: 10,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    },
    inputIcon: { fontSize: 16 },
    input: { flex: 1, color: '#FFF', fontSize: 15 },
    eyeIcon: { fontSize: 18, padding: 4 },

    forgotRow: { alignItems: 'flex-end', marginTop: 12, marginBottom: 8 },
    forgotText: { fontSize: 13, color: '#2AC9A0', fontWeight: '600' },

    errorBox: {
        backgroundColor: '#FF525220', borderRadius: 12, padding: 12, marginTop: 8,
        borderWidth: 1, borderColor: '#FF525240',
    },
    errorText: { fontSize: 13, color: '#FF7070', fontWeight: '500', lineHeight: 18 },

    loginBtn: {
        width: '100%', paddingVertical: 17, borderRadius: 16, backgroundColor: '#2AC9A0',
        alignItems: 'center', marginTop: 20,
        shadowColor: '#2AC9A0', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
    },
    loginBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },

    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
    footerText: { fontSize: 14, color: '#7A7A9A' },
    footerLink: { fontSize: 14, color: '#2AC9A0', fontWeight: '700' },
});
