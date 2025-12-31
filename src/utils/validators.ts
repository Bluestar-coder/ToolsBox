import { logger } from './logger';

// 输入验证工具函数

// 验证结果类型
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * 验证字符串是否为空
 * @param input 输入字符串
 * @param fieldName 字段名称
 * @returns 验证结果
 */
export const validateRequired = (input: string, fieldName: string): ValidationResult => {
  if (!input || input.trim() === '') {
    return { valid: false, error: `${fieldName}不能为空` };
  }
  return { valid: true };
};

/**
 * 验证字符串长度范围
 * @param input 输入字符串
 * @param minLength 最小长度
 * @param maxLength 最大长度
 * @param fieldName 字段名称
 * @returns 验证结果
 */
export const validateLength = (input: string, minLength: number, maxLength: number, fieldName: string): ValidationResult => {
  if (input.length < minLength) {
    return { valid: false, error: `${fieldName}长度不能小于${minLength}个字符` };
  }
  if (input.length > maxLength) {
    return { valid: false, error: `${fieldName}长度不能超过${maxLength}个字符` };
  }
  return { valid: true };
};

/**
 * 验证是否为有效的Base64字符串
 * @param input 输入字符串
 * @returns 验证结果
 */
export const validateBase64 = (input: string): ValidationResult => {
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(input)) {
    return { valid: false, error: '无效的Base64字符串' };
  }
  return { valid: true };
};

/**
 * 验证是否为有效的十六进制字符串
 * @param input 输入字符串
 * @returns 验证结果
 */
export const validateHex = (input: string): ValidationResult => {
  const hexRegex = /^[0-9A-Fa-f]+$/;
  if (!hexRegex.test(input)) {
    return { valid: false, error: '无效的十六进制字符串' };
  }
  return { valid: true };
};

/**
 * 验证是否为有效的URL
 * @param input 输入字符串
 * @returns 验证结果
 */
export const validateUrl = (input: string): ValidationResult => {
  try {
    new URL(input);
    return { valid: true };
  } catch (error) {
    logger.error('URL validation failed:', error);
    return { valid: false, error: '无效的URL格式' };
  }
};

/**
 * 验证是否为有效的JSON字符串
 * @param input 输入字符串
 * @returns 验证结果
 */
export const validateJson = (input: string): ValidationResult => {
  try {
    JSON.parse(input);
    return { valid: true };
  } catch (error) {
    logger.error('JSON validation failed:', error);
    return { valid: false, error: '无效的JSON格式' };
  }
};

/**
 * 验证是否为有效的时间戳（秒或毫秒）
 * @param input 输入字符串
 * @returns 验证结果
 */
export const validateTimestamp = (input: string): ValidationResult => {
  const num = parseInt(input);
  if (isNaN(num)) {
    return { valid: false, error: '无效的时间戳' };
  }
  // 验证是否在合理的时间范围内（1970-2100年）
  const minTimestamp = 0; // 1970-01-01
  const maxTimestamp = 4102444800; // 2100-01-01 (秒级)
  if (num < minTimestamp || num > maxTimestamp * 1000) {
    return { valid: false, error: '时间戳超出合理范围' };
  }
  return { valid: true };
};

/**
 * 验证是否为有效的日期字符串
 * @param input 输入字符串
 * @returns 验证结果
 */
export const validateDate = (input: string): ValidationResult => {
  const date = new Date(input);
  if (isNaN(date.getTime())) {
    return { valid: false, error: '无效的日期格式' };
  }
  return { valid: true };
};

/**
 * 验证是否为有效的密码（至少包含大小写字母和数字，长度8-32位）
 * @param input 输入字符串
 * @returns 验证结果
 */
export const validatePassword = (input: string): ValidationResult => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,32}$/;
  if (!passwordRegex.test(input)) {
    return { valid: false, error: '密码必须包含大小写字母和数字，长度8-32位' };
  }
  return { valid: true };
};

/**
 * 验证是否为有效的电子邮件地址
 * @param input 输入字符串
 * @returns 验证结果
 */
export const validateEmail = (input: string): ValidationResult => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(input)) {
    return { valid: false, error: '无效的电子邮件地址' };
  }
  return { valid: true };
};

/**
 * 验证字符串是否只包含字母数字字符
 * @param input 输入字符串
 * @param fieldName 字段名称
 * @returns 验证结果
 */
export const validateAlphanumeric = (input: string, fieldName: string): ValidationResult => {
  const alphanumericRegex = /^[a-zA-Z0-9]+$/;
  if (!alphanumericRegex.test(input)) {
    return { valid: false, error: `${fieldName}只能包含字母和数字` };
  }
  return { valid: true };
};

