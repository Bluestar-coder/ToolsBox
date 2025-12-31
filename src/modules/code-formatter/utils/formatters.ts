/**
 * 代码格式化工具集
 *
 * @remarks
 * 提供多种编程语言的代码格式化和压缩功能
 *
 * @packageDocumentation
 */

// 代码格式化工具函数

/**
 * 支持的编程语言列表
 *
 * @remarks
 * 以下语言支持格式化和压缩操作：
 * - Web: json, javascript, typescript, html, css, scss, less, xml
 * - Data: yaml, markdown, graphql
 * - Backend: java, python, csharp, go, php
 * - Database: sql
 */
export type SupportedLanguage =
  | 'json' 
  | 'javascript' 
  | 'typescript'
  | 'html' 
  | 'css' 
  | 'scss'
  | 'less'
  | 'xml' 
  | 'sql'
  | 'yaml'
  | 'markdown'
  | 'graphql'
  | 'java'
  | 'python'
  | 'csharp'
  | 'go'
  | 'php';

export interface FormatOptions {
  indentSize: number;
  useTabs: boolean;
}

const defaultOptions: FormatOptions = {
  indentSize: 2,
  useTabs: false,
};

// JSON 格式化
export function formatJSON(input: string, options: FormatOptions = defaultOptions): string {
  const parsed = JSON.parse(input);
  const indent = options.useTabs ? '\t' : ' '.repeat(options.indentSize);
  return JSON.stringify(parsed, null, indent);
}

// JSON 压缩
export function minifyJSON(input: string): string {
  const parsed = JSON.parse(input);
  return JSON.stringify(parsed);
}

