import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { EncodingProvider } from '../context/EncodingContext';
import { useEncodingContext } from './useEncodingContext';

describe('useEncodingContext Hook', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <EncodingProvider>{children}</EncodingProvider>
  );

  it('should provide encoding state and helpers', () => {
    const { result } = renderHook(() => useEncodingContext(), { wrapper });

    expect(result.current).toHaveProperty('state');
    expect(result.current).toHaveProperty('dispatch');
    expect(result.current).toHaveProperty('setInput');
    expect(result.current).toHaveProperty('setOutput');
    expect(result.current).toHaveProperty('setType');
    expect(result.current).toHaveProperty('setOperation');
  });

  it('should update input via dispatch', () => {
    const { result } = renderHook(() => useEncodingContext(), { wrapper });

    act(() => {
      result.current.dispatch({ type: 'SET_CURRENT_INPUT', payload: 'test' });
    });

    expect(result.current.state.currentInput).toBe('test');
  });
});
