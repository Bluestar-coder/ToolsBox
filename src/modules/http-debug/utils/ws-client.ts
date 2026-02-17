import type {
  WsConnectionConfig,
  WsConnectionStatus,
  WsMessage,
  WsMessageType,
  ReconnectConfig,
} from './types';
import { arrayBufferToHex } from './validators';

let messageIdCounter = 0;

function generateMessageId(): string {
  messageIdCounter += 1;
  return `ws-msg-${Date.now()}-${messageIdCounter}`;
}

/**
 * WebSocket 客户端类
 * 支持连接、断开、发送消息、自动重连
 */
export class WsClient {
  status: WsConnectionStatus = 'disconnected';

  onMessage: (message: WsMessage) => void = () => {};
  onStatusChange: (status: WsConnectionStatus) => void = () => {};
  onError: (error: string) => void = () => {};

  private ws: WebSocket | null = null;
  private config: WsConnectionConfig | null = null;
  private reconnectConfig: ReconnectConfig | null = null;
  private reconnectCount = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private manualDisconnect = false;

  /**
   * 建立 WebSocket 连接
   */
  connect(config: WsConnectionConfig): void {
    // 关闭已有连接
    this.cleanupConnection();
    this.manualDisconnect = false;
    this.reconnectCount = 0;
    this.config = config;

    this.setStatus('connecting');

    try {
      this.ws =
        config.protocols.length > 0
          ? new WebSocket(config.url, config.protocols)
          : new WebSocket(config.url);

      this.ws.binaryType = 'arraybuffer';
      this.setupEventHandlers();
    } catch (error: any) {
      this.setStatus('closed');
      this.onError(`Connection failed: ${error.message || String(error)}`);
    }
  }

  /**
   * 断开 WebSocket 连接，停止自动重连
   */
  disconnect(): void {
    this.manualDisconnect = true;
    this.clearReconnectTimer();
    this.cleanupConnection();
    this.setStatus('disconnected');
  }

  /**
   * 发送消息（文本或二进制）
   * 仅在已连接状态下可用
   */
  send(data: string | ArrayBuffer): void {
    if (this.status !== 'connected' || !this.ws) {
      this.onError('Cannot send message: not connected');
      return;
    }

    try {
      this.ws.send(data);

      const type: WsMessageType = typeof data === 'string' ? 'text' : 'binary';
      const content =
        typeof data === 'string' ? data : arrayBufferToHex(data);

      const message: WsMessage = {
        id: generateMessageId(),
        direction: 'sent',
        type,
        content,
        timestamp: Date.now(),
      };

      this.onMessage(message);
    } catch (error: any) {
      this.onError(`Send failed: ${error.message || String(error)}`);
    }
  }

  /**
   * 启用自动重连
   */
  enableReconnect(config: ReconnectConfig): void {
    this.reconnectConfig = { ...config, enabled: true };
  }

  /**
   * 禁用自动重连
   */
  disableReconnect(): void {
    this.reconnectConfig = null;
    this.clearReconnectTimer();
    this.reconnectCount = 0;
  }

  // --- 内部方法 ---

  private setStatus(status: WsConnectionStatus): void {
    this.status = status;
    this.onStatusChange(status);
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.reconnectCount = 0;
      this.setStatus('connected');
    };

    this.ws.onclose = () => {
      this.ws = null;

      if (this.manualDisconnect) {
        this.setStatus('disconnected');
        return;
      }

      this.setStatus('closed');
      this.attemptReconnect();
    };

    this.ws.onerror = () => {
      this.onError('WebSocket connection error');
    };

    this.ws.onmessage = (event: MessageEvent) => {
      const isBinary = event.data instanceof ArrayBuffer;
      const type: WsMessageType = isBinary ? 'binary' : 'text';
      const content = isBinary
        ? arrayBufferToHex(event.data as ArrayBuffer)
        : String(event.data);

      const message: WsMessage = {
        id: generateMessageId(),
        direction: 'received',
        type,
        content,
        timestamp: Date.now(),
      };

      this.onMessage(message);
    };
  }

  private attemptReconnect(): void {
    if (!this.reconnectConfig?.enabled || !this.config) return;
    if (this.manualDisconnect) return;

    const { interval, maxRetries } = this.reconnectConfig;

    if (this.reconnectCount >= maxRetries) {
      this.onError(
        `Auto-reconnect failed after ${maxRetries} attempts`,
      );
      return;
    }

    this.reconnectCount += 1;

    this.reconnectTimer = setTimeout(() => {
      if (this.manualDisconnect || !this.config) return;
      this.setStatus('connecting');

      try {
        this.ws =
          this.config.protocols.length > 0
            ? new WebSocket(this.config.url, this.config.protocols)
            : new WebSocket(this.config.url);

        this.ws.binaryType = 'arraybuffer';
        this.setupEventHandlers();
      } catch (error: any) {
        this.setStatus('closed');
        this.onError(`Reconnect failed: ${error.message || String(error)}`);
        this.attemptReconnect();
      }
    }, interval);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private cleanupConnection(): void {
    this.clearReconnectTimer();
    if (this.ws) {
      // Remove handlers before closing to avoid triggering onclose logic
      this.ws.onopen = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      try {
        this.ws.close();
      } catch {
        // ignore close errors
      }
      this.ws = null;
    }
  }
}
