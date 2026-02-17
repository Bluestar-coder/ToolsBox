import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { WsClient } from '../ws-client';
import type { WsConnectionConfig, WsMessage } from '../types';

/**
 * Property 8: 消息日志完整性
 * **Validates: Requirements 7.3, 7.4**
 *
 * For any series of sent and received WebSocket messages, each message should
 * appear in the Message_Log with correct direction (sent/received), timestamp,
 * and message type (text/binary).
 */

// --- Mock WebSocket ---

type WsHandler = ((event: any) => void) | null;

class MockWebSocket {
  static instances: MockWebSocket[] = [];

  url: string;
  protocols: string | string[];
  binaryType = 'blob';
  readyState = 0;

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

  simulateOpen() {
    this.readyState = 1;
    this.onopen?.({} as Event);
  }

  simulateMessage(data: string | ArrayBuffer) {
    this.onmessage?.({ data } as MessageEvent);
  }
}

// --- Action types for the arbitrary ---

interface SendTextAction {
  kind: 'send-text';
  content: string;
}

interface SendBinaryAction {
  kind: 'send-binary';
  bytes: number[];
}

interface ReceiveTextAction {
  kind: 'receive-text';
  content: string;
}

interface ReceiveBinaryAction {
  kind: 'receive-binary';
  bytes: number[];
}

type MessageAction = SendTextAction | SendBinaryAction | ReceiveTextAction | ReceiveBinaryAction;

// --- Arbitraries ---

const arbSendText: fc.Arbitrary<SendTextAction> = fc
  .string({ minLength: 0, maxLength: 50 })
  .map((content) => ({ kind: 'send-text' as const, content }));

const arbSendBinary: fc.Arbitrary<SendBinaryAction> = fc
  .array(fc.integer({ min: 0, max: 255 }), { minLength: 1, maxLength: 32 })
  .map((bytes) => ({ kind: 'send-binary' as const, bytes }));

const arbReceiveText: fc.Arbitrary<ReceiveTextAction> = fc
  .string({ minLength: 0, maxLength: 50 })
  .map((content) => ({ kind: 'receive-text' as const, content }));

const arbReceiveBinary: fc.Arbitrary<ReceiveBinaryAction> = fc
  .array(fc.integer({ min: 0, max: 255 }), { minLength: 1, maxLength: 32 })
  .map((bytes) => ({ kind: 'receive-binary' as const, bytes }));

const arbAction: fc.Arbitrary<MessageAction> = fc.oneof(
  arbSendText,
  arbSendBinary,
  arbReceiveText,
  arbReceiveBinary,
);

const arbActionSequence: fc.Arbitrary<MessageAction[]> = fc.array(arbAction, {
  minLength: 1,
  maxLength: 20,
});

// --- Helpers ---

const OriginalWebSocket = globalThis.WebSocket;

function defaultConfig(): WsConnectionConfig {
  return { url: 'ws://localhost:8080', protocols: [] };
}

function lastMockWs(): MockWebSocket {
  return MockWebSocket.instances[MockWebSocket.instances.length - 1];
}

function bytesToHex(bytes: number[]): string {
  return bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// --- Tests ---

beforeEach(() => {
  MockWebSocket.instances = [];
  (globalThis as any).WebSocket = MockWebSocket as any;
});

afterEach(() => {
  (globalThis as any).WebSocket = OriginalWebSocket;
});

describe('Property-Based Tests: 消息日志完整性 (Property 8)', () => {
  it('every action in an arbitrary sequence produces a message with correct direction, type, and non-zero timestamp', () => {
    fc.assert(
      fc.property(arbActionSequence, (actions) => {
        const client = new WsClient();
        const messages: WsMessage[] = [];
        client.onMessage = (m) => messages.push(m);

        client.connect(defaultConfig());
        lastMockWs().simulateOpen();

        // Execute each action
        for (const action of actions) {
          switch (action.kind) {
            case 'send-text':
              client.send(action.content);
              break;
            case 'send-binary': {
              const buf = new Uint8Array(action.bytes).buffer;
              client.send(buf);
              break;
            }
            case 'receive-text':
              lastMockWs().simulateMessage(action.content);
              break;
            case 'receive-binary': {
              const buf = new Uint8Array(action.bytes).buffer;
              lastMockWs().simulateMessage(buf);
              break;
            }
          }
        }

        // Verify: one message per action
        expect(messages.length).toBe(actions.length);

        // Verify each message matches its action
        for (let i = 0; i < actions.length; i++) {
          const action = actions[i];
          const msg = messages[i];

          // Timestamp must be a positive number
          expect(msg.timestamp).toBeGreaterThan(0);

          // Direction and type must match the action
          switch (action.kind) {
            case 'send-text':
              expect(msg.direction).toBe('sent');
              expect(msg.type).toBe('text');
              expect(msg.content).toBe(action.content);
              break;
            case 'send-binary':
              expect(msg.direction).toBe('sent');
              expect(msg.type).toBe('binary');
              expect(msg.content).toBe(bytesToHex(action.bytes));
              break;
            case 'receive-text':
              expect(msg.direction).toBe('received');
              expect(msg.type).toBe('text');
              expect(msg.content).toBe(action.content);
              break;
            case 'receive-binary':
              expect(msg.direction).toBe('received');
              expect(msg.type).toBe('binary');
              expect(msg.content).toBe(bytesToHex(action.bytes));
              break;
          }
        }
      }),
      { numRuns: 100 },
    );
  });

  it('all messages have unique ids', () => {
    fc.assert(
      fc.property(arbActionSequence, (actions) => {
        const client = new WsClient();
        const messages: WsMessage[] = [];
        client.onMessage = (m) => messages.push(m);

        client.connect(defaultConfig());
        lastMockWs().simulateOpen();

        for (const action of actions) {
          switch (action.kind) {
            case 'send-text':
              client.send(action.content);
              break;
            case 'send-binary':
              client.send(new Uint8Array(action.bytes).buffer);
              break;
            case 'receive-text':
              lastMockWs().simulateMessage(action.content);
              break;
            case 'receive-binary':
              lastMockWs().simulateMessage(new Uint8Array(action.bytes).buffer);
              break;
          }
        }

        const ids = messages.map((m) => m.id);
        expect(new Set(ids).size).toBe(ids.length);
      }),
      { numRuns: 100 },
    );
  });
});
