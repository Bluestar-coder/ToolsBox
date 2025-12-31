/**
 * Sentry集成测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Sentry - 必须在任何导入之前
vi.mock('@sentry/react', () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  setUser: vi.fn(),
  addBreadcrumb: vi.fn(),
  withScope: vi.fn((callback) => {
    const mockScope = {
      setContext: vi.fn(),
    };
    callback(mockScope);
  }),
  startSpan: vi.fn((_, fn) => fn()),
  browserTracingIntegration: vi.fn(() => ({ name: 'BrowserTracing' })),
  replayIntegration: vi.fn(() => ({ name: 'Replay' })),
}));

// 现在导入被测试的模块
import * as Sentry from '@sentry/react';
import * as sentryModule from './sentry';

describe('Sentry Integration', () => {
  beforeEach(() => {
    // 重置所有mock
    vi.clearAllMocks();
  });

  describe('initSentry', () => {
    it('should not initialize Sentry in development environment', () => {
      // Mock开发环境
      vi.stubGlobal('import.meta', {
        env: {
          PROD: false,
          MODE: 'development',
          VITE_SENTRY_DSN: '',
          VITE_APP_VERSION: '1.0.0',
        },
      });

      sentryModule.initSentry();

      // Sentry.init不应该被调用
      expect(Sentry.init).not.toHaveBeenCalled();
    });
  });

  describe('captureError', () => {
    it('should capture error without context', () => {
      const error = new Error('Test error');
      sentryModule.captureError(error);

      expect(Sentry.withScope).toHaveBeenCalled();
      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });

    it('should capture error with context', () => {
      const error = new Error('Test error');
      const context = { userId: '123', action: 'encode' };

      sentryModule.captureError(error, context);

      expect(Sentry.withScope).toHaveBeenCalled();
      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });
  });

  describe('captureMessage', () => {
    it('should capture message with info level', () => {
      sentryModule.captureMessage('Test message', 'info');

      expect(Sentry.captureMessage).toHaveBeenCalledWith('Test message', 'info');
    });

    it('should capture message with warning level', () => {
      sentryModule.captureMessage('Warning message', 'warning');

      expect(Sentry.captureMessage).toHaveBeenCalledWith('Warning message', 'warning');
    });

    it('should capture message with error level', () => {
      sentryModule.captureMessage('Error message', 'error');

      expect(Sentry.captureMessage).toHaveBeenCalledWith('Error message', 'error');
    });

    it('should default to info level', () => {
      sentryModule.captureMessage('Default message');

      expect(Sentry.captureMessage).toHaveBeenCalledWith('Default message', 'info');
    });
  });

  describe('setSentryUser', () => {
    it('should set user with id and email', () => {
      const user = { id: '123', email: 'test@example.com' };
      sentryModule.setSentryUser(user);

      expect(Sentry.setUser).toHaveBeenCalledWith(user);
    });

    it('should set user with only id', () => {
      const user = { id: '123' };
      sentryModule.setSentryUser(user);

      expect(Sentry.setUser).toHaveBeenCalledWith(user);
    });

    it('should set user with only email', () => {
      const user = { email: 'test@example.com' };
      sentryModule.setSentryUser(user);

      expect(Sentry.setUser).toHaveBeenCalledWith(user);
    });
  });

  describe('addSentryBreadcrumb', () => {
    it('should add breadcrumb with all parameters', () => {
      const message = 'Test breadcrumb';
      const category = 'test';
      const level = 'info' as const;
      const data = { key: 'value' };

      sentryModule.addSentryBreadcrumb(message, category, level, data);

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        message,
        category,
        level,
        data,
      });
    });

    it('should add breadcrumb without data', () => {
      const message = 'Test breadcrumb';
      const category = 'test';
      const level = 'info' as const;

      sentryModule.addSentryBreadcrumb(message, category, level);

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        message,
        category,
        level,
      });
    });

    it('should default to info level', () => {
      const message = 'Test breadcrumb';
      const category = 'test';

      sentryModule.addSentryBreadcrumb(message, category);

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        message,
        category,
        level: 'info',
      });
    });
  });

  describe('Performance Tracking', () => {
    it('should track synchronous performance', () => {
      const result = sentryModule.withPerformanceTracking('test-transaction', 'test-op', () => {
        return 'test-result';
      });

      expect(result).toBe('test-result');
      expect(Sentry.startSpan).toHaveBeenCalled();
    });

    it('should handle errors in synchronous performance tracking', () => {
      expect(() => {
        sentryModule.withPerformanceTracking('test-transaction', 'test-op', () => {
          throw new Error('Test error');
        });
      }).toThrow('Test error');
    });

    it('should track async performance', async () => {
      const result = await sentryModule.withPerformanceTrackingAsync(
        'test-transaction',
        'test-op',
        async () => {
          return 'async-result';
        }
      );

      expect(result).toBe('async-result');
      expect(Sentry.startSpan).toHaveBeenCalled();
    });

    it('should handle errors in async performance tracking', async () => {
      await expect(
        sentryModule.withPerformanceTrackingAsync('test-transaction', 'test-op', async () => {
          throw new Error('Async error');
        })
      ).rejects.toThrow('Async error');
    });
  });
});
