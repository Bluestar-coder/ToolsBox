/** HTTP 方法 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

/** 请求体类型 */
export type BodyType = 'none' | 'json' | 'form' | 'multipart' | 'raw' | 'binary';

/** 键值对 */
export interface KeyValuePair {
  key: string;
  value: string;
  enabled: boolean;
}

/** HTTP 请求配置 */
export interface HttpRequestConfig {
  method: HttpMethod;
  url: string;
  headers: KeyValuePair[];
  bodyType: BodyType;
  body: string;
  /** multipart 表单字段 */
  formData?: KeyValuePair[];
}

/** HTTP 响应 */
export interface HttpResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  /** 响应体大小（字节） */
  size: number;
  /** 请求耗时（毫秒） */
  duration: number;
  /** 响应体 Content-Type */
  contentType: string;
}

/** 请求历史记录 */
export interface HistoryEntry {
  id: string;
  timestamp: number;
  request: HttpRequestConfig;
}

/** 环境变量配置 */
export interface Environment {
  id: string;
  name: string;
  variables: KeyValuePair[];
}

/** WebSocket 连接状态 */
export type WsConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'closed';

/** WebSocket 消息方向 */
export type MessageDirection = 'sent' | 'received';

/** WebSocket 消息类型 */
export type WsMessageType = 'text' | 'binary';

/** WebSocket 消息记录 */
export interface WsMessage {
  id: string;
  direction: MessageDirection;
  type: WsMessageType;
  content: string;
  timestamp: number;
}

/** WebSocket 连接配置 */
export interface WsConnectionConfig {
  url: string;
  protocols: string[];
}

/** 自动重连配置 */
export interface ReconnectConfig {
  enabled: boolean;
  /** 重连间隔（毫秒），默认 3000 */
  interval: number;
  /** 最大重连次数，默认 5 */
  maxRetries: number;
}
