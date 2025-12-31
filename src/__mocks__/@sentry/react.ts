import { vi } from 'vitest';

// Mock for @sentry/react
export const captureException = vi.fn();
export const captureMessage = vi.fn();
export const withScope = vi.fn();
export const BrowserTracing = vi.fn();
export const Replay = vi.fn();
export const init = vi.fn();
