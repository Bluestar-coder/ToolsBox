import { beforeEach, describe, expect, it, vi } from 'vitest';

const invokeMock = vi.hoisted(() => vi.fn());

vi.mock('@tauri-apps/api/core', () => ({
  invoke: invokeMock,
}));

describe('runtime-info', () => {
  beforeEach(() => {
    invokeMock.mockReset();
    const runtime = globalThis as typeof globalThis & { __TAURI_INTERNALS__?: unknown };
    delete runtime.__TAURI_INTERNALS__;
  });

  it('detects non-tauri runtime by default', async () => {
    const runtimeInfo = await import('./runtime-info');
    expect(runtimeInfo.isTauriEnvironment()).toBe(false);
    expect(await runtimeInfo.getRuntimeInfo()).toMatchObject({
      desktop: false,
      native_http: false,
      native_fs: false,
      path_opener: false,
      recipe_snapshots_dir: null,
    });
  });

  it('invokes Tauri runtime command when internals are present', async () => {
    const runtime = globalThis as typeof globalThis & { __TAURI_INTERNALS__?: unknown };
    runtime.__TAURI_INTERNALS__ = {};
    invokeMock.mockResolvedValue({
      platform: 'darwin',
      arch: 'aarch64',
      app_version: '1.0.0',
      debug: false,
      desktop: true,
      native_http: true,
      window_state: true,
      native_fs: true,
      path_opener: true,
      hostname: 'mac',
      app_data_dir: '/tmp/data',
      app_config_dir: '/tmp/config',
      temp_dir: '/tmp',
      recipe_snapshots_dir: '/tmp/data/recipe-snapshots',
    });

    const runtimeInfo = await import('./runtime-info');
    await expect(runtimeInfo.getRuntimeInfo()).resolves.toMatchObject({
      desktop: true,
      path_opener: true,
      hostname: 'mac',
      recipe_snapshots_dir: '/tmp/data/recipe-snapshots',
    });
    expect(invokeMock).toHaveBeenCalledWith('get_runtime_info', undefined);
  });

  it('opens runtime paths only inside tauri', async () => {
    const runtimeInfo = await import('./runtime-info');
    expect(await runtimeInfo.openRuntimePath('/tmp/demo')).toBe(false);

    const runtime = globalThis as typeof globalThis & { __TAURI_INTERNALS__?: unknown };
    runtime.__TAURI_INTERNALS__ = {};
    invokeMock.mockResolvedValue(undefined);

    expect(await runtimeInfo.openRuntimePath('/tmp/demo')).toBe(true);
    expect(invokeMock).toHaveBeenCalledWith('open_path_in_system', { path: '/tmp/demo' });
  });
});
