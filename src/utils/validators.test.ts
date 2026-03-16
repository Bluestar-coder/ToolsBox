import { beforeEach, describe, expect, it, vi } from 'vitest';
import { logger } from './logger';
import {
  combineValidators,
  validateAlpha,
  validateAlphanumeric,
  validateBase16,
  validateBase32,
  validateBase64,
  validateBase64Url,
  validateDate,
  validateEmail,
  validateEncryptionKeyLength,
  validateHex,
  validateIvLength,
  validateJson,
  validateLength,
  validateMaxLength,
  validateMinLength,
  validateNumeric,
  validatePassword,
  validateRequired,
  validateTimestamp,
  validateUrl,
} from './validators';

describe('validators', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('validates required and length boundaries', () => {
    expect(validateRequired('', '名称')).toEqual({ valid: false, error: '名称不能为空' });
    expect(validateRequired('   ', '名称')).toEqual({ valid: false, error: '名称不能为空' });
    expect(validateRequired('value', '名称')).toEqual({ valid: true });

    expect(validateLength('ab', 3, 5, '字段')).toEqual({ valid: false, error: '字段长度不能小于3个字符' });
    expect(validateLength('abcdef', 3, 5, '字段')).toEqual({ valid: false, error: '字段长度不能超过5个字符' });
    expect(validateLength('abcd', 3, 5, '字段')).toEqual({ valid: true });
  });

  it('validates base64, hex, base16, base32 and base64url formats', () => {
    expect(validateBase64('YWJjZA==')).toEqual({ valid: true });
    expect(validateBase64('bad*base64')).toEqual({ valid: false, error: '无效的Base64字符串' });

    expect(validateHex('deadBEEF')).toEqual({ valid: true });
    expect(validateHex('xyz123')).toEqual({ valid: false, error: '无效的十六进制字符串' });

    expect(validateBase16('0A0B')).toEqual({ valid: true });
    expect(validateBase16('ABC')).toEqual({ valid: false, error: 'Base16字符串长度必须为偶数' });
    expect(validateBase16('GG')).toEqual({ valid: false, error: '无效的十六进制字符串' });

    expect(validateBase32('MFRGG===')).toEqual({ valid: true });
    expect(validateBase32('base32*')).toEqual({ valid: false, error: '无效的Base32字符串' });

    expect(validateBase64Url('abc_DEF-123')).toEqual({ valid: true });
    expect(validateBase64Url('bad+/')).toEqual({ valid: false, error: '无效的Base64URL字符串' });
  });

  it('validates url and json while logging parse failures', () => {
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});

    expect(validateUrl('https://example.com/path?q=1')).toEqual({ valid: true });
    expect(validateUrl('not a url')).toEqual({ valid: false, error: '无效的URL格式' });

    expect(validateJson('{"name":"ToolsBox"}')).toEqual({ valid: true });
    expect(validateJson('{broken')).toEqual({ valid: false, error: '无效的JSON格式' });

    expect(errorSpy).toHaveBeenCalledTimes(2);
  });

  it('validates timestamp and date inputs', () => {
    expect(validateTimestamp('abc')).toEqual({ valid: false, error: '无效的时间戳' });
    expect(validateTimestamp('-1')).toEqual({ valid: false, error: '时间戳超出合理范围' });
    expect(validateTimestamp('99999999999999')).toEqual({ valid: false, error: '时间戳超出合理范围' });
    expect(validateTimestamp('1700000000')).toEqual({ valid: true });
    expect(validateTimestamp('1700000000000')).toEqual({ valid: true });

    expect(validateDate('2026-03-16')).toEqual({ valid: true });
    expect(validateDate('not-a-date')).toEqual({ valid: false, error: '无效的日期格式' });
  });

  it('validates password and email formats', () => {
    expect(validatePassword('Password1')).toEqual({ valid: true });
    expect(validatePassword('password1')).toEqual({
      valid: false,
      error: '密码必须包含大小写字母和数字，长度8-32位',
    });

    expect(validateEmail('jack@example.com')).toEqual({ valid: true });
    expect(validateEmail('jack.example.com')).toEqual({ valid: false, error: '无效的电子邮件地址' });
  });

  it('validates alpha, numeric and alphanumeric strings', () => {
    expect(validateAlphanumeric('abc123', '账号')).toEqual({ valid: true });
    expect(validateAlphanumeric('abc-123', '账号')).toEqual({ valid: false, error: '账号只能包含字母和数字' });

    expect(validateNumeric('123456', '编号')).toEqual({ valid: true });
    expect(validateNumeric('12a456', '编号')).toEqual({ valid: false, error: '编号只能包含数字' });

    expect(validateAlpha('OnlyLetters', '名称')).toEqual({ valid: true });
    expect(validateAlpha('Letters1', '名称')).toEqual({ valid: false, error: '名称只能包含字母' });
  });

  it('validates encryption key and iv lengths by algorithm', () => {
    expect(validateEncryptionKeyLength('aes', 'a'.repeat(32))).toEqual({ valid: true });
    expect(validateEncryptionKeyLength('des', 'a'.repeat(8))).toEqual({ valid: true });
    expect(validateEncryptionKeyLength('tripledes', 'a'.repeat(24))).toEqual({ valid: true });
    expect(validateEncryptionKeyLength('unknown', 'abc')).toEqual({
      valid: false,
      error: '不支持的算法类型: unknown',
    });
    expect(validateEncryptionKeyLength('aes', 'short')).toEqual({
      valid: false,
      error: 'aes算法要求密钥长度为32个字符',
    });

    expect(validateIvLength('aes')).toEqual({ valid: true });
    expect(validateIvLength('aes', '1'.repeat(16))).toEqual({ valid: true });
    expect(validateIvLength('rabbit', '1'.repeat(8))).toEqual({ valid: true });
    expect(validateIvLength('unknown', '1234')).toEqual({
      valid: false,
      error: '不支持的算法类型: unknown',
    });
    expect(validateIvLength('aes', 'short')).toEqual({
      valid: false,
      error: 'aes算法要求IV长度为16个字符',
    });
  });

  it('validates max/min length helpers and combined validators', () => {
    expect(validateMaxLength('abcdef', 5, '备注')).toEqual({
      valid: false,
      error: '备注长度不能超过5个字符',
    });
    expect(validateMaxLength('abc', 5, '备注')).toEqual({ valid: true });

    expect(validateMinLength('ab', 3, '备注')).toEqual({
      valid: false,
      error: '备注长度不能小于3个字符',
    });
    expect(validateMinLength('abcd', 3, '备注')).toEqual({ valid: true });

    const validators = [
      (input: string) => validateRequired(input, '内容'),
      (input: string) => validateMinLength(input, 3, '内容'),
      (input: string) => validateAlpha(input, '内容'),
    ];

    expect(combineValidators('', validators)).toEqual({ valid: false, error: '内容不能为空' });
    expect(combineValidators('ab', validators)).toEqual({ valid: false, error: '内容长度不能小于3个字符' });
    expect(combineValidators('abc1', validators)).toEqual({ valid: false, error: '内容只能包含字母' });
    expect(combineValidators('abcd', validators)).toEqual({ valid: true });
  });
});
