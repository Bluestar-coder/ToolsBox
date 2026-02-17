import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WsClient } from '../ws-client';
import type { WsConnectionConfig, WsMessage } from '../types';

// --- Mock WebSocket ---

type WsHandler = ((event: any) => void) | null;

class MockWebSocket {
  static instances: MockWebSocket[] = [];

  url: string;
  protocols: string | string[];
  binaryType = 'blob';
  readyState = 0; // CONNECTING

  onopen: WsHandler = null;
  onclose: WsHandler = null;
  onerror: WsHandler = null;
  onmessage: WsHandler = null;

  constructor(url: string, protocols?: string | string[]) {
    this.url = url;
    this.protocols = protocols ?? '';
    MockWebSocket.instances.push(this);
  }

  send = vi.fn();
  close = vi.fn();

  // helpers to simulate server events
  simulateOpen() {
    this.readyState = 1;
    this.onopen?.({} as Event);
  }
  simulateClose() {
    this.readyState = 3;
    this.onclose?.({} as CloseEvent);
  }
  simulateError() {
    this.onerror?.({} as Event);
  }
  simulateMessage(data: string | ArrayBuffer) {
    this.onmessage?.({ data } as MessageEvent);
  }
}

// Replace global WebSocket
const OriginalWebSocket = globalThis.WebSocket;

beforeEach(() => {
  MockWebSocket.instances = [];
  (globalThis as any).WebSocket = MockWebSocket as any;
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  (globalThis as any).WebSocket = OriginalWebSocket;
});

function defaultConfig(): WsConnectionConfig {
  return { url: 'ws://localhost:8080', protocols: [] };
}

function lastMockWs(): MockWebSocket {
  return MockWebSocket.instances[MockWebSocket.instances.length - 1];
}

