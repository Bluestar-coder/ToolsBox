import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/utils';
import ThemeProvider, { useTheme } from './ThemeContext';

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
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const setDarkButton = screen.getByText('Set Dark');
    setDarkButton.click();

    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    expect(screen.getByTestId('is-dark')).toHaveTextContent('true');
  });

  it('should toggle theme between light and dark', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const toggleButton = screen.getByText('Toggle');
    toggleButton.click();

    expect(screen.getByTestId('theme')).toHaveTextContent('dark');

    toggleButton.click();

    expect(screen.getByTestId('theme')).toHaveTextContent('light');
  });

  it('should apply theme to DOM', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // 初始为light主题
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    const setDarkButton = screen.getByText('Set Dark');
    setDarkButton.click();

    // 切换到dark主题
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('should save theme to localStorage', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(setItemSpy).toHaveBeenCalledWith('app-theme', 'light');

    const setDarkButton = screen.getByText('Set Dark');
    setDarkButton.click();

    expect(setItemSpy).toHaveBeenCalledWith('app-theme', 'dark');

    setItemSpy.mockRestore();
  });

  it('should read theme from localStorage on initialization', () => {
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('dark');

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(getItemSpy).toHaveBeenCalledWith('app-theme');

    getItemSpy.mockRestore();
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
