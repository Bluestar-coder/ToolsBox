import React, { createContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { EncoderType, OperationType } from '../modules/encoder-decoder/utils/encoders';
import { pluginManager } from '../plugins/PluginManager';
import type { PluginConfig, PluginMetadata, PluginEvent, PluginLoadResult } from '../plugins/types';
import { logger } from '../utils/logger';

/**
 * @deprecated 请使用专用的Context：useEncodingContext, useThemeContext, useErrorContext, usePluginContext
 *
 * 此文件将在v2.0.0版本移除
 *
 * 迁移指南：
 * - useAppContext() → useEncodingContext() (大部分编码/解码相关操作)
 * - useAppContext() → useThemeContext() (主题相关操作)
 * - useAppContext() → useErrorContext() (错误处理相关操作)
 * - useAppContext() → usePluginContext() (插件管理相关操作)
 *
 * 或者使用兼容层：import { useAppContext } from '../hooks/useAppContext'
 */

// 错误信息类型
interface ErrorInfo {
  message: string;
  type: string;
  stack?: string;
}

// 应用状态类型
interface AppState {
  currentInput: string;
  currentOutput: string;
  currentType: EncoderType;
  currentOperation: OperationType;
  error: ErrorInfo | null;
  plugins: {
    loaded: boolean;
    list: PluginMetadata[];
  };
}

// Action类型
type AppAction =
  | { type: 'SET_CURRENT_INPUT'; payload: string }
  | { type: 'SET_CURRENT_OUTPUT'; payload: string }
  | { type: 'SET_CURRENT_TYPE'; payload: EncoderType }
  | { type: 'SET_CURRENT_OPERATION'; payload: OperationType }
  | { type: 'SET_ERROR'; payload: ErrorInfo }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_PLUGINS_LOADED'; payload: boolean }
  | { type: 'UPDATE_PLUGINS_LIST'; payload: PluginMetadata[] };

// 初始状态
const initialState: AppState = {
  currentInput: '',
  currentOutput: '',
  currentType: 'base64',
  currentOperation: 'encode',
  error: null,
  plugins: {
    loaded: false,
    list: []
  }
};

// 创建上下文
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  setError: (message: string, type: string, stack?: string) => void;
  clearError: () => void;
  // 插件管理相关功能
  loadPlugin: (pluginConfig: PluginConfig) => Promise<PluginLoadResult>;
  enablePlugin: (pluginId: string) => Promise<boolean>;
  disablePlugin: (pluginId: string) => Promise<boolean>;
  unloadPlugin: (pluginId: string) => Promise<boolean>;
  pluginManager: typeof pluginManager;
}>({
  state: initialState,
  dispatch: () => {},
  setError: () => {},
  clearError: () => {},
  // 插件管理相关功能默认实现
  loadPlugin: async () => ({ success: false, error: '插件管理器未初始化' }),
  enablePlugin: async () => false,
  disablePlugin: async () => false,
  unloadPlugin: async () => false,
  pluginManager: pluginManager
});

// Reducer函数
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_CURRENT_INPUT':
      return { ...state, currentInput: action.payload, error: null };
    case 'SET_CURRENT_OUTPUT':
      return { ...state, currentOutput: action.payload, error: null };
    case 'SET_CURRENT_TYPE':
      return { ...state, currentType: action.payload, error: null };
    case 'SET_CURRENT_OPERATION':
      return { ...state, currentOperation: action.payload, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'SET_PLUGINS_LOADED':
      return { ...state, plugins: { ...state.plugins, loaded: action.payload } };
    case 'UPDATE_PLUGINS_LIST':
      return { ...state, plugins: { ...state.plugins, list: action.payload } };
    default:
      return state;
  }
};

// 上下文提供者组件
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // 清理历史记录数据
  useEffect(() => {
    // 清除localStorage中的历史记录
    localStorage.removeItem('encoderDecoderHistory');
  }, []);

  // 初始化插件管理器
  useEffect(() => {
    // 监听插件事件
    const handlePluginEvent = (event: PluginEvent) => {
      logger.log('Plugin Event:', event);
      // 根据事件类型更新状态
      switch (event.type) {
        case 'PLUGIN_LOADED':
        case 'PLUGIN_ENABLED':
        case 'PLUGIN_DISABLED':
        case 'PLUGIN_ERROR':
        case 'PLUGIN_UNLOADED':
          // 更新插件列表
          dispatch({
            type: 'UPDATE_PLUGINS_LIST',
            payload: pluginManager.getPlugins()
          });
          break;
        default:
          break;
      }
    };

    // 注册事件监听器
    pluginManager.onEvent(handlePluginEvent);

    // 标记插件已加载
    dispatch({ type: 'SET_PLUGINS_LOADED', payload: true });

    // 清理函数
    return () => {
      pluginManager.offEvent(handlePluginEvent);
    };
  }, []);

  // 设置错误信息的辅助函数
  const setError = (message: string, type: string, stack?: string) => {
    dispatch({ 
      type: 'SET_ERROR', 
      payload: { message, type, stack } 
    });
  };

  // 清除错误信息的辅助函数
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // 加载插件的辅助函数
  const loadPlugin = async (pluginConfig: PluginConfig) => {
    const result = await pluginManager.loadPlugin(pluginConfig);
    if (!result.success && result.error) {
      setError(result.error, 'PluginLoadError');
    }
    return result;
  };

  // 启用插件的辅助函数
  const enablePlugin = async (pluginId: string) => {
    const result = await pluginManager.enablePlugin(pluginId);
    if (!result) {
      setError('启用插件失败', 'PluginEnableError');
    }
    return result;
  };

  // 禁用插件的辅助函数
  const disablePlugin = async (pluginId: string) => {
    const result = await pluginManager.disablePlugin(pluginId);
    if (!result) {
      setError('禁用插件失败', 'PluginDisableError');
    }
    return result;
  };

  // 卸载插件的辅助函数
  const unloadPlugin = async (pluginId: string) => {
    const result = await pluginManager.unloadPlugin(pluginId);
    if (!result) {
      setError('卸载插件失败', 'PluginUnloadError');
    }
    return result;
  };

  return (
    <AppContext.Provider 
      value={{
        state,
        dispatch,
        setError,
        clearError,
        // 插件管理相关功能
        loadPlugin,
        enablePlugin,
        disablePlugin,
        unloadPlugin,
        pluginManager
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// 导出AppContext上下文和AppProvider组件
export { AppContext };
export default AppProvider;
