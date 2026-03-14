const ignoredRuntimeWarnings: RegExp[] = [
  /\[antd: message\] Static function can not consume context/i,
  /\[antd: Input\] `addonBefore` is deprecated/i,
  /\[antd: List\] The `List` component is deprecated/i,
];

export function installRuntimeWarningFilter(): void {
  if (typeof console === 'undefined') {
    return;
  }

  const runtimeConsole = console as typeof console & {
    __toolsboxWarningFilterInstalled__?: boolean;
  };

  if (runtimeConsole.__toolsboxWarningFilterInstalled__) {
    return;
  }

  const originalError = console.error.bind(console);

  console.error = (...args: unknown[]) => {
    const message = args
      .map((arg) => (arg instanceof Error ? arg.message : String(arg)))
      .join(' ');

    if (ignoredRuntimeWarnings.some((pattern) => pattern.test(message))) {
      return;
    }

    originalError(...args);
  };

  runtimeConsole.__toolsboxWarningFilterInstalled__ = true;
}
