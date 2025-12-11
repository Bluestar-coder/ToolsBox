import { describe, it, expect } from 'vitest';
import {
  base64Encode,
  base64Decode,
  base16Encode,
  base16Decode,
  urlEncode,
  urlDecode,
  htmlEncode,
  htmlDecode,
  jsonEncode,
  unicodeEncode,
  unicodeDecode,
  executeEncodeDecode
} from './encoders';

describe('编码/解码工具测试', () => {
  // Base64 编码/解码测试
  describe('Base64 测试', () => {
    it('应该正确编码字符串', () => {
      const input = 'Hello, World!';
      const result = base64Encode(input);
      expect(result.success).toBe(true);
      expect(result.result).toBe('SGVsbG8sIFdvcmxkIQ==');
    });

    it('应该正确解码Base64字符串', () => {
      const input = 'SGVsbG8sIFdvcmxkIQ==';
      const result = base64Decode(input);
      expect(result.success).toBe(true);
      expect(result.result).toBe('Hello, World!');
    });

    it('应该处理空字符串', () => {
      const input = '';
      const result = base64Encode(input);
      expect(result.success).toBe(true);
      expect(result.result).toBe('');
    });
  });

  // Base16 编码/解码测试
  describe('Base16 测试', () => {
    it('应该正确编码字符串', () => {
      const input = 'Hello';
      const result = base16Encode(input);
      expect(result.success).toBe(true);
      expect(result.result).toBe('48656C6C6F');
    });

    it('应该正确解码Base16字符串', () => {
      const input = '48656C6C6F';
      const result = base16Decode(input);
      expect(result.success).toBe(true);
      expect(result.result).toBe('Hello');
    });

    it('应该处理无效的Base16输入', () => {
      const input = 'InvalidBase16String';
      const result = base16Decode(input);
      expect(result.success).toBe(false);
    });
  });

  // URL 编码/解码测试
  describe('URL 测试', () => {
    it('应该正确编码URL', () => {
      const input = 'https://example.com/path with spaces?query=value';
      const result = urlEncode(input);
      expect(result.success).toBe(true);
      expect(result.result).toBe('https%3A%2F%2Fexample.com%2Fpath%20with%20spaces%3Fquery%3Dvalue');
    });

    it('应该正确解码URL', () => {
      const input = 'https%3A%2F%2Fexample.com%2Fpath%20with%20spaces%3Fquery%3Dvalue';
      const result = urlDecode(input);
      expect(result.success).toBe(true);
      expect(result.result).toBe('https://example.com/path with spaces?query=value');
    });
  });

  // HTML 编码/解码测试
  describe('HTML 测试', () => {
    it('应该正确编码HTML特殊字符', () => {
      const input = '<div>Hello & World</div>';
      const result = htmlEncode(input);
      expect(result.success).toBe(true);
      expect(result.result).toBe('&lt;div&gt;Hello &amp; World&lt;/div&gt;');
    });

    it('应该正确解码HTML特殊字符', () => {
      const input = '&lt;div&gt;Hello &amp; World&lt;/div&gt;';
      const result = htmlDecode(input);
      expect(result.success).toBe(true);
      expect(result.result).toBe('<div>Hello & World</div>');
    });
  });

  // JSON 编码/解码测试
  describe('JSON 测试', () => {
    it('应该正确格式化JSON', () => {
      const input = '{"name":"test","value":123}';
      const result = jsonEncode(input);
      expect(result.success).toBe(true);
      expect(JSON.parse(result.result)).toEqual({ name: 'test', value: 123 });
    });

    it('应该处理无效JSON', () => {
      const input = '{invalid json}';
      const result = jsonEncode(input);
      expect(result.success).toBe(false);
    });
  });

  // Unicode 编码/解码测试
  describe('Unicode 测试', () => {
    it('应该正确编码Unicode字符', () => {
      const input = '你好，世界';
      const result = unicodeEncode(input);
      expect(result.success).toBe(true);
      // 检查返回的字符串是否包含Unicode转义序列
      expect(result.result).toContain('\\u4f60');
      expect(result.result).toContain('\\u597d');
      expect(result.result).toContain('\\u4e16');
      expect(result.result).toContain('\\u754c');
    });

    it('应该正确解码Unicode转义序列', () => {
      const input = '\u4f60\u597d\uff0c\u4e16\u754c';
      const result = unicodeDecode(input);
      expect(result.success).toBe(true);
      expect(result.result).toBe('你好，世界');
    });
  });

  // 执行编码/解码函数测试
  describe('executeEncodeDecode 测试', () => {
    it('应该正确执行Base64编码', () => {
      const result = executeEncodeDecode('test', 'base64', 'encode');
      expect(result.success).toBe(true);
      expect(result.result).toBe('dGVzdA==');
    });

    it('应该正确执行Base64解码', () => {
      const result = executeEncodeDecode('dGVzdA==', 'base64', 'decode');
      expect(result.success).toBe(true);
      expect(result.result).toBe('test');
    });

    it('应该处理无效的编码类型', () => {
      // @ts-expect-error 测试无效的编码类型
      const result = executeEncodeDecode('test', 'invalid-type', 'encode');
      expect(result.success).toBe(false);
    });

    it('应该处理空输入', () => {
      const result = executeEncodeDecode('', 'base64', 'encode');
      expect(result.success).toBe(true);
      expect(result.result).toBe('');
    });
  });
});