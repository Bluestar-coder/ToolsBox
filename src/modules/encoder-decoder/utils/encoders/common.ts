/**
 * 公共类型定义和工具函数
 */

// 编码/解码类型定义
export type EncoderType = 'base64' | 'base16' | 'base32' | 'base32hex' | 'base36' | 'base64url' | 'base58' | 'base62' | 'base85' | 'base91' | 'url' | 'html' | 'json' | 'unicode' | 'utf7' | 'utf8' | 'utf16be' | 'utf16le' | 'utf32be' | 'utf32le';

// Base64家族编码类型
export type BaseFamilyType = 'base16' | 'base32' | 'base32hex' | 'base36' | 'base64' | 'base64url' | 'base58' | 'base62' | 'base85' | 'base91';

// UTF家族编码类型
export type UTFFamilyType = 'utf7' | 'utf8' | 'utf16be' | 'utf16le' | 'utf32be' | 'utf32le';

// 编码/解码操作类型
export type OperationType = 'encode' | 'decode';

// 编码/解码结果类型
export interface EncodeDecodeResult {
  success: boolean;
  result: string;
  error?: string;
}

/**
 * 创建成功的编码/解码结果
 * @param result 结果字符串
 * @returns 成功的结果对象
 */
export function createSuccessResult(result: string): EncodeDecodeResult {
  return { success: true, result };
}

/**
 * 创建失败的编码/解码结果
 * @param error 错误信息
 * @returns 失败的结果对象
 */
export function createErrorResult(error: string): EncodeDecodeResult {
  return { success: false, result: '', error };
}

/**
 * 包装编码/解码函数，自动处理异常
 * @param fn 要执行的函数
 * @param errorMessage 错误消息
 * @returns 包装后的函数
 */
export function withErrorHandling<T extends string>(
  fn: (input: T) => string,
  errorMessage: string
): (input: T) => EncodeDecodeResult {
  return (input: T): EncodeDecodeResult => {
    try {
      const result = fn(input);
      return createSuccessResult(result);
    } catch (error) {
      return createErrorResult(error instanceof Error ? error.message : errorMessage);
    }
  };
}
