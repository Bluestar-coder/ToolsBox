import React, { useReducer, useCallback, useMemo, useEffect } from 'react';
import type { ReactNode } from 'react';
import { contextEventBus, CONTEXT_EVENTS, type ErrorOccurredEvent, type EncodingErrorEvent, type CryptoErrorEvent, type PluginErrorEvent } from './ContextEventBus';
import {
  type ErrorState,
  type ErrorAction,
  initialErrorState
} from './types';
import { ErrorContext } from './definitions';

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
  const [state, dispatch] = useReducer(errorReducer, initialErrorState);

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

export default ErrorProvider;
