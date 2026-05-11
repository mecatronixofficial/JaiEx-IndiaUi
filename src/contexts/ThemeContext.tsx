'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<
  ThemeContextType | undefined
>(undefined);

/* =========================
   HOOK
========================= */

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      'useTheme must be used within ThemeProvider',
    );
  }

  return context;
};

/* =========================
   PROVIDER
========================= */

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({
  children,
}: ThemeProviderProps) => {
  const [theme, setTheme] =
    useState<Theme>('light');

  /* =========================
     INITIAL LOAD
  ========================= */

  useEffect(() => {
    const storedTheme =
      localStorage.getItem(
        'theme',
      ) as Theme | null;

    if (
      storedTheme === 'light' ||
      storedTheme === 'dark'
    ) {
      setTheme(storedTheme);
      return;
    }

    const systemTheme =
      window.matchMedia(
        '(prefers-color-scheme: dark)',
      ).matches
        ? 'dark'
        : 'light';

    setTheme(systemTheme);
  }, []);

  /* =========================
     APPLY THEME
  ========================= */

  useEffect(() => {
    const root =
      document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    localStorage.setItem(
      'theme',
      theme,
    );
  }, [theme]);

  /* =========================
     TOGGLE
  ========================= */

  const toggleTheme = () => {
    setTheme((prev) =>
      prev === 'light'
        ? 'dark'
        : 'light',
    );
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        isDark: theme === 'dark',
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};