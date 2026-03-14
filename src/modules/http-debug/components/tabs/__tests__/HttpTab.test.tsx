import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, userEvent, waitFor } from '@/test/utils';
import type { Environment, HistoryEntry, HttpRequestConfig, HttpResponse, KeyValuePair } from '../../../utils/types';
import HttpTab from '../HttpTab';

const mocks = vi.hoisted(() => ({
  isTauriEnvironment: vi.fn(() => false),
  sendHttpRequest: vi.fn<Promise<HttpResponse>, [HttpRequestConfig, KeyValuePair[]]>(),
  getHistory: vi.fn<HistoryEntry[], []>(),
  saveToHistory: vi.fn<void, [HistoryEntry]>(),
  clearHistory: vi.fn<void, []>(),
  loadEnvironments: vi.fn<Environment[], []>(),
  saveEnvironments: vi.fn<void, [Environment[]]>(),
  loadActiveEnvId: vi.fn<string | null, []>(),
  saveActiveEnvId: vi.fn<void, [string | null]>(),
}));

vi.mock('../../../utils/http-client', () => ({
  isTauriEnvironment: mocks.isTauriEnvironment,
  sendHttpRequest: mocks.sendHttpRequest,
}));

vi.mock('../../../utils/history-manager', () => ({
  getHistory: mocks.getHistory,
  saveToHistory: mocks.saveToHistory,
  clearHistory: mocks.clearHistory,
}));

vi.mock('../../../utils/variable-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../utils/variable-engine')>();
  return {
    ...actual,
    loadEnvironments: mocks.loadEnvironments,
    saveEnvironments: mocks.saveEnvironments,
    loadActiveEnvId: mocks.loadActiveEnvId,
    saveActiveEnvId: mocks.saveActiveEnvId,
  };
});

vi.mock('../../http/RequestBuilder', () => ({
  default: ({
    config,
    onChange,
    onSend,
    loading,
  }: {
    config: HttpRequestConfig;
    onChange: (config: HttpRequestConfig) => void;
    onSend: () => void;
    loading: boolean;
  }) => (
    <div>
      <div data-testid="request-url">{config.url}</div>
      <button
        type="button"
        onClick={() =>
          onChange({
            ...config,
            method: 'POST',
            url: 'https://api.example.com/users',
            headers: [{ key: 'X-Test', value: '1', enabled: true }],
            bodyType: 'json',
            body: '{"ok":true}',
          })
        }
      >
        set-request
      </button>
      <button type="button" onClick={onSend} disabled={loading}>
        发送
      </button>
    </div>
  ),
}));

vi.mock('../../http/ResponseViewer', () => ({
  default: ({
    response,
    loading,
    error,
  }: {
    response: HttpResponse | null;
    loading: boolean;
    error: string | null;
  }) => (
    <div>
      <div>{loading ? 'loading' : 'idle'}</div>
      <div>{response ? `response:${response.status}` : 'no-response'}</div>
      <div>{error ? `error:${error}` : 'no-error'}</div>
    </div>
  ),
}));

vi.mock('../../http/HistoryPanel', () => ({
  default: ({
    history,
    onSelect,
    onClear,
  }: {
    history: HistoryEntry[];
    onSelect: (entry: HistoryEntry) => void;
    onClear: () => void;
  }) => (
    <div>
      <div>history:{history.length}</div>
      {history[0] ? (
        <button type="button" onClick={() => onSelect(history[0])}>
          select-history
        </button>
      ) : null}
      <button type="button" onClick={onClear}>
        clear-history
      </button>
    </div>
  ),
}));

vi.mock('../../http/EnvironmentPanel', () => ({
  default: ({
    environments,
    activeEnvId,
    onEnvironmentsChange,
    onActiveEnvChange,
  }: {
    environments: Environment[];
    activeEnvId: string | null;
    onEnvironmentsChange: (environments: Environment[]) => void;
    onActiveEnvChange: (id: string | null) => void;
  }) => (
    <div>
      <div>envs:{environments.length}</div>
      <div>active-env:{activeEnvId ?? 'none'}</div>
      <button
        type="button"
        onClick={() =>
          onEnvironmentsChange([
            {
              id: 'env-updated',
              name: 'Updated Env',
              variables: [{ key: 'api', value: 'v1', enabled: true }],
            },
          ])
        }
      >
        update-envs
      </button>
      <button type="button" onClick={() => onActiveEnvChange('env-updated')}>
        activate-env
      </button>
    </div>
  ),
}));

