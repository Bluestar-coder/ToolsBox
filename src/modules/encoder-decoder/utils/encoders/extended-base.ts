/**
 * 扩展Base编码函数 - Base36, Base58, Base62, Base85, Base91
 */

import type { EncodeDecodeResult } from './common';
import { createSuccessResult, createErrorResult } from './common';

/**
 * Base36 编码 - 高性能版
 * @param input 输入字符串
 * @returns 编码结果
 */
export const base36Encode = (input: string): EncodeDecodeResult => {
  try {
    // 预分配结果数组，避免多次字符串拼接
    const resultArray = new Array(input.length);

    // 直接操作数组，避免字符串拼接
    for (let i = 0; i < input.length; i++) {
      const charCode = input.charCodeAt(i);
      resultArray[i] = charCode.toString(36);
    }

    const result = resultArray.join('').toUpperCase();
    return createSuccessResult(result);
  } catch (error) {
    return createErrorResult(error instanceof Error ? error.message : 'Base36编码错误');
  }
};

/**
 * Base36 解码 - 高性能版
 * @param input 输入字符串
 * @returns 解码结果
 */
export const base36Decode = (input: string): EncodeDecodeResult => {
  try {
    let result = '';
    let temp = '';

    // 直接遍历字符串，避免不必要的异常处理
    for (let i = 0; i < input.length; i++) {
      temp += input[i];
      const charCode = parseInt(temp, 36);

      if (isNaN(charCode)) {
        throw new Error('Invalid Base36 character');
      }

      if (charCode <= 255) {
        result += String.fromCharCode(charCode);
        temp = '';
      }
    }

    // 如果还有剩余的字符，说明输入无效
    if (temp.length > 0) {
      throw new Error('Invalid Base36 input');
    }

    return createSuccessResult(result);
  } catch (error) {
    return createErrorResult(error instanceof Error ? error.message : 'Base36解码错误');
  }
};

/**
 * Base58 编码
 */
export const base58Encode = (input: string): EncodeDecodeResult => {
  try {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    const bytes = new TextEncoder().encode(input);

    let value = BigInt(0);
    for (let i = 0; i < bytes.length; i++) {
      value = (value << BigInt(8)) | BigInt(bytes[i]);
    }

    if (value === BigInt(0)) {
      return createSuccessResult(alphabet[0]);
    }

    let result = '';
    while (value > BigInt(0)) {
      const remainder = value % BigInt(58);
      result = alphabet[Number(remainder)] + result;
      value = value / BigInt(58);
    }

    // 处理前导零字节
    for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
      result = alphabet[0] + result;
    }

    return createSuccessResult(result);
  } catch (error) {
    return createErrorResult(error instanceof Error ? error.message : 'Base58编码错误');
  }
};

/**
 * Base58 解码
 */
export const base58Decode = (input: string): EncodeDecodeResult => {
  try {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let value = BigInt(0);

    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      const index = alphabet.indexOf(char);
      if (index === -1) {
        throw new Error(`Invalid Base58 character: ${char}`);
      }
      value = value * BigInt(58) + BigInt(index);
    }

    // 转换为字节数组
    const bytes: number[] = [];
    while (value > BigInt(0)) {
      bytes.unshift(Number(value & BigInt(0xFF)));
      value = value >> BigInt(8);
    }

    // 处理前导1（代表零字节）
    for (let i = 0; i < input.length && input[i] === alphabet[0]; i++) {
      bytes.unshift(0);
    }

    const result = new TextDecoder().decode(new Uint8Array(bytes));
    return createSuccessResult(result);
  } catch (error) {
    return createErrorResult(error instanceof Error ? error.message : 'Base58解码错误');
  }
};

/**
 * Base62 编码
 */
export const base62Encode = (input: string): EncodeDecodeResult => {
  try {
    const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let value = BigInt(0);
    for (let i = 0; i < input.length; i++) {
      value = (value << BigInt(8)) | BigInt(input.charCodeAt(i));
    }
    if (value === BigInt(0)) return createSuccessResult(alphabet[0]);
    let result = '';
    while (value > BigInt(0)) {
      result = alphabet[Number(value % BigInt(62))] + result;
      value = value / BigInt(62);
    }
    // 处理前导零
    for (let i = 0; i < input.length && input[i] === '\x00'; i++) {
      result = alphabet[0] + result;
    }
    return createSuccessResult(result);
  } catch (error) {
    return createErrorResult(error instanceof Error ? error.message : 'Base62编码错误');
  }
};

/**
 * Base62 解码
 */
