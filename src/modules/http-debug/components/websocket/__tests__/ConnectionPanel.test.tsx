import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import ConnectionPanel from '../ConnectionPanel';
import type { WsConnectionConfig, WsConnectionStatus } from '../../../utils/types';

const defaultConfig: WsConnectionConfig = {
  url: '',
  protocols: [],
};

const defaultProps = {
  config: defaultConfig,
  status: 'disconnected' as WsConnectionStatus,
  error: null,
  onChange: vi.fn(),
  onConnect: vi.fn(),
  onDisconnect: vi.fn(),
};

describe('ConnectionPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render URL input and connect button', () => {
    render(<ConnectionPanel {...defaultProps} />);

    expect(screen.getByPlaceholderText(/WebSocket URL/)).toBeInTheDocument();
    expect(screen.getByText('连接')).toBeInTheDocument();
  });

  it('should disable connect button when URL is empty', () => {
    render(<ConnectionPanel {...defaultProps} />);

    const connectBtn = screen.getByText('连接').closest('button');
    expect(connectBtn).toBeDisabled();
  });

  it('should disable connect button when URL is invalid', () => {
    render(
      <ConnectionPanel
        {...defaultProps}
        config={{ url: 'http://invalid', protocols: [] }}
      />,
    );

    const connectBtn = screen.getByText('连接').closest('button');
    expect(connectBtn).toBeDisabled();
  });

  it('should enable connect button when URL is valid ws://', () => {
    render(
      <ConnectionPanel
        {...defaultProps}
        config={{ url: 'ws://localhost:8080', protocols: [] }}
      />,
    );

    const connectBtn = screen.getByText('连接').closest('button');
    expect(connectBtn).not.toBeDisabled();
  });

  it('should enable connect button when URL is valid wss://', () => {
    render(
      <ConnectionPanel
        {...defaultProps}
        config={{ url: 'wss://example.com/ws', protocols: [] }}
      />,
    );

    const connectBtn = screen.getByText('连接').closest('button');
    expect(connectBtn).not.toBeDisabled();
  });

  it('should show validation error for invalid URL', () => {
    render(
      <ConnectionPanel
        {...defaultProps}
        config={{ url: 'http://not-ws', protocols: [] }}
      />,
    );

    expect(screen.getByText(/ws:\/\/ 或 wss:\/\//)).toBeInTheDocument();
  });

  it('should show disconnect button when connected', () => {
    render(
      <ConnectionPanel
        {...defaultProps}
        config={{ url: 'ws://localhost:8080', protocols: [] }}
        status="connected"
      />,
    );

    expect(screen.getByText('断开')).toBeInTheDocument();
    expect(screen.queryByText('连接')).not.toBeInTheDocument();
  });

  it('should show disconnect button when connecting', () => {
    render(
      <ConnectionPanel
        {...defaultProps}
        config={{ url: 'ws://localhost:8080', protocols: [] }}
        status="connecting"
      />,
    );

    expect(screen.getByText('断开')).toBeInTheDocument();
  });

  it('should call onConnect when connect button is clicked', async () => {
    const user = userEvent.setup();
    const onConnect = vi.fn();

    render(
      <ConnectionPanel
        {...defaultProps}
        config={{ url: 'ws://localhost:8080', protocols: [] }}
        onConnect={onConnect}
      />,
    );

    await user.click(screen.getByText('连接'));
    expect(onConnect).toHaveBeenCalledTimes(1);
  });

  it('should call onDisconnect when disconnect button is clicked', async () => {
    const user = userEvent.setup();
    const onDisconnect = vi.fn();

    render(
      <ConnectionPanel
        {...defaultProps}
        config={{ url: 'ws://localhost:8080', protocols: [] }}
        status="connected"
        onDisconnect={onDisconnect}
      />,
    );

    await user.click(screen.getByText('断开'));
    expect(onDisconnect).toHaveBeenCalledTimes(1);
  });

  it('should display connection status for each state', () => {
    const statuses: { status: WsConnectionStatus; label: string }[] = [
      { status: 'disconnected', label: '未连接' },
      { status: 'connecting', label: '连接中' },
      { status: 'connected', label: '已连接' },
      { status: 'closed', label: '已断开' },
    ];

    for (const { status, label } of statuses) {
      const { unmount } = render(
        <ConnectionPanel
          {...defaultProps}
          config={{ url: 'ws://localhost:8080', protocols: [] }}
          status={status}
        />,
      );

      // Badge text + Tag both show the label
      expect(screen.getAllByText(label).length).toBeGreaterThanOrEqual(1);
      unmount();
    }
  });

  it('should display error message when error is provided', () => {
    render(
      <ConnectionPanel
        {...defaultProps}
        error="WebSocket connection error"
      />,
    );

    expect(screen.getByText('WebSocket connection error')).toBeInTheDocument();
  });

  it('should disable URL input when connected', () => {
    render(
      <ConnectionPanel
        {...defaultProps}
        config={{ url: 'ws://localhost:8080', protocols: [] }}
        status="connected"
      />,
    );

    const urlInput = screen.getByPlaceholderText(/WebSocket URL/);
    expect(urlInput).toBeDisabled();
  });

  it('should disable sub-protocol input when connected', () => {
    render(
      <ConnectionPanel
        {...defaultProps}
        config={{ url: 'ws://localhost:8080', protocols: [] }}
        status="connected"
      />,
    );

    const protocolInput = screen.getByPlaceholderText(/graphql-ws/);
    expect(protocolInput).toBeDisabled();
  });

  it('should call onChange when URL is typed', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <ConnectionPanel
        {...defaultProps}
        onChange={onChange}
      />,
    );

    const urlInput = screen.getByPlaceholderText(/WebSocket URL/);
    await user.type(urlInput, 'w');

    expect(onChange).toHaveBeenCalledWith({ url: 'w', protocols: [] });
  });

  it('should display sub-protocols as comma-separated string', () => {
    render(
      <ConnectionPanel
        {...defaultProps}
        config={{ url: '', protocols: ['graphql-ws', 'mqtt'] }}
      />,
    );

    const protocolInput = screen.getByPlaceholderText(/graphql-ws/) as HTMLInputElement;
    expect(protocolInput.value).toBe('graphql-ws, mqtt');
  });

  it('should parse comma-separated protocols on change', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <ConnectionPanel
        {...defaultProps}
        onChange={onChange}
      />,
    );

    const protocolInput = screen.getByPlaceholderText(/graphql-ws/);
    await user.clear(protocolInput);
    await user.type(protocolInput, 'a');

    // The last call should parse the typed value
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall.protocols).toEqual(['a']);
  });
});
