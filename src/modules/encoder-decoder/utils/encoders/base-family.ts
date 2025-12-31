/**
 * Base家族编码函数 - Base64, Base32, Base32Hex, Base16
 */

import type { EncodeDecodeResult } from './common';
import { createSuccessResult, createErrorResult } from './common';

/**
 * Base64 编码 - 高性能版
 * @param input 输入字符串
 * @returns 编码结果
 */
export const base64Encode = (input: string): EncodeDecodeResult => {
  try {
    // 直接使用内置的btoa函数，它是经过优化的原生实现
    // 对于包含非ASCII字符的字符串，使用TextEncoder先转换为字节数组
    const encoder = new TextEncoder();
    const bytes = encoder.encode(input);
    // 使用String.fromCharCode.apply优化大量字符的转换
    const binaryString = String.fromCharCode.apply(null, bytes as unknown as number[]);
    const result = btoa(binaryString);
    return createSuccessResult(result);
  } catch (error) {
    return createErrorResult(error instanceof Error ? error.message : 'Base64编码错误');
  }
};

/**
 * Base64 解码 - 高性能版
 * @param input 输入字符串
 * @returns 解码结果
 */
export const base64Decode = (input: string): EncodeDecodeResult => {
  try {
    // 直接使用内置的atob函数，它是经过优化的原生实现
    const binaryString = atob(input);
    // 使用Uint8Array.from优化字节数组的创建
    const bytes = Uint8Array.from(binaryString, c => c.charCodeAt(0));
    // 使用TextDecoder优化字节数组到字符串的转换
    const decoder = new TextDecoder();
    const result = decoder.decode(bytes);
    return createSuccessResult(result);
  } catch (error) {
    return createErrorResult(error instanceof Error ? error.message : 'Base64解码错误');
  }
};

/**
 * Base16 编码 - 高性能版
 * @param input 输入字符串
 * @returns 编码结果
 */
export const base16Encode = (input: string): EncodeDecodeResult => {
  try {
    // 使用TextEncoder获取字节数组，然后转换为十六进制字符串
    const encoder = new TextEncoder();
    const bytes = encoder.encode(input);

    // 预分配结果数组，避免多次字符串拼接
    const resultArray = new Array(bytes.length * 2);
    // 十六进制字符映射表
    const hexChars = '0123456789ABCDEF';

    // 直接操作数组，避免字符串拼接
    for (let i = 0; i < bytes.length; i++) {
      const byte = bytes[i];
      resultArray[i * 2] = hexChars[byte >> 4]; // 高4位
      resultArray[i * 2 + 1] = hexChars[byte & 0x0F]; // 低4位
    }

    const result = resultArray.join('');
    return createSuccessResult(result);
  } catch (error) {
    return createErrorResult(error instanceof Error ? error.message : 'Base16编码错误');
  }
};

/**
 * Base16 解码 - 高性能版
 * @param input 输入字符串
 * @returns 解码结果
 */
export const base16Decode = (input: string): EncodeDecodeResult => {
  try {
    if (input.length % 2 !== 0) {
      throw new Error('Base16 input must have even length');
    }

    // 预分配字节数组以提高性能
    const bytes = new Uint8Array(input.length / 2);

    // 直接操作字节数组，避免字符串拼接和多次查找
    for (let i = 0; i < input.length; i += 2) {
      const high = parseInt(input[i], 16);
      const low = parseInt(input[i + 1], 16);
      // 检查是否是有效的十六进制字符
      if (isNaN(high) || isNaN(low)) {
        throw new Error('Invalid Base16 character');
      }
      bytes[i / 2] = (high << 4) | low;
    }

    // 使用TextDecoder一次性解码字节数组
    const decoder = new TextDecoder();
    const result = decoder.decode(bytes);

    return createSuccessResult(result);
  } catch (error) {
    return createErrorResult(error instanceof Error ? error.message : 'Base16解码错误');
  }
};

/**
 * Base32 编码 - RFC 4648 标准实现
 */
export const base32Encode = (input: string): EncodeDecodeResult => {
  try {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const bytes = new TextEncoder().encode(input);

    let buffer = 0;
    let bitsLeft = 0;
    let result = '';

    for (let i = 0; i < bytes.length; i++) {
      buffer = (buffer << 8) | bytes[i];
      bitsLeft += 8;

      while (bitsLeft >= 5) {
        const index = (buffer >>> (bitsLeft - 5)) & 0x1F;
        result += alphabet[index];
        bitsLeft -= 5;
      }
    }

    if (bitsLeft > 0) {
      const index = (buffer << (5 - bitsLeft)) & 0x1F;
      result += alphabet[index];
    }

    // 填充到8的倍数
    while (result.length % 8 !== 0) {
      result += '=';
    }

    return createSuccessResult(result);
  } catch (error) {
    return createErrorResult(error instanceof Error ? error.message : 'Base32编码错误');
  }
};

