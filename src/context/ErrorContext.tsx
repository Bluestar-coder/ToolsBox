import React, { createContext, useReducer, useCallback, useMemo, useEffect } from 'react';
import type { ReactNode } from 'react';
import { contextEventBus, CONTEXT_EVENTS, type ErrorOccurredEvent, type EncodingErrorEvent, type CryptoErrorEvent, type PluginErrorEvent } from './ContextEventBus';

// 错误信息类型
interface ErrorInfo {
  message: string;
  type: string;
  stack?: string;
}

// 错误状态类型
interface ErrorState {
  error: ErrorInfo | null;
}

// Action类型
type ErrorAction =
  | { type: 'SET_ERROR'; payload: ErrorInfo }
  | { type: 'CLEAR_ERROR' };

// 初始状态
const initialState: ErrorState = {
  error: null,
};

// 创建上下文
const ErrorContext = createContext<{
  state: ErrorState;
  dispatch: React.Dispatch<ErrorAction>;
  setError: (message: string, type: string, stack?: string) => void;
  clearError: () => void;
}>({
  state: initialState,
  dispatch: () => {},
  setError: () => {},
  clearError: () => {},
});

// Reducer函数
const errorReducer = (state: ErrorState, action: ErrorAction): ErrorState => {
  switch (action.type) {
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

// 上下文提供者组件
interface ErrorProviderProps {
  children: ReactNode;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(errorReducer, initialState);

  // 辅助函数
  const setError = useCallback((message: string, type: string, stack?: string) => {
    dispatch({
      type: 'SET_ERROR',
      payload: { message, type, stack },
    });

    // 发送错误事件到事件总线
    const errorEvent: ErrorOccurredEvent = {
      message,
      type,
      source: type.includes('Encoding') ? 'encoding' :
              type.includes('Crypto') ? 'crypto' :
              type.includes('Plugin') ? 'plugin' : 'general',
      stack,
    };
    contextEventBus.emit(CONTEXT_EVENTS.ERROR_OCCURRED, errorEvent);
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });

    // 发送错误清除事件到事件总线
    contextEventBus.emit(CONTEXT_EVENTS.ERROR_CLEARED, {});
  }, []);

  // 监听来自其他Context的错误事件
  useEffect(() => {
    const unsubscribes: Array<() => void> = [];

    // 监听编码错误
    unsubscribes.push(
      contextEventBus.on<EncodingErrorEvent>(CONTEXT_EVENTS.ENCODING_ERROR, (data) => {
        dispatch({
          type: 'SET_ERROR',
          payload: { message: data.message, type: data.type, stack: data.stack },
        });
      })
    );

    // 监听加密错误
    unsubscribes.push(
      contextEventBus.on<CryptoErrorEvent>(CONTEXT_EVENTS.CRYPTO_ERROR, (data) => {
        dispatch({
          type: 'SET_ERROR',
          payload: { message: data.message, type: `CryptoError:${data.algorithm}`, stack: data.stack },
        });
      })
    );

    // 监听插件错误
    unsubscribes.push(
      contextEventBus.on<PluginErrorEvent>(CONTEXT_EVENTS.PLUGIN_ERROR, (data) => {
        dispatch({
          type: 'SET_ERROR',
          payload: { message: data.message, type: `PluginError:${data.pluginId}`, stack: data.error?.stack },
        });
      })
    );

    // 清理所有订阅
    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  const value = useMemo(
    () => ({
      state,
      dispatch,
      setError,
      clearError,
    }),
    [state, setError, clearError]
  );

  return <ErrorContext.Provider value={value}>{children}</ErrorContext.Provider>;
};

// 导出hook
export const useErrorContext = () => {
  const context = React.useContext(ErrorContext);
  if (!context) {
    throw new Error('useErrorContext must be used within ErrorProvider');
  }
  return context;
};

export { ErrorContext };
export default ErrorProvider;
