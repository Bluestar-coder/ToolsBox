import type { SupportedLanguage } from './formatters';

export interface LanguageOption {
  value: SupportedLanguage;
  label: string;
  placeholder: string;
}

export const languageOptions: LanguageOption[] = [
  // 数据格式
  { 
    value: 'json', 
    label: 'JSON',
    placeholder: '{"name": "example", "value": 123}'
  },
  { 
    value: 'xml', 
    label: 'XML',
    placeholder: '<?xml version="1.0"?><root><item>value</item></root>'
  },
  { 
    value: 'yaml', 
    label: 'YAML',
    placeholder: 'name: example\nvalue: 123\nitems:\n  - item1\n  - item2'
  },
  // Web 前端
  { 
    value: 'html', 
    label: 'HTML',
    placeholder: '<div><p>Hello World</p></div>'
  },
  { 
    value: 'css', 
    label: 'CSS',
    placeholder: '.container { display: flex; justify-content: center; }'
  },
  { 
    value: 'scss', 
    label: 'SCSS',
    placeholder: '.parent { color: red; .child { font-size: 14px; } }'
  },
  { 
    value: 'less', 
    label: 'LESS',
    placeholder: '@primary: #333; .box { color: @primary; }'
  },
  { 
    value: 'javascript', 
    label: 'JavaScript',
    placeholder: 'function hello() { console.log("Hello"); }'
  },
  { 
    value: 'typescript', 
    label: 'TypeScript',
    placeholder: 'function greet(name: string): void { console.log(name); }'
  },
  // 查询语言
  { 
    value: 'sql', 
    label: 'SQL',
    placeholder: 'SELECT * FROM users WHERE id = 1 ORDER BY name'
  },
  { 
    value: 'graphql', 
    label: 'GraphQL',
    placeholder: 'query { user(id: 1) { name email } }'
  },
  // 文档
  { 
    value: 'markdown', 
    label: 'Markdown',
    placeholder: '# Title\n\n- Item 1\n- Item 2\n\n```code```'
  },
  // 后端语言
  { 
    value: 'java', 
    label: 'Java',
    placeholder: 'public class Main { public static void main(String[] args) { } }'
  },
  { 
    value: 'python', 
    label: 'Python',
    placeholder: 'def hello():\n    print("Hello")\n\nif __name__ == "__main__":\n    hello()'
  },
  { 
    value: 'csharp', 
    label: 'C#',
    placeholder: 'public class Program { static void Main() { } }'
  },
  { 
    value: 'go', 
    label: 'Go',
    placeholder: 'package main\n\nfunc main() { fmt.Println("Hello") }'
  },
  { 
    value: 'php', 
    label: 'PHP',
    placeholder: '<?php function hello() { echo "Hello"; } ?>'
  },
];

export const indentSizeOptions = [
  { value: 2, label: '2 空格' },
  { value: 4, label: '4 空格' },
  { value: 8, label: '8 空格' },
];

// 语言分组
export const languageGroups = [
  { label: '数据格式', languages: ['json', 'xml', 'yaml'] },
  { label: 'Web 前端', languages: ['html', 'css', 'scss', 'less', 'javascript', 'typescript'] },
  { label: '查询语言', languages: ['sql', 'graphql'] },
  { label: '文档', languages: ['markdown'] },
  { label: '后端语言', languages: ['java', 'python', 'csharp', 'go', 'php'] },
];
