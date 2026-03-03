import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type TabName = 'Home' | 'Hábitos' | 'Objetivos' | 'Agenda' | 'Finanzas';

interface Props {
    active: TabName;
    onTabPress: (tab: TabName) => void;
}

const tabs: { name: TabName; icon: any; iconActive: any }[] = [
    { name: 'Home', icon: 'grid-outline', iconActive: 'grid' },
    { name: 'Hábitos', icon: 'radio-button-on-outline', iconActive: 'radio-button-on' },
    { name: 'Objetivos', icon: 'diamond-outline', iconActive: 'diamond' },
    { name: 'Agenda', icon: 'calendar-outline', iconActive: 'calendar' },
    { name: 'Finanzas', icon: 'logo-bitcoin', iconActive: 'logo-bitcoin' },
];

export default function BottomTabBar({ active, onTabPress }: Props) {
    return (
        <View style={styles.container}>
            {tabs.map((t) => {
                const isActive = active === t.name;
                return (
                    <TouchableOpacity
                        key={t.name}
                        style={styles.tab}
                        onPress={() => onTabPress(t.name)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
                            <Ionicons
                                name={isActive ? t.iconActive : t.icon}
                                size={22}
                                color={isActive ? '#6C63FF' : '#555570'}
                            />
                        </View>
                        <Text style={[styles.label, isActive && styles.labelActive]}>{t.name}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: '#0C0C1E',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        paddingBottom: 24,
        paddingTop: 8,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        gap: 3,
    },
    iconWrap: {
        width: 44,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconWrapActive: {
        backgroundColor: 'rgba(108,99,255,0.12)',
    },
    label: {
        fontSize: 10,
        color: '#555570',
        fontWeight: '600',
    },
    labelActive: {
        color: '#6C63FF',
    },
});
