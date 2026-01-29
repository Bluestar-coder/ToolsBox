import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// 扩展 Vitest 的 expect 方法，支持 jest-dom 匹配器
expect.extend(matchers);

// 每个测试后清理 DOM
afterEach(() => {
  cleanup();
});

const ignoredConsoleMessages: RegExp[] = [
  /An update to .* was not wrapped in act/,
  /Could not parse CSS stylesheet/,
  /Prettier format error/,
  /Error reading from localStorage/,
  /Error importing data/,
  /Potentially unsafe URL parameter value/,
  /Not implemented: navigation to another Document/,
  /Cannot update a component .* while rendering a different component/,
  /Unsupported language for formatting:/,
  /Test error/,
  /ErrorBoundary caught an error/,
];

const shouldIgnoreConsoleMessage = (args: unknown[]) => {
  if (args.length === 0) {
    return false;
  }
  const message = args
    .map((arg) => (arg instanceof Error ? arg.message : String(arg)))
    .join(' ');
  return ignoredConsoleMessages.some((pattern) => pattern.test(message));
};

const originalConsoleError = console.error.bind(console);
const originalConsoleWarn = console.warn.bind(console);

vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
  if (shouldIgnoreConsoleMessage(args)) {
    return;
  }
  originalConsoleError(...args);
});

vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
  if (shouldIgnoreConsoleMessage(args)) {
    return;
  }
  originalConsoleWarn(...args);
});

const ignoredStderrMessages: RegExp[] = [
  /Could not parse CSS stylesheet/,
  /Not implemented: navigation to another Document/,
  /Error reading from localStorage/,
  /Error importing data/,
  /Prettier format error/,
  /Potentially unsafe URL parameter value/,
  /Test error/,
];

const originalStderrWrite = process.stderr.write.bind(process.stderr);
process.stderr.write = ((chunk: unknown, encoding?: BufferEncoding, callback?: (err?: Error | null) => void) => {
  const message = typeof chunk === 'string' ? chunk : Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk);
  if (ignoredStderrMessages.some((pattern) => pattern.test(message))) {
    if (typeof callback === 'function') {
      callback();
    }
    return true;
  }
  return originalStderrWrite(chunk as string, encoding as BufferEncoding, callback);
}) as typeof process.stderr.write;

// Mock Sentry
vi.mock('@sentry/react', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  withScope: vi.fn(),
  BrowserTracing: vi.fn(),
  Replay: vi.fn(),
  init: vi.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage with a working implementation
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock ResizeObserver with a class constructor
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;