describe('WsClient', () => {
  describe('connect', () => {
    it('should create a WebSocket and set status to connecting', () => {
      const client = new WsClient();
      const statuses: string[] = [];
      client.onStatusChange = (s) => statuses.push(s);

      client.connect(defaultConfig());

      expect(statuses).toContain('connecting');
      expect(MockWebSocket.instances).toHaveLength(1);
      expect(lastMockWs().url).toBe('ws://localhost:8080');
    });

    it('should set binaryType to arraybuffer', () => {
      const client = new WsClient();
      client.connect(defaultConfig());
      expect(lastMockWs().binaryType).toBe('arraybuffer');
    });

    it('should pass subprotocols when provided', () => {
      const client = new WsClient();
      client.connect({ url: 'ws://localhost:8080', protocols: ['graphql-ws'] });
      expect(lastMockWs().protocols).toEqual(['graphql-ws']);
    });

    it('should transition to connected on open', () => {
      const client = new WsClient();
      const statuses: string[] = [];
      client.onStatusChange = (s) => statuses.push(s);

      client.connect(defaultConfig());
      lastMockWs().simulateOpen();

      expect(client.status).toBe('connected');
      expect(statuses).toEqual(['connecting', 'connected']);
    });

    it('should close previous connection when connecting again', () => {
      const client = new WsClient();
      client.connect(defaultConfig());
      const firstWs = lastMockWs();
      firstWs.simulateOpen();

      client.connect({ url: 'ws://localhost:9090', protocols: [] });
      expect(firstWs.close).toHaveBeenCalled();
      expect(MockWebSocket.instances).toHaveLength(2);
    });
  });

  describe('disconnect', () => {
    it('should close connection and set status to disconnected', () => {
      const client = new WsClient();
      client.connect(defaultConfig());
      lastMockWs().simulateOpen();

      client.disconnect();

      expect(client.status).toBe('disconnected');
      expect(lastMockWs().close).toHaveBeenCalled();
    });

    it('should stop auto-reconnect on manual disconnect', () => {
      const client = new WsClient();
      client.enableReconnect({ enabled: true, interval: 1000, maxRetries: 3 });
      client.connect(defaultConfig());
      lastMockWs().simulateOpen();

      client.disconnect();

      // Advance timers — no reconnect should happen
      vi.advanceTimersByTime(5000);
      // Only the initial connection should exist
      expect(MockWebSocket.instances).toHaveLength(1);
    });
  });

  describe('send', () => {
    it('should send text message and emit WsMessage', () => {
      const client = new WsClient();
      const messages: WsMessage[] = [];
      client.onMessage = (m) => messages.push(m);

      client.connect(defaultConfig());
      lastMockWs().simulateOpen();

      client.send('hello');

      expect(lastMockWs().send).toHaveBeenCalledWith('hello');
      expect(messages).toHaveLength(1);
      expect(messages[0].direction).toBe('sent');
      expect(messages[0].type).toBe('text');
      expect(messages[0].content).toBe('hello');
    });

    it('should send binary message and log hex content', () => {
      const client = new WsClient();
      const messages: WsMessage[] = [];
      client.onMessage = (m) => messages.push(m);

      client.connect(defaultConfig());
      lastMockWs().simulateOpen();

      const buffer = new Uint8Array([0xde, 0xad]).buffer;
      client.send(buffer);

      expect(lastMockWs().send).toHaveBeenCalledWith(buffer);
      expect(messages[0].type).toBe('binary');
      expect(messages[0].content).toBe('dead');
    });

    it('should error when not connected', () => {
      const client = new WsClient();
      const errors: string[] = [];
      client.onError = (e) => errors.push(e);

      client.send('hello');

      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('not connected');
    });
  });

  describe('receive', () => {
    it('should emit received text message', () => {
      const client = new WsClient();
      const messages: WsMessage[] = [];
      client.onMessage = (m) => messages.push(m);

      client.connect(defaultConfig());
      lastMockWs().simulateOpen();
      lastMockWs().simulateMessage('world');

      expect(messages).toHaveLength(1);
      expect(messages[0].direction).toBe('received');
      expect(messages[0].type).toBe('text');
      expect(messages[0].content).toBe('world');
    });

    it('should emit received binary message as hex', () => {
      const client = new WsClient();
      const messages: WsMessage[] = [];
      client.onMessage = (m) => messages.push(m);

      client.connect(defaultConfig());
      lastMockWs().simulateOpen();
      lastMockWs().simulateMessage(new Uint8Array([0xca, 0xfe]).buffer);

      expect(messages[0].direction).toBe('received');
      expect(messages[0].type).toBe('binary');
      expect(messages[0].content).toBe('cafe');
    });
  });

  describe('error handling', () => {
    it('should call onError on WebSocket error event', () => {
      const client = new WsClient();
      const errors: string[] = [];
      client.onError = (e) => errors.push(e);

      client.connect(defaultConfig());
      lastMockWs().simulateError();

      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('connection error');
    });
  });

  describe('auto-reconnect', () => {
    it('should reconnect after unexpected close', () => {
      const client = new WsClient();
      client.enableReconnect({ enabled: true, interval: 3000, maxRetries: 5 });
      client.connect(defaultConfig());
      lastMockWs().simulateOpen();

      // Simulate unexpected close
      lastMockWs().simulateClose();
      expect(client.status).toBe('closed');

      // Advance past reconnect interval
      vi.advanceTimersByTime(3000);

      // A new WebSocket should have been created
      expect(MockWebSocket.instances).toHaveLength(2);
    });

    it('should stop after max retries', () => {
      const client = new WsClient();
      const errors: string[] = [];
      client.onError = (e) => errors.push(e);
      client.enableReconnect({ enabled: true, interval: 100, maxRetries: 2 });
      client.connect(defaultConfig());
      lastMockWs().simulateOpen();

      // Close 1
      lastMockWs().simulateClose();
      vi.advanceTimersByTime(100);
      // Reconnect attempt 1
      lastMockWs().simulateClose();
      vi.advanceTimersByTime(100);
      // Reconnect attempt 2
      lastMockWs().simulateClose();
      vi.advanceTimersByTime(100);

      // Should have stopped — no more WebSocket instances created
      const countAfterMax = MockWebSocket.instances.length;
      vi.advanceTimersByTime(1000);
      expect(MockWebSocket.instances.length).toBe(countAfterMax);

      // Should have reported the failure
      expect(errors.some((e) => e.includes('failed after'))).toBe(true);
    });

    it('should not reconnect when disabled', () => {
      const client = new WsClient();
      client.connect(defaultConfig());
      lastMockWs().simulateOpen();

      lastMockWs().simulateClose();
      vi.advanceTimersByTime(10000);

      // Only the initial connection
      expect(MockWebSocket.instances).toHaveLength(1);
    });

    it('should reset reconnect count on successful connection', () => {
      const client = new WsClient();
      client.enableReconnect({ enabled: true, interval: 100, maxRetries: 3 });
      client.connect(defaultConfig());
      lastMockWs().simulateOpen();

      // Close and reconnect
      lastMockWs().simulateClose();
      vi.advanceTimersByTime(100);
      // Reconnect succeeds
      lastMockWs().simulateOpen();

      // Close again — should have full retries available
      lastMockWs().simulateClose();
      vi.advanceTimersByTime(100);
      expect(MockWebSocket.instances.length).toBeGreaterThanOrEqual(3);
    });

    it('should stop reconnect when disableReconnect is called', () => {
      const client = new WsClient();
      client.enableReconnect({ enabled: true, interval: 100, maxRetries: 5 });
      client.connect(defaultConfig());
      lastMockWs().simulateOpen();

      lastMockWs().simulateClose();
      client.disableReconnect();

      vi.advanceTimersByTime(5000);
      // No new connections after disabling
      expect(MockWebSocket.instances).toHaveLength(1);
    });
  });

  describe('message id and timestamp', () => {
    it('should generate unique ids for each message', () => {
      const client = new WsClient();
      const messages: WsMessage[] = [];
      client.onMessage = (m) => messages.push(m);

      client.connect(defaultConfig());
      lastMockWs().simulateOpen();

      client.send('a');
      client.send('b');
      lastMockWs().simulateMessage('c');

      const ids = messages.map((m) => m.id);
      expect(new Set(ids).size).toBe(3);
    });

    it('should include timestamp on each message', () => {
      const client = new WsClient();
      const messages: WsMessage[] = [];
      client.onMessage = (m) => messages.push(m);

      client.connect(defaultConfig());
      lastMockWs().simulateOpen();

      client.send('test');

      expect(messages[0].timestamp).toBeGreaterThan(0);
    });
  });
});
