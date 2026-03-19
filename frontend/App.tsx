import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider } from './src/config/AuthContext';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';

function AppContent() {
  const { mode } = useTheme();
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator />
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
