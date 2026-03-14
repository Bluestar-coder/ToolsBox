import { beforeEach, describe, expect, it, vi } from 'vitest';
import PluginManager from './PluginManager';
import type { PluginConfig, PluginEvent } from './types';

type FixtureState = {
  initializeCount: number;
  destroyCount: number;
  registerCount: number;
  unregisterCount: number;
};

const successConfig: PluginConfig = {
  name: 'fixture-plugin',
  version: '1.0.0',
  description: 'fixture plugin',
  author: 'codex',
  entryPoint: '/src/plugins/__fixtures__/success-plugin.ts',
  permissions: [],
};

const failingConfig: PluginConfig = {
  ...successConfig,
  name: 'failing-plugin',
  entryPoint: '/src/plugins/__fixtures__/failing-plugin.ts',
};

function readFixtureState(): FixtureState {
  const runtime = globalThis as typeof globalThis & { __TOOLSBOX_PLUGIN_FIXTURE__?: FixtureState };
  return runtime.__TOOLSBOX_PLUGIN_FIXTURE__ ?? {
    initializeCount: 0,
    destroyCount: 0,
    registerCount: 0,
    unregisterCount: 0,
  };
}

describe('PluginManager', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    const runtime = globalThis as typeof globalThis & { __TOOLSBOX_PLUGIN_FIXTURE__?: FixtureState };
    delete runtime.__TOOLSBOX_PLUGIN_FIXTURE__;
  });

  it('rejects unsafe entry points', async () => {
    const manager = new PluginManager();
    const result = await manager.loadPlugin({
      ...successConfig,
      entryPoint: 'https://example.com/plugin.js',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('不安全的插件入口点路径');
  });

  it('loads a valid plugin and emits lifecycle events', async () => {
    const manager = new PluginManager();
    const events: PluginEvent['type'][] = [];
    manager.onEvent((event) => events.push(event.type));

    const result = await manager.loadPlugin(successConfig);

    expect(result.success).toBe(true);
    expect(manager.isPluginLoaded('fixture-plugin-1.0.0')).toBe(true);
    expect(manager.isPluginEnabled('fixture-plugin-1.0.0')).toBe(true);
    expect(events).toEqual(['PLUGIN_LOADED', 'PLUGIN_ENABLED']);
    expect(readFixtureState()).toMatchObject({
      initializeCount: 1,
      registerCount: 1,
    });
  });

  it('disables, enables and unloads a plugin instance', async () => {
    const manager = new PluginManager();
    await manager.loadPlugin(successConfig);

    await expect(manager.disablePlugin('fixture-plugin-1.0.0')).resolves.toBe(true);
    expect(manager.isPluginEnabled('fixture-plugin-1.0.0')).toBe(false);

    await expect(manager.enablePlugin('fixture-plugin-1.0.0')).resolves.toBe(true);
    expect(manager.isPluginEnabled('fixture-plugin-1.0.0')).toBe(true);

    await expect(manager.unloadPlugin('fixture-plugin-1.0.0')).resolves.toBe(true);
    expect(manager.isPluginLoaded('fixture-plugin-1.0.0')).toBe(false);
    expect(readFixtureState()).toMatchObject({
      registerCount: 2,
      unregisterCount: 2,
      destroyCount: 1,
    });
  });

  it('marks plugin as error when initialize fails', async () => {
    const manager = new PluginManager();
    const events: PluginEvent[] = [];
    manager.onEvent((event) => events.push(event));

    const result = await manager.loadPlugin(failingConfig);

    expect(result.success).toBe(false);
    expect(result.error).toBe('fixture initialize failed');
    expect(events.at(-1)).toMatchObject({
      type: 'PLUGIN_ERROR',
      error: 'fixture initialize failed',
    });
    expect(manager.getPluginById('failing-plugin-1.0.0')?.status).toBe('error');
  });
});
