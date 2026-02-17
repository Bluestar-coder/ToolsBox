import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useLocation, useNavigate } from 'react-router-dom';

/**
 * URL参数白名单验证常量
 * 用于防止路由注入和XSS攻击
 */

// 编码器类型白名单
export const VALID_ENCODER_TYPES = [
  'base64', 'base16', 'base32', 'base32hex', 'base36', 'base64url',
  'base58', 'base62', 'base85', 'base91', 'url', 'html', 'json',
  'unicode', 'utf7', 'utf8', 'utf16be', 'utf16le', 'utf32be', 'utf32le'
] as const;

// 加密算法白名单
export const VALID_CRYPTO_ALGORITHMS = [
  'aes', 'des', '3des', 'rc4', 'rabbit', 'tripledes'
] as const;

// 操作类型白名单
export const VALID_OPERATIONS = ['encode', 'decode', 'encrypt', 'decrypt'] as const;

// 模块ID白名单
export const VALID_MODULES = [
  'encoder-decoder', 'crypto-tool', 'qrcode-tool', 'regex-tool', 'code-formatter'
] as const;

/**
 * 验证编码器类型是否在白名单中
 */
export function isValidEncoderType(type: string): boolean {
  return VALID_ENCODER_TYPES.includes(type as typeof VALID_ENCODER_TYPES[number]);
}

/**
 * 验证加密算法是否在白名单中
 */
export function isValidCryptoAlgorithm(algorithm: string): boolean {
  return VALID_CRYPTO_ALGORITHMS.includes(algorithm as typeof VALID_CRYPTO_ALGORITHMS[number]);
}

/**
 * 验证操作类型是否在白名单中
 */
export function isValidOperation(operation: string): boolean {
  return VALID_OPERATIONS.includes(operation as typeof VALID_OPERATIONS[number]);
}

/**
 * 验证模块ID是否在白名单中
 */
export function isValidModule(moduleId: string): boolean {
  return VALID_MODULES.includes(moduleId as typeof VALID_MODULES[number]);
}

/**
 * 安全的字符串验证，防止XSS
 * 只允许字母、数字、连字符和下划线
 */
export function isValidString(str: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(str);
}

/**
 * URL同步Hook
 * 用于在URL参数和组件状态之间建立双向同步
 * 包含参数验证以防止路由注入
 */
export function useUrlSync<T extends string>(
  paramName: string,
  defaultValue: T,
  options?: {
    /**
     * 是否立即更新URL（默认为true）
     * 如果为false，只有当值变化时才更新URL
     */
    immediate?: boolean;
    /**
     * 自定义序列化函数
     */
    serialize?: (value: T) => string;
    /**
     * 自定义反序列化函数
     */
    deserialize?: (value: string) => T;
    /**
     * 自定义验证函数
     */
    validator?: (value: string) => boolean;
  }
): [T, (value: T) => void] {
  const { immediate = true, serialize, deserialize, validator } = options || {};
  const [searchParams, setSearchParams] = useSearchParams();
  const paramValue = searchParams.get(paramName);
  const [internalValue, setInternalValue] = useState<T>(() => {
    const paramValue = searchParams.get(paramName);
    if (paramValue !== null) {
      // 验证参数值
      if (validator && !validator(paramValue)) {
        console.warn(`Invalid URL parameter value for ${paramName}: ${paramValue}`);
        return defaultValue;
      }
      // 默认安全验证
      if (!validator && !isValidString(paramValue)) {
        console.warn(`Potentially unsafe URL parameter value for ${paramName}: ${paramValue}`);
        return defaultValue;
      }
      return deserialize ? deserialize(paramValue) : (paramValue as T);
    }
    return defaultValue;
  });
  const internalValueRef = useRef(internalValue);
  const serializeRef = useRef(serialize);
  const deserializeRef = useRef(deserialize);
  const validatorRef = useRef(validator);

  useEffect(() => {
    internalValueRef.current = internalValue;
  }, [internalValue]);

  useEffect(() => {
    serializeRef.current = serialize;
    deserializeRef.current = deserialize;
    validatorRef.current = validator;
  }, [serialize, deserialize, validator]);

  // 更新URL参数
  const setValue = (newValue: T) => {
    internalValueRef.current = newValue;
    setInternalValue(newValue);
    const serializeFn = serializeRef.current;
    const serializedValue = serializeFn ? serializeFn(newValue) : String(newValue);
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set(paramName, serializedValue);
      return newParams;
    });
  };

  // 当URL参数变化时更新内部状态
  useEffect(() => {
    if (paramValue !== null) {
      const validatorFn = validatorRef.current;
      // 验证参数值
      if (validatorFn && !validatorFn(paramValue)) {
        console.warn(`Invalid URL parameter value for ${paramName}: ${paramValue}`);
        return;
      }
      // 默认安全验证
      if (!validatorFn && !isValidString(paramValue)) {
        console.warn(`Potentially unsafe URL parameter value for ${paramName}: ${paramValue}`);
        return;
      }
      const deserializeFn = deserializeRef.current;
      const deserializedValue = deserializeFn ? deserializeFn(paramValue) : (paramValue as T);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInternalValue(deserializedValue);
    } else if (immediate && internalValueRef.current !== defaultValue) {
      // 如果URL中没有参数且有默认值，更新URL
      const serializeFn = serializeRef.current;
      const serializedValue = serializeFn
        ? serializeFn(internalValueRef.current)
        : String(internalValueRef.current);
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.set(paramName, serializedValue);
        return newParams;
      });
    }
  }, [
    paramValue,
    paramName,
    immediate,
    defaultValue,
    setSearchParams,
  ]);

  return [internalValue, setValue];
}