describe('HttpTab', () => {
  let historyStore: HistoryEntry[];

  beforeEach(() => {
    vi.clearAllMocks();
    historyStore = [];

    mocks.getHistory.mockImplementation(() => [...historyStore]);
    mocks.saveToHistory.mockImplementation((entry) => {
      historyStore.unshift(entry);
    });
    mocks.clearHistory.mockImplementation(() => {
      historyStore = [];
    });

    mocks.loadEnvironments.mockReturnValue([
      {
        id: 'env-1',
        name: 'Dev',
        variables: [
          { key: 'token', value: 'abc', enabled: true },
          { key: 'disabled', value: 'skip', enabled: false },
        ],
      },
    ]);
    mocks.loadActiveEnvId.mockReturnValue('env-1');
    mocks.isTauriEnvironment.mockReturnValue(false);
  });

  it('renders browser warning in browser mode and hides it in tauri mode', () => {
    const { unmount } = render(<HttpTab />);
    expect(screen.getByText(/当前为浏览器环境.*CORS/)).toBeInTheDocument();

    unmount();
    mocks.isTauriEnvironment.mockReturnValue(true);
    render(<HttpTab />);
    expect(screen.queryByText(/CORS/)).not.toBeInTheDocument();
  });

  it('sends request, passes active env variables, saves history and restores selected history', async () => {
    mocks.sendHttpRequest.mockResolvedValue({
      status: 200,
      statusText: 'OK',
      headers: {},
      body: '{"ok":true}',
      size: 10,
      duration: 20,
      contentType: 'application/json',
    });

    render(<HttpTab />);

    expect(screen.getByText('envs:1')).toBeInTheDocument();
    expect(screen.getByText('active-env:env-1')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'set-request' }));
    expect(screen.getByTestId('request-url')).toHaveTextContent('https://api.example.com/users');

    await userEvent.click(screen.getByRole('button', { name: '发送' }));

    await waitFor(() => {
      expect(mocks.sendHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: 'https://api.example.com/users',
          bodyType: 'json',
        }),
        [{ key: 'token', value: 'abc', enabled: true }]
      );
    });

    expect(mocks.saveToHistory).toHaveBeenCalled();
    expect(screen.getByText('history:1')).toBeInTheDocument();
    expect(screen.getByText('response:200')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'select-history' }));
    expect(screen.getByTestId('request-url')).toHaveTextContent('https://api.example.com/users');
  });

  it('surfaces network-style errors and does not save failed responses to history', async () => {
    mocks.sendHttpRequest.mockResolvedValue({
      status: 0,
      statusText: 'Error',
      headers: {},
      body: 'network fail',
      size: 0,
      duration: 10,
      contentType: '',
    });

    render(<HttpTab />);

    await userEvent.click(screen.getByRole('button', { name: 'set-request' }));
    await userEvent.click(screen.getByRole('button', { name: '发送' }));

    await waitFor(() => {
      expect(screen.getByText('error:network fail')).toBeInTheDocument();
    });
    expect(mocks.saveToHistory).not.toHaveBeenCalled();
    expect(screen.getByText('history:0')).toBeInTheDocument();
  });

  it('persists environment changes and clears history via panel callbacks', async () => {
    historyStore = [
      {
        id: 'history-1',
        timestamp: Date.now(),
        request: {
          method: 'GET',
          url: 'https://example.com',
          headers: [],
          bodyType: 'none',
          body: '',
        },
      },
    ];
    mocks.getHistory.mockImplementation(() => [...historyStore]);

    render(<HttpTab />);

    expect(screen.getByText('history:1')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'update-envs' }));
    expect(mocks.saveEnvironments).toHaveBeenCalledWith([
      expect.objectContaining({
        id: 'env-updated',
        name: 'Updated Env',
      }),
    ]);

    await userEvent.click(screen.getByRole('button', { name: 'activate-env' }));
    expect(mocks.saveActiveEnvId).toHaveBeenCalledWith('env-updated');

    await userEvent.click(screen.getByRole('button', { name: 'clear-history' }));
    expect(mocks.clearHistory).toHaveBeenCalled();
    expect(screen.getByText('history:0')).toBeInTheDocument();
  });
});
