import { beforeEach, describe, expect, it, vi } from 'vitest';
import PluginManager from './PluginManager';
import type { Plugin, PluginConfig, PluginEvent, PluginMetadata } from './types';

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

function seedPlugin(manager: PluginManager, metadata: PluginMetadata): void {
  const pluginStore = (manager as unknown as { plugins: Map<string, PluginMetadata> }).plugins;
  pluginStore.set(metadata.id, metadata);
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

  it('rejects duplicate loads and supports listener removal', async () => {
    const manager = new PluginManager();
    const listener = vi.fn();
    manager.onEvent(listener);
    manager.offEvent(listener);

    const firstLoad = await manager.loadPlugin(successConfig);
    const secondLoad = await manager.loadPlugin(successConfig);

    expect(firstLoad.success).toBe(true);
    expect(secondLoad).toMatchObject({
      success: false,
      error: '插件已加载',
    });
    expect(listener).not.toHaveBeenCalled();
    expect(manager.getPlugins()).toHaveLength(1);
  });

  it('returns false when enabling, disabling or unloading an unknown plugin', async () => {
    const manager = new PluginManager();

    await expect(manager.enablePlugin('missing-plugin')).resolves.toBe(false);
    await expect(manager.disablePlugin('missing-plugin')).resolves.toBe(false);
    await expect(manager.unloadPlugin('missing-plugin')).resolves.toBe(false);
  });

  it('re-initializes seeded metadata and rejects unsafe enable entry points', async () => {
    const manager = new PluginManager();
    const events: PluginEvent['type'][] = [];
    manager.onEvent((event) => events.push(event.type));

    seedPlugin(manager, {
      id: 'lazy-plugin-1.0.0',
      config: {
        ...successConfig,
        name: 'lazy-plugin',
      },
      status: 'disabled',
    });

    await expect(manager.enablePlugin('lazy-plugin-1.0.0')).resolves.toBe(true);
    expect(manager.getPluginById('lazy-plugin-1.0.0')).toMatchObject({
      status: 'enabled',
    });
    expect(readFixtureState()).toMatchObject({
      initializeCount: 1,
      registerCount: 1,
    });
    expect(events).toEqual(['PLUGIN_ENABLED']);

    seedPlugin(manager, {
      id: 'unsafe-plugin-1.0.0',
      config: {
        ...successConfig,
        name: 'unsafe-plugin',
        entryPoint: 'data:text/javascript,evil',
      },
      status: 'disabled',
    });

    await expect(manager.enablePlugin('unsafe-plugin-1.0.0')).resolves.toBe(false);
    expect(manager.getPluginById('unsafe-plugin-1.0.0')).toMatchObject({
      status: 'error',
      error: expect.stringContaining('不安全的插件入口点路径'),
    });
  });

  it('surfaces plugin errors when unregister or destroy fails', async () => {
    const manager = new PluginManager();
    const events: PluginEvent[] = [];
    manager.onEvent((event) => events.push(event));

    const unregisterFailurePlugin: Plugin = {
      initialize: vi.fn().mockResolvedValue(undefined),
      destroy: vi.fn().mockResolvedValue(undefined),
      unregisterModules: vi.fn(() => {
        throw new Error('unregister failed');
      }),
    };

    seedPlugin(manager, {
      id: 'broken-disable-1.0.0',
      config: {
        ...successConfig,
        name: 'broken-disable',
      },
      status: 'enabled',
      instance: unregisterFailurePlugin,
    });

    await expect(manager.disablePlugin('broken-disable-1.0.0')).resolves.toBe(false);
    expect(manager.getPluginById('broken-disable-1.0.0')).toMatchObject({
      status: 'error',
      error: 'unregister failed',
    });
    expect(events.at(-1)).toMatchObject({
      type: 'PLUGIN_ERROR',
      error: 'unregister failed',
    });

    const destroyFailurePlugin: Plugin = {
      initialize: vi.fn().mockResolvedValue(undefined),
      destroy: vi.fn().mockRejectedValue(new Error('destroy failed')),
      unregisterModules: vi.fn(),
    };

    seedPlugin(manager, {
      id: 'broken-unload-1.0.0',
      config: {
        ...successConfig,
        name: 'broken-unload',
      },
      status: 'enabled',
      instance: destroyFailurePlugin,
    });

    await expect(manager.unloadPlugin('broken-unload-1.0.0')).resolves.toBe(false);
    expect(manager.getPluginById('broken-unload-1.0.0')).toMatchObject({
      status: 'error',
      error: 'destroy failed',
    });
    expect(events.at(-1)).toMatchObject({
      type: 'PLUGIN_ERROR',
      error: 'destroy failed',
    });
  });
});
