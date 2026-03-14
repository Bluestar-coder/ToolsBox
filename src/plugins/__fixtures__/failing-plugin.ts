export default class FailingPlugin {
  async initialize(): Promise<void> {
    throw new Error('fixture initialize failed');
  }

  async destroy(): Promise<void> {
    // noop
  }
}
