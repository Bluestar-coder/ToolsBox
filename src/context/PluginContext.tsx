import React, { useReducer, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { pluginManager } from '../plugins/PluginManager';
import type { PluginConfig, PluginEvent } from '../plugins/types';
import { logger } from '../utils/logger';
import { contextEventBus, CONTEXT_EVENTS, type PluginErrorEvent } from './ContextEventBus';
import {
  type PluginState,
  type PluginAction,
  initialPluginState
} from './types';
import { PluginContext } from './definitions';

// Reducer函数
const pluginReducer = (state: PluginState, action: PluginAction): PluginState => {
  switch (action.type) {
    case 'SET_PLUGINS_LOADED':
      return { ...state, loaded: action.payload };
    case 'UPDATE_PLUGINS_LIST':
      return { ...state, list: action.payload };
    default:
      return state;
  }
};

// 上下文提供者组件
interface PluginProviderProps {
  children: ReactNode;
  pluginManager?: typeof pluginManager; // 允许依赖注入，默认使用单例
}

export const PluginProvider: React.FC<PluginProviderProps> = ({
  children,
  pluginManager: injectedPluginManager = pluginManager // 默认使用单例
}) => {
  const [state, dispatch] = useReducer(pluginReducer, initialPluginState);
  const manager = injectedPluginManager;

  // 初始化插件管理器
  useEffect(() => {
    // 监听插件事件
    const handlePluginEvent = (event: PluginEvent) => {
      logger.log('Plugin Event:', event);

      // 根据事件类型更新状态和发送总线事件
      switch (event.type) {
        case 'PLUGIN_LOADED':
          contextEventBus.emit(CONTEXT_EVENTS.PLUGIN_LOADED, {
            pluginId: event.plugin?.id || 'unknown',
            metadata: event.plugin,
          });
          break;
        case 'PLUGIN_ENABLED':
          contextEventBus.emit(CONTEXT_EVENTS.PLUGIN_ENABLED, {
            pluginId: event.plugin?.id || 'unknown',
          });
          break;
        case 'PLUGIN_DISABLED':
          contextEventBus.emit(CONTEXT_EVENTS.PLUGIN_DISABLED, {
            pluginId: event.plugin?.id || 'unknown',
          });
          break;
        case 'PLUGIN_ERROR': {
          // 发送插件错误事件到总线
          const errorEvent: PluginErrorEvent = {
            pluginId: event.plugin?.id || 'unknown',
            message: event.error || 'Unknown plugin error',
            error: event.error ? new Error(event.error) : undefined,
          };
          contextEventBus.emit(CONTEXT_EVENTS.PLUGIN_ERROR, errorEvent);
          break;
        }
        case 'PLUGIN_UNLOADED':
          // 更新插件列表
          dispatch({
            type: 'UPDATE_PLUGINS_LIST',
            payload: manager.getPlugins(),
          });
          break;
        default:
          break;
      }

      // 更新插件列表
      dispatch({
        type: 'UPDATE_PLUGINS_LIST',
        payload: manager.getPlugins(),
      });
    };

    // 注册事件监听器
    manager.onEvent(handlePluginEvent);

    // 标记插件已加载
    dispatch({ type: 'SET_PLUGINS_LOADED', payload: true });

    // 清理函数
    return () => {
      manager.offEvent(handlePluginEvent);
    };
  }, [manager]);

  // 加载插件的辅助函数
  const loadPlugin = useCallback(async (pluginConfig: PluginConfig) => {
    return await manager.loadPlugin(pluginConfig);
  }, [manager]);

  // 启用插件的辅助函数
  const enablePlugin = useCallback(async (pluginId: string) => {
    return await manager.enablePlugin(pluginId);
  }, [manager]);

  // 禁用插件的辅助函数
  const disablePlugin = useCallback(async (pluginId: string) => {
    return await manager.disablePlugin(pluginId);
  }, [manager]);

  // 卸载插件的辅助函数
  const unloadPlugin = useCallback(async (pluginId: string) => {
    return await manager.unloadPlugin(pluginId);
  }, [manager]);

  const value = useMemo(
    () => ({
      state,
      dispatch,
      loadPlugin,
      enablePlugin,
      disablePlugin,
      unloadPlugin,
      pluginManager: manager,
    }),
    [state, loadPlugin, enablePlugin, disablePlugin, unloadPlugin, manager]
  );

  return <PluginContext.Provider value={value}>{children}</PluginContext.Provider>;
};

export default PluginProvider;
