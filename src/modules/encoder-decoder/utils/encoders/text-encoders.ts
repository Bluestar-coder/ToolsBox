/**
 * 文本编码函数 - URL, HTML, JSON, Unicode
 */

import { encode, decode } from 'html-entities';
import type { EncodeDecodeResult, EncoderType, OperationType } from './common';
import { createSuccessResult, createErrorResult } from './common';
import * as baseFamily from './base-family';
import * as extendedBase from './extended-base';
import * as utfFamily from './utf-family';

/**
 * URL 编码 (符合 RFC 3986 标准) - 优化版
 * @param input 输入字符串
 * @returns 编码结果
 */
export const urlEncode = (input: string): EncodeDecodeResult => {
  try {
    // encodeURIComponent 已经是高效的实现，直接使用即可
    const result = encodeURIComponent(input);
    return createSuccessResult(result);
  } catch (error) {
    return createErrorResult(error instanceof Error ? error.message : 'URL编码错误');
  }
};

/**
 * URL 解码 (符合 RFC 3986 标准) - 优化版
 * @param input 输入字符串
 * @returns 解码结果
 */
export const urlDecode = (input: string): EncodeDecodeResult => {
  try {
    // 使用正则表达式替换 + 为空格，然后使用 decodeURIComponent 解码
    // 使用 replaceAll 替代 replace 以处理所有匹配项
    const result = decodeURIComponent(input.replaceAll('+', ' '));
    return createSuccessResult(result);
  } catch (error) {
    return createErrorResult(error instanceof Error ? error.message : 'URL解码错误');
  }
};

/**
 * URL 编码 (application/x-www-form-urlencoded 格式)
 * @param input 输入字符串
 * @returns 编码结果
 */
export const urlFormEncode = (input: string): EncodeDecodeResult => {
  try {
    // 先使用 encodeURIComponent，然后将空格替换为 + 号
    const result = encodeURIComponent(input).replace(/%20/g, '+');
    return createSuccessResult(result);
  } catch (error) {
    return createErrorResult(error instanceof Error ? error.message : 'URL表单编码错误');
  }
};

/**
 * HTML 实体编码
 * @param input 输入字符串
 * @returns 编码结果
 */
export const htmlEncode = (input: string): EncodeDecodeResult => {
  try {
    const result = encode(input);
    return createSuccessResult(result);
  } catch (error) {
    return createErrorResult(error instanceof Error ? error.message : 'HTML实体编码错误');
  }
};

/**
 * HTML 实体解码
 * @param input 输入字符串
 * @returns 解码结果
 */
export const htmlDecode = (input: string): EncodeDecodeResult => {
  try {
    const result = decode(input);
    return createSuccessResult(result);
  } catch (error) {
    return createErrorResult(error instanceof Error ? error.message : 'HTML实体解码错误');
  }
};

/**
 * JSON 编码
 * @param input 输入字符串
 * @returns 编码结果
 */
export const jsonEncode = (input: string): EncodeDecodeResult => {
  try {
    // 尝试解析输入，确保它是有效的 JSON
    const parsed = JSON.parse(input);
    const result = JSON.stringify(parsed, null, 2);
    return createSuccessResult(result);
  } catch (error) {
    return createErrorResult(error instanceof Error ? error.message : 'JSON编码错误');
  }
};

/**
 * JSON 解码
 * @param input 输入字符串
 * @returns 解码结果
 */
export const jsonDecode = (input: string): EncodeDecodeResult => {
  try {
    const parsed = JSON.parse(input);
    const result = JSON.stringify(parsed, null, 2);
    return createSuccessResult(result);
  } catch (error) {
    return createErrorResult(error instanceof Error ? error.message : 'JSON解码错误');
  }
};

/**
 * ASCII 编码 (字符转十进制码值，空格分隔)
 * @param input 输入字符串
 * @returns 编码结果
 */
export const asciiEncode = (input: string): EncodeDecodeResult => {
  try {
    const result = input.split('').map(char => {
      const code = char.charCodeAt(0);
      if (code > 127) {
        throw new Error(`字符 "${char}" 不是有效的 ASCII 字符`);
      }
      return code.toString();
    }).join(' ');
    return createSuccessResult(result);
  } catch (error) {
    return createErrorResult(error instanceof Error ? error.message : 'ASCII编码错误');
  }
};

/**
 * ASCII 解码 (十进制码值转字符，支持空格/逗号分隔)
 * @param input 输入字符串
 * @returns 解码结果
 */
export const asciiDecode = (input: string): EncodeDecodeResult => {
  try {
    // 支持空格、逗号、分号等分隔符
    const codes = input.trim().split(/[\s,;]+/).filter(s => s.length > 0);
    const result = codes.map(code => {
      const num = parseInt(code, 10);
      if (isNaN(num) || num < 0 || num > 127) {
        throw new Error(`"${code}" 不是有效的 ASCII 码值 (0-127)`);
      }
      return String.fromCharCode(num);
    }).join('');
    return createSuccessResult(result);
  } catch (error) {
    return createErrorResult(error instanceof Error ? error.message : 'ASCII解码错误');
  }
};

