import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { storage, STORAGE_KEYS, clearAllAppData, exportData, importData } from './storage';

describe('Storage Service', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
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
      localStorage.setItem('invalid_json', 'invalid json{{{');
      expect(storage.get('invalid_json')).toBeNull();
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
      const result = importData('invalid json{{{');
      expect(result).toBe(false);
    });

    it('should handle empty import data', () => {
      const result = importData('{}');
      expect(result).toBe(true);
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
