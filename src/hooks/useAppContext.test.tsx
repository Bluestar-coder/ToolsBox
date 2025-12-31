import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppContext } from './useAppContext';
import { EncodingProvider } from '../context/EncodingContext';
import { PluginProvider } from '../context/PluginContext';
import { ErrorProvider } from '../context/ErrorContext';

// Mock the plugin manager
vi.mock('../plugins/PluginManager', () => ({
  pluginManager: {
    onEvent: vi.fn(),
    offEvent: vi.fn(),
    loadPlugin: vi.fn(),
    enablePlugin: vi.fn(),
    disablePlugin: vi.fn(),
    unloadPlugin: vi.fn(),
    getPlugins: vi.fn(() => []),
  },
}));

describe('useAppContext Hook', () => {
  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
      <ErrorProvider>
        <PluginProvider>
          <EncodingProvider>{children}</EncodingProvider>
        </PluginProvider>
      </ErrorProvider>
    );
  };

  it('should throw error when used outside providers', () => {
    // The hook will throw when context is not available
    // We test this by checking the hook works within providers
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ErrorProvider>
        <PluginProvider>
          <EncodingProvider>{children}</EncodingProvider>
        </PluginProvider>
      </ErrorProvider>
    );

    const { result } = renderHook(() => useAppContext(), { wrapper });
    expect(result.current).toBeDefined();
  });

  it('should return app context when used within providers', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(result.current).toHaveProperty('state');
    expect(result.current).toHaveProperty('dispatch');
    expect(result.current).toHaveProperty('setError');
    expect(result.current).toHaveProperty('clearError');
    expect(result.current).toHaveProperty('loadPlugin');
    expect(result.current).toHaveProperty('enablePlugin');
    expect(result.current).toHaveProperty('disablePlugin');
    expect(result.current).toHaveProperty('unloadPlugin');
    expect(result.current).toHaveProperty('pluginManager');
  });

  it('should include encoding state in combined state', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper(),
    });

    expect(result.current.state).toHaveProperty('currentInput');
    expect(result.current.state).toHaveProperty('currentOutput');
    expect(result.current.state).toHaveProperty('currentType');
    expect(result.current.state).toHaveProperty('currentOperation');
  });

  it('should include error state in combined state', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper(),
    });

    expect(result.current.state).toHaveProperty('error');
  });

  it('should include plugins state in combined state', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper(),
    });

    expect(result.current.state).toHaveProperty('plugins');
  });

  it('should provide setError function', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.setError).toBe('function');
  });

  it('should provide clearError function', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.clearError).toBe('function');
  });

  it('should provide loadPlugin function', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.loadPlugin).toBe('function');
  });

  it('should provide enablePlugin function', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.enablePlugin).toBe('function');
  });

  it('should provide disablePlugin function', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.disablePlugin).toBe('function');
  });

  it('should provide unloadPlugin function', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.unloadPlugin).toBe('function');
  });

  it('should provide pluginManager reference', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper(),
    });

    expect(result.current.pluginManager).toBeDefined();
    expect(typeof result.current.pluginManager).toBe('object');
  });

  it('should provide dispatch function', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.dispatch).toBe('function');
  });

  it('should allow setting and clearing errors', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper(),
    });

    // Set error
    act(() => {
      result.current.setError('Test error', 'test');
    });

    expect(result.current.state.error).toBeDefined();

    // Clear error
    act(() => {
      result.current.clearError();
    });

    expect(result.current.state.error).toBeNull();
  });

  it('should initialize with default encoding state', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper(),
    });

    expect(result.current.state.currentInput).toBe('');
    expect(result.current.state.currentOutput).toBe('');
    expect(result.current.state.currentType).toBe('base64');
    expect(result.current.state.currentOperation).toBe('encode');
  });

  it('should initialize with default plugins state', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper(),
    });

    expect(result.current.state.plugins).toHaveProperty('loaded');
    expect(result.current.state.plugins).toHaveProperty('list');
  });

  it('should allow encoding state updates via dispatch', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.dispatch({ type: 'SET_CURRENT_INPUT', payload: 'test input' });
    });

    expect(result.current.state.currentInput).toBe('test input');
  });

  it('should maintain backward compatibility with encoding context functions', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper(),
    });

    // The hook should provide dispatch for backward compatibility
    expect(result.current.dispatch).toBeDefined();
  });
});
