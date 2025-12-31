import { describe, it, expect } from 'vitest';
import { calculateAllHashes, calculateHash } from './hash';

describe('哈希工具测试', () => {
  describe('calculateHash - 单个哈希计算', () => {
    it('应该正确计算MD5哈希', () => {
      const input = 'Hello, World!';
      const result = calculateHash(input, 'MD5');
      expect(result).toBe('65a8e27d8879283831b664bd8b7f0ad4');
    });

    it('应该正确计算SHA1哈希', () => {
      const input = 'Hello, World!';
      const result = calculateHash(input, 'SHA1');
      // SHA1哈希值是固定的，验证长度为40个十六进制字符
      expect(result).toHaveProperty('length');
      expect(result.length).toBe(40);
      // 验证只包含十六进制字符
      expect(result).toMatch(/^[0-9a-f]{40}$/i);
    });

    it('应该正确计算SHA256哈希', () => {
      const input = 'Hello, World!';
      const result = calculateHash(input, 'SHA256');
      expect(result).toBe('dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f');
    });

    it('应该正确计算SHA512哈希', () => {
      const input = 'Hello, World!';
      const result = calculateHash(input, 'SHA512');
      expect(result).toHaveProperty('length');
      expect(result.length).toBe(128);
    });

    it('应该处理空字符串', () => {
      const result = calculateHash('', 'MD5');
      expect(result).toBe('d41d8cd98f00b204e9800998ecf8427e');
    });

    it('应该处理特殊字符', () => {
      const input = '测试中文!@#$%';
      const result = calculateHash(input, 'MD5');
      expect(result).toHaveProperty('length');
      expect(result.length).toBe(32);
    });

    it('应该对不支持的算法抛出错误', () => {
      expect(() => calculateHash('test', 'INVALID')).toThrow('不支持的哈希算法');
    });

    it('应该支持大小写不敏感的算法名', () => {
      const input = 'test';
      const upper = calculateHash(input, 'MD5');
      const lower = calculateHash(input, 'md5');
      const mixed = calculateHash(input, 'Md5');
      expect(upper).toBe(lower);
      expect(lower).toBe(mixed);
    });
  });

  describe('calculateAllHashes - 批量哈希计算', () => {
    it('应该计算所有支持的哈希算法', () => {
      const input = 'Hello, World!';
      const result = calculateAllHashes(input);

      expect(result).toHaveProperty('MD5');
      expect(result).toHaveProperty('SHA1');
      expect(result).toHaveProperty('SHA224');
      expect(result).toHaveProperty('SHA256');
      expect(result).toHaveProperty('SHA384');
      expect(result).toHaveProperty('SHA512');
    });

    it('应该返回正确的哈希值长度', () => {
      const input = 'test';
      const result = calculateAllHashes(input);

      // MD5: 128位 = 32个十六进制字符
      expect(result.MD5.length).toBe(32);
      // SHA1: 160位 = 40个十六进制字符
      expect(result.SHA1.length).toBe(40);
      // SHA224: 224位 = 56个十六进制字符
      expect(result.SHA224.length).toBe(56);
      // SHA256: 256位 = 64个十六进制字符
      expect(result.SHA256.length).toBe(64);
      // SHA384: 384位 = 96个十六进制字符
      expect(result.SHA384.length).toBe(96);
      // SHA512: 512位 = 128个十六进制字符
      expect(result.SHA512.length).toBe(128);
    });

    it('应该处理空字符串', () => {
      const result = calculateAllHashes('');
      expect(result.MD5).toBe('d41d8cd98f00b204e9800998ecf8427e');
    });

    it('应该对相同输入返回相同结果', () => {
      const input = 'consistent input';
      const result1 = calculateAllHashes(input);
      const result2 = calculateAllHashes(input);

      expect(result1.MD5).toBe(result2.MD5);
      expect(result1.SHA256).toBe(result2.SHA256);
    });

    it('应该对不同输入返回不同结果', () => {
      const result1 = calculateAllHashes('input1');
      const result2 = calculateAllHashes('input2');

      expect(result1.MD5).not.toBe(result2.MD5);
      expect(result1.SHA256).not.toBe(result2.SHA256);
    });

    it('应该处理长字符串', () => {
      const longInput = 'a'.repeat(10000);
      const result = calculateAllHashes(longInput);

      expect(result.MD5).toBeDefined();
      expect(result.SHA256).toBeDefined();
    });

    it('应该只包含十六进制字符', () => {
      const input = 'test';
      const result = calculateAllHashes(input);
      const hexRegex = /^[0-9a-f]+$/;

      expect(result.MD5).toMatch(hexRegex);
      expect(result.SHA1).toMatch(hexRegex);
      expect(result.SHA256).toMatch(hexRegex);
      expect(result.SHA384).toMatch(hexRegex);
      expect(result.SHA512).toMatch(hexRegex);
    });
  });

  describe('边界条件测试', () => {
    it('应该处理单个字符', () => {
      const result = calculateHash('a', 'SHA256');
      expect(result).toBe('ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb');
    });

    it('应该处理Unicode字符', () => {
      const input = '你好世界';
      const result = calculateHash(input, 'MD5');
      expect(result).toHaveProperty('length');
      expect(result.length).toBe(32);
    });

    it('应该处理包含换行符的文本', () => {
      const input = 'line1\nline2\nline3';
      const result = calculateHash(input, 'SHA256');
      expect(result).toHaveProperty('length');
    });
  });

  describe('安全性测试', () => {
    it('相同哈希值应该难以反向推导原文（雪崩效应）', () => {
      const input1 = 'Hello';
      const input2 = 'Hellp'; // 只有一位不同
      const hash1 = calculateHash(input1, 'SHA256');
      const hash2 = calculateHash(input2, 'SHA256');

      // 哈希值应该完全不同
      expect(hash1).not.toBe(hash2);

      // 计算不同字符数
      let diffCount = 0;
      for (let i = 0; i < hash1.length; i++) {
        if (hash1[i] !== hash2[i]) diffCount++;
      }

      // 至少应该有一半以上的字符不同
      expect(diffCount).toBeGreaterThan(32);
    });
  });
});