/**
 * 路径参数Hook
 * 用于从URL路径中提取参数
 */
export function usePathParam(paramName: string): string | undefined {
  const params = useParams();
  return params[paramName];
}

/**
 * URL状态同步Hook
 * 用于同步多个URL参数
 */
export function useUrlState<T extends Record<string, unknown>>(
  defaultState: T,
  options?: {
    /**
     * 序列化函数映射
     */
    serializers?: Partial<{ [K in keyof T]: (value: T[K]) => string }>;
    /**
     * 反序列化函数映射
     */
    deserializers?: Partial<{ [K in keyof T]: (value: string) => T[K] }>;
  }
): [T, (updates: Partial<T>) => void] {
  const { serializers = {} as Partial<{ [K in keyof T]: (value: T[K]) => string }>, deserializers = {} as Partial<{ [K in keyof T]: (value: string) => T[K] }> } = options || {};
  const [searchParams, setSearchParams] = useSearchParams();
  const serializersRef = useRef(serializers);
  const deserializersRef = useRef(deserializers);

  useEffect(() => {
    serializersRef.current = serializers;
    deserializersRef.current = deserializers;
  }, [serializers, deserializers]);

  // 从URL读取初始状态
  const [state, setState] = useState<T>(() => {
    const newState = { ...defaultState };
    for (const key in defaultState) {
      const paramValue = searchParams.get(key);
      if (paramValue !== null) {
        const deserializer = deserializers[key as keyof T];
        (newState as Record<string, unknown>)[key] = deserializer ? deserializer(paramValue) : paramValue;
      }
    }
    return newState;
  });

  // 更新状态和URL
  const updateState = (updates: Partial<T>) => {
    setState((prev) => {
      const newState = { ...prev, ...updates };
      setSearchParams((prevParams) => {
        const newParams = new URLSearchParams(prevParams);
        for (const key in updates) {
          const serializer = serializersRef.current[key as keyof T];
          const value = updates[key];
          if (value !== undefined && value !== null && value !== '') {
            newParams.set(key, serializer ? serializer(value as T[keyof T]) : String(value));
          } else {
            newParams.delete(key);
          }
        }
        return newParams;
      });
      return newState;
    });
  };

  // 将defaultState存入ref，避免作为useEffect依赖导致无限循环
  const defaultStateRef = useRef(defaultState);
  useEffect(() => {
    defaultStateRef.current = defaultState;
  }, [defaultState]);

  // 当URL参数变化时更新状态
  useEffect(() => {
    const currentDefault = defaultStateRef.current;
    const newState = { ...currentDefault };
    let hasChanges = false;
    for (const key in currentDefault) {
      const paramValue = searchParams.get(key);
      if (paramValue !== null) {
        const deserializer = deserializersRef.current[key as keyof T];
        (newState as Record<string, unknown>)[key] = deserializer ? deserializer(paramValue) : paramValue;
        hasChanges = true;
      }
    }
    if (hasChanges) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState(newState);
    }
  }, [searchParams]);

  return [state, updateState];
}

/**
 * 导航Hook
 * 用于程序化导航
 */
export function useAppNavigate() {
  const navigate = useNavigate();
  const location = useLocation();

  return {
    /**
     * 导航到指定路径
     */
    navigateTo: (path: string, options?: { replace?: boolean; state?: unknown }) => {
      navigate(path, options);
    },
    /**
     * 导航到指定模块
     */
    navigateToModule: (moduleId: string, subType?: string) => {
      const path = subType ? `/${moduleId}/${subType}` : `/${moduleId}`;
      navigate(path);
    },
    /**
     * 当前路径
     */
    currentPath: location.pathname,
    /**
     * 当前搜索参数
     */
    currentSearchParams: location.search,
  };
}
