import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils';
import HttpTab from '../HttpTab';

// Mock http-client
vi.mock('../../../utils/http-client', () => ({
  isTauriEnvironment: vi.fn(() => false),
  sendHttpRequest: vi.fn(),
}));

// Mock history-manager
vi.mock('../../../utils/history-manager', () => ({
  getHistory: vi.fn(() => []),
  saveToHistory: vi.fn(),
  clearHistory: vi.fn(),
}));

// Mock variable-engine persistence
vi.mock('../../../utils/variable-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../utils/variable-engine')>();
  return {
    ...actual,
    loadEnvironments: vi.fn(() => []),
    saveEnvironments: vi.fn(),
    loadActiveEnvId: vi.fn(() => null),
    saveActiveEnvId: vi.fn(),
  };
});

describe('HttpTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should render all sub-components', () => {
    render(<HttpTab />);

    // RequestBuilder: method selector + URL input + send button
    expect(screen.getByText('发送')).toBeInTheDocument();

    // ResponseViewer: empty state
    expect(screen.getByText('发送请求以查看响应')).toBeInTheDocument();

    // HistoryPanel
    expect(screen.getByText('历史记录')).toBeInTheDocument();

    // EnvironmentPanel
    expect(screen.getByText('环境变量')).toBeInTheDocument();
  });

  it('should show CORS warning in browser environment', () => {
    render(<HttpTab />);

    expect(
      screen.getByText(/当前为浏览器环境.*CORS/),
    ).toBeInTheDocument();
  });

  it('should not show CORS warning in Tauri environment', async () => {
    const { isTauriEnvironment } = await import('../../../utils/http-client');
    (isTauriEnvironment as ReturnType<typeof vi.fn>).mockReturnValue(true);

    render(<HttpTab />);

    expect(screen.queryByText(/CORS/)).not.toBeInTheDocument();

    // Reset
    (isTauriEnvironment as ReturnType<typeof vi.fn>).mockReturnValue(false);
  });

  it('should disable send button when URL is empty', () => {
    render(<HttpTab />);

    const sendButton = screen.getByText('发送').closest('button');
    expect(sendButton).toBeDisabled();
  });
});