// HTML 格式化
export function formatHTML(input: string, options: FormatOptions = defaultOptions): string {
  const indent = options.useTabs ? '\t' : ' '.repeat(options.indentSize);
  let formatted = '';
  let indentLevel = 0;
  
  // 简单的HTML格式化逻辑
  const tokens = input.replace(/>\s*</g, '>\n<').split('\n');
  
  for (const token of tokens) {
    const trimmed = token.trim();
    if (!trimmed) continue;
    
    // 自闭合标签或结束标签
    if (trimmed.match(/^<\//) || trimmed.match(/\/>$/)) {
      if (trimmed.match(/^<\//)) {
        indentLevel = Math.max(0, indentLevel - 1);
      }
      formatted += indent.repeat(indentLevel) + trimmed + '\n';
      if (trimmed.match(/\/>$/)) {
        // 自闭合标签不改变缩进
      }
    } else if (trimmed.match(/^</)) {
      // 开始标签
      formatted += indent.repeat(indentLevel) + trimmed + '\n';
      // 不是自闭合且不是特殊标签
      if (!trimmed.match(/<(br|hr|img|input|meta|link|area|base|col|embed|param|source|track|wbr)/i)) {
        indentLevel++;
      }
    } else {
      formatted += indent.repeat(indentLevel) + trimmed + '\n';
    }
  }
  
  return formatted.trim();
}

// HTML 压缩
export function minifyHTML(input: string): string {
  return input
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .replace(/\s+>/g, '>')
    .replace(/<\s+/g, '<')
    .trim();
}

// CSS 格式化
export function formatCSS(input: string, options: FormatOptions = defaultOptions): string {
  const indent = options.useTabs ? '\t' : ' '.repeat(options.indentSize);
  
  return input
    .replace(/\s*{\s*/g, ' {\n' + indent)
    .replace(/\s*}\s*/g, '\n}\n\n')
    .replace(/;\s*/g, ';\n' + indent)
    .replace(/,\s*/g, ',\n')
    .replace(new RegExp(indent + '}', 'g'), '}')
    .replace(/\n\s*\n/g, '\n')
    .trim();
}

// CSS 压缩
export function minifyCSS(input: string): string {
  return input
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*{\s*/g, '{')
    .replace(/\s*}\s*/g, '}')
    .replace(/\s*;\s*/g, ';')
    .replace(/\s*:\s*/g, ':')
    .replace(/\s*,\s*/g, ',')
    .trim();
}

// XML 格式化
export function formatXML(input: string, options: FormatOptions = defaultOptions): string {
  const indent = options.useTabs ? '\t' : ' '.repeat(options.indentSize);
  let formatted = '';
  let indentLevel = 0;
  
  const tokens = input.replace(/>\s*</g, '>\n<').split('\n');
  
  for (const token of tokens) {
    const trimmed = token.trim();
    if (!trimmed) continue;
    
    if (trimmed.match(/^<\?/)) {
      // XML 声明
      formatted += trimmed + '\n';
    } else if (trimmed.match(/^<\//)) {
      // 结束标签
      indentLevel = Math.max(0, indentLevel - 1);
      formatted += indent.repeat(indentLevel) + trimmed + '\n';
    } else if (trimmed.match(/\/>$/)) {
      // 自闭合标签
      formatted += indent.repeat(indentLevel) + trimmed + '\n';
    } else if (trimmed.match(/^</)) {
      // 开始标签
      formatted += indent.repeat(indentLevel) + trimmed + '\n';
      indentLevel++;
    } else {
      formatted += indent.repeat(indentLevel) + trimmed + '\n';
    }
  }
  
  return formatted.trim();
}

// XML 压缩
export function minifyXML(input: string): string {
  return input
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/>\s+</g, '><')
    .replace(/\s+/g, ' ')
    .trim();
}

// SQL 格式化
export function formatSQL(input: string, options: FormatOptions = defaultOptions): string {
  const indent = options.useTabs ? '\t' : ' '.repeat(options.indentSize);
  const keywords = [
    'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'ORDER BY', 'GROUP BY',
    'HAVING', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN',
    'ON', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM',
    'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE', 'LIMIT', 'OFFSET',
    'UNION', 'UNION ALL', 'AS', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MAX', 'MIN'
  ];
  
  let formatted = input.trim();
  
  // 主要关键字换行
  const mainKeywords = ['SELECT', 'FROM', 'WHERE', 'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT', 'UNION'];
  mainKeywords.forEach(kw => {
    const regex = new RegExp(`\\b${kw}\\b`, 'gi');
    formatted = formatted.replace(regex, '\n' + kw);
  });
  
  // JOIN 关键字换行并缩进
  const joinKeywords = ['JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN'];
  joinKeywords.forEach(kw => {
    const regex = new RegExp(`\\b${kw}\\b`, 'gi');
    formatted = formatted.replace(regex, '\n' + indent + kw);
  });
  
  // AND/OR 换行并缩进
  formatted = formatted.replace(/\bAND\b/gi, '\n' + indent + 'AND');
  formatted = formatted.replace(/\bOR\b/gi, '\n' + indent + 'OR');
  
  // 清理多余空行
  formatted = formatted.replace(/\n\s*\n/g, '\n').trim();
  
  // 关键字大写
  keywords.forEach(kw => {
    const regex = new RegExp(`\\b${kw}\\b`, 'gi');
    formatted = formatted.replace(regex, kw);
  });
  
  return formatted;
}

// SQL 压缩
export function minifySQL(input: string): string {
  return input
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// JavaScript 简单格式化
export function formatJavaScript(input: string, options: FormatOptions = defaultOptions): string {
  const indent = options.useTabs ? '\t' : ' '.repeat(options.indentSize);
  let formatted = '';
  let indentLevel = 0;
  let inString = false;
  let stringChar = '';
  
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    const prevChar = input[i - 1];
    
    // 处理字符串
    if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
      }
      formatted += char;
      continue;
    }
    
    if (inString) {
      formatted += char;
      continue;
    }
    
    // 处理括号和分号
    if (char === '{') {
      formatted += ' {\n' + indent.repeat(++indentLevel);
    } else if (char === '}') {
      indentLevel = Math.max(0, indentLevel - 1);
      formatted = formatted.trimEnd() + '\n' + indent.repeat(indentLevel) + '}';
    } else if (char === ';') {
      formatted += ';\n' + indent.repeat(indentLevel);
    } else if (char === '\n') {
      // 跳过原有换行
    } else {
      formatted += char;
    }
  }
  
  return formatted.replace(/\n\s*\n/g, '\n').trim();
}

// JavaScript 压缩
export function minifyJavaScript(input: string): string {
  // 简单压缩，移除注释和多余空白
  return input
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}();,:])\s*/g, '$1')
    .trim();
}

// TypeScript 格式化 (复用 JavaScript 逻辑)
export function formatTypeScript(input: string, options: FormatOptions = defaultOptions): string {
  return formatJavaScript(input, options);
}

export function minifyTypeScript(input: string): string {
  return minifyJavaScript(input);
}

