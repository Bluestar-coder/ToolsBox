/**
 * 智能解码工具 - 自动识别并解码文本中的各种编码
 */

import { base64Decode } from './encoders/base-family';
import { urlDecode, htmlDecode, unicodeDecode } from './encoders/text-encoders';

export interface DecodeMatch {
  original: string;      // 原始匹配的编码文本
  decoded: string;       // 解码后的文本
  type: string;          // 编码类型
  start: number;         // 起始位置
  end: number;           // 结束位置
}

export interface SmartDecodeResult {
  success: boolean;
  result: string;        // 解码后的完整文本
  matches: DecodeMatch[]; // 所有匹配和解码的详情
  error?: string;
}

// URL编码模式 - 匹配 %XX 格式
const URL_ENCODED_PATTERN = /(?:%[0-9A-Fa-f]{2})+/g;

// Base64模式 - 匹配标准Base64字符串（至少8个字符，避免误匹配）
const BASE64_PATTERN = /(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})/g;

// Unicode转义模式 - 匹配 \uXXXX 格式
const UNICODE_PATTERN = /\\u[0-9A-Fa-f]{4}/g;

// HTML实体模式 - 匹配 &xxx; 或 &#xxx; 格式
const HTML_ENTITY_PATTERN = /&(?:#[0-9]+|#x[0-9A-Fa-f]+|[a-zA-Z]+);/g;

// Hex编码模式 - 匹配 \xXX 格式
const HEX_ESCAPE_PATTERN = /\\x[0-9A-Fa-f]{2}/g;

/**
 * 检查字符串是否是有效的Base64
 */
function isValidBase64(str: string): boolean {
  if (str.length < 8) return false; // 太短的不处理
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(str)) return false;
  
  try {
    const decoded = atob(str);
    // 检查解码后是否包含可打印字符
    const printableRatio = decoded.split('').filter(c => {
      const code = c.charCodeAt(0);
      return (code >= 32 && code <= 126) || code === 9 || code === 10 || code === 13;
    }).length / decoded.length;
    
    return printableRatio > 0.8; // 80%以上是可打印字符才认为是有效Base64
  } catch {
    return false;
  }
}

/**
 * 解码Hex转义序列 \xXX
 */
function decodeHexEscape(str: string): string {
  return str.replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
}

/**
 * 智能解码 - 自动识别并解码文本中的各种编码
 */
export function smartDecode(input: string, options: {
  decodeUrl?: boolean;
  decodeBase64?: boolean;
  decodeUnicode?: boolean;
  decodeHtml?: boolean;
  decodeHex?: boolean;
  maxIterations?: number;
} = {}): SmartDecodeResult {
  const {
    decodeUrl = true,
    decodeBase64 = true,
    decodeUnicode = true,
    decodeHtml = true,
    decodeHex = true,
    maxIterations = 5,
  } = options;

  const matches: DecodeMatch[] = [];
  let result = input;
  let iteration = 0;
  let hasChanges = true;

  try {
    // 迭代解码，直到没有变化或达到最大迭代次数
    while (hasChanges && iteration < maxIterations) {
      hasChanges = false;
      iteration++;
      const previousResult = result;

      // 1. 解码URL编码
      if (decodeUrl) {
        const urlMatches = result.match(URL_ENCODED_PATTERN);
        if (urlMatches) {
          for (const match of urlMatches) {
            try {
              const decoded = urlDecode(match);
              if (decoded.success && decoded.result !== match) {
                matches.push({
                  original: match,
                  decoded: decoded.result,
                  type: 'URL',
                  start: result.indexOf(match),
                  end: result.indexOf(match) + match.length,
                });
                result = result.replace(match, decoded.result);
                hasChanges = true;
              }
            } catch {
              // 忽略解码错误
            }
          }
        }
      }

      // 2. 解码Unicode转义
      if (decodeUnicode) {
        const unicodeMatches = result.match(UNICODE_PATTERN);
        if (unicodeMatches) {
          const fullMatch = unicodeMatches.join('');
          const decoded = unicodeDecode(result);
          if (decoded.success && decoded.result !== result) {
            matches.push({
              original: fullMatch,
              decoded: decoded.result.substring(
                result.indexOf(unicodeMatches[0]),
                result.indexOf(unicodeMatches[0]) + fullMatch.length
              ),
              type: 'Unicode',
              start: 0,
              end: result.length,
            });
            result = decoded.result;
            hasChanges = true;
          }
        }
      }

      // 3. 解码Hex转义
      if (decodeHex) {
        const hexMatches = result.match(HEX_ESCAPE_PATTERN);
        if (hexMatches) {
          const decoded = decodeHexEscape(result);
          if (decoded !== result) {
            matches.push({
              original: hexMatches.join(', '),
              decoded: decoded,
              type: 'Hex',
              start: 0,
              end: result.length,
            });
            result = decoded;
            hasChanges = true;
          }
        }
      }

      // 4. 解码HTML实体
      if (decodeHtml) {
        const htmlMatches = result.match(HTML_ENTITY_PATTERN);
        if (htmlMatches) {
          const decoded = htmlDecode(result);
          if (decoded.success && decoded.result !== result) {
            matches.push({
              original: htmlMatches.join(', '),
              decoded: decoded.result,
              type: 'HTML',
              start: 0,
              end: result.length,
            });
            result = decoded.result;
            hasChanges = true;
          }
        }
      }

      // 5. 解码Base64（最后处理，因为可能误匹配）
      if (decodeBase64) {
        const base64Matches = result.match(BASE64_PATTERN);
        if (base64Matches) {
          for (const match of base64Matches) {
            if (isValidBase64(match)) {
              const decoded = base64Decode(match);
              if (decoded.success && decoded.result !== match) {
                matches.push({
                  original: match,
                  decoded: decoded.result,
                  type: 'Base64',
                  start: result.indexOf(match),
                  end: result.indexOf(match) + match.length,
                });
                result = result.replace(match, decoded.result);
                hasChanges = true;
              }
            }
          }
        }
      }

      // 如果没有变化，退出循环
      if (result === previousResult) {
        hasChanges = false;
      }
    }

    return {
      success: true,
      result,
      matches,
    };
  } catch (error) {
    return {
      success: false,
      result: input,
      matches: [],
      error: error instanceof Error ? error.message : '解码失败',
    };
  }
}

/**
 * 获取支持的解码类型列表
 */
export const supportedDecodeTypes = [
  { key: 'url', label: 'URL编码', description: '%XX 格式' },
  { key: 'base64', label: 'Base64', description: '标准Base64编码' },
  { key: 'unicode', label: 'Unicode', description: '\\uXXXX 格式' },
  { key: 'html', label: 'HTML实体', description: '&xxx; 格式' },
  { key: 'hex', label: 'Hex转义', description: '\\xXX 格式' },
];
