let operationsInitialized = false;
let operationsInitPromise: Promise<void> | null = null;

/**
 * 同步初始化操作系统
 * 仅在明确需要立即注册时使用
 */
export async function ensureOperationsInitialized(): Promise<void> {
  if (operationsInitialized) {
    return;
  }

  if (import.meta.vitest || import.meta.env.MODE === 'test') {
    return;
  }

  if (!operationsInitPromise) {
    operationsInitPromise = import('./operations').then(({ registerAllOperations }) => {
      registerAllOperations();
      operationsInitialized = true;
    });
  }

  await operationsInitPromise;
}

export default ensureOperationsInitialized;
