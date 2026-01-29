import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import ThemeProvider from './ThemeContext';
import { useTheme } from '../hooks/useTheme';
import { STORAGE_KEYS } from '../utils/storage';

// 测试组件，使用useTheme hook
function TestComponent() {
  const { theme, isDark, setTheme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="is-dark">{String(isDark)}</span>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
      <button onClick={() => setTheme('light')}>Set Light</button>
      <button onClick={toggleTheme}>Toggle</button>
    </div>
  );
}

describe('ThemeContext', () => {
  beforeEach(() => {
    // 清除localStorage mock
    vi.clearAllMocks();
    window.localStorage.clear();
    // 重置document.documentElement属性
    document.documentElement.removeAttribute('data-theme');
  });

  it('should provide default theme', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    expect(screen.getByTestId('theme')).toHaveTextContent('light');
  });

  it('should provide isDark state based on theme', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    expect(screen.getByTestId('is-dark')).toHaveTextContent('false');
  });

  it('should change theme when setTheme is called', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const setDarkButton = screen.getByText('Set Dark');
    await user.click(setDarkButton);

    await waitFor(() => {
      expect(screen.getByTestId('theme')).toHaveTextContent('dark');
      expect(screen.getByTestId('is-dark')).toHaveTextContent('true');
    });
  });

  it('should toggle theme between light and dark', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const toggleButton = screen.getByText('Toggle');
    await user.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    });

    await user.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByTestId('theme')).toHaveTextContent('light');
    });
  });

  it('should apply theme to DOM', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // 初始为light主题
    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    const setDarkButton = screen.getByText('Set Dark');
    await user.click(setDarkButton);

    // 切换到dark主题
    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });
  });

  it('should save theme to localStorage', async () => {
    const user = userEvent.setup();
    const setItemSpy = vi.spyOn(window.localStorage, 'setItem');

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(setItemSpy).toHaveBeenCalledWith(STORAGE_KEYS.THEME, JSON.stringify('light'));
    });

    const setDarkButton = screen.getByText('Set Dark');
    await user.click(setDarkButton);

    await waitFor(() => {
      expect(setItemSpy).toHaveBeenCalledWith(STORAGE_KEYS.THEME, JSON.stringify('dark'));
    });
  });

  it('should read theme from localStorage on initialization', () => {
    window.localStorage.setItem(STORAGE_KEYS.THEME, JSON.stringify('dark'));

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
  });

  it('should handle system theme correctly', () => {
    // Mock matchMedia返回dark mode
    const mockMatchMedia = vi.fn().mockImplementation(query => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    });

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // 验证matchMedia被调用
    expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
  });
});
