/**
 * Sentry集成示例
 *
 * 此文件展示如何在项目中使用Sentry进行错误监控和性能追踪
 */

import { captureError, captureMessage, addSentryBreadcrumb, withPerformanceTracking, withPerformanceTrackingAsync } from './sentry';
import type { EncoderType, OperationType } from '../modules/encoder-decoder/utils/encoders';

// ============================================
// 示例1: 在编码操作中添加错误监控
// ============================================

/**
 * 带错误监控的编码函数包装器
 */
export function encodeWithMonitoring(
  type: EncoderType,
  operation: OperationType,
  input: string,
  encodeFn: (input: string) => { success: boolean; data?: string; error?: string }
) {
  // 添加面包屑记录用户操作
  addSentryBreadcrumb(
    `Starting ${operation} operation`,
    'encoder',
    'info',
    { type, inputLength: input.length }
  );

  try {
    // 使用性能监控包装编码操作
    const result = withPerformanceTracking(
      `encode-${type}`,
      operation,
      () => encodeFn(input)
    );

    if (!result.success) {
      // 记录编码失败的错误
      captureMessage(
        `${type} ${operation} failed: ${result.error}`,
        'warning'
      );
    }

    return result;
  } catch (error) {
    // 捕获并上报异常
    captureError(error as Error, {
      type,
      operation,
      inputLength: input.length,
    });
    throw error;
  }
}

// ============================================
// 示例2: 异步操作监控
// ============================================

/**
 * 模拟异步API调用
 */
export async function fetchWithMonitoring(url: string) {
  // 添加面包屑
  addSentryBreadcrumb(
    'API request initiated',
    'network',
    'info',
    { url }
  );

  try {
    // 使用异步性能监控
    const response = await withPerformanceTrackingAsync(
      'api-fetch',
      'http-request',
      async () => {
        const res = await fetch(url);
        return res;
      }
    );

    // 检查响应状态
    if (!response.ok) {
      captureMessage(
        `API request failed: ${response.status} ${response.statusText}`,
        'error'
      );
    }

    return response;
  } catch (error) {
    captureError(error as Error, {
      url,
      action: 'fetch-data',
    });
    throw error;
  }
}

// ============================================
// 示例3: 用户操作追踪
// ============================================

/**
 * 追踪用户在表单中的操作
 */
export function trackFormAction(formName: string, action: string, data?: Record<string, unknown>) {
  addSentryBreadcrumb(
    `Form action: ${action}`,
    'form-interaction',
    'info',
    {
      form: formName,
      ...data,
    }
  );
}

/**
 * 追踪工具切换
 */
export function trackToolSwitch(fromTool: string, toTool: string) {
  addSentryBreadcrumb(
    'Tool switched',
    'navigation',
    'info',
    { from: fromTool, to: toTool }
  );
}

// ============================================
// 示例4: 密码学操作监控
// ============================================

/**
 * 带监控的加密操作
 */
export function cryptoWithMonitoring(
  algorithm: string,
  action: 'encrypt' | 'decrypt',
  data: string,
  cryptoFn: () => string
) {
  // 添加面包屑（不记录敏感数据）
  addSentryBreadcrumb(
    `Crypto operation: ${action}`,
    'cryptography',
    'info',
    {
      algorithm,
      dataLength: data.length,
    }
  );

  try {
    const result = withPerformanceTracking(
      `crypto-${algorithm}`,
      action,
      () => cryptoFn()
    );

    return result;
  } catch (error) {
    captureError(error as Error, {
      algorithm,
      action,
      // 不记录实际的数据内容
      dataLength: data.length,
    });
    throw error;
  }
}

// ============================================
// 示例5: 错误恢复追踪
// ============================================

/**
 * 追踪错误恢复操作
 */
export function trackErrorRecovery(
  originalError: Error,
  recoveryAction: string,
  success: boolean
) {
  if (success) {
    addSentryBreadcrumb(
      'Error recovered successfully',
      'error-recovery',
      'info',
      {
        originalError: originalError.message,
        recoveryAction,
      }
    );
  } else {
    captureMessage(
      `Error recovery failed: ${recoveryAction}`,
      'warning'
    );
  }
}

// ============================================
// 示例6: 性能基准测试
// ============================================

/**
 * 测量关键操作的性能
 */
export function benchmarkOperation<T>(
  operationName: string,
  operation: () => T
): { result: T; duration: number } {
  const start = performance.now();
  const result = withPerformanceTracking(
    operationName,
    'benchmark',
    () => operation()
  );
  const duration = performance.now() - start;

  // 如果操作耗时过长，记录警告
  if (duration > 1000) {
    captureMessage(
      `Performance warning: ${operationName} took ${duration.toFixed(2)}ms`,
      'warning'
    );
  }

  return { result, duration };
}

// ============================================
// 示例7: 资源加载监控
// ============================================

/**
 * 监控模块加载
 */
export function trackModuleLoad(moduleName: string, loadTime: number) {
  addSentryBreadcrumb(
    'Module loaded',
    'module-loading',
    'info',
    {
      module: moduleName,
      loadTime: `${loadTime.toFixed(2)}ms`,
    }
  );

  // 如果加载时间过长
  if (loadTime > 3000) {
    captureMessage(
      `Slow module load: ${moduleName} took ${loadTime.toFixed(2)}ms`,
      'warning'
    );
  }
}

// ============================================
// 使用示例
// ============================================

/*
// 在组件中使用：

import { encodeWithMonitoring, trackFormAction, trackToolSwitch } from '@/utils/sentry-examples';

function EncoderComponent() {
  const handleEncode = () => {
    const result = encodeWithMonitoring(
      'base64',
      'encode',
      inputValue,
      base64Encode
    );
    // ...
  };

  const handleToolChange = (newTool: string) => {
    trackToolSwitch(currentTool, newTool);
    setCurrentTool(newTool);
  };

  const handleFormSubmit = () => {
    trackFormAction('login-form', 'submit', { username: 'user@example.com' });
    // ...
  };

  return (
    // JSX...
  );
}
*/
