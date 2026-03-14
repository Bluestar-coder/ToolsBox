let sentryBrowserPromise: Promise<typeof import('@sentry/browser')> | null = null;
let sentryBrowserModule: typeof import('@sentry/browser') | null = null;
let replayModulePromise: Promise<typeof import('@sentry-internal/replay')> | null = null;
let replayScheduled = false;

function isTestRuntime(): boolean {
  const runtime = globalThis as typeof globalThis & { __TEST__?: boolean };
  return !!runtime.__TEST__;
}

const replayOptions = {
  maskAllText: false,
  blockAllMedia: false,
};

function loadSentryBrowser(): Promise<typeof import('@sentry/browser')> {
  if (!sentryBrowserPromise) {
    sentryBrowserPromise = import('@sentry/browser').then((mod) => {
      sentryBrowserModule = mod;
      return mod;
    });
  }
  return sentryBrowserPromise;
}

function loadReplayModule(): Promise<typeof import('@sentry-internal/replay')> {
  if (!replayModulePromise) {
    replayModulePromise = import('@sentry-internal/replay');
  }
  return replayModulePromise;
}

function getLoadedSentryBrowser(): typeof import('@sentry/browser') | null {
  return sentryBrowserModule;
}

function scheduleReplayIntegration(force = false): void {
  if (replayScheduled || (!import.meta.env.PROD && !force)) {
    return;
  }

  replayScheduled = true;

  const attachReplay = async () => {
    try {
      const [Sentry, Replay] = await Promise.all([loadSentryBrowser(), loadReplayModule()]);
      Sentry.addIntegration(Replay.replayIntegration(replayOptions));
    } catch {
      replayScheduled = false;
    }
  };

  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      void attachReplay();
    }, { timeout: 5000 });
    return;
  }

  setTimeout(() => {
    void attachReplay();
  }, 0);
}

export async function initSentry(force = false): Promise<void> {
  if ((isTestRuntime() || import.meta.vitest || import.meta.env.MODE === 'test' || !import.meta.env.PROD) && !force) {
    return;
  }

  const Sentry = await loadSentryBrowser();

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN || '',
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event, hint) {
      if (event.request) {
        delete event.request.cookies;
      }

      if (event.exception) {
        const error = hint.originalException;
        if (error instanceof Error && error.message.includes('ResizeObserver')) {
          return null;
        }
      }

      return event;
    },
    release: import.meta.env.VITE_APP_VERSION || '1.0.0',
    initialScope: {
      tags: {
        component: 'toolsbox',
      },
    },
  });

  scheduleReplayIntegration(force);
}

export function captureError(error: Error, context?: Record<string, unknown>) {
  const Sentry = getLoadedSentryBrowser();
  if (!Sentry) {
    return;
  }

  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('custom', context);
    }
    Sentry.captureException(error);
  });
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  const Sentry = getLoadedSentryBrowser();
  if (!Sentry) {
    return;
  }

  Sentry.captureMessage(message, level);
}

export function setSentryUser(user: { id?: string; email?: string }) {
  const Sentry = getLoadedSentryBrowser();
  if (!Sentry) {
    return;
  }

  Sentry.setUser(user);
}

export function addSentryBreadcrumb(
  message: string,
  category: string,
  level: 'info' | 'warning' | 'error' = 'info',
  data?: Record<string, unknown>
) {
  const Sentry = getLoadedSentryBrowser();
  if (!Sentry) {
    return;
  }

  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
  });
}

export function withPerformanceTracking<T>(
  transactionName: string,
  operation: string,
  fn: () => T
): T {
  const Sentry = getLoadedSentryBrowser();
  if (!Sentry) {
    return fn();
  }

  return Sentry.startSpan(
    {
      name: transactionName,
      op: operation,
    },
    () => fn()
  );
}

export async function withPerformanceTrackingAsync<T>(
  transactionName: string,
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const Sentry = await loadSentryBrowser().catch(() => null);
  if (!Sentry) {
    return fn();
  }

  return Sentry.startSpan(
    {
      name: transactionName,
      op: operation,
    },
    async () => fn()
  );
}
