import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useModules } from './useModules';
import { moduleManager } from '../modules';

describe('useModules', () => {
  it('reacts to lazy module registrations', async () => {
    const uniqueId = `test-module-${Date.now()}`;
    const initialCount = moduleManager.getLazyModules().length;

    const { result } = renderHook(() => useModules());
    expect(result.current.length).toBe(initialCount);

    await act(async () => {
      moduleManager.registerLazyModule({
        id: uniqueId,
        name: 'Test Module',
        icon: null,
        description: 'dynamic fixture',
        component: React.lazy(async () => ({ default: () => null })),
      });
    });

    await waitFor(() => {
      expect(result.current.some((module) => module.id === uniqueId)).toBe(true);
      expect(result.current.length).toBe(initialCount + 1);
    });
  });
});
