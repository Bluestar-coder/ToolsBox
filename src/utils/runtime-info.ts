export interface RuntimeInfo {
  platform: string;
  arch: string;
  app_version: string;
  debug: boolean;
  desktop: boolean;
  native_http: boolean;
  window_state: boolean;
  native_fs: boolean;
  path_opener: boolean;
  hostname?: string | null;
  app_data_dir?: string | null;
  app_config_dir?: string | null;
  temp_dir?: string | null;
}

function getWebRuntimeInfo(): RuntimeInfo {
  const browserNavigator = navigator as Navigator & {
    userAgentData?: { platform?: string };
  };
  const platform =
    typeof navigator !== 'undefined'
      ? browserNavigator.userAgentData?.platform || navigator.platform || 'web'
      : 'web';

  return {
    platform,
    arch: 'browser',
    app_version: 'web',
    debug: import.meta.env.DEV,
    desktop: false,
    native_http: false,
    window_state: false,
    native_fs: false,
    path_opener: false,
    hostname: null,
    app_data_dir: null,
    app_config_dir: null,
    temp_dir: null,
  };
}

async function invokeRuntime<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<T>(command, args);
}

export function isTauriEnvironment(): boolean {
  try {
    const tauriGlobal = globalThis as typeof globalThis & { __TAURI_INTERNALS__?: unknown };
    return typeof window !== 'undefined' && !!tauriGlobal.__TAURI_INTERNALS__;
  } catch {
    return false;
  }
}

export async function getRuntimeInfo(): Promise<RuntimeInfo> {
  if (!isTauriEnvironment()) {
    return getWebRuntimeInfo();
  }

  try {
    return await invokeRuntime<RuntimeInfo>('get_runtime_info');
  } catch {
    return getWebRuntimeInfo();
  }
}

export async function openRuntimePath(path: string): Promise<boolean> {
  if (!path || !isTauriEnvironment()) {
    return false;
  }

  try {
    await invokeRuntime('open_path_in_system', { path });
    return true;
  } catch {
    return false;
  }
}
