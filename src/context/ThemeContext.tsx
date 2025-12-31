import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { storage } from '../utils/storage';
import { STORAGE_KEYS } from '../utils/storage';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  isDark: false,
  setTheme: () => {},
  toggleTheme: () => {},
});

// 计算实际是否为暗色模式
const computeIsDark = (mode: ThemeMode): boolean => {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return mode === 'dark';
};

// 应用主题到 DOM
const applyThemeToDOM = (dark: boolean): void => {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = storage.get<ThemeMode>(STORAGE_KEYS.THEME);
    return saved || 'light';
  });

  // 计算 isDark 基于当前 theme
  const isDark = useMemo(() => computeIsDark(theme), [theme]);

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
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'light';
      return computeIsDark('system') ? 'light' : 'dark';
    });
  }, []);

  const value = useMemo(() => ({ theme, isDark, setTheme, toggleTheme }), [theme, isDark, setTheme, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export { ThemeContext };

// 导出 useTheme hook 方便在组件中使用
export const useTheme = (): ThemeContextType => {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeProvider;
