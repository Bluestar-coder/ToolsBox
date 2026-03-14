import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { logger } from './logger';
import {
  batchGet,
  batchSet,
  clearAllAppData,
  clearSensitiveData,
  createStorageHook,
  exportData,
  importData,
  sessionStorage as sessionStore,
  STORAGE_KEYS,
  storage,
} from './storage';

describe('Storage Service', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  describe('Basic storage operations', () => {
    it('should store and retrieve data', () => {
      storage.set(STORAGE_KEYS.THEME, 'dark');
      expect(storage.get<string>(STORAGE_KEYS.THEME)).toBe('dark');
    });

    it('should return null for non-existent keys', () => {
      expect(storage.get('non_existent_key')).toBeNull();
    });

    it('should handle complex objects', () => {
      const complexData = { nested: { value: 123 }, array: [1, 2, 3] };
      storage.set('test_key', complexData);
      expect(storage.get('test_key')).toEqual(complexData);
    });

    it('should remove data', () => {
      storage.set(STORAGE_KEYS.THEME, 'dark');
      expect(storage.get<string>(STORAGE_KEYS.THEME)).toBe('dark');
      storage.remove(STORAGE_KEYS.THEME);
      expect(storage.get(STORAGE_KEYS.THEME)).toBeNull();
    });

    it('should handle string values', () => {
      storage.set(STORAGE_KEYS.LANGUAGE, 'zh-CN');
      expect(storage.get<string>(STORAGE_KEYS.LANGUAGE)).toBe('zh-CN');
    });

    it('should handle boolean values', () => {
      storage.set('bool_key', true);
      expect(storage.get<boolean>('bool_key')).toBe(true);
    });

    it('should handle number values', () => {
      storage.set('number_key', 42);
      expect(storage.get<number>('number_key')).toBe(42);
    });

    it('should handle null values', () => {
      storage.set('null_key', null);
      expect(storage.get('null_key')).toBeNull();
    });

    it('should handle arrays', () => {
      const arrayData = [1, 2, 3, 4, 5];
      storage.set('array_key', arrayData);
      expect(storage.get<number[]>('array_key')).toEqual(arrayData);
    });
  });

  describe('Error handling', () => {
    it('should handle JSON parse errors gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      localStorage.setItem('invalid_json', 'invalid json{{{');
      expect(storage.get('invalid_json')).toBeNull();
      consoleErrorSpy.mockRestore();
    });

    it('should handle localStorage quota errors', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn(() => {
        throw new DOMException('QuotaExceededError');
      });

      expect(() => storage.set('test_key', 'data')).not.toThrow();

      Storage.prototype.setItem = originalSetItem;
      consoleErrorSpy.mockRestore();
    });

    it('should handle localStorage getItem errors', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const originalGetItem = Storage.prototype.getItem;
      Storage.prototype.getItem = vi.fn(() => {
        throw new Error('getItem error');
      });

      expect(storage.get('test_key')).toBeNull();

      Storage.prototype.getItem = originalGetItem;
      consoleErrorSpy.mockRestore();
    });

    it('should handle localStorage remove and clear errors', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const removeSpy = vi.spyOn(window.localStorage, 'removeItem').mockImplementation(() => {
        throw new Error('removeItem error');
      });
      const clearSpy = vi.spyOn(window.localStorage, 'clear').mockImplementation(() => {
        throw new Error('clear error');
      });

      try {
        expect(() => storage.remove('test_key')).not.toThrow();
        expect(() => storage.clear()).not.toThrow();
        expect(removeSpy).toHaveBeenCalled();
        expect(clearSpy).toHaveBeenCalled();
        expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
      } finally {
        removeSpy.mockRestore();
        clearSpy.mockRestore();
        consoleErrorSpy.mockRestore();
      }
    });
  });

  describe('Session storage service', () => {
    it('should store, read and remove session values', () => {
      sessionStore.set('temp_key', { step: 1 });
      expect(sessionStore.get<{ step: number }>('temp_key')).toEqual({ step: 1 });

      sessionStore.remove('temp_key');
      expect(sessionStore.get('temp_key')).toBeNull();
    });

    it('should handle session storage errors gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const originalSetItem = Storage.prototype.setItem;
      const originalRemoveItem = Storage.prototype.removeItem;
      const originalClear = Storage.prototype.clear;

      try {
        window.sessionStorage.setItem('bad_json', '{bad');
        expect(sessionStore.get('bad_json')).toBeNull();

        Storage.prototype.setItem = vi.fn(() => {
          throw new Error('session set error');
        });
        Storage.prototype.removeItem = vi.fn(() => {
          throw new Error('session remove error');
        });
        Storage.prototype.clear = vi.fn(() => {
          throw new Error('session clear error');
        });

        expect(() => sessionStore.set('temp_key', 'value')).not.toThrow();
        expect(() => sessionStore.remove('temp_key')).not.toThrow();
        expect(() => sessionStore.clear()).not.toThrow();
        expect(consoleErrorSpy).toHaveBeenCalledTimes(3);
      } finally {
        Storage.prototype.setItem = originalSetItem;
        Storage.prototype.removeItem = originalRemoveItem;
        Storage.prototype.clear = originalClear;
        consoleErrorSpy.mockRestore();
      }
    });
  });

  describe('Storage helpers', () => {
    it('should provide typed storage hooks with defaults', () => {
      const themeHook = createStorageHook(STORAGE_KEYS.THEME, 'light');

      expect(themeHook.get()).toBe('light');

      themeHook.set('dark');
      expect(themeHook.get()).toBe('dark');

      themeHook.remove();
      expect(themeHook.get()).toBe('light');
    });

    it('should support batch reads and writes', () => {
      batchSet(
        {
          theme: 'dark',
          language: 'zh-CN',
          currentModule: 'crypto',
        },
        {
          theme: STORAGE_KEYS.THEME,
          language: STORAGE_KEYS.LANGUAGE,
          currentModule: STORAGE_KEYS.CURRENT_MODULE,
        }
      );

      const result = batchGet<{
        theme: string;
        language: string;
        currentModule: string;
      }>({
        theme: STORAGE_KEYS.THEME,
        language: STORAGE_KEYS.LANGUAGE,
        currentModule: STORAGE_KEYS.CURRENT_MODULE,
      });

      expect(result).toEqual({
        theme: 'dark',
        language: 'zh-CN',
        currentModule: 'crypto',
      });
    });

    it('should clear only sensitive crypto data', () => {
      storage.set(STORAGE_KEYS.CRYPTO_INPUT, 'secret');
      storage.set(STORAGE_KEYS.CRYPTO_OUTPUT, 'cipher');
      storage.set(STORAGE_KEYS.THEME, 'dark');

      clearSensitiveData();

      expect(storage.get(STORAGE_KEYS.CRYPTO_INPUT)).toBeNull();
      expect(storage.get(STORAGE_KEYS.CRYPTO_OUTPUT)).toBeNull();
      expect(storage.get(STORAGE_KEYS.THEME)).toBe('dark');
    });
  });

  describe('clearAllAppData', () => {
    it('should clear all application data', () => {
      storage.set(STORAGE_KEYS.THEME, 'dark');
      storage.set(STORAGE_KEYS.LANGUAGE, 'en-US');
      storage.set(STORAGE_KEYS.ENCODING_INPUT, 'test input');

      clearAllAppData();

      expect(storage.get(STORAGE_KEYS.THEME)).toBeNull();
      expect(storage.get(STORAGE_KEYS.LANGUAGE)).toBeNull();
      expect(storage.get(STORAGE_KEYS.ENCODING_INPUT)).toBeNull();
    });

    it('should not affect other localStorage keys', () => {
      storage.set(STORAGE_KEYS.THEME, 'dark');
      localStorage.setItem('other_key', 'other_value');

      clearAllAppData();

      expect(storage.get(STORAGE_KEYS.THEME)).toBeNull();
      expect(localStorage.getItem('other_key')).toBe('other_value');
    });
  });

  describe('exportData and importData', () => {
    it('should export all application data', () => {
      storage.set(STORAGE_KEYS.THEME, 'dark');
      storage.set(STORAGE_KEYS.LANGUAGE, 'en-US');
      storage.set(STORAGE_KEYS.ENCODING_INPUT, 'test input');

      const exported = exportData();
      const data = JSON.parse(exported);

      expect(data[STORAGE_KEYS.THEME]).toBe('dark');
      expect(data[STORAGE_KEYS.LANGUAGE]).toBe('en-US');
      expect(data[STORAGE_KEYS.ENCODING_INPUT]).toBe('test input');
    });

    it('should exclude sensitive crypto data from exports', () => {
      storage.set(STORAGE_KEYS.THEME, 'dark');
      storage.set(STORAGE_KEYS.CRYPTO_INPUT, 'super-secret');
      storage.set(STORAGE_KEYS.CRYPTO_OUTPUT, 'cipher-text');

      const exported = JSON.parse(exportData());

      expect(exported[STORAGE_KEYS.THEME]).toBe('dark');
      expect(exported[STORAGE_KEYS.CRYPTO_INPUT]).toBeUndefined();
      expect(exported[STORAGE_KEYS.CRYPTO_OUTPUT]).toBeUndefined();
    });

    it('should import data correctly', () => {
      const dataToImport = {
        [STORAGE_KEYS.THEME]: 'light',
        [STORAGE_KEYS.LANGUAGE]: 'zh-CN',
        [STORAGE_KEYS.ENCODING_TYPE]: 'base64',
      };

      const jsonString = JSON.stringify(dataToImport);
      const result = importData(jsonString);

      expect(result).toBe(true);
      expect(storage.get<string>(STORAGE_KEYS.THEME)).toBe('light');
      expect(storage.get<string>(STORAGE_KEYS.LANGUAGE)).toBe('zh-CN');
      expect(storage.get<string>(STORAGE_KEYS.ENCODING_TYPE)).toBe('base64');
    });

    it('should return false for invalid JSON', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const result = importData('invalid json{{{');
      expect(result).toBe(false);
      consoleErrorSpy.mockRestore();
    });

    it('should reject oversized imports and non-object payloads', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(importData('x'.repeat(10 * 1024 * 1024 + 1))).toBe(false);
      expect(importData('"not-an-object"')).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle empty import data', () => {
      const result = importData('{}');
      expect(result).toBe(true);
    });

    it('should skip unknown, sensitive and oversized values during import', () => {
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
      const largeObject = Object.fromEntries(
        Array.from({ length: 101 }, (_, index) => [`k${index}`, index])
      );

      const result = importData(JSON.stringify({
        unknown_key: 'ignored',
        [STORAGE_KEYS.CRYPTO_INPUT]: 'ignored-sensitive',
        [STORAGE_KEYS.THEME]: 'light',
        [STORAGE_KEYS.LANGUAGE]: 'x'.repeat(1024 * 1024 + 1),
        [STORAGE_KEYS.CURRENT_MODULE]: largeObject,
        [STORAGE_KEYS.ENCODING_TYPE]: 7,
        [STORAGE_KEYS.ENCODING_OPERATION]: true,
        [STORAGE_KEYS.ENCODING_CATEGORY]: { nested: 'ok' },
        [STORAGE_KEYS.ENCODING_OUTPUT]: null,
      }));

      expect(result).toBe(true);
      expect(storage.get<string>(STORAGE_KEYS.THEME)).toBe('light');
      expect(storage.get<string>(STORAGE_KEYS.LANGUAGE)).toBeNull();
      expect(storage.get<Record<string, number>>(STORAGE_KEYS.CURRENT_MODULE)).toBeNull();
      expect(storage.get<number>(STORAGE_KEYS.ENCODING_TYPE)).toBe(7);
      expect(storage.get<boolean>(STORAGE_KEYS.ENCODING_OPERATION)).toBe(true);
      expect(storage.get<Record<string, string>>(STORAGE_KEYS.ENCODING_CATEGORY)).toEqual({ nested: 'ok' });
      expect(storage.get(STORAGE_KEYS.ENCODING_OUTPUT)).toBeNull();
      expect(storage.get(STORAGE_KEYS.CRYPTO_INPUT)).toBeNull();
      expect(warnSpy).toHaveBeenCalled();
    });

    it('should export and import data roundtrip', () => {
      storage.set(STORAGE_KEYS.THEME, 'dark');
      storage.set(STORAGE_KEYS.LANGUAGE, 'en-US');
      storage.set(STORAGE_KEYS.ENCODING_INPUT, 'test input');
      storage.set(STORAGE_KEYS.ENCODING_TYPE, 'base64');

      const exported = exportData();
      clearAllAppData();

      expect(storage.get(STORAGE_KEYS.THEME)).toBeNull();
      expect(storage.get(STORAGE_KEYS.LANGUAGE)).toBeNull();

      importData(exported);

      expect(storage.get<string>(STORAGE_KEYS.THEME)).toBe('dark');
      expect(storage.get<string>(STORAGE_KEYS.LANGUAGE)).toBe('en-US');
      expect(storage.get<string>(STORAGE_KEYS.ENCODING_INPUT)).toBe('test input');
      expect(storage.get<string>(STORAGE_KEYS.ENCODING_TYPE)).toBe('base64');
    });
  });

  describe('STORAGE_KEYS constant', () => {
    it('should have all required keys', () => {
      expect(STORAGE_KEYS.THEME).toBeDefined();
      expect(STORAGE_KEYS.LANGUAGE).toBeDefined();
      expect(STORAGE_KEYS.ENCODING_INPUT).toBeDefined();
      expect(STORAGE_KEYS.ENCODING_OUTPUT).toBeDefined();
      expect(STORAGE_KEYS.ENCODING_TYPE).toBeDefined();
      expect(STORAGE_KEYS.ENCODING_OPERATION).toBeDefined();
      expect(STORAGE_KEYS.ENCODING_CATEGORY).toBeDefined();
      expect(STORAGE_KEYS.CRYPTO_INPUT).toBeDefined();
      expect(STORAGE_KEYS.CRYPTO_OUTPUT).toBeDefined();
      expect(STORAGE_KEYS.CRYPTO_MODE).toBeDefined();
      expect(STORAGE_KEYS.CRYPTO_ALGORITHM).toBeDefined();
      expect(STORAGE_KEYS.CURRENT_MODULE).toBeDefined();
    });

    it('should have keys prefixed with toolsbox_', () => {
      Object.values(STORAGE_KEYS).forEach(key => {
        expect(key).toMatch(/^toolsbox_/);
      });
    });
  });
});
