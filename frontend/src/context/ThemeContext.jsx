import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

const THEME_OPTIONS = [
  { id: 'light', label: 'Light Theme', description: 'Clean bright interface', icon: '☀️' },
  { id: 'dark', label: 'Dark Theme', description: 'Comfortable for low-light environments', icon: '🌙' },
  { id: 'ocean', label: 'Ocean Theme', description: 'Blue inspired modern interface', icon: '🌊' },
];

export const ThemeProvider = ({ children }) => {
  const { user } = useAuth();
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || user?.preferences?.appearance?.theme || 'dark';
  });

  const applyTheme = (themeName) => {
    const root = document.documentElement;
    root.removeAttribute('data-theme');

    let effectiveTheme = themeName;
    if (themeName === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      effectiveTheme = isDark ? 'dark' : 'light';
    }

    root.setAttribute('data-theme', effectiveTheme);
    localStorage.setItem('theme', themeName);
  };

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (theme !== 'system') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => applyTheme('system');
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  useEffect(() => {
    if (user?.preferences?.appearance?.theme) {
      setTheme(user.preferences.appearance.theme);
    }
  }, [user]);

  const currentTheme = theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      if (prev === 'system') return 'dark';
      const currentIndex = THEME_OPTIONS.findIndex((t) => t.id === prev);
      const nextIndex = (currentIndex + 1) % THEME_OPTIONS.length;
      return THEME_OPTIONS[nextIndex].id;
    });
  }, []);

  const value = useMemo(
    () => ({
      theme,
      currentTheme,
      changeTheme: setTheme,
      toggleTheme,
      availableThemes: THEME_OPTIONS,
    }),
    [theme, currentTheme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
