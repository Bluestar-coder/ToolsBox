import { useEncodingContext } from '../context/EncodingContext';
import { usePluginContext } from '../context/PluginContext';
import { useErrorContext } from '../context/ErrorContext';

/**
 * 自定义Hook，用于访问应用上下文（向后兼容）
 * 组合了 EncodingContext, PluginContext, 和 ErrorContext
 * @returns 应用上下文
 */
export const useAppContext = () => {
  const encodingContext = useEncodingContext();
  const pluginContext = usePluginContext();
  const errorContext = useErrorContext();

  // 组合所有上下文，保持向后兼容
  return {
    state: {
      ...encodingContext.state,
      error: errorContext.state.error,
      plugins: pluginContext.state,
    },
    dispatch: encodingContext.dispatch,
    setError: errorContext.setError,
    clearError: errorContext.clearError,
    loadPlugin: pluginContext.loadPlugin,
    enablePlugin: pluginContext.enablePlugin,
    disablePlugin: pluginContext.disablePlugin,
    unloadPlugin: pluginContext.unloadPlugin,
    pluginManager: pluginContext.pluginManager,
  };
};