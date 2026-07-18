import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const { user } = useAuth();
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || user?.preferences?.appearance?.theme || 'system';
  });

  const applyTheme = (themeName) => {
    const root = document.documentElement;
    
    // Remove all theme attributes first
    root.removeAttribute('data-theme');

    let effectiveTheme = themeName;

    if (themeName === 'system') {
      // Check system preference
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      effectiveTheme = isDark ? 'dark' : 'light';
    }

    root.setAttribute('data-theme', effectiveTheme);

    // Save to localStorage
    localStorage.setItem('theme', themeName);
  };

  // Apply theme whenever it changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Listen for system theme changes if using 'system'
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => applyTheme('system');
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Sync with user preferences on login
  useEffect(() => {
    if (user?.preferences?.appearance?.theme) {
      setTheme(user.preferences.appearance.theme);
    }
  }, [user]);

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};