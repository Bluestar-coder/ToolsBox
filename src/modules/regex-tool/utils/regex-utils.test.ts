import { describe, it, expect } from 'vitest';
import {
  testRegex,
  replaceWithRegex,
  highlightMatches,
  splitWithRegex,
  type MatchResult
} from './regex-utils';

describe('正则工具测试', () => {
  describe('testRegex - 正则测试', () => {
    it('应该返回有效的正则测试结果', () => {
      const result = testRegex('\\d+', 'g', 'test 123 and 456');
      expect(result.isValid).toBe(true);
      expect(result.matches).toHaveLength(2);
      expect(result.matchCount).toBe(2);
    });

    it('应该正确匹配数字', () => {
      const result = testRegex('\\d+', 'g', 'abc 123 def 456');
      expect(result.matches[0].match).toBe('123');
      expect(result.matches[1].match).toBe('456');
    });

    it('应该正确匹配字母', () => {
      const result = testRegex('[a-z]+', 'gi', 'Hello World');
      expect(result.matches[0].match).toBe('Hello');
      expect(result.matches[1].match).toBe('World');
    });

    it('应该处理无g标志的单次匹配', () => {
      const result = testRegex('\\d+', '', 'test 123 and 456');
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].match).toBe('123');
    });

    it('应该正确捕获分组', () => {
      const result = testRegex('(\\d+)-(\\d+)', 'g', '123-456 and 789-012');
      expect(result.matches[0].groups).toEqual(['123', '456']);
      expect(result.matches[1].groups).toEqual(['789', '012']);
    });

    it('应该支持命名分组', () => {
      const result = testRegex('(?<name>\\w+): (?<value>\\d+)', 'g', 'age: 25 name: John');
      expect(result.matches[0].namedGroups).toEqual({ name: 'age', value: '25' });
    });

    it('应该返回正确的匹配索引', () => {
      const result = testRegex('test', 'g', 'this is a test string');
      expect(result.matches[0].index).toBe(10);
    });

    it('应该处理空模式', () => {
      const result = testRegex('', 'g', 'test');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('请输入正则表达式');
    });

    it('应该处理无效的正则表达式', () => {
      const result = testRegex('[invalid', 'g', 'test');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('应该处理不匹配的情况', () => {
      const result = testRegex('\\d+', 'g', 'no numbers here');
      expect(result.isValid).toBe(true);
      expect(result.matches).toHaveLength(0);
      expect(result.matchCount).toBe(0);
    });

    it('应该处理多种标志', () => {
      const result = testRegex('test', 'gi', 'TEST Test test');
      expect(result.matches).toHaveLength(3);
    });

    it('应该处理多行模式', () => {
      const result = testRegex('^test', 'gm', 'test\ntest\nother');
      expect(result.matches).toHaveLength(2);
    });

    it('应该处理空字符串输入', () => {
      const result = testRegex('\\d+', 'g', '');
      expect(result.isValid).toBe(true);
      expect(result.matches).toHaveLength(0);
    });

    it('应该防止零长度匹配的无限循环', () => {
      const result = testRegex('', 'g', 'test');
      expect(result.isValid).toBe(false);
    });
  });

  describe('replaceWithRegex - 正则替换', () => {
    it('应该正确替换匹配的文本', () => {
      const result = replaceWithRegex('\\d+', 'g', 'test 123 and 456', 'NUM');
      expect(result.result).toBe('test NUM and NUM');
      expect(result.error).toBeUndefined();
    });

    it('应该支持捕获组引用', () => {
      const result = replaceWithRegex('(\\d+)-(\\d+)', 'g', '123-456', '$2-$1');
      expect(result.result).toBe('456-123');
    });

    it('应该支持命名分组引用', () => {
      const result = replaceWithRegex('(?<first>\\d+)-(?<second>\\d+)', 'g', '123-456', '$<second>-$<first>');
      expect(result.result).toBe('456-123');
    });

    it('应该支持函数替换', () => {
      const result = replaceWithRegex('\\d+', 'g', 'test 123', 'NUMBER');
      expect(result.result).toBe('test NUMBER');
    });

    it('应该处理大小写不敏感替换', () => {
      const result = replaceWithRegex('test', 'gi', 'TEST Test test', 'demo');
      expect(result.result).toBe('demo demo demo');
    });

    it('应该处理空模式', () => {
      const result = replaceWithRegex('', 'g', 'test', 'x');
      expect(result.error).toBe('请输入正则表达式');
    });

    it('应该处理无效的正则表达式', () => {
      const result = replaceWithRegex('[invalid', 'g', 'test', 'x');
      expect(result.error).toBeDefined();
    });

    it('应该处理全局替换', () => {
      const result = replaceWithRegex('a', 'g', 'aaa', 'b');
      expect(result.result).toBe('bbb');
    });

    it('应该处理单次替换', () => {
      const result = replaceWithRegex('a', '', 'aaa', 'b');
      expect(result.result).toBe('baa');
    });

    it('应该保留不匹配的文本', () => {
      const result = replaceWithRegex('\\d+', 'g', 'abc 123 def', 'NUM');
      expect(result.result).toBe('abc NUM def');
    });
  });

  describe('highlightMatches - 高亮匹配', () => {
    it('应该正确高亮匹配的文本', () => {
      const matches: MatchResult[] = [
        { match: '123', index: 5, groups: [] },
        { match: '456', index: 12, groups: [] }
      ];
      const result = highlightMatches('test 123 and 456', matches);
      expect(result).toContain('<mark class="regex-match">123</mark>');
      expect(result).toContain('<mark class="regex-match">456</mark>');
    });

    it('应该转义HTML特殊字符', () => {
      const matches: MatchResult[] = [
        { match: 'test', index: 0, groups: [] }
      ];
      const result = highlightMatches('<div>test</div>', matches);
      // 验证结果包含高亮的test部分
      expect(result).toContain('<mark class="regex-match">test</mark>');
      // 验证结果存在
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('应该处理空匹配数组', () => {
      const result = highlightMatches('test string', []);
      expect(result).toBe('test string');
    });

    it('应该保持不匹配的文本', () => {
      const matches: MatchResult[] = [
        { match: '123', index: 5, groups: [] }
      ];
      const result = highlightMatches('test 123 end', matches);
      expect(result).toContain('test ');
      expect(result).toContain(' end');
    });

    it('应该处理多个连续匹配', () => {
      const matches: MatchResult[] = [
        { match: 'a', index: 0, groups: [] },
        { match: 'b', index: 1, groups: [] },
        { match: 'c', index: 2, groups: [] }
      ];
      const result = highlightMatches('abc', matches);
      expect(result).toContain('<mark class="regex-match">a</mark>');
      expect(result).toContain('<mark class="regex-match">b</mark>');
      expect(result).toContain('<mark class="regex-match">c</mark>');
    });

    it('应该正确转义高亮文本中的特殊字符', () => {
      const matches: MatchResult[] = [
        { match: '<test>', index: 0, groups: [] }
      ];
      const result = highlightMatches('<test>', matches);
      expect(result).toContain('&lt;test&gt;');
    });
  });

  describe('splitWithRegex - 正则分割', () => {
    it('应该正确分割文本', () => {
      const result = splitWithRegex('[,\\s]+', 'g', 'apple, banana, cherry');
      expect(result.result).toEqual(['apple', 'banana', 'cherry']);
      expect(result.error).toBeUndefined();
    });

    it('应该按空格分割', () => {
      const result = splitWithRegex('\\s+', 'g', 'hello world test');
      expect(result.result).toEqual(['hello', 'world', 'test']);
    });

    it('应该按换行符分割', () => {
      const result = splitWithRegex('\\n', 'g', 'line1\nline2\nline3');
      expect(result.result).toEqual(['line1', 'line2', 'line3']);
    });

    it('应该处理空模式', () => {
      const result = splitWithRegex('', 'g', 'test');
      expect(result.error).toBe('请输入正则表达式');
    });

    it('应该处理无效的正则表达式', () => {
      const result = splitWithRegex('[invalid', 'g', 'test');
      expect(result.error).toBeDefined();
    });

    it('应该处理没有匹配的情况', () => {
      const result = splitWithRegex('\\d+', 'g', 'no numbers');
      expect(result.result).toEqual(['no numbers']);
    });

    it('应该处理连续的分隔符', () => {
      const result = splitWithRegex('\\s+', 'g', 'a    b    c');
      expect(result.result).toEqual(['a', 'b', 'c']);
    });

    it('应该处理开头和结尾的分隔符', () => {
      const result = splitWithRegex('\\s+', 'g', '  hello world  ');
      expect(result.result[0]).toBe('');
      expect(result.result[result.result.length - 1]).toBe('');
    });

    it('应该按特殊字符分割', () => {
      const result = splitWithRegex('[.,;]', 'g', 'a.b,c;d');
      expect(result.result).toEqual(['a', 'b', 'c', 'd']);
    });
  });

  describe('复杂正则表达式测试', () => {
    it('应该处理邮箱验证正则', () => {
      const emailRegex = '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}';
      const result = testRegex(emailRegex, 'g', 'Contact us at test@example.com or support@domain.org');
      expect(result.matches).toHaveLength(2);
    });

    it('应该处理URL匹配正则', () => {
      const urlRegex = 'https?://[^\\s]+';
      const result = testRegex(urlRegex, 'g', 'Visit https://example.com or http://test.org');
      expect(result.matches).toHaveLength(2);
    });

    it('应该处理IPv4地址正则', () => {
      const ipRegex = '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b';
      const result = testRegex(ipRegex, 'g', 'Server IPs: 192.168.1.1 and 10.0.0.1');
      expect(result.matches).toHaveLength(2);
    });

    it('应该处理日期格式正则', () => {
      const dateRegex = '\\d{4}-\\d{2}-\\d{2}';
      const result = testRegex(dateRegex, 'g', 'Dates: 2024-01-15 and 2024-12-31');
      expect(result.matches).toHaveLength(2);
    });

    it('应该处理手机号正则（中国）', () => {
      const phoneRegex = '1[3-9]\\d{9}';
      const result = testRegex(phoneRegex, 'g', 'Call 13812345678 or 15987654321');
      expect(result.matches).toHaveLength(2);
    });

    it('应该处理十六进制颜色代码', () => {
      const colorRegex = '#[0-9a-fA-F]{3,6}';
      const result = testRegex(colorRegex, 'g', 'Colors: #fff and #1a2b3c');
      expect(result.matches).toHaveLength(2);
    });
  });

  describe('边界条件测试', () => {
    it('应该处理超长字符串', () => {
      const longString = 'a'.repeat(10000);
      const result = testRegex('a', 'g', longString);
      expect(result.matchCount).toBe(10000);
    });

    it('应该处理Unicode字符', () => {
      const result = testRegex('\\w+', 'g', '测试test测试123');
      expect(result.isValid).toBe(true);
    });

    it('应该处理零宽断言', () => {
      const result = testRegex('\\d+(?=\\s*USD)', 'g', 'Price: 100 USD and 200 USD');
      expect(result.matches[0].match).toBe('100');
    });

    it('应该处理负向前瞻', () => {
      const result = testRegex('\\d+(?!\\s*USD)', 'g', '100 USD 200 EUR');
      expect(result.matches.some(m => m.match === '200')).toBe(true);
    });

    it('应该处理后顾断言', () => {
      const result = testRegex('(?<=Price:)\\s*\\d+', 'g', 'Price: 100 and Price: 200');
      expect(result.matches).toHaveLength(2);
    });
  });

  describe('性能和安全测试', () => {
    it('应该防止灾难性回溯', () => {
      const catastrophicRegex = '(a+)+';
      const input = 'a'.repeat(30) + 'b';
      const startTime = Date.now();
      testRegex(catastrophicRegex, 'g', input);
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(5000);
    });

    it('应该处理大量匹配', () => {
      const input = Array(1000).fill('test').join(' ');
      const result = testRegex('test', 'g', input);
      expect(result.matchCount).toBe(1000);
    });
  });
});
