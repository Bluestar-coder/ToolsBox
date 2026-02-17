/**
 * Context事件总线
 *
 * 用于在不同Context之间进行通信，解耦Context之间的直接依赖关系
 *
 * @example
 * ```tsx
 * // 发送事件
 * import { contextEventBus, CONTEXT_EVENTS } from '../context/ContextEventBus';
 * contextEventBus.emit(CONTEXT_EVENTS.ENCODING_ERROR, { message: error.message });
 *
 * // 监听事件
 * useEffect(() => {
 *   const unsubscribe = contextEventBus.on(CONTEXT_EVENTS.ENCODING_ERROR, (data) => {
 *     console.log('Error:', data);
 *   });
 *   return unsubscribe;
 * }, []);
 * ```
 */

import { logger } from '../utils/logger';

type EventCallback<T = unknown> = (data: T) => void;

/**
 * Context事件总线类
 */
class ContextEventBusClass {
  private listeners: Map<string, Set<EventCallback<unknown>>> = new Map();

  /**
   * 订阅事件
   * @param event 事件名称
   * @param callback 回调函数
   * @returns 取消订阅函数
   */
  on<T = unknown>(event: string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as EventCallback<unknown>);

    // 返回取消订阅函数
    return () => this.off(event, callback);
  }

  /**
   * 发送事件
   * @param event 事件名称
   * @param data 事件数据
   */
  emit<T = unknown>(event: string, data: T): void {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        logger.error(`Error in event handler for ${event}:`, error);
      }
    });
  }

  /**
   * 取消订阅事件
   * @param event 事件名称
   * @param callback 回调函数
   */
  off<T = unknown>(event: string, callback: EventCallback<T>): void {
    this.listeners.get(event)?.delete(callback as EventCallback<unknown>);
  }

  /**
   * 清除所有事件监听器
   */
  clear(): void {
    this.listeners.clear();
  }

  /**
   * 获取事件监听器数量（用于调试）
   * @param event 事件名称
   */
  listenerCount(event: string): number {
    return this.listeners.get(event)?.size || 0;
  }
}

/**
 * 全局事件总线实例
 */
export const contextEventBus = new ContextEventBusClass();

/**
 * Context事件类型常量
 */
export const CONTEXT_EVENTS = {
  // 编码相关事件
  ENCODING_ERROR: 'encoding:error',
  ENCODING_SUCCESS: 'encoding:success',
  ENCODING_STATE_CHANGED: 'encoding:state_changed',

  // 加密相关事件
  CRYPTO_ERROR: 'crypto:error',
  CRYPTO_SUCCESS: 'crypto:success',

  // 主题相关事件
  THEME_CHANGED: 'theme:changed',

  // 插件相关事件
  PLUGIN_LOADED: 'plugin:loaded',
  PLUGIN_ERROR: 'plugin:error',
  PLUGIN_ENABLED: 'plugin:enabled',
  PLUGIN_DISABLED: 'plugin:disabled',

  // 通用错误事件
  ERROR_OCCURRED: 'error:occurred',
  ERROR_CLEARED: 'error:cleared',
} as const;

/**
 * 事件数据类型定义
 */
export interface EncodingErrorEvent {
  message: string;
  type: string;
  stack?: string;
}

export interface CryptoErrorEvent {
  message: string;
  algorithm: string;
  stack?: string;
}

export interface ThemeChangedEvent {
  theme: 'light' | 'dark' | 'system';
  isDark: boolean;
}

export interface PluginErrorEvent {
  pluginId: string;
  message: string;
  error?: Error;
}

export interface ErrorOccurredEvent {
  message: string;
  type: string;
  source: 'encoding' | 'crypto' | 'plugin' | 'general';
  stack?: string;
}
