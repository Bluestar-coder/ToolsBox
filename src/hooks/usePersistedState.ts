import { useState, useEffect, useRef } from 'react';
import { storage, sessionStorage, STORAGE_KEYS } from '../utils/storage';
import type { EncoderType, OperationType } from '../modules/encoder-decoder/utils/encoders';

/**
 * 持久化配置接口
 */
interface PersistConfig<T extends Record<string, unknown>> {
  key: string;
  state: T;
  fields: (keyof T)[];
}

/**
 * 通用状态持久化Hook
 *
 * 统一管理Context状态的持久化，避免多个useEffect导致的性能问题
 *
 * @example
 * ```tsx
 * usePersistedState({
 *   key: 'toolsbox_encoding_state',
 *   state: state,
 *   fields: ['currentInput', 'currentOutput', 'currentType', 'currentOperation']
 * });
 * ```
 */
export function usePersistedContext<T extends Record<string, unknown>>(
  config: PersistConfig<T>
): void {
  const { key, state, fields } = config;

  useEffect(() => {
    const toPersist: Partial<T> = {};
    fields.forEach(field => {
      if (state[field] !== undefined) {
        toPersist[field] = state[field];
      }
    });

    // 批量存储，减少localStorage操作次数
    if (Object.keys(toPersist).length > 0) {
      storage.set(key, toPersist);
    }
  }, [key, state, fields]);
}

/**
 * 使用多个键的持久化Hook（带防抖优化）
 *
 * 对于需要分别存储到不同键的场景，使用防抖来减少localStorage写入次数
 *
 * @example
 * ```tsx
 * useMultiKeyPersistedState({
 *   fields: {
 *     currentInput: 'toolsbox_encoding_input',
 *     currentOutput: 'toolsbox_encoding_output',
 *   },
 *   state: state
 * });
 * ```
 */
export function useMultiKeyPersistedState<
  T extends Record<string, unknown>,
  K extends Record<string, keyof T>
>(config: { fields: K; state: T }): void {
  const { fields, state } = config;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousStateRef = useRef<Record<string, unknown>>({});

  useEffect(() => {
    // 检查哪些字段发生了变化
    const changedFields: Array<{ storageKey: string; stateKey: keyof T; value: T[keyof T] }> = [];

    Object.entries(fields).forEach(([storageKey, stateKey]) => {
      const currentValue = state[stateKey];
      const previousValue = previousStateRef.current[stateKey as string];

      // 只保存发生变化的字段
      if (currentValue !== previousValue) {
        changedFields.push({ storageKey, stateKey, value: currentValue });
        previousStateRef.current[stateKey as string] = currentValue;
      }
    });

    // 如果有字段发生变化，清除之前的定时器并设置新的定时器
    if (changedFields.length > 0) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // 使用防抖，300ms后才写入localStorage
      timeoutRef.current = setTimeout(() => {
        changedFields.forEach(({ storageKey, value }) => {
          if (value !== undefined) {
            storage.set(storageKey, value);
          }
        });
      }, 300);
    }

    // 清理函数
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [fields, state]);
}

/**
 * 持久化状态Hook
 * 使用localStorage存储数据，适用于非敏感数据
 */
export function usePersistedState<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    const stored = storage.get<T>(key);
    return stored !== null ? stored : defaultValue;
  });

  // 更新localStorage
  useEffect(() => {
    storage.set(key, state);
  }, [key, state]);

  return [state, setState];
}

/**
 * 会话状态Hook
 * 使用sessionStorage存储数据，页面关闭后自动清除，适用于临时敏感数据
 */
export function useSessionState<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    const stored = sessionStorage.get<T>(key);
    return stored !== null ? stored : defaultValue;
  });

  // 更新sessionStorage
  useEffect(() => {
    sessionStorage.set(key, state);
  }, [key, state]);

  return [state, setState];
}

// 专用的持久化状态hooks
export function usePersistedTheme() {
  return usePersistedState<'light' | 'dark' | 'system'>(
    STORAGE_KEYS.THEME,
    'light'
  );
}

export function usePersistedLanguage() {
  return usePersistedState<string>(
    STORAGE_KEYS.LANGUAGE,
    'zh-CN'
  );
}

export function usePersistedEncodingState() {
  const [input, setInput] = usePersistedState<string>(
    STORAGE_KEYS.ENCODING_INPUT,
    ''
  );
  const [output, setOutput] = usePersistedState<string>(
    STORAGE_KEYS.ENCODING_OUTPUT,
    ''
  );
  const [type, setType] = usePersistedState<EncoderType>(
    STORAGE_KEYS.ENCODING_TYPE,
    'base64'
  );
  const [operation, setOperation] = usePersistedState<OperationType>(
    STORAGE_KEYS.ENCODING_OPERATION,
    'encode'
  );
  const [category, setCategory] = usePersistedState<string>(
    STORAGE_KEYS.ENCODING_CATEGORY,
    'base'
  );

  return {
    input, setInput,
    output, setOutput,
    type, setType,
    operation, setOperation,
    category, setCategory,
  };
}

/**
 * 加密工具状态Hook
 * 使用内部状态，不持久化敏感数据到localStorage
 * 只持久化模式选择等非敏感配置
 */
export function usePersistedCryptoState() {
  // 使用内部状态存储敏感的输入输出数据
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  // 只持久化算法和模式选择（非敏感配置）
  const [mode, setMode] = usePersistedState<string>(
    STORAGE_KEYS.CRYPTO_MODE,
    'classical'
  );
  const [algorithm, setAlgorithm] = usePersistedState<string>(
    STORAGE_KEYS.CRYPTO_ALGORITHM,
    'caesar'
  );

  return {
    input, setInput,
    output, setOutput,
    mode, setMode,
    algorithm, setAlgorithm,
  };
}

export function usePersistedCurrentModule() {
  return usePersistedState<string>(
    STORAGE_KEYS.CURRENT_MODULE,
    'encoder-decoder'
  );
}
