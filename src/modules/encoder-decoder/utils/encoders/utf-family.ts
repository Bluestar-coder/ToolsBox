/**
 * UTF家族编码函数 - UTF-7, UTF-8, UTF-16, UTF-32
 */

import type { EncodeDecodeResult } from './common';
import { createSuccessResult, createErrorResult } from './common';

/**
 * UTF-7 编码 (RFC 2152)
 */
export const utf7Encode = (input: string): EncodeDecodeResult => {
  try {
    const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;

    while (i < input.length) {
      const char = input[i];
      const code = char.charCodeAt(0);

      // 直接可打印的ASCII字符（除了+）
      if ((code >= 0x20 && code <= 0x7E && char !== '+') || code === 0x09 || code === 0x0A || code === 0x0D) {
        result += char;
        i++;
      } else if (char === '+') {
        result += '+-';
        i++;
      } else {
        // 需要Base64编码的Unicode字符
        result += '+';
        let buffer = 0;
        let bits = 0;

        while (i < input.length) {
          const c = input[i];
          const cc = c.charCodeAt(0);
          if ((cc >= 0x20 && cc <= 0x7E) || cc === 0x09 || cc === 0x0A || cc === 0x0D) break;

          buffer = (buffer << 16) | cc;
          bits += 16;

          while (bits >= 6) {
            bits -= 6;
            result += base64Chars[(buffer >> bits) & 0x3F];
          }
          i++;
        }

        if (bits > 0) {
          result += base64Chars[(buffer << (6 - bits)) & 0x3F];
        }
        result += '-';
      }
    }
    return createSuccessResult(result);
  } catch (error) {
    return createErrorResult(error instanceof Error ? error.message : 'UTF-7编码错误');
  }
};

/**
 * UTF-7 解码
 */
export const utf7Decode = (input: string): EncodeDecodeResult => {
  try {
    const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;

    while (i < input.length) {
      if (input[i] === '+') {
        if (input[i + 1] === '-') {
          result += '+';
          i += 2;
        } else {
          i++;
          let buffer = 0;
          let bits = 0;

          while (i < input.length && input[i] !== '-') {
            const idx = base64Chars.indexOf(input[i]);
            if (idx === -1) break;
            buffer = (buffer << 6) | idx;
            bits += 6;

            if (bits >= 16) {
              bits -= 16;
              result += String.fromCharCode((buffer >> bits) & 0xFFFF);
            }
            i++;
          }
          if (input[i] === '-') i++;
        }
      } else {
        result += input[i];
        i++;
      }
    }
    return createSuccessResult(result);
  } catch (error) {
    return createErrorResult(error instanceof Error ? error.message : 'UTF-7解码错误');
  }
};

/**
 * UTF-8 编码（输出十六进制）
 */
export const utf8Encode = (input: string): EncodeDecodeResult => {
  try {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(input);
    const result = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' ');
    return createSuccessResult(result);
  } catch (error) {
    return createErrorResult(error instanceof Error ? error.message : 'UTF-8编码错误');
  }
};

/**
 * UTF-8 解码（从十六进制）
 */
export const utf8Decode = (input: string): EncodeDecodeResult => {
  try {
    const hex = input.replace(/\s+/g, '');
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    const decoder = new TextDecoder('utf-8');
    return createSuccessResult(decoder.decode(bytes));
  } catch (error) {
    return createErrorResult(error instanceof Error ? error.message : 'UTF-8解码错误');
  }
};

/**
 * UTF-16 BE 编码（大端序）
 */
export const utf16BEEncode = (input: string): EncodeDecodeResult => {
  try {
    let result = '';
    for (let i = 0; i < input.length; i++) {
      const code = input.charCodeAt(i);
      // 处理代理对
      if (code >= 0xD800 && code <= 0xDBFF && i + 1 < input.length) {
        const low = input.charCodeAt(i + 1);
        if (low >= 0xDC00 && low <= 0xDFFF) {
          result += code.toString(16).padStart(4, '0') + ' ';
          result += low.toString(16).padStart(4, '0') + ' ';
          i++;
          continue;
        }
      }
      result += code.toString(16).padStart(4, '0') + ' ';
    }
    return createSuccessResult(result.trim());
  } catch (error) {
    return createErrorResult(error instanceof Error ? error.message : 'UTF-16 BE编码错误');
  }
};

/**
 * UTF-16 BE 解码
 */
