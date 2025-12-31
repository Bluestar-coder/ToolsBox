/**
 * 输入验证函数
 */

/**
 * 验证Base64输入
 * @param input 输入字符串
 * @returns 是否有效
 */
export function validateBase64Input(input: string): boolean {
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  return base64Regex.test(input);
}

/**
 * 验证Base32输入
 * @param input 输入字符串
 * @returns 是否有效
 */
export function validateBase32Input(input: string): boolean {
  const base32Regex = /^[A-Z2-7]+=*$/i;
  return base32Regex.test(input);
}

/**
 * 验证Base32Hex输入
 * @param input 输入字符串
 * @returns 是否有效
 */
export function validateBase32HexInput(input: string): boolean {
  const base32HexRegex = /^[0-9A-V]+=*$/i;
  return base32HexRegex.test(input);
}

/**
 * 验证十六进制输入
 * @param input 输入字符串
 * @returns 是否有效
 */
export function validateHexInput(input: string): boolean {
  const hexRegex = /^[0-9A-Fa-f]*$/;
  return hexRegex.test(input) && input.length % 2 === 0;
}

/**
 * 验证Base58输入
 * @param input 输入字符串
 * @returns 是否有效
 */
export function validateBase58Input(input: string): boolean {
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]*$/;
  return base58Regex.test(input);
}

/**
 * 验证Base62输入
 * @param input 输入字符串
 * @returns 是否有效
 */
export function validateBase62Input(input: string): boolean {
  const base62Regex = /^[0-9A-Za-z]*$/;
  return base62Regex.test(input);
}

/**
 * 验证Base91输入
 * @param input 输入字符串
 * @returns 是否有效
 */
export function validateBase91Input(input: string): boolean {
  const base91Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,./:;<=>?@[]^_`{|}~"';
  for (const char of input) {
    if (!base91Alphabet.includes(char)) {
      return false;
    }
  }
  return true;
}

/**
 * 验证URL输入
 * @param input 输入字符串
 * @returns 是否有效
 */
export function validateUrlInput(input: string): boolean {
  try {
    decodeURIComponent(input);
    return true;
  } catch {
    return false;
  }
}

/**
 * 验证JSON输入
 * @param input 输入字符串
 * @returns 是否有效
 */
export function validateJsonInput(input: string): boolean {
  try {
    JSON.parse(input);
    return true;
  } catch {
    return false;
  }
}

/**
 * 验证UTF-8十六进制输入
 * @param input 输入字符串
 * @returns 是否有效
 */
export function validateUtf8HexInput(input: string): boolean {
  const hex = input.replace(/\s+/g, '');
  if (hex.length % 2 !== 0) return false;
  const hexRegex = /^[0-9A-Fa-f]*$/;
  return hexRegex.test(hex);
}

/**
 * 验证UTF-16十六进制输入
 * @param input 输入字符串
 * @returns 是否有效
 */
export function validateUtf16HexInput(input: string): boolean {
  const hex = input.replace(/\s+/g, '');
  if (hex.length % 4 !== 0) return false;
  const hexRegex = /^[0-9A-Fa-f]*$/;
  return hexRegex.test(hex);
}

/**
 * 验证UTF-32十六进制输入
 * @param input 输入字符串
 * @returns 是否有效
 */
export function validateUtf32HexInput(input: string): boolean {
  const hex = input.replace(/\s+/g, '');
  if (hex.length % 8 !== 0) return false;
  const hexRegex = /^[0-9A-Fa-f]*$/;
  return hexRegex.test(hex);
}
