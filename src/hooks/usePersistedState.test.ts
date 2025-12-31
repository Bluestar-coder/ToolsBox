import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  usePersistedState,
  useSessionState,
  usePersistedTheme,
  usePersistedLanguage,
  usePersistedEncodingState,
  usePersistedCryptoState,
  usePersistedCurrentModule,
  useMultiKeyPersistedState,
  usePersistedContext,
} from './usePersistedState';

describe('usePersistedState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Basic usePersistedState Hook', () => {
    it('should initialize with default value when no stored value', () => {
      const { result } = renderHook(() => usePersistedState('test-key', 'default'));

      expect(result.current[0]).toBe('default');
    });

    it('should load stored value from localStorage', () => {
      localStorage.setItem('test-key', JSON.stringify('stored-value'));

      const { result } = renderHook(() => usePersistedState('test-key', 'default'));

      expect(result.current[0]).toBe('stored-value');
    });

    it('should persist state to localStorage on update', async () => {
      const { result } = renderHook(() => usePersistedState('test-key', 'default'));

      act(() => {
        result.current[1]('new-value');
      });

      expect(result.current[0]).toBe('new-value');
      expect(localStorage.getItem('test-key')).toBe(JSON.stringify('new-value'));
    });

    it('should handle updater function', () => {
      const { result } = renderHook(() => usePersistedState<number>('count-key', 0));

      act(() => {
        result.current[1]((prev) => prev + 1);
      });

      expect(result.current[0]).toBe(1);
    });

    it('should handle complex objects', () => {
      const obj = { name: 'test', value: 123 };
      const { result } = renderHook(() => usePersistedState('obj-key', obj));

      act(() => {
        result.current[1]({ ...obj, value: 456 });
      });

      expect(result.current[0]).toEqual({ name: 'test', value: 456 });
    });

    it('should handle null as valid value', () => {
      const { result } = renderHook(() => usePersistedState<string | null>('null-key', 'default'));

      act(() => {
        result.current[1](null);
      });

      expect(result.current[0]).toBe(null);
      expect(localStorage.getItem('null-key')).toBe(JSON.stringify(null));
    });

    it('should handle arrays', () => {
      const { result } = renderHook(() => usePersistedState<number[]>('array-key', []));

      act(() => {
        result.current[1]([1, 2, 3]);
      });

      expect(result.current[0]).toEqual([1, 2, 3]);
    });

    it('should preserve type safety', () => {
      const { result } = renderHook(() => usePersistedState<number>('num-key', 0));

      expect(typeof result.current[0]).toBe('number');

      act(() => {
        result.current[1](42);
      });

      expect(result.current[0]).toBe(42);
    });
  });

  describe('useSessionState Hook', () => {
    it('should initialize with default value', () => {
      const { result } = renderHook(() => useSessionState('session-key', 'default'));

      expect(result.current[0]).toBe('default');
    });

    it('should persist to sessionStorage', () => {
      const { result } = renderHook(() => useSessionState('session-key', 'default'));

      act(() => {
        result.current[1]('session-value');
      });

      expect(result.current[0]).toBe('session-value');
      expect(sessionStorage.getItem('session-key')).toBe(JSON.stringify('session-value'));
    });

    it('should load from sessionStorage', () => {
      sessionStorage.setItem('session-key', JSON.stringify('stored-session'));

      const { result } = renderHook(() => useSessionState('session-key', 'default'));

      expect(result.current[0]).toBe('stored-session');
    });

    it('should not affect localStorage', () => {
      const { result } = renderHook(() => useSessionState('session-key', 'value'));

      act(() => {
        result.current[1]('new-session-value');
      });

      expect(localStorage.getItem('session-key')).toBe(null);
      expect(sessionStorage.getItem('session-key')).toBeTruthy();
    });
  });

  describe('usePersistedTheme Hook', () => {
    it('should initialize with light theme', () => {
      const { result } = renderHook(() => usePersistedTheme());

      expect(result.current[0]).toBe('light');
    });

    it('should allow theme changes', () => {
      const { result } = renderHook(() => usePersistedTheme());

      act(() => {
        result.current[1]('dark');
      });

      expect(result.current[0]).toBe('dark');
    });

    it('should allow system theme', () => {
      const { result } = renderHook(() => usePersistedTheme());

      act(() => {
        result.current[1]('system');
      });

      expect(result.current[0]).toBe('system');
    });
  });

  describe('usePersistedLanguage Hook', () => {
    it('should initialize with zh-CN', () => {
      const { result } = renderHook(() => usePersistedLanguage());

      expect(result.current[0]).toBe('zh-CN');
    });

    it('should allow language changes', () => {
      const { result } = renderHook(() => usePersistedLanguage());

      act(() => {
        result.current[1]('en-US');
      });

      expect(result.current[0]).toBe('en-US');
    });
  });

  describe('usePersistedEncodingState Hook', () => {
    it('should return all encoding state properties', () => {
      const { result } = renderHook(() => usePersistedEncodingState());

      expect(result.current).toHaveProperty('input');
      expect(result.current).toHaveProperty('output');
      expect(result.current).toHaveProperty('type');
      expect(result.current).toHaveProperty('operation');
      expect(result.current).toHaveProperty('category');
      expect(result.current).toHaveProperty('setInput');
      expect(result.current).toHaveProperty('setOutput');
      expect(result.current).toHaveProperty('setType');
      expect(result.current).toHaveProperty('setOperation');
      expect(result.current).toHaveProperty('setCategory');
    });

    it('should initialize with default values', () => {
      const { result } = renderHook(() => usePersistedEncodingState());

      expect(result.current.input).toBe('');
      expect(result.current.output).toBe('');
      expect(result.current.type).toBe('base64');
      expect(result.current.operation).toBe('encode');
      expect(result.current.category).toBe('base');
    });

    it('should update input', () => {
      const { result } = renderHook(() => usePersistedEncodingState());

      act(() => {
        result.current.setInput('test input');
      });

      expect(result.current.input).toBe('test input');
    });

    it('should update output', () => {
      const { result } = renderHook(() => usePersistedEncodingState());

      act(() => {
        result.current.setOutput('test output');
      });

      expect(result.current.output).toBe('test output');
    });

    it('should update type', () => {
      const { result } = renderHook(() => usePersistedEncodingState());

      act(() => {
        result.current.setType('hex');
      });

      expect(result.current.type).toBe('hex');
    });

    it('should update operation', () => {
      const { result } = renderHook(() => usePersistedEncodingState());

      act(() => {
        result.current.setOperation('decode');
      });

      expect(result.current.operation).toBe('decode');
    });

    it('should update category', () => {
      const { result } = renderHook(() => usePersistedEncodingState());

      act(() => {
        result.current.setCategory('url');
      });

      expect(result.current.category).toBe('url');
    });
  });

  describe('usePersistedCryptoState Hook', () => {
    it('should return all crypto state properties', () => {
      const { result } = renderHook(() => usePersistedCryptoState());

      expect(result.current).toHaveProperty('input');
      expect(result.current).toHaveProperty('output');
      expect(result.current).toHaveProperty('mode');
      expect(result.current).toHaveProperty('algorithm');
      expect(result.current).toHaveProperty('setInput');
      expect(result.current).toHaveProperty('setOutput');
      expect(result.current).toHaveProperty('setMode');
      expect(result.current).toHaveProperty('setAlgorithm');
    });

    it('should initialize with default values', () => {
      const { result } = renderHook(() => usePersistedCryptoState());

      expect(result.current.input).toBe('');
      expect(result.current.output).toBe('');
      expect(result.current.mode).toBe('classical');
      expect(result.current.algorithm).toBe('caesar');
    });

    it('should update input (not persisted)', () => {
      const { result } = renderHook(() => usePersistedCryptoState());

      act(() => {
        result.current.setInput('sensitive data');
      });

      expect(result.current.input).toBe('sensitive data');
    });

    it('should update output (not persisted)', () => {
      const { result } = renderHook(() => usePersistedCryptoState());

      act(() => {
        result.current.setOutput('encrypted data');
      });

      expect(result.current.output).toBe('encrypted data');
    });

    it('should update mode (persisted)', () => {
      const { result } = renderHook(() => usePersistedCryptoState());

      act(() => {
        result.current.setMode('modern');
      });

      expect(result.current.mode).toBe('modern');
    });

    it('should update algorithm (persisted)', () => {
      const { result } = renderHook(() => usePersistedCryptoState());

      act(() => {
        result.current.setAlgorithm('aes');
      });

      expect(result.current.algorithm).toBe('aes');
    });

    it('should not persist input/output to localStorage', () => {
      const { result } = renderHook(() => usePersistedCryptoState());

      act(() => {
        result.current.setInput('test');
        result.current.setOutput('result');
      });

      // Check that crypto input/output keys don't exist in localStorage
      const keys = Object.keys(localStorage);
      const hasCryptoInput = keys.some(k => k.includes('CRYPTO_INPUT'));
      const hasCryptoOutput = keys.some(k => k.includes('CRYPTO_OUTPUT'));
      expect(hasCryptoInput).toBe(false);
      expect(hasCryptoOutput).toBe(false);
    });
  });

  describe('usePersistedCurrentModule Hook', () => {
    it('should initialize with encoder-decoder', () => {
      const { result } = renderHook(() => usePersistedCurrentModule());

      expect(result.current[0]).toBe('encoder-decoder');
    });

    it('should allow module changes', () => {
      const { result } = renderHook(() => usePersistedCurrentModule());

      act(() => {
        result.current[1]('crypto-tool');
      });

      expect(result.current[0]).toBe('crypto-tool');
    });
  });

  describe('useMultiKeyPersistedState Hook', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should persist state with debounce', async () => {
      const mockState = { field1: 'value1', field2: 'value2' };

      const { rerender } = renderHook(
        ({ state }) => useMultiKeyPersistedState({
          fields: { storage1: 'field1', storage2: 'field2' },
          state,
        }),
        { initialProps: { state: mockState } }
      );

      // Update state
      const newState = { field1: 'new-value1', field2: 'value2' };
      rerender({ state: newState });

      // Should not be saved immediately
      expect(localStorage.getItem('storage1')).not.toBe(JSON.stringify('new-value1'));

      // Fast forward past debounce time
      act(() => {
        vi.advanceTimersByTime(350);
      });

      // Now should be saved
      expect(localStorage.getItem('storage1')).toBe(JSON.stringify('new-value1'));
    });

    it('should debounce multiple rapid updates', () => {
      const mockState = { field1: 'value1' };

      const { rerender } = renderHook(
        ({ state }) => useMultiKeyPersistedState({
          fields: { storage1: 'field1' },
          state,
        }),
        { initialProps: { state: mockState } }
      );

      // Make multiple rapid updates
      rerender({ state: { field1: 'value2' } });
      rerender({ state: { field1: 'value3' } });
      rerender({ state: { field1: 'value4' } });

      // Fast forward
      act(() => {
        vi.advanceTimersByTime(350);
      });

      // Should only have the last value
      expect(localStorage.getItem('storage1')).toBe(JSON.stringify('value4'));
    });

    it('should handle undefined values gracefully', () => {
      const mockState = { field1: 'value1', field2: undefined };

      renderHook(
        ({ state }) => useMultiKeyPersistedState({
          fields: { storage1: 'field1', storage2: 'field2' },
          state,
        }),
        { initialProps: { state: mockState } }
      );

      act(() => {
        vi.advanceTimersByTime(350);
      });

      // field1 should be saved, field2 should not
      expect(localStorage.getItem('storage1')).toBe(JSON.stringify('value1'));
      expect(localStorage.getItem('storage2')).toBe(null);
    });
  });

  describe('usePersistedContext Hook', () => {
    it('should persist context state to single key', () => {
      const mockState = { field1: 'value1', field2: 'value2', field3: 'value3' };

      renderHook(
        ({ state }) =>
          usePersistedContext({
            key: 'context-key',
            state,
            fields: ['field1', 'field2'],
          }),
        { initialProps: { state: mockState } }
      );

      const stored = localStorage.getItem('context-key');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveProperty('field1', 'value1');
      expect(parsed).toHaveProperty('field2', 'value2');
      expect(parsed).not.toHaveProperty('field3');
    });

    it('should only persist specified fields', () => {
      const mockState = { field1: 'value1', field2: 'value2', field3: 'value3' };

      renderHook(
        ({ state }) =>
          usePersistedContext({
            key: 'context-key-2',
            state,
            fields: ['field1'],
          }),
        { initialProps: { state: mockState } }
      );

      const stored = localStorage.getItem('context-key-2');
      const parsed = JSON.parse(stored!);
      expect(parsed).toEqual({ field1: 'value1' });
    });

    it('should handle state updates', () => {
      const initialState = { field1: 'value1' };
      const { rerender } = renderHook(
        ({ state }) =>
          usePersistedContext({
            key: 'context-key-3',
            state,
            fields: ['field1'],
          }),
        { initialProps: { state: initialState } }
      );

      const updatedState = { field1: 'updated' };
      rerender({ state: updatedState });

      const stored = localStorage.getItem('context-key-3');
      const parsed = JSON.parse(stored!);
      expect(parsed.field1).toBe('updated');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle corrupted localStorage data', () => {
      localStorage.setItem('test-corrupt', 'invalid-json{{{');

      const { result } = renderHook(() => usePersistedState('test-corrupt', 'default'));

      // Should fall back to default value
      expect(result.current[0]).toBe('default');
    });

    it('should handle rapid state changes', () => {
      const { result } = renderHook(() => usePersistedState<number>('rapid-key', 0));

      for (let i = 1; i <= 10; i++) {
        act(() => {
          result.current[1](i);
        });
      }

      expect(result.current[0]).toBe(10);
    });

    it('should handle boolean values', () => {
      const { result } = renderHook(() => usePersistedState<boolean>('bool-key', false));

      act(() => {
        result.current[1](true);
      });

      expect(result.current[0]).toBe(true);
      expect(localStorage.getItem('bool-key')).toBe('true');
    });

    it('should handle zero as valid value', () => {
      const { result } = renderHook(() => usePersistedState<number>('zero-key', 10));

      act(() => {
        result.current[1](0);
      });

      expect(result.current[0]).toBe(0);
    });

    it('should handle empty string as valid value', () => {
      const { result } = renderHook(() => usePersistedState<string>('empty-key', 'default'));

      act(() => {
        result.current[1]('');
      });

      expect(result.current[0]).toBe('');
    });

    it('should handle special characters in values', () => {
      const special = '测试\n\r\t\\"\'\u00E9';
      const { result } = renderHook(() => usePersistedState('special-key', ''));

      act(() => {
        result.current[1](special);
      });

      expect(result.current[0]).toBe(special);
    });
  });
});
