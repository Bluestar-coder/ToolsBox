export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const isValidTheme = (value: string): value is ThemeMode => {
  return value === 'light' || value === 'dark' || value === 'system';
};

// 计算实际是否为暗色模式
export const computeIsDark = (mode: ThemeMode): boolean => {
  if (mode === 'system') {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return mode === 'dark';
};

// 应用主题到 DOM
export const applyThemeToDOM = (dark: boolean): void => {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
};
