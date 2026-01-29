import { describe, it, expect } from 'vitest';
import {
  formatJSON,
  minifyJSON,
  formatHTML,
  minifyHTML,
  formatCSS,
  minifyCSS,
  formatXML,
  formatSQL,
  formatJavaScript,
  formatTypeScript,
  formatCode,
  type SupportedLanguage
} from './formatters';

describe('代码格式化工具测试', () => {
  describe('JSON格式化', () => {
    it('应该正确格式化JSON', async () => {
      const input = '{"name":"test","value":123}';
      const result = await formatJSON(input);
      // Prettier for short JSON puts it on one line with spaces
      expect(result).toBe('{ "name": "test", "value": 123 }\n');
    });

    it('应该正确压缩JSON', () => {
      const input = '{\n  "name": "test",\n  "value": 123\n}';
      const result = minifyJSON(input);
      expect(result).not.toContain('\n');
      expect(result).toBe('{"name":"test","value":123}');
    });

    it('应该处理嵌套JSON', async () => {
      const input = '{"user":{"name":"test","age":25}}';
      const result = await formatJSON(input);
      expect(result).toContain('user');
      expect(result).toContain('name');
      expect(result).toContain('age');
      // Should add spaces
      expect(result).toContain(' "name": "test"');
    });

    it('应该处理数组', async () => {
      const input = '{"items":[1,2,3]}';
      const result = await formatJSON(input);
      expect(result).toContain('items');
      expect(result).toContain('[1, 2, 3]');
    });

    it('应该优雅处理无效JSON (返回原值)', async () => {
      const input = '{invalid json}';
      // 新实现不再抛出错误，而是返回原值
      const result = await formatJSON(input);
      expect(result).toBe(input);
    });

    it('应该支持自定义缩进', async () => {
      // Use long input to force wrapping
      const input = JSON.stringify({
        longKeyNameToForceWrappingBecauseItIsVeryLong: "value",
        anotherLongKeyToEnsureItGoesToNextLine: 123456789
      });
      const result = await formatJSON(input, { indentSize: 4, useTabs: false });
      // Prettier output check
      expect(result).toContain('\n    "longKeyNameToForceWrappingBecauseItIsVeryLong": "value"');
    });
  });

  describe('HTML格式化', () => {
    it('应该正确格式化HTML', async () => {
      const input = '<div><p>Hello</p></div>';
      const result = await formatHTML(input);
      expect(result).toContain('\n');
    });

    it('应该正确压缩HTML', () => {
      const input = '<div>\n  <p>Hello</p>\n</div>';
      const result = minifyHTML(input);
      expect(result).not.toContain('\n');
    });
  });

  describe('CSS格式化', () => {
    it('应该正确格式化CSS', async () => {
      const input = '.test{color:red;font-size:14px;}';
      const result = await formatCSS(input);
      expect(result).toContain('\n');
      expect(result).toContain('color');
    });

    it('应该正确压缩CSS', () => {
      const input = '.test {\n  color: red;\n  font-size: 14px;\n}';
      const result = minifyCSS(input);
      expect(result).not.toContain('\n');
      expect(result).not.toContain('  ');
    });
  });

  describe('XML格式化', () => {
    it('应该正确格式化XML', async () => {
      const input = '<?xml version="1.0"?><root><item>test</item></root>';
      const result = await formatXML(input);
      expect(result).toContain('\n');
    });
  });

  describe('SQL格式化', () => {
    it('应该正确格式化SQL', () => {
      const input = 'select * from users where id=1';
      const result = formatSQL(input);
      expect(result).toContain('\n');
      expect(result).toContain('SELECT');
      expect(result).toContain('FROM');
    });

    it('应该关键字大写', () => {
      const input = 'select name from users';
      const result = formatSQL(input);
      expect(result).toMatch(/SELECT/);
      expect(result).toMatch(/FROM/);
    });
  });

  describe('JavaScript格式化', () => {
    it('应该正确格式化JavaScript', async () => {
      const input = 'function test(){return 1;}';
      const result = await formatJavaScript(input);
      expect(result).toContain('\n');
      expect(result).toContain('return');
    });

    it('应该处理对象字面量', async () => {
      const input = 'const obj={a:1,b:2};';
      const result = await formatJavaScript(input);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('TypeScript格式化', () => {
    it('应该正确格式化TypeScript', async () => {
      const input = 'function test(x:number):number{return x*2;}';
      const result = await formatTypeScript(input);
      // Prettier formats short TS to single line with spaces
      expect(result).toBe('function test(x: number): number {\n  return x * 2;\n}\n');
    });

    it('应该处理接口定义', async () => { // Fixed missing async
      const input = 'interface User{name:string;}';
      const result = await formatTypeScript(input);
      expect(result).toContain('interface User');
      expect(result).toContain('name: string;');
    });
  });

  describe('统一格式化接口', () => {
    it('应该支持所有声明的语言', async () => {
      const languages: SupportedLanguage[] = [
        'javascript', 'typescript', 'html', 'css', 'scss',
        'less', 'xml', 'sql', 'yaml', 'markdown', 'graphql',
        'java', 'python', 'csharp', 'go', 'php'
      ];

      for (const lang of languages) {
        // 使用 await
        await expect(formatCode('test', lang)).resolves.not.toThrow();
      }
    });

    it('应该对不支持的语言返回原值(或抛出警告)', async () => {
       // 原实现是 console.warn 并返回 input，这里只检查不崩溃
       const result = await formatCode('test', 'ruby' as SupportedLanguage);
       expect(result).toBe('test');
    });
  });

  describe('边界条件测试', () => {
    it('应该处理空字符串', async () => {
       // Prettier 可能返回空字符串或换行
       const result = await formatJSON('');
       // JSON parser might fail on empty string but wrapper returns input
       expect(result).toBe('');
    });

    it('应该处理特殊字符', async () => {
      const input = '{"text":"Hello\\nWorld"}';
      await expect(formatJSON(input)).resolves.not.toThrow();
    });
  });
});
