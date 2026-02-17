import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { HttpRequestConfig } from '../types';
import { isTauriEnvironment, sendViaFetch, sendHttpRequest } from '../http-client';

// Mock @tauri-apps/plugin-http to prevent Vite import resolution errors
vi.mock('@tauri-apps/plugin-http', () => ({
  fetch: vi.fn(),
}));

// ─── helpers ────────────────────────────────────────────────────────────────

/** Minimal GET config for reuse across tests */
function makeGetConfig(overrides?: Partial<HttpRequestConfig>): HttpRequestConfig {
  return {
    method: 'GET',
    url: 'https://example.com/api',
    headers: [],
    bodyType: 'none',
    body: '',
    ...overrides,
  };
}

/** Minimal POST JSON config */
function makePostJsonConfig(overrides?: Partial<HttpRequestConfig>): HttpRequestConfig {
  return {
    method: 'POST',
    url: 'https://example.com/api',
    headers: [
      { key: 'Authorization', value: 'Bearer token123', enabled: true },
    ],
    bodyType: 'json',
    body: '{"key":"value"}',
    ...overrides,
  };
}

// ─── isTauriEnvironment ─────────────────────────────────────────────────────

describe('isTauriEnvironment', () => {
  let originalTauri: any;

  beforeEach(() => {
    originalTauri = (window as any).__TAURI_INTERNALS__;
  });

  afterEach(() => {
    if (originalTauri === undefined) {
      delete (window as any).__TAURI_INTERNALS__;
    } else {
      (window as any).__TAURI_INTERNALS__ = originalTauri;
    }
  });

  it('returns false in test environment (no __TAURI_INTERNALS__)', () => {
    delete (window as any).__TAURI_INTERNALS__;
    expect(isTauriEnvironment()).toBe(false);
  });

  it('returns true when window.__TAURI_INTERNALS__ is set', () => {
    (window as any).__TAURI_INTERNALS__ = { appName: 'test' };
    expect(isTauriEnvironment()).toBe(true);
  });
});

// ─── sendViaFetch ───────────────────────────────────────────────────────────

describe('sendViaFetch', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  /** Create a mock Response with the given properties */
  function mockResponse(opts: {
    status?: number;
    statusText?: string;
    headers?: Record<string, string>;
    body?: string;
  }): Response {
    const { status = 200, statusText = 'OK', headers = {}, body = '' } = opts;
    const h = new Headers(headers);
    return new Response(body, { status, statusText, headers: h });
  }

  it('passes correct method, headers, and body to fetch for a GET request', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(mockResponse({ body: 'ok' }));
    globalThis.fetch = fetchSpy;

    const config = makeGetConfig({
      headers: [{ key: 'X-Custom', value: 'test', enabled: true }],
    });

    await sendViaFetch(config);

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://example.com/api');
    expect(init.method).toBe('GET');
    expect(init.headers['X-Custom']).toBe('test');
    // GET should not have a body
    expect(init.body).toBeNull();
  });

  it('passes JSON body and auto-sets Content-Type for POST request', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(mockResponse({ body: '{}' }));
    globalThis.fetch = fetchSpy;

    const config = makePostJsonConfig();

    await sendViaFetch(config);

    const [, init] = fetchSpy.mock.calls[0];
    expect(init.method).toBe('POST');
    expect(init.body).toBe('{"key":"value"}');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(init.headers['Authorization']).toBe('Bearer token123');
  });

  it('does not override user-set Content-Type header', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(mockResponse({ body: '{}' }));
    globalThis.fetch = fetchSpy;

    const config = makePostJsonConfig({
      headers: [{ key: 'Content-Type', value: 'text/plain', enabled: true }],
    });

    await sendViaFetch(config);

    const [, init] = fetchSpy.mock.calls[0];
    // User-set Content-Type should be preserved, not overridden
    expect(init.headers['Content-Type']).toBe('text/plain');
  });

  it('skips disabled headers', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(mockResponse({ body: '' }));
    globalThis.fetch = fetchSpy;

    const config = makeGetConfig({
      headers: [
        { key: 'X-Enabled', value: 'yes', enabled: true },
        { key: 'X-Disabled', value: 'no', enabled: false },
      ],
    });

    await sendViaFetch(config);

    const [, init] = fetchSpy.mock.calls[0];
    expect(init.headers['X-Enabled']).toBe('yes');
    expect(init.headers['X-Disabled']).toBeUndefined();
  });

  it('correctly parses response status, headers, body, duration, and size', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(
      mockResponse({
        status: 201,
        statusText: 'Created',
        headers: { 'content-type': 'application/json', 'x-request-id': 'abc123' },
        body: '{"id":1}',
      }),
    );
    globalThis.fetch = fetchSpy;

    const result = await sendViaFetch(makeGetConfig());

    expect(result.status).toBe(201);
    expect(result.statusText).toBe('Created');
    expect(result.headers['content-type']).toBe('application/json');
    expect(result.headers['x-request-id']).toBe('abc123');
    expect(result.body).toBe('{"id":1}');
    expect(result.contentType).toBe('application/json');
    expect(result.duration).toBeGreaterThanOrEqual(0);
    expect(result.size).toBe(new TextEncoder().encode('{"id":1}').byteLength);
  });

  it('returns status 0 with error message on network error', async () => {
    const fetchSpy = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    globalThis.fetch = fetchSpy;

    const result = await sendViaFetch(makeGetConfig());

    expect(result.status).toBe(0);
    expect(result.statusText).toBe('Error');
    expect(result.body).toContain('Network error');
    expect(result.body).toContain('Failed to fetch');
    expect(result.body).toContain('CORS');
    expect(result.size).toBe(0);
    expect(result.headers).toEqual({});
  });

  it('returns appropriate error for non-TypeError exceptions', async () => {
    const fetchSpy = vi.fn().mockRejectedValue(new Error('Something went wrong'));
    globalThis.fetch = fetchSpy;

    const result = await sendViaFetch(makeGetConfig());

    expect(result.status).toBe(0);
    expect(result.statusText).toBe('Error');
    expect(result.body).toContain('Request failed');
    expect(result.body).toContain('Something went wrong');
  });

  it('builds form-urlencoded body for form bodyType', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(mockResponse({ body: '' }));
    globalThis.fetch = fetchSpy;

    const config: HttpRequestConfig = {
      method: 'POST',
      url: 'https://example.com/login',
      headers: [],
      bodyType: 'form',
      body: '',
      formData: [
        { key: 'username', value: 'admin', enabled: true },
        { key: 'password', value: 'secret', enabled: true },
        { key: 'disabled', value: 'skip', enabled: false },
      ],
    };

    await sendViaFetch(config);

    const [, init] = fetchSpy.mock.calls[0];
    expect(init.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
    expect(init.body).toContain('username=admin');
    expect(init.body).toContain('password=secret');
    expect(init.body).not.toContain('disabled');
  });
});