/**
 * 验证字符串是否只包含数字
 * @param input 输入字符串
 * @param fieldName 字段名称
 * @returns 验证结果
 */
export const validateNumeric = (input: string, fieldName: string): ValidationResult => {
  const numericRegex = /^[0-9]+$/;
  if (!numericRegex.test(input)) {
    return { valid: false, error: `${fieldName}只能包含数字` };
  }
  return { valid: true };
};

/**
 * 验证字符串是否只包含字母
 * @param input 输入字符串
 * @param fieldName 字段名称
 * @returns 验证结果
 */
export const validateAlpha = (input: string, fieldName: string): ValidationResult => {
  const alphaRegex = /^[a-zA-Z]+$/;
  if (!alphaRegex.test(input)) {
    return { valid: false, error: `${fieldName}只能包含字母` };
  }
  return { valid: true };
};

/**
 * 验证密钥长度是否符合算法要求
 * @param algorithm 算法类型
 * @param key 密钥
 * @returns 验证结果
 */
export const validateEncryptionKeyLength = (algorithm: string, key: string): ValidationResult => {
  const keyLengths: Record<string, number> = {
    aes: 32,
    des: 8,
    '3des': 24,
    tripledes: 24,
    rc4: 32,
    rabbit: 16,
  };
  
  const requiredLength = keyLengths[algorithm];
  if (!requiredLength) {
    return { valid: false, error: `不支持的算法类型: ${algorithm}` };
  }
  
  if (key.length !== requiredLength) {
    return { valid: false, error: `${algorithm}算法要求密钥长度为${requiredLength}个字符` };
  }
  
  return { valid: true };
};

/**
 * 验证IV长度是否符合算法要求
 * @param algorithm 算法类型
 * @param iv IV向量
 * @returns 验证结果
 */
export const validateIvLength = (algorithm: string, iv?: string): ValidationResult => {
  if (!iv) return { valid: true };
  
  const ivLengths: Record<string, number> = {
    aes: 16,
    des: 8,
    '3des': 8,
    tripledes: 8,
    rabbit: 8,
  };
  
  const requiredLength = ivLengths[algorithm];
  if (!requiredLength) {
    return { valid: false, error: `不支持的算法类型: ${algorithm}` };
  }
  
  if (iv.length !== requiredLength) {
    return { valid: false, error: `${algorithm}算法要求IV长度为${requiredLength}个字符` };
  }
  
  return { valid: true };
};

/**
 * 验证是否为有效的Base16编码字符串
 * @param input 输入字符串
 * @returns 验证结果
 */
export const validateBase16 = (input: string): ValidationResult => {
  if (input.length % 2 !== 0) {
    return { valid: false, error: 'Base16字符串长度必须为偶数' };
  }
  return validateHex(input);
};

/**
 * 验证是否为有效的Base32编码字符串
 * @param input 输入字符串
 * @returns 验证结果
 */
export const validateBase32 = (input: string): ValidationResult => {
  const base32Regex = /^[A-Z2-7=]+$/i;
  if (!base32Regex.test(input)) {
    return { valid: false, error: '无效的Base32字符串' };
  }
  return { valid: true };
};

/**
 * 验证是否为有效的Base64URL编码字符串
 * @param input 输入字符串
 * @returns 验证结果
 */
export const validateBase64Url = (input: string): ValidationResult => {
  const base64UrlRegex = /^[A-Za-z0-9_-]*$/;
  if (!base64UrlRegex.test(input)) {
    return { valid: false, error: '无效的Base64URL字符串' };
  }
  return { valid: true };
};

/**
 * 验证输入是否超过最大长度限制
 * @param input 输入字符串
 * @param maxLength 最大长度
 * @param fieldName 字段名称
 * @returns 验证结果
 */
export const validateMaxLength = (input: string, maxLength: number, fieldName: string): ValidationResult => {
  if (input.length > maxLength) {
    return { valid: false, error: `${fieldName}长度不能超过${maxLength}个字符` };
  }
  return { valid: true };
};

/**
 * 验证输入是否小于最小长度限制
 * @param input 输入字符串
 * @param minLength 最小长度
 * @param fieldName 字段名称
 * @returns 验证结果
 */
export const validateMinLength = (input: string, minLength: number, fieldName: string): ValidationResult => {
  if (input.length < minLength) {
    return { valid: false, error: `${fieldName}长度不能小于${minLength}个字符` };
  }
  return { valid: true };
};

/**
 * 组合多个验证规则
 * @param input 输入字符串
 * @param validators 验证器数组
 * @returns 验证结果
 */
export const combineValidators = (input: string, validators: ((input: string) => ValidationResult)[]): ValidationResult => {
  for (const validator of validators) {
    const result = validator(input);
    if (!result.valid) {
      return result;
    }
  }
  return { valid: true };
};