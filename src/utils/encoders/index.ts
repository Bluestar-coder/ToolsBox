import { encode, decode } from 'html-entities';

// 编码/解码类型定义
export type EncoderType = 'base64' | 'url' | 'html' | 'json' | 'unicode';

// 编码/解码操作类型
export type OperationType = 'encode' | 'decode';

// 编码/解码结果类型
export interface EncodeDecodeResult {
  success: boolean;
  result: string;
  error?: string;
}

/**
 * Base64 编码
 * @param input 输入字符串
 * @returns 编码结果
 */
export const base64Encode = (input: string): EncodeDecodeResult => {
  try {
    const result = btoa(unescape(encodeURIComponent(input)));
    return { success: true, result };
  } catch (error) {
    return { success: false, result: '', error: error instanceof Error ? error.message : 'Base64 encode error' };
  }
};

/**
 * Base64 解码
 * @param input 输入字符串
 * @returns 解码结果
 */
export const base64Decode = (input: string): EncodeDecodeResult => {
  try {
    const result = decodeURIComponent(escape(atob(input)));
    return { success: true, result };
  } catch (error) {
    return { success: false, result: '', error: error instanceof Error ? error.message : 'Base64 decode error' };
  }
};

/**
 * URL 编码
 * @param input 输入字符串
 * @returns 编码结果
 */
export const urlEncode = (input: string): EncodeDecodeResult => {
  try {
    const result = encodeURIComponent(input);
    return { success: true, result };
  } catch (error) {
    return { success: false, result: '', error: error instanceof Error ? error.message : 'URL encode error' };
  }
};

/**
 * URL 解码
 * @param input 输入字符串
 * @returns 解码结果
 */
export const urlDecode = (input: string): EncodeDecodeResult => {
  try {
    const result = decodeURIComponent(input);
    return { success: true, result };
  } catch (error) {
    return { success: false, result: '', error: error instanceof Error ? error.message : 'URL decode error' };
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
    return { success: true, result };
  } catch (error) {
    return { success: false, result: '', error: error instanceof Error ? error.message : 'HTML encode error' };
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
    return { success: true, result };
  } catch (error) {
    return { success: false, result: '', error: error instanceof Error ? error.message : 'HTML decode error' };
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
    return { success: true, result };
  } catch (error) {
    return { success: false, result: '', error: error instanceof Error ? error.message : 'JSON encode error' };
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
    return { success: true, result };
  } catch (error) {
    return { success: false, result: '', error: error instanceof Error ? error.message : 'JSON decode error' };
  }
};

/**
 * Unicode 编码
 * @param input 输入字符串
 * @returns 编码结果
 */
export const unicodeEncode = (input: string): EncodeDecodeResult => {
  try {
    const result = input.split('').map(char => {
      const code = char.charCodeAt(0);
      return code > 127 ? `\\u${code.toString(16).padStart(4, '0')}` : char;
    }).join('');
    return { success: true, result };
  } catch (error) {
    return { success: false, result: '', error: error instanceof Error ? error.message : 'Unicode encode error' };
  }
};

/**
 * Unicode 解码
 * @param input 输入字符串
 * @returns 解码结果
 */
export const unicodeDecode = (input: string): EncodeDecodeResult => {
  try {
    const result = input.replace(/\\u([0-9a-fA-F]{4})/g, (_, code) => {
      return String.fromCharCode(parseInt(code, 16));
    });
    return { success: true, result };
  } catch (error) {
    return { success: false, result: '', error: error instanceof Error ? error.message : 'Unicode decode error' };
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
    return { success: true, result: '' };
  }

  switch (type) {
    case 'base64':
      return operation === 'encode' ? base64Encode(input) : base64Decode(input);
    case 'url':
      return operation === 'encode' ? urlEncode(input) : urlDecode(input);
    case 'html':
      return operation === 'encode' ? htmlEncode(input) : htmlDecode(input);
    case 'json':
      return operation === 'encode' ? jsonEncode(input) : jsonDecode(input);
    case 'unicode':
      return operation === 'encode' ? unicodeEncode(input) : unicodeDecode(input);
    default:
      return { success: false, result: '', error: 'Unsupported encoding type' };
  }
};

/**
 * 获取编码/解码类型的显示名称
 * @param type 编码类型
 * @returns 显示名称
 */
export const getEncoderDisplayName = (type: EncoderType): string => {
  const displayNames: Record<EncoderType, string> = {
    base64: 'Base64',
    url: 'URL',
    html: 'HTML Entity',
    json: 'JSON',
    unicode: 'Unicode'
  };
  return displayNames[type] || type;
};
