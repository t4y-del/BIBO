import React, { useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';

import { supabase } from './src/config/supabase';
import { AuthProvider, useAuthLoading } from './src/contexts/AuthContext';
import { HideBalanceProvider } from './src/contexts/HideBalanceContext';
import WelcomeScreen from './src/screens/WelcomeScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import HabitosScreen from './src/screens/HabitosScreen';
import ObjetivosScreen from './src/screens/ObjetivosScreen';
import AgendaScreen from './src/screens/AgendaScreen';
import FinanzasScreen from './src/screens/FinanzasScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import JournalScreen from './src/screens/JournalScreen';
import FocusScreen from './src/screens/FocusScreen';
import MetasScreen from './src/screens/MetasScreen';
import BottomTabBar, { TabName } from './src/components/BottomTabBar';

// ── Main tabs: kept mounted for instant switching ───────────────────
const MAIN_TABS: TabName[] = ['Home', 'Hábitos', 'Finanzas', 'Metas'];

type AuthScreen = 'Welcome' | 'Register' | 'Login';

function AppInner() {
  const authLoading = useAuthLoading();
  const [authScreen, setAuthScreen] = useState<AuthScreen | null>('Welcome');
  const [activeTab, setActiveTab] = useState<TabName>('Home');
  const [showProfile, setShowProfile] = useState(false);
  const [booting, setBooting] = useState(true);

  // ── Track which secondary tabs have been visited (lazy mount) ────
  const [mountedSecondary, setMountedSecondary] = useState<Set<TabName>>(new Set());

  // ── Check for an existing Supabase session on startup ──────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setAuthScreen(null);
      }
      setBooting(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setAuthScreen('Welcome');
        setShowProfile(false);
        setActiveTab('Home');
        setMountedSecondary(new Set());
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Mount secondary tabs on first visit
  useEffect(() => {
    if (!MAIN_TABS.includes(activeTab) && !mountedSecondary.has(activeTab)) {
      setMountedSecondary((prev) => new Set(prev).add(activeTab));
    }
  }, [activeTab]);

  const navigate = (s: string) => {
    if (s === 'Home') {
      setAuthScreen(null);
      setActiveTab('Home');
    } else if (s === 'Profile') {
      setShowProfile(true);
    } else {
      setAuthScreen(s as AuthScreen);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowProfile(false);
    setAuthScreen('Welcome');
    setMountedSecondary(new Set());
  };

  // ── Boot splash ────────────────────────────────────────────────────
  if (booting || authLoading) {
    return (
      <View style={styles.splash}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#2AC9A0" />
      </View>
    );
  }

  // ── Auth flow ──────────────────────────────────────────────────────
  if (authScreen) {
    return (
      <>
        <StatusBar barStyle="light-content" />
        {authScreen === 'Welcome' && <WelcomeScreen onNavigate={navigate} />}
        {authScreen === 'Register' && <RegisterScreen onNavigate={navigate} />}
        {authScreen === 'Login' && <LoginScreen onNavigate={navigate} />}
      </>
    );
  }

  // ── Profile overlay ────────────────────────────────────────────────
  if (showProfile) {
    return (
      <>
        <StatusBar barStyle="light-content" />
        <ProfileScreen onBack={() => setShowProfile(false)} onLogout={handleLogout} />
      </>
    );
  }

  // ── Main app with tabs ─────────────────────────────────────────────
  // Main tabs: always mounted, hidden via display:'none' when inactive
  // Secondary tabs: mounted on first visit, then persisted
  return (
    <HideBalanceProvider>
      <View style={styles.main}>
        <StatusBar barStyle="light-content" />

        {/* ── Main tabs: persistent mount with display toggling ── */}
        <View style={[styles.screenWrap, activeTab !== 'Home' && styles.hidden]}>
          <HomeScreen onNavigate={navigate} />
        </View>
        <View style={[styles.screenWrap, activeTab !== 'Hábitos' && styles.hidden]}>
          <HabitosScreen />
        </View>
        <View style={[styles.screenWrap, activeTab !== 'Finanzas' && styles.hidden]}>
          <FinanzasScreen />
        </View>
        <View style={[styles.screenWrap, activeTab !== 'Metas' && styles.hidden]}>
          <MetasScreen />
        </View>

        {/* ── Secondary tabs: lazy-mounted, then persistent ── */}
        {mountedSecondary.has('Objetivos') && (
          <View style={[styles.screenWrap, activeTab !== 'Objetivos' && styles.hidden]}>
            <ObjetivosScreen />
          </View>
        )}
        {mountedSecondary.has('Agenda') && (
          <View style={[styles.screenWrap, activeTab !== 'Agenda' && styles.hidden]}>
            <AgendaScreen />
          </View>
        )}
        {mountedSecondary.has('Journal') && (
          <View style={[styles.screenWrap, activeTab !== 'Journal' && styles.hidden]}>
            <JournalScreen />
          </View>
        )}
        {mountedSecondary.has('Focus') && (
          <View style={[styles.screenWrap, activeTab !== 'Focus' && styles.hidden]}>
            <FocusScreen />
          </View>
        )}

        <BottomTabBar active={activeTab} onTabPress={setActiveTab} />
      </View>
    </HideBalanceProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  main: { flex: 1, backgroundColor: '#060e1c' },
  splash: { flex: 1, backgroundColor: '#060e1c', justifyContent: 'center', alignItems: 'center' },
  screenWrap: { flex: 1 },
  hidden: { display: 'none' },
});