/**
 * Unicode 编码 (\\uXXXX 格式)
 * @param input 输入字符串
 * @returns 编码结果
 */
export const unicodeEncode = (input: string): EncodeDecodeResult => {
  try {
    const result = input.split('').map(char => {
      const code = char.charCodeAt(0);
      return code > 127 ? `\\u${code.toString(16).padStart(4, '0')}` : char;
    }).join('');
    return createSuccessResult(result);
  } catch (error) {
    return createErrorResult(error instanceof Error ? error.message : 'Unicode编码错误');
  }
};

/**
 * Unicode 解码 (\\uXXXX 格式)
 * @param input 输入字符串
 * @returns 解码结果
 */
export const unicodeDecode = (input: string): EncodeDecodeResult => {
  try {
    const result = input.replace(/\\u([0-9a-fA-F]{4})/g, (_, code) => {
      return String.fromCharCode(parseInt(code, 16));
    });
    return createSuccessResult(result);
  } catch (error) {
    return createErrorResult(error instanceof Error ? error.message : 'Unicode解码错误');
  }
};

/**
 * 执行编码/解码操作
 * @param input 输入字符串
 * @param type 编码类型
 * @param operation 操作类型
 * @returns 编码/解码结果
 */
export const executeEncodeDecode = (input: string, type: EncoderType, operation: OperationType): EncodeDecodeResult => {
  if (!input.trim()) {
    return createSuccessResult('');
  }

  switch (type) {
    // Base家族编码/解码
    case 'base16':
      return operation === 'encode' ? baseFamily.base16Encode(input) : baseFamily.base16Decode(input);
    case 'base32':
      return operation === 'encode' ? baseFamily.base32Encode(input) : baseFamily.base32Decode(input);
    case 'base32hex':
      return operation === 'encode' ? baseFamily.base32HexEncode(input) : baseFamily.base32HexDecode(input);
    case 'base36':
      return operation === 'encode' ? extendedBase.base36Encode(input) : extendedBase.base36Decode(input);
    case 'base58':
      return operation === 'encode' ? extendedBase.base58Encode(input) : extendedBase.base58Decode(input);
    case 'base62':
      return operation === 'encode' ? extendedBase.base62Encode(input) : extendedBase.base62Decode(input);
    case 'base64':
      return operation === 'encode' ? baseFamily.base64Encode(input) : baseFamily.base64Decode(input);
    case 'base64url':
      return operation === 'encode' ? baseFamily.base64UrlEncode(input) : baseFamily.base64UrlDecode(input);
    case 'base85':
      return operation === 'encode' ? extendedBase.base85Encode(input) : extendedBase.base85Decode(input);
    case 'base91':
      return operation === 'encode' ? extendedBase.base91Encode(input) : extendedBase.base91Decode(input);
    // UTF家族编码/解码
    case 'utf7':
      return operation === 'encode' ? utfFamily.utf7Encode(input) : utfFamily.utf7Decode(input);
    case 'utf8':
      return operation === 'encode' ? utfFamily.utf8Encode(input) : utfFamily.utf8Decode(input);
    case 'utf16be':
      return operation === 'encode' ? utfFamily.utf16BEEncode(input) : utfFamily.utf16BEDecode(input);
    case 'utf16le':
      return operation === 'encode' ? utfFamily.utf16LEEncode(input) : utfFamily.utf16LEDecode(input);
    case 'utf32be':
      return operation === 'encode' ? utfFamily.utf32BEEncode(input) : utfFamily.utf32BEDecode(input);
    case 'utf32le':
      return operation === 'encode' ? utfFamily.utf32LEEncode(input) : utfFamily.utf32LEDecode(input);
    // 其他编码/解码
    case 'url':
      return operation === 'encode' ? urlEncode(input) : urlDecode(input);
    case 'html':
      return operation === 'encode' ? htmlEncode(input) : htmlDecode(input);
    case 'json':
      return operation === 'encode' ? jsonEncode(input) : jsonDecode(input);
    case 'unicode':
      return operation === 'encode' ? unicodeEncode(input) : unicodeDecode(input);
    case 'ascii':
      return operation === 'encode' ? asciiEncode(input) : asciiDecode(input);
    default:
      return createErrorResult('不支持的编码类型');
  }
};

/**
 * 获取编码/解码类型的显示名称
 * @param type 编码类型
 * @returns 显示名称
 */
export const getEncoderDisplayName = (type: EncoderType): string => {
  const displayNames: Record<EncoderType, string> = {
    base16: 'Base16 (Hex)',
    base32: 'Base32',
    base32hex: 'Base32Hex',
    base36: 'Base36',
    base58: 'Base58',
    base62: 'Base62',
    base64: 'Base64',
    base64url: 'Base64URL',
    base85: 'Base85 (ASCII85)',
    base91: 'Base91',
    utf7: 'UTF-7',
    utf8: 'UTF-8',
    utf16be: 'UTF-16 BE',
    utf16le: 'UTF-16 LE',
    utf32be: 'UTF-32 BE',
    utf32le: 'UTF-32 LE',
    url: 'URL',
    html: 'HTML实体',
    json: 'JSON',
    unicode: 'Unicode',
    ascii: 'ASCII'
  };
  return displayNames[type] || type;
};
