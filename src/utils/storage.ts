import { logger } from './logger';

// 存储键名常量
export const STORAGE_KEYS = {
  THEME: 'toolsbox_theme',
  LANGUAGE: 'toolsbox_language',
  ENCODING_INPUT: 'toolsbox_encoding_input',
  ENCODING_OUTPUT: 'toolsbox_encoding_output',
  ENCODING_TYPE: 'toolsbox_encoding_type',
  ENCODING_OPERATION: 'toolsbox_encoding_operation',
  ENCODING_CATEGORY: 'toolsbox_encoding_category',
  CRYPTO_INPUT: 'toolsbox_crypto_input',
  CRYPTO_OUTPUT: 'toolsbox_crypto_output',
  CRYPTO_MODE: 'toolsbox_crypto_mode',
  CRYPTO_ALGORITHM: 'toolsbox_crypto_algorithm',
  CURRENT_MODULE: 'toolsbox_current_module',
} as const;

// 基础存储接口
interface StorageService {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
}

// LocalStorage实现
class LocalStorageService implements StorageService {
  get<T>(key: string): T | null {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      logger.error(`Error reading from localStorage:`, error);
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      logger.error(`Error writing to localStorage:`, error);
    }
  }

  remove(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      logger.error(`Error removing from localStorage:`, error);
    }
  }

  clear(): void {
    try {
      window.localStorage.clear();
    } catch (error) {
      logger.error(`Error clearing localStorage:`, error);
    }
  }
}

// SessionStorage实现（临时数据）
class SessionStorageService implements StorageService {
  get<T>(key: string): T | null {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      logger.error(error);
    }
  }

  remove(key: string): void {
    window.sessionStorage.removeItem(key);
  }

  clear(): void {
    window.sessionStorage.clear();
  }
}

// 导出单例实例
export const storage = new LocalStorageService();
export const sessionStorage = new SessionStorageService();

// 类型安全的存储包装器
export function createStorageHook<T>(key: string, defaultValue: T) {
  return {
    get: (): T => {
      const stored = storage.get<T>(key);
      return stored !== null ? stored : defaultValue;
    },
    set: (value: T): void => {
      storage.set(key, value);
    },
    remove: (): void => {
      storage.remove(key);
    },
  };
}

// 批量操作
export function batchGet<T extends Record<string, unknown>>(keys: Record<keyof T, string>): Partial<T> {
  const result: Partial<T> = {};
  for (const [prop, key] of Object.entries(keys)) {
    const value = storage.get(key);
    if (value !== null) {
      result[prop as keyof T] = value as T[keyof T];
    }
  }
  return result;
}

export function batchSet<T extends Record<string, unknown>>(data: T, keys: Record<keyof T, string>): void {
  for (const [prop, key] of Object.entries(keys)) {
    if (data[prop as keyof T] !== undefined) {
      storage.set(key, data[prop as keyof T]);
    }
  }
}

// 清除所有应用数据
export function clearAllAppData(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    storage.remove(key);
  });
}

/**
 * 清除敏感的加密工具数据
 * 用于迁移已有数据，清除localStorage中的敏感信息
 */
export function clearSensitiveData(): void {
  storage.remove(STORAGE_KEYS.CRYPTO_INPUT);
  storage.remove(STORAGE_KEYS.CRYPTO_OUTPUT);
}

/**
 * 不应导出的敏感键列表
 * 这些键包含用户敏感信息，不应包含在导出数据中
 */
const SENSITIVE_KEYS = [
  STORAGE_KEYS.CRYPTO_INPUT,
  STORAGE_KEYS.CRYPTO_OUTPUT,
] as const;

// 导出数据（用于备份）
export function exportData(): string {
  const data: Record<string, unknown> = {};

  Object.values(STORAGE_KEYS).forEach(key => {
    // 跳过敏感键，不导出敏感信息
    if (SENSITIVE_KEYS.includes(key as typeof SENSITIVE_KEYS[number])) {
      return;
    }
    data[key] = storage.get(key);
  });

  return JSON.stringify(data, null, 2);
}

// 导入数据（用于恢复）
export function importData(jsonString: string): boolean {
  try {
    // 1. 验证数据大小（限制10MB）
    const MAX_IMPORT_SIZE = 10 * 1024 * 1024; // 10MB
    if (jsonString.length > MAX_IMPORT_SIZE) {
      logger.error('Import data size exceeds maximum limit of 10MB');
      return false;
    }

    // 2. 解析JSON
    const data = JSON.parse(jsonString);

    // 3. 验证数据结构
    if (typeof data !== 'object' || data === null) {
      logger.error('Import data must be an object');
      return false;
    }

    // 4. 获取所有合法的存储键
    const validKeys = Object.values(STORAGE_KEYS);

    // 5. 验证并导入每个键值对
    for (const [key, value] of Object.entries(data)) {
      // 检查键名是否合法
      if (!validKeys.includes(key as typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS])) {
        logger.warn(`Unknown storage key during import: ${key}, skipping`);
        continue;
      }

      // 跳过敏感键，不允许导入敏感数据
      if (key === STORAGE_KEYS.CRYPTO_INPUT || key === STORAGE_KEYS.CRYPTO_OUTPUT) {
        logger.warn(`Skipping sensitive key during import: ${key}`);
        continue;
      }

      // 验证值类型
      if (value === null) {
        // null值是允许的
        storage.set(key, value);
      } else if (typeof value === 'string') {
        // 验证字符串长度，防止过长的字符串
        if (value.length <= 1024 * 1024) { // 单个值最大1MB
          storage.set(key, value);
        } else {
          logger.warn(`Value too large for key: ${key}, skipping`);
        }
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        // 基本类型直接存储
        storage.set(key, value);
      } else if (typeof value === 'object') {
        // 验证对象大小，防止过大的嵌套对象
        const keyCount = Object.keys(value).length;
        if (keyCount < 100) { // 最多100个属性
          storage.set(key, value);
        } else {
          logger.warn(`Object has too many properties for key: ${key}, skipping`);
        }
      } else {
        logger.warn(`Unsupported value type for key: ${key}, skipping`);
      }
    }

    return true;
  } catch (error) {
    logger.error('Error importing data:', error);
    return false;
  }
}
