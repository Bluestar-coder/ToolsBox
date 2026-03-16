import { act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@/test/utils';
import { useContext, useEffect } from 'react';
import { PluginProvider } from './PluginContext';
import { PluginContext } from './definitions';
import { CONTEXT_EVENTS, contextEventBus } from './ContextEventBus';
import { logger } from '../utils/logger';
import type { PluginConfig, PluginEvent, PluginLoadResult, PluginMetadata } from '../plugins/types';

let latestContext: React.ContextType<typeof PluginContext> | undefined;

function Probe() {
  const context = useContext(PluginContext);

  useEffect(() => {
    latestContext = context;
  }, [context]);

  return (
    <div>
      <div data-testid="plugin-loaded">{String(context?.state.loaded)}</div>
      <div data-testid="plugin-list">{context?.state.list.map((plugin) => plugin.id).join(',') ?? ''}</div>
    </div>
  );
}

describe('PluginProvider', () => {
  beforeEach(() => {
    latestContext = undefined;
    contextEventBus.clear();
    vi.restoreAllMocks();
  });

  it('wires plugin manager actions, state updates and cleanup', async () => {
    const logSpy = vi.spyOn(logger, 'log').mockImplementation(() => {});
    const emitSpy = vi.spyOn(contextEventBus, 'emit');

    const pluginConfig: PluginConfig = {
      name: 'Example Plugin',
      version: '1.0.0',
      description: 'example',
      author: 'tester',
      entryPoint: './index.js',
      permissions: [],
    };

    const plugin: PluginMetadata = {
      id: 'example-plugin',
      config: pluginConfig,
      status: 'enabled',
    };

    let currentPlugins: PluginMetadata[] = [];
    let eventHandler: ((event: PluginEvent) => void) | undefined;

    const manager: {
      onEvent: (handler: (event: PluginEvent) => void) => void;
      offEvent: (handler: (event: PluginEvent) => void) => void;
      getPlugins: () => PluginMetadata[];
      loadPlugin: (plugin: PluginConfig) => Promise<PluginLoadResult>;
      enablePlugin: (pluginId: string) => Promise<boolean>;
      disablePlugin: (pluginId: string) => Promise<boolean>;
      unloadPlugin: (pluginId: string) => Promise<boolean>;
    } = {
      onEvent: vi.fn((handler: (event: PluginEvent) => void) => {
        eventHandler = handler;
      }),
      offEvent: vi.fn(),
      getPlugins: vi.fn(() => currentPlugins),
      loadPlugin: vi.fn(async () => ({ success: true, plugin })),
      enablePlugin: vi.fn(async () => true),
      disablePlugin: vi.fn(async () => true),
      unloadPlugin: vi.fn(async () => true),
    };

    const { unmount } = render(
      <PluginProvider pluginManager={manager as unknown as typeof import('../plugins/PluginManager').pluginManager}>
        <Probe />
      </PluginProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('plugin-loaded')).toHaveTextContent('true');
    });

    expect(manager.onEvent).toHaveBeenCalledTimes(1);
    expect(manager.getPlugins).not.toHaveBeenCalled();

    await latestContext?.loadPlugin(pluginConfig);
    await latestContext?.enablePlugin('example-plugin');
    await latestContext?.disablePlugin('example-plugin');
    await latestContext?.unloadPlugin('example-plugin');

    expect(manager.loadPlugin).toHaveBeenCalledWith(pluginConfig);
    expect(manager.enablePlugin).toHaveBeenCalledWith('example-plugin');
    expect(manager.disablePlugin).toHaveBeenCalledWith('example-plugin');
    expect(manager.unloadPlugin).toHaveBeenCalledWith('example-plugin');

    currentPlugins = [plugin];
    await act(async () => {
      eventHandler?.({ type: 'PLUGIN_LOADED', plugin });
      eventHandler?.({ type: 'PLUGIN_ENABLED', plugin });
      eventHandler?.({ type: 'PLUGIN_DISABLED', plugin });
      eventHandler?.({ type: 'PLUGIN_ERROR', plugin, error: 'boom' });
      eventHandler?.({ type: 'PLUGIN_UNLOADED', pluginId: plugin.id });
    });

    expect(logSpy).toHaveBeenCalled();
    expect(emitSpy).toHaveBeenCalledWith(CONTEXT_EVENTS.PLUGIN_LOADED, {
      pluginId: 'example-plugin',
      metadata: plugin,
    });
    expect(emitSpy).toHaveBeenCalledWith(CONTEXT_EVENTS.PLUGIN_ENABLED, {
      pluginId: 'example-plugin',
    });
    expect(emitSpy).toHaveBeenCalledWith(CONTEXT_EVENTS.PLUGIN_DISABLED, {
      pluginId: 'example-plugin',
    });
    expect(emitSpy).toHaveBeenCalledWith(
      CONTEXT_EVENTS.PLUGIN_ERROR,
      expect.objectContaining({
        pluginId: 'example-plugin',
        message: 'boom',
      })
    );

    await waitFor(() => {
      expect(screen.getByTestId('plugin-list')).toHaveTextContent('example-plugin');
    });

    unmount();
    expect(manager.offEvent).toHaveBeenCalledWith(eventHandler);
  });

  it('falls back to unknown plugin ids for partial plugin events', async () => {
    const emitSpy = vi.spyOn(contextEventBus, 'emit');
    vi.spyOn(logger, 'log').mockImplementation(() => {});
    let eventHandler: ((event: PluginEvent) => void) | undefined;

    const manager: {
      onEvent: (handler: (event: PluginEvent) => void) => void;
      offEvent: (handler: (event: PluginEvent) => void) => void;
      getPlugins: () => PluginMetadata[];
      loadPlugin: (plugin: PluginConfig) => Promise<PluginLoadResult>;
      enablePlugin: (pluginId: string) => Promise<boolean>;
      disablePlugin: (pluginId: string) => Promise<boolean>;
      unloadPlugin: (pluginId: string) => Promise<boolean>;
    } = {
      onEvent: vi.fn((handler: (event: PluginEvent) => void) => {
        eventHandler = handler;
      }),
      offEvent: vi.fn(),
      getPlugins: vi.fn(() => []),
      loadPlugin: vi.fn(async () => ({ success: false, error: 'failed' })),
      enablePlugin: vi.fn(async () => false),
      disablePlugin: vi.fn(async () => false),
      unloadPlugin: vi.fn(async () => false),
    };

    render(
      <PluginProvider pluginManager={manager as unknown as typeof import('../plugins/PluginManager').pluginManager}>
        <Probe />
      </PluginProvider>
    );

    await act(async () => {
      eventHandler?.({
        type: 'PLUGIN_LOADED',
        plugin: { id: '', config: {} as PluginConfig, status: 'disabled' },
      });
      eventHandler?.({
        type: 'PLUGIN_ENABLED',
        plugin: { id: '', config: {} as PluginConfig, status: 'disabled' },
      });
      eventHandler?.({
        type: 'PLUGIN_DISABLED',
        plugin: { id: '', config: {} as PluginConfig, status: 'disabled' },
      });
      eventHandler?.({
        type: 'PLUGIN_ERROR',
        plugin: { id: '', config: {} as PluginConfig, status: 'error' },
        error: '',
      });
    });

    expect(emitSpy).toHaveBeenCalledWith(CONTEXT_EVENTS.PLUGIN_LOADED, {
      pluginId: 'unknown',
      metadata: expect.any(Object),
    });
    expect(emitSpy).toHaveBeenCalledWith(CONTEXT_EVENTS.PLUGIN_ENABLED, {
      pluginId: 'unknown',
    });
    expect(emitSpy).toHaveBeenCalledWith(CONTEXT_EVENTS.PLUGIN_DISABLED, {
      pluginId: 'unknown',
    });
    expect(emitSpy).toHaveBeenCalledWith(
      CONTEXT_EVENTS.PLUGIN_ERROR,
      expect.objectContaining({
        pluginId: 'unknown',
        message: 'Unknown plugin error',
      })
    );
  });
});
