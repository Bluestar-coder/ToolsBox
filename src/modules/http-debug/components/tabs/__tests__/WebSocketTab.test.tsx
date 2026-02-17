import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/utils';
import WebSocketTab from '../WebSocketTab';

// Mock WsClient
const mockConnect = vi.fn();
const mockDisconnect = vi.fn();
const mockSend = vi.fn();
const mockEnableReconnect = vi.fn();
const mockDisableReconnect = vi.fn();

let capturedOnMessage: ((msg: any) => void) | null = null;
let capturedOnStatusChange: ((status: string) => void) | null = null;
let capturedOnError: ((error: string) => void) | null = null;

vi.mock('../../../utils/ws-client', () => {
  class MockWsClient {
    status = 'disconnected';
    connect = mockConnect;
    disconnect = mockDisconnect;
    send = mockSend;
    enableReconnect = mockEnableReconnect;
    disableReconnect = mockDisableReconnect;

    set onMessage(fn: (msg: any) => void) {
      capturedOnMessage = fn;
    }
    set onStatusChange(fn: (status: string) => void) {
      capturedOnStatusChange = fn;
    }
    set onError(fn: (error: string) => void) {
      capturedOnError = fn;
    }
  }
  return { WsClient: MockWsClient };
});

describe('WebSocketTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedOnMessage = null;
    capturedOnStatusChange = null;
    capturedOnError = null;
  });

  it('should render ConnectionPanel, MessageComposer, and MessageLog', () => {
    render(<WebSocketTab />);

    // ConnectionPanel: URL input placeholder
    expect(screen.getByPlaceholderText(/WebSocket URL/)).toBeInTheDocument();

    // MessageComposer: text/binary radio buttons
    expect(screen.getByText('文本')).toBeInTheDocument();

    // MessageLog: empty state
    expect(screen.getByText('暂无消息')).toBeInTheDocument();

    // Auto-reconnect section
    expect(screen.getByText('自动重连')).toBeInTheDocument();
    expect(screen.getByText('启用自动重连')).toBeInTheDocument();
  });

  it('should disable message sending when not connected', () => {
    render(<WebSocketTab />);

    const sendButton = screen.getByText('发送').closest('button');
    expect(sendButton).toBeDisabled();
  });

  it('should show reconnect config fields when auto-reconnect is enabled', async () => {
    render(<WebSocketTab />);

    // Initially, interval/maxRetries fields should not be visible
    expect(screen.queryByText('重连间隔 (ms)')).not.toBeInTheDocument();

    // Enable auto-reconnect
    const switchEl = screen.getByRole('switch');
    fireEvent.click(switchEl);

    await waitFor(() => {
      expect(screen.getByText('重连间隔 (ms)')).toBeInTheDocument();
      expect(screen.getByText('最大重连次数')).toBeInTheDocument();
    });
  });

  it('should call WsClient.enableReconnect when reconnect is toggled on', async () => {
    render(<WebSocketTab />);

    const switchEl = screen.getByRole('switch');
    fireEvent.click(switchEl);

    await waitFor(() => {
      expect(mockEnableReconnect).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: true,
          interval: 3000,
          maxRetries: 5,
        }),
      );
    });
  });

  it('should call WsClient.disableReconnect when reconnect is toggled off', async () => {
    render(<WebSocketTab />);

    // Enable first
    const switchEl = screen.getByRole('switch');
    fireEvent.click(switchEl);

    await waitFor(() => {
      expect(mockEnableReconnect).toHaveBeenCalled();
    });

    // Disable
    fireEvent.click(switchEl);

    await waitFor(() => {
      expect(mockDisableReconnect).toHaveBeenCalled();
    });
  });

  it('should display messages received via onMessage callback', async () => {
    render(<WebSocketTab />);

    // Simulate receiving a message
    capturedOnMessage?.({
      id: 'msg-1',
      direction: 'received',
      type: 'text',
      content: 'Hello from server',
      timestamp: Date.now(),
    });

    await waitFor(() => {
      expect(screen.getByText('Hello from server')).toBeInTheDocument();
    });
  });

  it('should display error from onError callback', async () => {
    render(<WebSocketTab />);

    capturedOnError?.('Connection refused');

    await waitFor(() => {
      expect(screen.getByText('Connection refused')).toBeInTheDocument();
    });
  });

  it('should call disconnect and cleanup on unmount', () => {
    const { unmount } = render(<WebSocketTab />);
    unmount();

    expect(mockDisconnect).toHaveBeenCalled();
  });
});
