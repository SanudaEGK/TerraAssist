// src/theme/ThemeContext.tsx
import React, { createContext, useContext, useState } from 'react';

export type ThemeMode = 'light' | 'dark';

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  textLight: string;
  error: string;
  success: string;
  warning: string;
  cardBackground: string;
  border: string;
  grey: string;
  tabBar: string;
  headerBg: string;
}

export const lightColors: ThemeColors = {
  primary: '#2E7D32',
  secondary: '#FFFFFF',
  accent: '#A5D6A7',
  background: '#F1F8E9',
  text: '#333333',
  textLight: '#757575',
  error: '#D32F2F',
  success: '#388E3C',
  warning: '#FBC02D',
  cardBackground: '#FFFFFF',
  border: '#C8E6C9',
  grey: '#E0E0E0',
  tabBar: '#FFFFFF',
  headerBg: '#F1F8E9',
};

export const darkColors: ThemeColors = {
  primary: '#81C784',
  secondary: '#1E1E1E',
  accent: '#4CAF50',
  background: '#121212',
  text: '#E0E0E0',
  textLight: '#9E9E9E',
  error: '#EF5350',
  success: '#66BB6A',
  warning: '#FFA726',
  cardBackground: '#2C2C2C',
  border: '#3A3A3A',
  grey: '#3A3A3A',
  tabBar: '#1E1E1E',
  headerBg: '#1E1E1E',
};

interface ThemeContextType {
  mode: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  colors: lightColors,
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('light');

  const toggleTheme = () => {
    setMode(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const colors = mode === 'light' ? lightColors : darkColors;

  return (
    <ThemeContext.Provider value={{ mode, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
