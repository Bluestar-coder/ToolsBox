import { describe, it, expect } from 'vitest';
import {
  formatJSON,
  minifyJSON,
  formatHTML,
  minifyHTML,
  formatCSS,
  minifyCSS,
  formatXML,
  minifyXML,
  formatSQL,
  minifySQL,
  formatJavaScript,
  minifyJavaScript,
  formatTypeScript,
  formatCode,
  minifyCode,
  type SupportedLanguage
} from './formatters';

describe('代码格式化工具测试', () => {
  describe('JSON格式化', () => {
    it('应该正确格式化JSON', () => {
      const input = '{"name":"test","value":123}';
      const result = formatJSON(input);
      expect(result).toContain('\n');
      expect(result).toContain('  ');
    });

    it('应该正确压缩JSON', () => {
      const input = '{\n  "name": "test",\n  "value": 123\n}';
      const result = minifyJSON(input);
      expect(result).not.toContain('\n');
      expect(result).toBe('{"name":"test","value":123}');
    });

    it('应该处理嵌套JSON', () => {
      const input = '{"user":{"name":"test","age":25}}';
      const result = formatJSON(input);
      expect(result).toContain('user');
      expect(result).toContain('name');
      expect(result).toContain('age');
    });

    it('应该处理数组', () => {
      const input = '{"items":[1,2,3]}';
      const result = formatJSON(input);
      expect(result).toContain('items');
    });

    it('应该处理无效JSON', () => {
      const input = '{invalid json}';
      expect(() => formatJSON(input)).toThrow();
    });

    it('应该支持自定义缩进', () => {
      const input = '{"test":1}';
      const result = formatJSON(input, { indentSize: 4, useTabs: false });
      expect(result.split('\n')[1]).toMatch(/^[ ]{4}/);
    });

    it('应该支持Tab缩进', () => {
      const input = '{"test":1}';
      const result = formatJSON(input, { indentSize: 2, useTabs: true });
      expect(result.split('\n')[1]).toMatch(/^\t/);
    });
  });

  describe('HTML格式化', () => {
    it('应该正确格式化HTML', () => {
      const input = '<div><p>Hello</p></div>';
      const result = formatHTML(input);
      expect(result).toContain('\n');
    });

    it('应该正确压缩HTML', () => {
      const input = '<div>\n  <p>Hello</p>\n</div>';
      const result = minifyHTML(input);
      expect(result).not.toContain('\n');
    });

    it('应该处理嵌套标签', () => {
      const input = '<div><span><a>link</a></span></div>';
      const result = formatHTML(input);
      expect(result).toContain('\n');
    });

    it('应该处理自闭合标签', () => {
      const input = '<img src="test.jpg"/><br/>';
      const result = formatHTML(input);
      expect(result).toContain('img');
      expect(result).toContain('br');
    });

    it('应该处理属性', () => {
      const input = '<div class="test" id="main">content</div>';
      const result = formatHTML(input);
      expect(result).toContain('class');
    });
  });

  describe('CSS格式化', () => {
    it('应该正确格式化CSS', () => {
      const input = '.test{color:red;font-size:14px;}';
      const result = formatCSS(input);
      expect(result).toContain('\n');
      expect(result).toContain('color');
    });

    it('应该正确压缩CSS', () => {
      const input = '.test {\n  color: red;\n  font-size: 14px;\n}';
      const result = minifyCSS(input);
      expect(result).not.toContain('\n');
      expect(result).not.toContain('  ');
    });

    it('应该移除注释', () => {
      const input = '/* comment */ .test { color: red; }';
      const result = minifyCSS(input);
      expect(result).not.toContain('comment');
    });

    it('应该处理多个选择器', () => {
      const input = '.a,.b,.c{color:red;}';
      const result = formatCSS(input);
      expect(result).toContain('\n');
    });

    it('应该处理嵌套CSS', () => {
      const input = '.test{.inner{color:red;}}';
      const result = formatCSS(input);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('XML格式化', () => {
    it('应该正确格式化XML', () => {
      const input = '<?xml version="1.0"?><root><item>test</item></root>';
      const result = formatXML(input);
      expect(result).toContain('\n');
    });

    it('应该正确压缩XML', () => {
      const input = '<root>\n  <item>test</item>\n</root>';
      const result = minifyXML(input);
      expect(result).not.toContain('\n');
    });

    it('应该处理XML声明', () => {
      const input = '<?xml version="1.0" encoding="UTF-8"?><root></root>';
      const result = formatXML(input);
      expect(result).toContain('<?xml');
    });

    it('应该移除XML注释', () => {
      const input = '<!-- comment --><root></root>';
      const result = minifyXML(input);
      expect(result).not.toContain('comment');
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

    it('应该处理JOIN', () => {
      const input = 'select * from users join orders on users.id=orders.user_id';
      const result = formatSQL(input);
      expect(result).toContain('JOIN');
      expect(result).toContain('\n');
    });

    it('应该处理AND/OR条件', () => {
      const input = 'select * from users where age>18 and age<65';
      const result = formatSQL(input);
      expect(result).toContain('AND');
    });

    it('应该正确压缩SQL', () => {
      const input = 'SELECT * \nFROM users \nWHERE id = 1';
      const result = minifySQL(input);
      expect(result).not.toContain('\n');
    });

    it('应该移除SQL注释', () => {
      const input = 'SELECT * -- comment\nFROM users';
      const result = minifySQL(input);
      expect(result).not.toContain('comment');
    });
  });

  describe('JavaScript格式化', () => {
    it('应该正确格式化JavaScript', () => {
      const input = 'function test(){return 1;}';
      const result = formatJavaScript(input);
      expect(result).toContain('\n');
      expect(result).toContain('return');
    });

    it('应该处理对象字面量', () => {
      const input = 'const obj={a:1,b:2};';
      const result = formatJavaScript(input);
      expect(result.length).toBeGreaterThan(0);
    });

    it('应该处理字符串', () => {
      const input = 'const str="hello {name}";';
      const result = formatJavaScript(input);
      expect(result).toContain('str');
    });

    it('应该正确压缩JavaScript', () => {
      const input = 'function test( ) {\n  return 1;\n}';
      const result = minifyJavaScript(input);
      expect(result).not.toContain('\n');
      expect(result).not.toContain('  ');
    });

    it('应该移除单行注释', () => {
      const input = '// comment\nconst x = 1;';
      const result = minifyJavaScript(input);
      expect(result).not.toContain('comment');
    });

    it('应该移除多行注释', () => {
      const input = '/* comment */ const x = 1;';
      const result = minifyJavaScript(input);
      expect(result).not.toContain('comment');
    });
  });

  describe('TypeScript格式化', () => {
    it('应该正确格式化TypeScript', () => {
      const input = 'function test(x:number):number{return x*2;}';
      const result = formatTypeScript(input);
      expect(result).toContain('\n');
    });

    it('应该处理接口定义', () => {
      const input = 'interface User{name:string;}';
      const result = formatTypeScript(input);
      expect(result).toContain('User');
    });
  });

  describe('统一格式化接口', () => {
    it('应该支持所有声明的语言', () => {
      const languages: SupportedLanguage[] = [
        'javascript', 'typescript', 'html', 'css', 'scss',
        'less', 'xml', 'sql', 'yaml', 'markdown', 'graphql',
        'java', 'python', 'csharp', 'go', 'php'
      ];

      languages.forEach(lang => {
        expect(() => formatCode('test', lang)).not.toThrow();
      });
    });

    it('应该对不支持的语言抛出错误', () => {
      expect(() => formatCode('test', 'ruby' as SupportedLanguage)).toThrow();
    });

    it('应该支持所有压缩语言', () => {
      const languages: SupportedLanguage[] = [
        'javascript', 'html', 'css'
      ];

      languages.forEach(lang => {
        expect(() => minifyCode('test', lang)).not.toThrow();
      });
    });
  });

  describe('边界条件测试', () => {
    it('应该处理空字符串', () => {
      expect(formatJSON('""')).toBe('""');
      expect(formatHTML('')).toBe('');
    });

    it('应该处理只有空白的字符串', () => {
      expect(formatCSS('   ').trim()).toBe('');
    });

    it('应该处理不完整的代码', () => {
      const incompleteJS = 'function test(';
      const result = formatJavaScript(incompleteJS);
      expect(result.length).toBeGreaterThan(0);
    });

    it('应该处理特殊字符', () => {
      const input = '{"text":"Hello\\nWorld"}';
      expect(() => formatJSON(input)).not.toThrow();
    });

    it('应该处理超大输入', () => {
      const largeJSON = JSON.stringify({ data: 'x'.repeat(10000) });
      expect(() => formatJSON(largeJSON)).not.toThrow();
    });
  });

  describe('格式化选项', () => {
    it('应该支持不同缩进大小', () => {
      const input = '{"test":1}';
      const result2 = formatJSON(input, { indentSize: 2, useTabs: false });
      const result4 = formatJSON(input, { indentSize: 4, useTabs: false });
      expect(result2).not.toBe(result4);
    });

    it('应该支持Tab缩进', () => {
      const input = '{\n  "test": 1\n}';
      const result = formatJSON(input, { indentSize: 2, useTabs: true });
      expect(result).toContain('\t');
    });
  });
});