// ─── sendHttpRequest ────────────────────────────────────────────────────────

describe('sendHttpRequest', () => {
  let originalFetch: typeof globalThis.fetch;
  let originalTauri: any;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    originalTauri = (window as any).__TAURI_INTERNALS__;
    // Ensure non-Tauri environment for these tests
    delete (window as any).__TAURI_INTERNALS__;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalTauri === undefined) {
      delete (window as any).__TAURI_INTERNALS__;
    } else {
      (window as any).__TAURI_INTERNALS__ = originalTauri;
    }
  });

  function mockFetchResponse(body: string = ''): Response {
    return new Response(body, { status: 200, statusText: 'OK' });
  }

  it('calls sendViaFetch in non-Tauri environment', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(mockFetchResponse('response'));
    globalThis.fetch = fetchSpy;

    const result = await sendHttpRequest(makeGetConfig());

    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(result.status).toBe(200);
    expect(result.body).toBe('response');
  });

  it('applies variables before sending', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(mockFetchResponse('ok'));
    globalThis.fetch = fetchSpy;

    const config = makeGetConfig({
      url: 'https://{{host}}/api/{{path}}',
      headers: [{ key: 'Authorization', value: 'Bearer {{token}}', enabled: true }],
    });
    const variables = [
      { key: 'host', value: 'example.com', enabled: true },
      { key: 'path', value: 'users', enabled: true },
      { key: 'token', value: 'abc123', enabled: true },
    ];

    await sendHttpRequest(config, variables);

    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://example.com/api/users');
    expect(init.headers['Authorization']).toBe('Bearer abc123');
  });

  it('preserves undefined variable placeholders', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(mockFetchResponse('ok'));
    globalThis.fetch = fetchSpy;

    const config = makeGetConfig({
      url: 'https://{{host}}/api/{{unknown}}',
    });
    const variables = [
      { key: 'host', value: 'example.com', enabled: true },
    ];

    await sendHttpRequest(config, variables);

    const [url] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://example.com/api/{{unknown}}');
  });

  it('sends without variable replacement when no variables provided', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(mockFetchResponse('ok'));
    globalThis.fetch = fetchSpy;

    const config = makeGetConfig({ url: 'https://{{host}}/api' });

    await sendHttpRequest(config);

    const [url] = fetchSpy.mock.calls[0];
    // No variables → placeholder stays as-is
    expect(url).toBe('https://{{host}}/api');
  });
});