export const utf16BEDecode = (input: string): EncodeDecodeResult => {
  try {
    const hex = input.replace(/\s+/g, '');
    let result = '';
    for (let i = 0; i < hex.length; i += 4) {
      const code = parseInt(hex.substr(i, 4), 16);
      result += String.fromCharCode(code);
    }
    return createSuccessResult(result);
  } catch (error) {
    return createErrorResult(error instanceof Error ? error.message : 'UTF-16 BE解码错误');
  }
};

/**
 * UTF-16 LE 编码（小端序）
 */
export const utf16LEEncode = (input: string): EncodeDecodeResult => {
  try {
    let result = '';
    for (let i = 0; i < input.length; i++) {
      const code = input.charCodeAt(i);
      const low = (code & 0xFF).toString(16).padStart(2, '0');
      const high = ((code >> 8) & 0xFF).toString(16).padStart(2, '0');
      result += low + high + ' ';
    }
    return createSuccessResult(result.trim());
  } catch (error) {
    return createErrorResult(error instanceof Error ? error.message : 'UTF-16 LE编码错误');
  }
};

/**
 * UTF-16 LE 解码
 */
export const utf16LEDecode = (input: string): EncodeDecodeResult => {
  try {
    const hex = input.replace(/\s+/g, '');
    let result = '';
    for (let i = 0; i < hex.length; i += 4) {
      const low = parseInt(hex.substr(i, 2), 16);
      const high = parseInt(hex.substr(i + 2, 2), 16);
      result += String.fromCharCode((high << 8) | low);
    }
    return createSuccessResult(result);
  } catch (error) {
    return createErrorResult(error instanceof Error ? error.message : 'UTF-16 LE解码错误');
  }
};

/**
 * UTF-32 BE 编码（大端序）
 */
export const utf32BEEncode = (input: string): EncodeDecodeResult => {
  try {
    let result = '';
    for (const char of input) {
      const code = char.codePointAt(0) || 0;
      result += code.toString(16).padStart(8, '0') + ' ';
    }
    return createSuccessResult(result.trim());
  } catch (error) {
    return createErrorResult(error instanceof Error ? error.message : 'UTF-32 BE编码错误');
  }
};

/**
 * UTF-32 BE 解码
 */
export const utf32BEDecode = (input: string): EncodeDecodeResult => {
  try {
    const hex = input.replace(/\s+/g, '');
    let result = '';
    for (let i = 0; i < hex.length; i += 8) {
      const code = parseInt(hex.substr(i, 8), 16);
      result += String.fromCodePoint(code);
    }
    return createSuccessResult(result);
  } catch (error) {
    return createErrorResult(error instanceof Error ? error.message : 'UTF-32 BE解码错误');
  }
};

/**
 * UTF-32 LE 编码（小端序）
 */
export const utf32LEEncode = (input: string): EncodeDecodeResult => {
  try {
    let result = '';
    for (const char of input) {
      const code = char.codePointAt(0) || 0;
      const b0 = (code & 0xFF).toString(16).padStart(2, '0');
      const b1 = ((code >> 8) & 0xFF).toString(16).padStart(2, '0');
      const b2 = ((code >> 16) & 0xFF).toString(16).padStart(2, '0');
      const b3 = ((code >> 24) & 0xFF).toString(16).padStart(2, '0');
      result += b0 + b1 + b2 + b3 + ' ';
    }
    return createSuccessResult(result.trim());
  } catch (error) {
    return createErrorResult(error instanceof Error ? error.message : 'UTF-32 LE编码错误');
  }
};

/**
 * UTF-32 LE 解码
 */
export const utf32LEDecode = (input: string): EncodeDecodeResult => {
  try {
    const hex = input.replace(/\s+/g, '');
    let result = '';
    for (let i = 0; i < hex.length; i += 8) {
      const b0 = parseInt(hex.substr(i, 2), 16);
      const b1 = parseInt(hex.substr(i + 2, 2), 16);
      const b2 = parseInt(hex.substr(i + 4, 2), 16);
      const b3 = parseInt(hex.substr(i + 6, 2), 16);
      const code = b0 | (b1 << 8) | (b2 << 16) | (b3 << 24);
      result += String.fromCodePoint(code);
    }
    return createSuccessResult(result);
  } catch (error) {
    return createErrorResult(error instanceof Error ? error.message : 'UTF-32 LE解码错误');
  }
};
