import { isTauriEnvironment } from '../../../utils/runtime-info';

export interface NativeRecipeSnapshot {
  name: string;
  path: string;
  size_bytes: number;
  modified_unix_ms?: number | null;
}

async function invokeRecipeNative<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<T>(command, args);
}

export async function saveNativeRecipeSnapshot(recipeName: string, content: string): Promise<string | null> {
  if (!isTauriEnvironment() || !recipeName.trim() || !content.trim()) {
    return null;
  }

  try {
    return await invokeRecipeNative<string>('save_recipe_snapshot', {
      recipeName,
      content,
    });
  } catch {
    return null;
  }
}

export async function listNativeRecipeSnapshots(): Promise<NativeRecipeSnapshot[]> {
  if (!isTauriEnvironment()) {
    return [];
  }

  try {
    return await invokeRecipeNative<NativeRecipeSnapshot[]>('list_recipe_snapshots');
  } catch {
    return [];
  }
}

export async function readNativeRecipeSnapshot(path: string): Promise<string | null> {
  if (!isTauriEnvironment() || !path.trim()) {
    return null;
  }

  try {
    return await invokeRecipeNative<string>('read_recipe_snapshot', { path });
  } catch {
    return null;
  }
}
