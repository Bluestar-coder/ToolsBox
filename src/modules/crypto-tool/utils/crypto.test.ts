import { describe, it, expect } from 'vitest';
import {
  encrypt,
  decrypt,
  validateKeyLength,
  validateIvLength,
  generateRandomKey,
  getSupportedModes
} from './crypto';

describe('加密/解密工具测试', () => {
  // 密钥和IV
  const aesKey = '12345678901234567890123456789012';
  const aesIv = '1234567890123456';
  const desKey = '12345678';
  const desIv = '12345678';
  const tripleDesKey = '123456789012345678901234';
  const tripleDesIv = '12345678';

  // AES 加密/解密测试
  describe('AES 测试', () => {
    it('应该使用CBC模式和PKCS7填充正确加密解密', () => {
      const plaintext = 'Hello, AES Encryption!';
      
      // 加密
      const encrypted = encrypt(plaintext, aesKey, {
        algorithm: 'aes',
        mode: 'cbc',
        padding: 'pkcs7',
        iv: aesIv,
        outputFormat: 'base64'
      });
      
      // 解密
      const decrypted = decrypt(encrypted, aesKey, {
        algorithm: 'aes',
        mode: 'cbc',
        padding: 'pkcs7',
        iv: aesIv,
        outputFormat: 'base64'
      });
      
      expect(decrypted).toBe(plaintext);
    });

    it('应该使用ECB模式正确加密解密', () => {
      const plaintext = 'Hello, AES ECB Mode!';
      
      // 加密
      const encrypted = encrypt(plaintext, aesKey, {
        algorithm: 'aes',
        mode: 'ecb',
        padding: 'pkcs7',
        outputFormat: 'base64'
      });
      
      // 解密
      const decrypted = decrypt(encrypted, aesKey, {
        algorithm: 'aes',
        mode: 'ecb',
        padding: 'pkcs7',
        outputFormat: 'base64'
      });
      
      expect(decrypted).toBe(plaintext);
    });
  });

  // DES 加密/解密测试
  describe('DES 测试', () => {
    it('应该正确加密解密', () => {
      const plaintext = 'Hello, DES!';
      
      // 加密
      const encrypted = encrypt(plaintext, desKey, {
        algorithm: 'des',
        mode: 'cbc',
        padding: 'pkcs7',
        iv: desIv,
        outputFormat: 'base64'
      });
      
      // 解密
      const decrypted = decrypt(encrypted, desKey, {
        algorithm: 'des',
        mode: 'cbc',
        padding: 'pkcs7',
        iv: desIv,
        outputFormat: 'base64'
      });
      
      expect(decrypted).toBe(plaintext);
    });
  });

  // 3DES 加密/解密测试
  describe('3DES 测试', () => {
    it('应该正确加密解密', () => {
      const plaintext = 'Hello, 3DES!';
      
      // 加密
      const encrypted = encrypt(plaintext, tripleDesKey, {
        algorithm: '3des',
        mode: 'cbc',
        padding: 'pkcs7',
        iv: tripleDesIv,
        outputFormat: 'base64'
      });
      
      // 解密
      const decrypted = decrypt(encrypted, tripleDesKey, {
        algorithm: '3des',
        mode: 'cbc',
        padding: 'pkcs7',
        iv: tripleDesIv,
        outputFormat: 'base64'
      });
      
      expect(decrypted).toBe(plaintext);
    });
  });

  // 密钥长度验证测试
  describe('密钥长度验证测试', () => {
    it('应该验证AES密钥长度', () => {
      expect(validateKeyLength('aes', aesKey)).toBe(true);
      expect(validateKeyLength('aes', 'shortkey')).toBe(false);
    });

    it('应该验证DES密钥长度', () => {
      expect(validateKeyLength('des', desKey)).toBe(true);
      expect(validateKeyLength('des', 'toolongkey123')).toBe(false);
    });

    it('应该验证3DES密钥长度', () => {
      expect(validateKeyLength('3des', tripleDesKey)).toBe(true);
      expect(validateKeyLength('3des', 'shortkey')).toBe(false);
    });
  });

  // IV长度验证测试
  describe('IV长度验证测试', () => {
    it('应该验证AES IV长度', () => {
      expect(validateIvLength('aes', aesIv)).toBe(true);
      expect(validateIvLength('aes', 'shortiv')).toBe(false);
    });

    it('应该验证DES IV长度', () => {
      expect(validateIvLength('des', desIv)).toBe(true);
      expect(validateIvLength('des', 'shortiv')).toBe(false);
    });

    it('应该允许不需要IV的算法', () => {
      expect(validateIvLength('rc4')).toBe(true);
      expect(validateIvLength('rc4', '')).toBe(true);
    });
  });

  // 随机密钥生成测试
  describe('随机密钥生成测试', () => {
    it('应该生成指定长度的随机密钥', () => {
      const key16 = generateRandomKey(16);
      const key32 = generateRandomKey(32);
      
      expect(key16.length).toBe(16);
      expect(key32.length).toBe(32);
      expect(typeof key16).toBe('string');
    });
  });

  // 支持的模式测试
  describe('支持的模式测试', () => {
    it('应该返回AES支持的模式', () => {
      const aesModes = getSupportedModes('aes');
      expect(aesModes).toEqual(['ecb', 'cbc', 'cfb', 'ofb', 'ctr']);
    });

    it('应该返回RC4支持的模式', () => {
      const rc4Modes = getSupportedModes('rc4');
      expect(rc4Modes).toEqual(['ecb']);
    });
  });

  // 不同输出格式测试
  describe('输出格式测试', () => {
    it('应该支持Base64输出', () => {
      const plaintext = 'Test Base64 Output';
      const encrypted = encrypt(plaintext, aesKey, {
        algorithm: 'aes',
        mode: 'ecb',
        padding: 'pkcs7',
        outputFormat: 'base64'
      });
      expect(typeof encrypted).toBe('string');
      // Base64字符串应该只包含Base64字符
      expect(encrypted).toMatch(/^[A-Za-z0-9+/]*={0,2}$/);
    });

    it('应该支持Hex输出', () => {
      const plaintext = 'Test Hex Output';
      const encrypted = encrypt(plaintext, aesKey, {
        algorithm: 'aes',
        mode: 'ecb',
        padding: 'pkcs7',
        outputFormat: 'hex'
      });
      expect(typeof encrypted).toBe('string');
      // Hex字符串应该只包含十六进制字符
      expect(encrypted).toMatch(/^[0-9A-Fa-f]*$/);
    });
  });

  // 空字符串测试
  describe('空字符串测试', () => {
    it('应该处理空字符串加密', () => {
      const encrypted = encrypt('', aesKey, {
        algorithm: 'aes',
        mode: 'ecb',
        padding: 'pkcs7',
        outputFormat: 'base64'
      });
      const decrypted = decrypt(encrypted, aesKey, {
        algorithm: 'aes',
        mode: 'ecb',
        padding: 'pkcs7',
        outputFormat: 'base64'
      });
      expect(decrypted).toBe('');
    });
  });
});