import { describe, beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { renderWithProviders, screen, userEvent } from '@/test/utils';
import DashboardPage from './DashboardPage';

const mockUseModules = vi.fn(() => []);
const mockGetRuntimeInfo = vi.fn();
const mockOpenRuntimePath = vi.fn();

vi.mock('../hooks/useModules', () => ({
  useModules: () => mockUseModules(),
}));

vi.mock('../utils/runtime-info', () => ({
  getRuntimeInfo: () => mockGetRuntimeInfo(),
  openRuntimePath: (...args: unknown[]) => mockOpenRuntimePath(...args),
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders runtime chips for the web runtime', async () => {
    mockGetRuntimeInfo.mockResolvedValue({
      platform: 'web',
      arch: 'browser',
      app_version: 'web',
      debug: true,
      desktop: false,
      native_http: false,
      window_state: false,
      native_fs: false,
      path_opener: false,
      hostname: null,
      app_data_dir: null,
      app_config_dir: null,
      temp_dir: null,
    });

    renderWithProviders(<DashboardPage />, {
      wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
    });

    expect(await screen.findByText(/Web Runtime/i)).toBeInTheDocument();
    expect(screen.getByText(/Native FS: off/i)).toBeInTheDocument();
    expect(screen.queryByText(/Desktop Quick Actions/i)).not.toBeInTheDocument();
  });

  it('renders desktop quick actions and opens a native path', async () => {
    mockGetRuntimeInfo.mockResolvedValue({
      platform: 'darwin',
      arch: 'aarch64',
      app_version: '0.1.0',
      debug: false,
      desktop: true,
      native_http: true,
      window_state: true,
      native_fs: true,
      path_opener: true,
      hostname: 'toolsbox-dev',
      app_data_dir: '/tmp/toolsbox/data',
      app_config_dir: '/tmp/toolsbox/config',
      temp_dir: '/tmp/toolsbox',
    });
    mockOpenRuntimePath.mockResolvedValue(true);

    renderWithProviders(<DashboardPage />, {
      wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
    });

    expect(await screen.findByText(/Desktop Quick Actions/i)).toBeInTheDocument();
    expect(screen.getByText(/Host: toolsbox-dev/i)).toBeInTheDocument();

    await userEvent.click(screen.getAllByRole('button', { name: /Open Folder/i })[0]);

    expect(mockOpenRuntimePath).toHaveBeenCalledWith('/tmp/toolsbox/data');
  });
});
