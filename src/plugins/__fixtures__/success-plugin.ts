type FixtureState = {
  initializeCount: number;
  destroyCount: number;
  registerCount: number;
  unregisterCount: number;
};

const stateKey = '__TOOLSBOX_PLUGIN_FIXTURE__';

function getState(): FixtureState {
  const runtime = globalThis as typeof globalThis & { [stateKey]?: FixtureState };
  if (!runtime[stateKey]) {
    runtime[stateKey] = {
      initializeCount: 0,
      destroyCount: 0,
      registerCount: 0,
      unregisterCount: 0,
    };
  }

  return runtime[stateKey];
}

export default class SuccessPlugin {
  async initialize(): Promise<void> {
    getState().initializeCount += 1;
  }

  async destroy(): Promise<void> {
    getState().destroyCount += 1;
  }

  registerModules(): void {
    getState().registerCount += 1;
  }

  unregisterModules(): void {
    getState().unregisterCount += 1;
  }
}