// SCSS 格式化
export function formatSCSS(input: string, options: FormatOptions = defaultOptions): string {
  const indent = options.useTabs ? '\t' : ' '.repeat(options.indentSize);
  let formatted = input;
  let indentLevel = 0;
  
  // 处理嵌套结构
  formatted = formatted
    .replace(/\s*{\s*/g, ' {\n')
    .replace(/\s*}\s*/g, '\n}\n')
    .replace(/;\s*/g, ';\n');
  
  const lines = formatted.split('\n');
  formatted = '';
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    if (trimmed === '}') {
      indentLevel = Math.max(0, indentLevel - 1);
    }
    
    formatted += indent.repeat(indentLevel) + trimmed + '\n';
    
    if (trimmed.endsWith('{')) {
      indentLevel++;
    }
  }
  
  return formatted.trim();
}

export function minifySCSS(input: string): string {
  return minifyCSS(input);
}

// LESS 格式化 (类似 SCSS)
export function formatLESS(input: string, options: FormatOptions = defaultOptions): string {
  return formatSCSS(input, options);
}

export function minifyLESS(input: string): string {
  return minifyCSS(input);
}

// YAML 格式化
export function formatYAML(input: string, options: FormatOptions = defaultOptions): string {
  const indent = options.useTabs ? '\t' : ' '.repeat(options.indentSize);
  const lines = input.split('\n');
  let formatted = '';
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      formatted += trimmed + '\n';
      continue;
    }
    
    // 计算原始缩进级别
    const leadingSpaces = line.match(/^(\s*)/)?.[1].length || 0;
    const indentLevel = Math.floor(leadingSpaces / 2);
    
    formatted += indent.repeat(indentLevel) + trimmed + '\n';
  }
  
  return formatted.trim();
}

export function minifyYAML(input: string): string {
  // YAML 不适合压缩，只移除空行和注释
  return input
    .split('\n')
    .filter(line => line.trim() && !line.trim().startsWith('#'))
    .join('\n');
}

