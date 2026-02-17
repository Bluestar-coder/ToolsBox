/**
 * URL 和输入验证工具函数
 */

/**
 * 验证 HTTP URL（必须以 http:// 或 https:// 开头且包含有效主机名）
 */
export function isValidHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
      parsed.hostname.length > 0
    );
  } catch {
    return false;
  }
}

/**
 * 验证 WebSocket URL（必须以 ws:// 或 wss:// 开头且包含有效主机名）
 */
export function isValidWsUrl(url: string): boolean {
  try {
    // URL constructor doesn't natively support ws/wss, so we swap to http/https for parsing
    const normalized = url.replace(/^ws(s?):\/\//, 'http$1://');
    const parsed = new URL(normalized);
    return (
      (url.startsWith('ws://') || url.startsWith('wss://')) &&
      parsed.hostname.length > 0
    );
  } catch {
    return false;
  }
}

/**
 * 验证 Hex 字符串（用于 WS 二进制消息）
 * 必须为偶数长度且仅包含 0-9, a-f, A-F
 */
export function isValidHexString(hex: string): boolean {
  if (hex.length === 0 || hex.length % 2 !== 0) {
    return false;
  }
  return /^[0-9a-fA-F]+$/.test(hex);
}

/**
 * Hex 字符串转 ArrayBuffer
 */
export function hexToArrayBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes.buffer;
}

/**
 * ArrayBuffer 转 Hex 字符串（小写）
 */
export function arrayBufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