export const base62Decode = (input: string): EncodeDecodeResult => {
  try {
    const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let value = BigInt(0);
    for (let i = 0; i < input.length; i++) {
      const index = alphabet.indexOf(input[i]);
      if (index === -1) throw new Error(`Invalid Base62 character: ${input[i]}`);
      value = value * BigInt(62) + BigInt(index);
    }
    let result = '';
    while (value > BigInt(0)) {
      result = String.fromCharCode(Number(value & BigInt(0xff))) + result;
      value = value >> BigInt(8);
    }
    // 处理前导零
    for (let i = 0; i < input.length && input[i] === alphabet[0]; i++) {
      result = '\x00' + result;
    }
    return createSuccessResult(result);
  } catch (error) {
    return createErrorResult(error instanceof Error ? error.message : 'Base62解码错误');
  }
};

/**
 * Base85 (ASCII85) 编码
 */
export const base85Encode = (input: string): EncodeDecodeResult => {
  try {
    const bytes = new TextEncoder().encode(input);
    let result = '<~';

    for (let i = 0; i < bytes.length; i += 4) {
      let value = 0;
      const chunk = Math.min(4, bytes.length - i);
      for (let j = 0; j < 4; j++) {
        value = value * 256 + (j < chunk ? bytes[i + j] : 0);
      }

      if (value === 0 && chunk === 4) {
        result += 'z';
      } else {
        const encoded = [];
        for (let j = 0; j < 5; j++) {
          encoded.unshift(String.fromCharCode((value % 85) + 33));
          value = Math.floor(value / 85);
        }
        result += encoded.slice(0, chunk + 1).join('');
      }
    }
    result += '~>';
    return createSuccessResult(result);
  } catch (error) {
    return createErrorResult(error instanceof Error ? error.message : 'Base85编码错误');
  }
};

/**
 * Base85 (ASCII85) 解码
 */
export const base85Decode = (input: string): EncodeDecodeResult => {
  try {
    let data = input.trim();
    if (data.startsWith('<~')) data = data.slice(2);
    if (data.endsWith('~>')) data = data.slice(0, -2);
    data = data.replace(/z/g, '!!!!!');

    const bytes: number[] = [];
    for (let i = 0; i < data.length; i += 5) {
      const chunk = data.slice(i, i + 5).padEnd(5, 'u');
      let value = 0;
      for (let j = 0; j < 5; j++) {
        value = value * 85 + (chunk.charCodeAt(j) - 33);
      }
      const chunkLen = Math.min(5, data.length - i);
      for (let j = 0; j < chunkLen - 1; j++) {
        bytes.push((value >> (24 - j * 8)) & 0xff);
      }
    }
    return createSuccessResult(new TextDecoder().decode(new Uint8Array(bytes)));
  } catch (error) {
    return createErrorResult(error instanceof Error ? error.message : 'Base85解码错误');
  }
};

/**
 * Base91 编码
 */
export const base91Encode = (input: string): EncodeDecodeResult => {
  try {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,./:;<=>?@[]^_`{|}~"';
    const bytes = new TextEncoder().encode(input);
    let result = '';
    let b = 0;
    let n = 0;

    for (let i = 0; i < bytes.length; i++) {
      b |= bytes[i] << n;
      n += 8;
      if (n > 13) {
        let v = b & 8191;
        if (v > 88) {
          b >>= 13;
          n -= 13;
        } else {
          v = b & 16383;
          b >>= 14;
          n -= 14;
        }
        result += alphabet[v % 91] + alphabet[Math.floor(v / 91)];
      }
    }
    if (n) {
      result += alphabet[b % 91];
      if (n > 7 || b > 90) result += alphabet[Math.floor(b / 91)];
    }
    return createSuccessResult(result);
  } catch (error) {
    return createErrorResult(error instanceof Error ? error.message : 'Base91编码错误');
  }
};

/**
 * Base91 解码
 */
export const base91Decode = (input: string): EncodeDecodeResult => {
  try {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,./:;<=>?@[]^_`{|}~"';
    const bytes: number[] = [];
    let b = 0;
    let n = 0;
    let v = -1;

    for (let i = 0; i < input.length; i++) {
      const p = alphabet.indexOf(input[i]);
      if (p === -1) continue;
      if (v < 0) {
        v = p;
      } else {
        v += p * 91;
        b |= v << n;
        n += (v & 8191) > 88 ? 13 : 14;
        do {
          bytes.push(b & 0xff);
          b >>= 8;
          n -= 8;
        } while (n > 7);
        v = -1;
      }
    }
    if (v > -1) bytes.push((b | v << n) & 0xff);
    return createSuccessResult(new TextDecoder().decode(new Uint8Array(bytes)));
  } catch (error) {
    return createErrorResult(error instanceof Error ? error.message : 'Base91解码错误');
  }
};
