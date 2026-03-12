import React, { useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';

import { supabase } from './src/config/supabase';
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
import BottomTabBar, { TabName } from './src/components/BottomTabBar';

type AuthScreen = 'Welcome' | 'Register' | 'Login';

export default function App() {
  const [authScreen, setAuthScreen] = useState<AuthScreen | null>('Welcome');
  const [activeTab, setActiveTab] = useState<TabName>('Home');
  const [showProfile, setShowProfile] = useState(false);
  const [booting, setBooting] = useState(true);

  // ── Check for an existing Supabase session on startup ──────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setAuthScreen(null); // already logged in → go straight to app
      }
      setBooting(false);
    });

    // Listen for changes (e.g. token expiry, external sign-out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setAuthScreen('Welcome');
        setShowProfile(false);
        setActiveTab('Home');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
  };

  // ── Boot splash (while checking session) ───────────────────────────
  if (booting) {
    return (
      <View style={styles.splash}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#6C63FF" />
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

  // ── Profile overlay (no tab bar) ───────────────────────────────────
  if (showProfile) {
    return (
      <>
        <StatusBar barStyle="light-content" />
        <ProfileScreen onBack={() => setShowProfile(false)} onLogout={handleLogout} />
      </>
    );
  }

  // ── Main app with tabs ─────────────────────────────────────────────
  return (
    <HideBalanceProvider>
      <View style={styles.main}>
        <StatusBar barStyle="light-content" />
        {activeTab === 'Home' && <HomeScreen onNavigate={navigate} />}
        {activeTab === 'Hábitos' && <HabitosScreen />}
        {activeTab === 'Objetivos' && <ObjetivosScreen />}
        {activeTab === 'Agenda' && <AgendaScreen />}
        {activeTab === 'Finanzas' && <FinanzasScreen />}
        <BottomTabBar active={activeTab} onTabPress={setActiveTab} />
      </View>
    </HideBalanceProvider>
  );
}

const styles = StyleSheet.create({
  main: { flex: 1, backgroundColor: '#0A0A1A' },
  splash: { flex: 1, backgroundColor: '#0A0A1A', justifyContent: 'center', alignItems: 'center' },
});
