import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Dimensions,
    Animated,
} from 'react-native';

const { width, height } = Dimensions.get('window');
const isSmall = height < 700;

interface Props {
    onNavigate: (screen: string) => void;
}

export default function WelcomeScreen({ onNavigate }: Props) {
    const floatAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, {
                    toValue: -12,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(floatAnim, {
                    toValue: 12,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [floatAnim]);

    return (
        <View style={styles.container}>
            {stars.map((s, i) => (
                <View
                    key={i}
                    style={[
                        styles.star,
                    ]}
                />
            ))}
            <View style={styles.topGlow} />

            <View style={styles.content}>
                <Text style={styles.title}>
                    <Text style={{ color: '#A78BFA' }}>B</Text>
                    <Text style={{ color: '#818CF8' }}>I</Text>
                    <Text style={{ color: '#6DD5FA' }}>B</Text>
                    <Text style={{ color: '#2AC9A0' }}>O</Text>
                </Text>

                <Animated.View style={[styles.logoWrap, { transform: [{ translateY: floatAnim }] }]}>
                    <View style={styles.logoGlow} />
                    <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
                </Animated.View>

                <View style={styles.tagline}>
                    <Text style={styles.tagWhite}>PLAN</Text>
                    <Text style={styles.tagPurple}>ACT</Text>
                    <Text style={styles.tagAqua}>GROW</Text>
                </View>

                <Text style={styles.subtitle}>
                    Hábitos, objetivos, inversiones y más.{'\n'}Todo en un solo lugar.
                </Text>

                <View style={styles.pillsWrap}>
                    <View style={styles.pillsRow}>
                        {pills.map((p) => (
                            <View key={p.label} style={[styles.pill, { borderColor: p.border, backgroundColor: p.bg }]}>
                                <View style={[styles.pillDot, { backgroundColor: p.dot }]} />
                                <Text style={styles.pillText}>{p.label}</Text>
                            </View>
                        ))}
                    </View>
                    <View style={[styles.pill, { borderColor: 'rgba(108,99,255,0.4)', backgroundColor: 'rgba(108,99,255,0.08)' }]}>
                        <View style={[styles.pillDot, { backgroundColor: '#2AC9A0' }]} />
                        <Text style={styles.pillText}>Agenda</Text>
                    </View>
                </View>
            </View>

            <View style={styles.btns}>
                <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8} onPress={() => onNavigate('Register')}>
                    <Text style={styles.primaryBtnText}>Comenzar ahora</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.8} onPress={() => onNavigate('Login')}>
                    <Text style={styles.secondaryBtnText}>Ya tengo una cuenta</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const pills = [
    { label: 'Hábitos', dot: '#4CAF50', border: 'rgba(76,175,80,0.4)', bg: 'rgba(76,175,80,0.08)' },
    { label: 'Objetivos', dot: '#FF9800', border: 'rgba(255,152,0,0.4)', bg: 'rgba(255,152,0,0.08)' },
    { label: 'BTC', dot: '#FFC107', border: 'rgba(255,193,7,0.4)', bg: 'rgba(255,193,7,0.08)' },
    { label: 'Ahorros', dot: '#2196F3', border: 'rgba(33,150,243,0.4)', bg: 'rgba(33,150,243,0.08)' },
];

const stars = Array.from({ length: 35 }, () => ({
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 2.5 + 1,
    opacity: Math.random() * 0.4 + 0.15,
}));

const LOGO_SIZE = isSmall ? height * 0.22 : height * 0.26;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A1A' },
    star: { position: 'absolute', backgroundColor: '#FFF', borderRadius: 10 },
    topGlow: {
        position: 'absolute', top: -height * 0.15, alignSelf: 'center',
        width: width * 0.9, height: height * 0.35, borderRadius: width,
        backgroundColor: '#2AC9A0', opacity: 0.07,
    },
    content: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 24, paddingTop: isSmall ? 36 : 50,
    },
    title: { fontSize: isSmall ? 30 : 36, fontWeight: '800', letterSpacing: 14, marginBottom: isSmall ? 4 : 8 },
    logoWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: isSmall ? 6 : 12 },
    logoGlow: {
        position: 'absolute', width: LOGO_SIZE * 0.85, height: LOGO_SIZE * 0.85,
        borderRadius: LOGO_SIZE, backgroundColor: '#2AC9A0', opacity: 0.10,
    },
    logo: { width: LOGO_SIZE, height: LOGO_SIZE },
    tagline: { alignItems: 'center', marginBottom: isSmall ? 6 : 12 },
    tagWhite: {
        fontSize: isSmall ? 30 : 36, fontWeight: '800', color: '#FFFFFF', lineHeight: isSmall ? 36 : 44,
        textShadowColor: 'rgba(255,255,255,0.15)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 12,
    },
    tagPurple: {
        fontSize: isSmall ? 30 : 36, fontWeight: '800', color: '#9B8AFF', lineHeight: isSmall ? 36 : 44,
        textShadowColor: 'rgba(155,138,255,0.35)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 18,
    },
    tagAqua: {
        fontSize: isSmall ? 30 : 36, fontWeight: '800', color: '#2AC9A0', lineHeight: isSmall ? 36 : 44,
        textShadowColor: 'rgba(0,217,255,0.35)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 18,
    },
    subtitle: { fontSize: isSmall ? 12 : 14, color: '#7A7A9A', textAlign: 'center', lineHeight: isSmall ? 17 : 20, marginBottom: isSmall ? 10 : 16 },
    pillsWrap: { alignItems: 'center', gap: 8 },
    pillsRow: { flexDirection: 'row', gap: 8 },
    pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, gap: 6 },
    pillDot: { width: 7, height: 7, borderRadius: 4 },
    pillText: { fontSize: 12, color: '#CCCCDD', fontWeight: '500' },
    btns: { paddingHorizontal: 24, paddingBottom: isSmall ? 24 : 38, paddingTop: 10, gap: 10 },
    primaryBtn: {
        width: '100%', paddingVertical: isSmall ? 14 : 17, borderRadius: 16,
        backgroundColor: '#2AC9A0', alignItems: 'center',
        shadowColor: '#2AC9A0', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
    },
    primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF', letterSpacing: 0.5 },
    secondaryBtn: {
        width: '100%', paddingVertical: isSmall ? 14 : 17, borderRadius: 16,
        backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center',
    },
    secondaryBtnText: { fontSize: 16, fontWeight: '600', color: '#CCCCDD' },
});
