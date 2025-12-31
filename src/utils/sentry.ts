import * as Sentry from '@sentry/react';

export function initSentry() {
  // 只在生产环境启用
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN || '', // 从环境变量读取
      environment: import.meta.env.MODE,

      // 性能监控 - 使用浏览器路由追踪
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],

      // 采样率
      tracesSampleRate: 0.1, // 10%的性能追踪
      replaysSessionSampleRate: 0.1, // 10%的会话回放
      replaysOnErrorSampleRate: 1.0, // 错误时100%回放

      // 过滤敏感信息
      beforeSend(event, hint) {
        // 移除敏感数据
        if (event.request) {
          delete event.request.cookies;
        }

        // 过滤特定错误
        if (event.exception) {
          const error = hint.originalException;
          if (error instanceof Error) {
            // 忽略某些特定错误
            if (error.message.includes('ResizeObserver')) {
              return null;
            }
          }
        }

        return event;
      },

      // 版本信息
      release: import.meta.env.VITE_APP_VERSION || '1.0.0',

      // 用户上下文
      initialScope: {
        tags: {
          component: 'toolsbox',
        },
      },
    });
  }
}

export function captureError(error: Error, context?: Record<string, unknown>) {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('custom', context);
    }
    Sentry.captureException(error);
  });
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  Sentry.captureMessage(message, level);
}

export function setSentryUser(user: { id?: string; email?: string }) {
  Sentry.setUser(user);
}

export function addSentryBreadcrumb(
  message: string,
  category: string,
  level: 'info' | 'warning' | 'error' = 'info',
  data?: Record<string, unknown>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
  });
}

/**
 * 性能监控包装器
 * 用于追踪关键操作的性能
 */
export function withPerformanceTracking<T>(
  transactionName: string,
  operation: string,
  fn: () => T
): T {
  // 使用Sentry的startSpan代替startTransaction
  return Sentry.startSpan(
    {
      name: transactionName,
      op: operation,
    },
    () => {
      return fn();
    }
  );
}

/**
 * 异步性能监控包装器
 */
export async function withPerformanceTrackingAsync<T>(
  transactionName: string,
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  // 使用Sentry的startSpan代替startTransaction
  return Sentry.startSpan(
    {
      name: transactionName,
      op: operation,
    },
    async () => {
      return await fn();
    }
  );
}