// Markdown 格式化
export function formatMarkdown(input: string, _options?: FormatOptions): string {
  void _options; // 标记参数为已使用，保留以便未来扩展
  let formatted = input;
  
  // 标题前后添加空行
  formatted = formatted.replace(/\n*(#{1,6}\s)/g, '\n\n$1');
  
  // 列表项规范化
  formatted = formatted.replace(/^(\s*)[-*+]\s+/gm, '$1- ');
  
  // 代码块前后添加空行
  formatted = formatted.replace(/\n*(```)/g, '\n\n$1');
  
  // 清理多余空行
  formatted = formatted.replace(/\n{3,}/g, '\n\n');
  
  return formatted.trim();
}

export function minifyMarkdown(input: string): string {
  return input
    .replace(/\n{2,}/g, '\n')
    .trim();
}

// GraphQL 格式化
export function formatGraphQL(input: string, options: FormatOptions = defaultOptions): string {
  const indent = options.useTabs ? '\t' : ' '.repeat(options.indentSize);
  let formatted = '';
  let indentLevel = 0;
  
  // 简单的 token 分割
  const tokens = input
    .replace(/([{}()])/g, '\n$1\n')
    .split('\n')
    .map(t => t.trim())
    .filter(t => t);
  
  for (const token of tokens) {
    if (token === '}' || token === ')') {
      indentLevel = Math.max(0, indentLevel - 1);
    }
    
    formatted += indent.repeat(indentLevel) + token + '\n';
    
    if (token === '{' || token === '(') {
      indentLevel++;
    }
  }
  
  return formatted.trim();
}

export function minifyGraphQL(input: string): string {
  return input
    .replace(/#.*$/gm, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}(),:])\s*/g, '$1')
    .trim();
}

// Java 格式化
export function formatJava(input: string, options: FormatOptions = defaultOptions): string {
  const indent = options.useTabs ? '\t' : ' '.repeat(options.indentSize);
  let formatted = '';
  let indentLevel = 0;
  let inString = false;
  let stringChar = '';
  
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    const prevChar = input[i - 1];
    
    if ((char === '"' || char === "'") && prevChar !== '\\') {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
      }
      formatted += char;
      continue;
    }
    
    if (inString) {
      formatted += char;
      continue;
    }
    
    if (char === '{') {
      formatted += ' {\n' + indent.repeat(++indentLevel);
    } else if (char === '}') {
      indentLevel = Math.max(0, indentLevel - 1);
      formatted = formatted.trimEnd() + '\n' + indent.repeat(indentLevel) + '}';
    } else if (char === ';') {
      formatted += ';\n' + indent.repeat(indentLevel);
    } else if (char === '\n') {
      // skip
    } else {
      formatted += char;
    }
  }
  
  return formatted.replace(/\n\s*\n/g, '\n').trim();
}

export function minifyJava(input: string): string {
  return input
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}();,:])\s*/g, '$1')
    .trim();
}

// Python 格式化
export function formatPython(input: string, options: FormatOptions = defaultOptions): string {
  const indent = options.useTabs ? '\t' : ' '.repeat(options.indentSize);
  const lines = input.split('\n');
  let formatted = '';
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      formatted += '\n';
      continue;
    }
    
    // 保持原有缩进结构，但规范化缩进字符
    const leadingSpaces = line.match(/^(\s*)/)?.[1].length || 0;
    const indentLevel = Math.floor(leadingSpaces / 4); // Python 通常用 4 空格
    
    formatted += indent.repeat(indentLevel) + trimmed + '\n';
  }
  
  // 函数/类定义前添加空行
  formatted = formatted.replace(/\n(def |class |async def )/g, '\n\n$1');
  formatted = formatted.replace(/\n{3,}/g, '\n\n');
  
  return formatted.trim();
}

export function minifyPython(input: string): string {
  // Python 依赖缩进，不能真正压缩，只移除注释和空行
  return input
    .split('\n')
    .filter(line => line.trim() && !line.trim().startsWith('#'))
    .join('\n');
}

// C# 格式化
export function formatCSharp(input: string, options: FormatOptions = defaultOptions): string {
  return formatJava(input, options); // C# 语法类似 Java
}

export function minifyCSharp(input: string): string {
  return minifyJava(input);
}

// Go 格式化
export function formatGo(input: string, options: FormatOptions = defaultOptions): string {
  // Go 使用 Tab 缩进
  const goOptions = { ...options, useTabs: true };
  return formatJava(input, goOptions);
}

export function minifyGo(input: string): string {
  return minifyJava(input);
}

// PHP 格式化
export function formatPHP(input: string, options: FormatOptions = defaultOptions): string {
  return formatJava(input, options);
}

export function minifyPHP(input: string): string {
  return minifyJava(input);
}

// 统一格式化入口
export function formatCode(
  input: string, 
  language: SupportedLanguage, 
  options: FormatOptions = defaultOptions
): string {
  switch (language) {
    case 'json':
      return formatJSON(input, options);
    case 'javascript':
      return formatJavaScript(input, options);
    case 'typescript':
      return formatTypeScript(input, options);
    case 'html':
      return formatHTML(input, options);
    case 'css':
      return formatCSS(input, options);
    case 'scss':
      return formatSCSS(input, options);
    case 'less':
      return formatLESS(input, options);
    case 'xml':
      return formatXML(input, options);
    case 'sql':
      return formatSQL(input, options);
    case 'yaml':
      return formatYAML(input, options);
    case 'markdown':
      return formatMarkdown(input, options);
    case 'graphql':
      return formatGraphQL(input, options);
    case 'java':
      return formatJava(input, options);
    case 'python':
      return formatPython(input, options);
    case 'csharp':
      return formatCSharp(input, options);
    case 'go':
      return formatGo(input, options);
    case 'php':
      return formatPHP(input, options);
    default:
      throw new Error(`Unsupported language: ${language}`);
  }
}

// 统一压缩入口
export function minifyCode(input: string, language: SupportedLanguage): string {
  switch (language) {
    case 'json':
      return minifyJSON(input);
    case 'javascript':
      return minifyJavaScript(input);
    case 'typescript':
      return minifyTypeScript(input);
    case 'html':
      return minifyHTML(input);
    case 'css':
      return minifyCSS(input);
    case 'scss':
      return minifySCSS(input);
    case 'less':
      return minifyLESS(input);
    case 'xml':
      return minifyXML(input);
    case 'sql':
      return minifySQL(input);
    case 'yaml':
      return minifyYAML(input);
    case 'markdown':
      return minifyMarkdown(input);
    case 'graphql':
      return minifyGraphQL(input);
    case 'java':
      return minifyJava(input);
    case 'python':
      return minifyPython(input);
    case 'csharp':
      return minifyCSharp(input);
    case 'go':
      return minifyGo(input);
    case 'php':
      return minifyPHP(input);
    default:
      throw new Error(`Unsupported language: ${language}`);
  }
}
