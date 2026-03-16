import { beforeEach, describe, expect, it, vi } from 'vitest';

const invokeMock = vi.hoisted(() => vi.fn());
const tauriState = vi.hoisted(() => ({ enabled: false }));

vi.mock('@tauri-apps/api/core', () => ({
  invoke: invokeMock,
}));

vi.mock('../../../utils/runtime-info', () => ({
  isTauriEnvironment: () => tauriState.enabled,
}));

describe('recipe-native', () => {
  beforeEach(() => {
    tauriState.enabled = false;
    invokeMock.mockReset();
  });

  it('returns null or empty results outside tauri', async () => {
    const recipeNative = await import('./recipe-native');

    await expect(recipeNative.saveNativeRecipeSnapshot('Demo', '{"ok":true}')).resolves.toBeNull();
    await expect(recipeNative.listNativeRecipeSnapshots()).resolves.toEqual([]);
    await expect(recipeNative.readNativeRecipeSnapshot('/tmp/demo.json')).resolves.toBeNull();
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it('invokes native recipe snapshot commands inside tauri', async () => {
    tauriState.enabled = true;
    invokeMock
      .mockResolvedValueOnce('/tmp/recipe-snapshots/demo.json')
      .mockResolvedValueOnce([
        { name: 'demo', path: '/tmp/recipe-snapshots/demo.json', size_bytes: 128, modified_unix_ms: 1700000000000 },
      ])
      .mockResolvedValueOnce('{"version":2}');

    const recipeNative = await import('./recipe-native');

    await expect(recipeNative.saveNativeRecipeSnapshot('Demo', '{"version":2}')).resolves.toBe('/tmp/recipe-snapshots/demo.json');
    await expect(recipeNative.listNativeRecipeSnapshots()).resolves.toHaveLength(1);
    await expect(recipeNative.readNativeRecipeSnapshot('/tmp/recipe-snapshots/demo.json')).resolves.toBe('{"version":2}');

    expect(invokeMock).toHaveBeenNthCalledWith(1, 'save_recipe_snapshot', {
      recipeName: 'Demo',
      content: '{"version":2}',
    });
    expect(invokeMock).toHaveBeenNthCalledWith(2, 'list_recipe_snapshots', undefined);
    expect(invokeMock).toHaveBeenNthCalledWith(3, 'read_recipe_snapshot', {
      path: '/tmp/recipe-snapshots/demo.json',
    });
  });

  it('returns safe fallback values when native commands fail', async () => {
    tauriState.enabled = true;
    invokeMock.mockRejectedValue(new Error('boom'));
    const recipeNative = await import('./recipe-native');

    await expect(recipeNative.saveNativeRecipeSnapshot('Demo', '{"ok":true}')).resolves.toBeNull();
    await expect(recipeNative.listNativeRecipeSnapshots()).resolves.toEqual([]);
    await expect(recipeNative.readNativeRecipeSnapshot('/tmp/missing.json')).resolves.toBeNull();
  });
});