/**
 * Base32 解码 - RFC 4648 标准实现
 */
export const base32Decode = (input: string): EncodeDecodeResult => {
  try {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const inputUpper = input.toUpperCase().replace(/=/g, '');

    let buffer = 0;
    let bitsLeft = 0;
    const bytes: number[] = [];

    for (let i = 0; i < inputUpper.length; i++) {
      const char = inputUpper[i];
      const index = alphabet.indexOf(char);

      if (index === -1) {
        throw new Error(`Invalid Base32 character: ${char}`);
      }

      buffer = (buffer << 5) | index;
      bitsLeft += 5;

      while (bitsLeft >= 8) {
        bytes.push((buffer >>> (bitsLeft - 8)) & 0xFF);
        bitsLeft -= 8;
      }
    }

    const result = new TextDecoder().decode(new Uint8Array(bytes));
    return createSuccessResult(result);
  } catch (error) {
    return createErrorResult(error instanceof Error ? error.message : 'Base32解码错误');
  }
};

/**
 * Base32Hex 编码 (RFC 4648 扩展十六进制字母表)
 */
export const base32HexEncode = (input: string): EncodeDecodeResult => {
  try {
    const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUV';
    let buffer = 0;
    let bitsLeft = 0;
    let result = '';

    for (let i = 0; i < input.length; i++) {
      buffer = (buffer << 8) | input.charCodeAt(i);
      bitsLeft += 8;
      while (bitsLeft >= 5) {
        const index = (buffer >>> (bitsLeft - 5)) & 0x1f;
        result += alphabet[index];
        bitsLeft -= 5;
      }
    }
    if (bitsLeft > 0) {
      const index = (buffer << (5 - bitsLeft)) & 0x1f;
      result += alphabet[index];
    }
    // 填充到8的倍数
    while (result.length % 8 !== 0) result += '=';
    return createSuccessResult(result);
  } catch (error) {
    return createErrorResult(error instanceof Error ? error.message : 'Base32Hex编码错误');
  }
};

/**
 * Base32Hex 解码
 */
export const base32HexDecode = (input: string): EncodeDecodeResult => {
  try {
    const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUV';
    const inputUpper = input.toUpperCase().replace(/=/g, '');
    let buffer = 0;
    let bitsLeft = 0;
    let result = '';

    for (let i = 0; i < inputUpper.length; i++) {
      const index = alphabet.indexOf(inputUpper[i]);
      if (index === -1) throw new Error(`Invalid Base32Hex character: ${inputUpper[i]}`);
      buffer = (buffer << 5) | index;
      bitsLeft += 5;
      while (bitsLeft >= 8) {
        result += String.fromCharCode((buffer >>> (bitsLeft - 8)) & 0xff);
        bitsLeft -= 8;
      }
    }
    return createSuccessResult(result);
  } catch (error) {
    return createErrorResult(error instanceof Error ? error.message : 'Base32Hex解码错误');
  }
};

/**
 * Base64URL 编码 - 高性能版
 * @param input 输入字符串
 * @returns 编码结果
 */
export const base64UrlEncode = (input: string): EncodeDecodeResult => {
  try {
    // 使用更现代的实现方式，避免使用已弃用的unescape函数
    const encoder = new TextEncoder();
    const bytes = encoder.encode(input);
    const binaryString = String.fromCharCode.apply(null, bytes as unknown as number[]);

    // 先进行Base64编码，然后替换URL不安全的字符
    const base64Url = btoa(binaryString)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    return createSuccessResult(base64Url);
  } catch (error) {
    return createErrorResult(error instanceof Error ? error.message : 'Base64URL编码错误');
  }
};

/**
 * Base64URL 解码 - 高性能版
 * @param input 输入字符串
 * @returns 解码结果
 */
export const base64UrlDecode = (input: string): EncodeDecodeResult => {
  try {
    // 将URL安全字符转换回标准Base64
    let base64 = input
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    // 添加缺失的填充
    const padding = 4 - (base64.length % 4);
    if (padding !== 4) {
      base64 += '='.repeat(padding);
    }

    // 使用更现代的实现方式，避免使用已弃用的escape函数
    const binaryString = atob(base64);
    const bytes = Uint8Array.from(binaryString, c => c.charCodeAt(0));
    const decoder = new TextDecoder();
    const result = decoder.decode(bytes);

    return createSuccessResult(result);
  } catch (error) {
    return createErrorResult(error instanceof Error ? error.message : 'Base64URL解码错误');
  }
};
