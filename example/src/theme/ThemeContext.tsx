import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { darkColors, lightColors, type AppColors } from './colors';
import { fonts, type AppFonts } from './type';

export type Theme = { colors: AppColors; fonts: AppFonts };

const ThemeContext = createContext<Theme | null>(null);

function themeFor(scheme: 'light' | 'dark' | null | undefined): Theme {
  return { colors: scheme === 'dark' ? darkColors : lightColors, fonts };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const theme = useMemo(() => themeFor(scheme), [scheme]);
  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): Theme {
  const provided = useContext(ThemeContext);
  const scheme = useColorScheme();
  return useMemo(() => provided ?? themeFor(scheme), [provided, scheme]);
}
