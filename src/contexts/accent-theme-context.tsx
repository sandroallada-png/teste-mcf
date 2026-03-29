'use client';

import React, { createContext, useContext, ReactNode, useCallback, useEffect, useState } from 'react';
import { themes, type Theme } from '@/components/personalization/theme-selector';

const ACCENT_THEME_STORAGE_KEY = 'my-cook-flex-accent-theme';

interface AccentThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const AccentThemeContext = createContext<AccentThemeContextType | undefined>(undefined);

export function AccentThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') {
      return themes[0]; // Default theme for server-side rendering
    }
    try {
      const item = window.localStorage.getItem(ACCENT_THEME_STORAGE_KEY);
      return item ? JSON.parse(item) : themes[0];
    } catch (error) {
      console.error(error);
      return themes[0];
    }
  });

  // Effect to apply the theme to the document
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      root.style.setProperty('--primary', theme.hsl);
      // Apply dynamic foreground for proper contrast (Black or White)
      root.style.setProperty('--primary-foreground', theme.foregroundHsl || '0 0% 100%');
    }
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme) => {
    try {
      window.localStorage.setItem(ACCENT_THEME_STORAGE_KEY, JSON.stringify(newTheme));
      setThemeState(newTheme);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const value = {
    theme,
    setTheme,
  };

  return (
    <AccentThemeContext.Provider value={value}>
      {children}
    </AccentThemeContext.Provider>
  );
}

export function useAccentTheme(): AccentThemeContextType {
  const context = useContext(AccentThemeContext);
  if (context === undefined) {
    throw new Error('useAccentTheme must be used within an AccentThemeProvider');
  }
  return context;
}
