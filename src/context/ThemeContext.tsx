import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { storage, STORAGE_KEYS } from '../utils/storage';
import {
  type ThemeMode,
  type ResolvedTheme,
  isValidTheme,
  computeIsDark,
  applyThemeToDOM
} from '../utils/theme-utils';
import { ThemeContext } from './definitions';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = storage.get<string>(STORAGE_KEYS.THEME);
    return saved && isValidTheme(saved) ? saved : 'light';
  });

  // 计算 isDark 基于当前 theme
  const isDark = useMemo(() => computeIsDark(theme), [theme]);
  const resolvedTheme = useMemo<ResolvedTheme>(() => (isDark ? 'dark' : 'light'), [isDark]);

  // 初始化时应用主题
  useEffect(() => {
    applyThemeToDOM(isDark);
    storage.set(STORAGE_KEYS.THEME, theme);
  }, [theme, isDark]);

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyThemeToDOM(mediaQuery.matches);
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    if (!isValidTheme(newTheme)) return;
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'light';
      return computeIsDark('system') ? 'light' : 'dark';
    });
  }, []);

  const value = useMemo(
    () => ({ theme, resolvedTheme, isDark, setTheme, toggleTheme }),
    [theme, resolvedTheme, isDark, setTheme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
