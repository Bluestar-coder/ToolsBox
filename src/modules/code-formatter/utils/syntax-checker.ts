// 语法检查工具

export interface SyntaxError {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface SyntaxCheckResult {
  valid: boolean;
  errors: SyntaxError[];
  warnings: SyntaxError[];
}

// JSON 语法检查
export function checkJsonSyntax(input: string): SyntaxCheckResult {
  const errors: SyntaxError[] = [];
  const warnings: SyntaxError[] = [];

  if (!input.trim()) {
    return { valid: false, errors: [{ line: 1, column: 1, message: '内容为空', severity: 'error' }], warnings };
  }

  try {
    JSON.parse(input);
  } catch (e) {
    if (e instanceof SyntaxError) {
      // 尝试从错误信息中提取位置
      const posMatch = e.message.match(/position\s+(\d+)/i);
      const pos = posMatch ? parseInt(posMatch[1]) : 0;
      const { line, column } = getLineAndColumn(input, pos);
      errors.push({ line, column, message: e.message, severity: 'error' });
    }
  }

  // 额外检查
  if (input.trim() && !errors.length) {
    // 检查尾随逗号
    if (/,\s*[}\]]/.test(input)) {
      const match = input.match(/,\s*[}\]]/);
      if (match && match.index !== undefined) {
        const { line, column } = getLineAndColumn(input, match.index);
        warnings.push({ line, column, message: '发现尾随逗号（某些解析器可能不支持）', severity: 'warning' });
      }
    }
    // 检查重复键
    checkDuplicateKeys(input, warnings);
  }

  return { valid: errors.length === 0, errors, warnings };
}

// 检查 JSON 重复键
function checkDuplicateKeys(input: string, warnings: SyntaxError[]): void {
  const keyRegex = /"([^"]+)"\s*:/g;
  const keys: Map<string, number[]> = new Map();
  let match;
  
  while ((match = keyRegex.exec(input)) !== null) {
    const key = match[1];
    const positions = keys.get(key) || [];
    positions.push(match.index);
    keys.set(key, positions);
  }
  
  keys.forEach((positions, key) => {
    if (positions.length > 1) {
      const { line, column } = getLineAndColumn(input, positions[1]);
      warnings.push({ line, column, message: `重复的键: "${key}"`, severity: 'warning' });
    }
  });
}

// JavaScript/TypeScript 语法检查
export function checkJavaScriptSyntax(input: string): SyntaxCheckResult {
  const errors: SyntaxError[] = [];
  const warnings: SyntaxError[] = [];

  if (!input.trim()) {
    return { valid: false, errors: [{ line: 1, column: 1, message: '内容为空', severity: 'error' }], warnings };
  }

  // 括号匹配检查
  checkBracketMatching(input, errors);
  
  // 引号匹配检查
  checkQuoteMatching(input, errors);
  
  // 常见错误检查
  checkCommonJsErrors(input, errors, warnings);

  return { valid: errors.length === 0, errors, warnings };
}

// HTML 语法检查
export function checkHtmlSyntax(input: string): SyntaxCheckResult {
  const errors: SyntaxError[] = [];
  const warnings: SyntaxError[] = [];

  if (!input.trim()) {
    return { valid: false, errors: [{ line: 1, column: 1, message: '内容为空', severity: 'error' }], warnings };
  }

  // 标签匹配检查
  checkHtmlTagMatching(input, errors);
  
  // 属性引号检查
  checkHtmlAttributes(input, warnings);
  
  // DOCTYPE 检查
  if (!input.trim().toLowerCase().startsWith('<!doctype') && !input.trim().startsWith('<')) {
    warnings.push({ line: 1, column: 1, message: '建议添加 DOCTYPE 声明', severity: 'info' });
  }

  return { valid: errors.length === 0, errors, warnings };
}

// CSS 语法检查
export function checkCssSyntax(input: string): SyntaxCheckResult {
  const errors: SyntaxError[] = [];
  const warnings: SyntaxError[] = [];

  if (!input.trim()) {
    return { valid: false, errors: [{ line: 1, column: 1, message: '内容为空', severity: 'error' }], warnings };
  }

  // 花括号匹配
  const openBraces = (input.match(/{/g) || []).length;
  const closeBraces = (input.match(/}/g) || []).length;
  if (openBraces !== closeBraces) {
    errors.push({ line: 1, column: 1, message: `花括号不匹配: ${openBraces} 个 '{' vs ${closeBraces} 个 '}'`, severity: 'error' });
  }

  // 检查缺少分号
  const lines = input.split('\n');
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    // 属性行应该以分号结尾
    if (trimmed && !trimmed.endsWith('{') && !trimmed.endsWith('}') && !trimmed.endsWith(';') && !trimmed.endsWith(',') && !trimmed.startsWith('/*') && !trimmed.startsWith('//') && !trimmed.startsWith('@') && trimmed.includes(':')) {
      warnings.push({ line: index + 1, column: line.length, message: '可能缺少分号', severity: 'warning' });
    }
  });

  // 检查无效的属性值
  const invalidValues = input.match(/:\s*;/g);
  if (invalidValues) {
    const match = input.match(/:\s*;/);
    if (match && match.index !== undefined) {
      const { line, column } = getLineAndColumn(input, match.index);
      errors.push({ line, column, message: '属性值为空', severity: 'error' });
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

// XML 语法检查
export function checkXmlSyntax(input: string): SyntaxCheckResult {
  const errors: SyntaxError[] = [];
  const warnings: SyntaxError[] = [];

  if (!input.trim()) {
    return { valid: false, errors: [{ line: 1, column: 1, message: '内容为空', severity: 'error' }], warnings };
  }

  // 使用 DOMParser 检查
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(input, 'application/xml');
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      const errorText = parseError.textContent || 'XML 解析错误';
      errors.push({ line: 1, column: 1, message: errorText.split('\n')[0], severity: 'error' });
    }
  } catch (e) {
    errors.push({ line: 1, column: 1, message: `XML 解析错误: ${e instanceof Error ? e.message : '未知错误'}`, severity: 'error' });
  }

  // XML 声明检查
  if (!input.trim().startsWith('<?xml')) {
    warnings.push({ line: 1, column: 1, message: '建议添加 XML 声明', severity: 'info' });
  }

  return { valid: errors.length === 0, errors, warnings };
}

// YAML 语法检查
export function checkYamlSyntax(input: string): SyntaxCheckResult {
  const errors: SyntaxError[] = [];
  const warnings: SyntaxError[] = [];

  if (!input.trim()) {
    return { valid: false, errors: [{ line: 1, column: 1, message: '内容为空', severity: 'error' }], warnings };
  }

  const lines = input.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    
    // 跳过空行和注释
    if (!line.trim() || line.trim().startsWith('#')) return;
    
    // Tab 检查
    if (line.includes('\t')) {
      errors.push({ line: lineNum, column: 1, message: 'YAML 不应使用 Tab 缩进', severity: 'error' });
    }

    // 检查冒号后是否有空格
    if (line.match(/:\S/) && !line.match(/:\S*:/) && !line.includes('://')) {
      const colonPos = line.indexOf(':');
      warnings.push({ line: lineNum, column: colonPos + 1, message: '冒号后建议添加空格', severity: 'warning' });
    }
  });

  return { valid: errors.length === 0, errors, warnings };
}

// Python 语法检查
export function checkPythonSyntax(input: string): SyntaxCheckResult {
  const errors: SyntaxError[] = [];
  const warnings: SyntaxError[] = [];

  if (!input.trim()) {
    return { valid: false, errors: [{ line: 1, column: 1, message: '内容为空', severity: 'error' }], warnings };
  }

  const lines = input.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    
    // 跳过空行和注释
    if (!line.trim() || line.trim().startsWith('#')) return;

    const indent = line.match(/^(\s*)/)?.[1].length || 0;

    // 混合 Tab 和空格
    if (line.match(/^\t+ /) || line.match(/^ +\t/)) {
      errors.push({ line: lineNum, column: 1, message: '混合使用 Tab 和空格缩进', severity: 'error' });
    }

    // 检查冒号后的缩进
    const prevLine = lines[index - 1];
    if (prevLine && prevLine.trim().endsWith(':')) {
      const prevIndent = prevLine.match(/^(\s*)/)?.[1].length || 0;
      if (indent <= prevIndent) {
        errors.push({ line: lineNum, column: 1, message: '冒号后应该增加缩进', severity: 'error' });
      }
    }

    // 括号匹配
    const openParens = (line.match(/\(/g) || []).length;
    const closeParens = (line.match(/\)/g) || []).length;
    
    // 简单的单行检查
    if (openParens !== closeParens && !line.trim().endsWith('\\')) {
      warnings.push({ line: lineNum, column: 1, message: '括号可能不匹配（如果是多行语句请忽略）', severity: 'warning' });
    }
  });

  // 检查常见错误
  if (input.includes('print ') && !input.includes('print(')) {
    warnings.push({ line: 1, column: 1, message: '检测到 Python 2 风格的 print 语句', severity: 'warning' });
  }

  return { valid: errors.length === 0, errors, warnings };
}

// 通用括号匹配检查
function checkBracketMatching(input: string, errors: SyntaxError[]): void {
  const brackets: { char: string; pos: number }[] = [];
  const pairs: Record<string, string> = { '(': ')', '[': ']', '{': '}' };
  const closers: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
  
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
      continue;
    }
    
    if (inString) continue;
    
    if (pairs[char]) {
      brackets.push({ char, pos: i });
    } else if (closers[char]) {
      const last = brackets.pop();
      if (!last || last.char !== closers[char]) {
        const { line, column } = getLineAndColumn(input, i);
        errors.push({ line, column, message: `未匹配的 '${char}'`, severity: 'error' });
      }
    }
  }
  
  // 检查未闭合的括号
  brackets.forEach(b => {
    const { line, column } = getLineAndColumn(input, b.pos);
    errors.push({ line, column, message: `未闭合的 '${b.char}'`, severity: 'error' });
  });
}

// 引号匹配检查
function checkQuoteMatching(input: string, errors: SyntaxError[]): void {
  const lines = input.split('\n');
  
  lines.forEach((line, index) => {
    let inString = false;
    let stringChar = '';
    let stringStart = 0;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const prevChar = line[i - 1];
      
      // 跳过转义
      if (prevChar === '\\') continue;
      
      if ((char === '"' || char === "'") && !inString) {
        inString = true;
        stringChar = char;
        stringStart = i;
      } else if (char === stringChar && inString) {
        inString = false;
      }
    }
    
    if (inString && stringChar !== '`') { // 模板字符串可以跨行
      errors.push({ 
        line: index + 1, 
        column: stringStart + 1, 
        message: `未闭合的字符串 (${stringChar})`, 
        severity: 'error' 
      });
    }
  });
}

// 常见 JS 错误检查
function checkCommonJsErrors(input: string, _errors: SyntaxError[], warnings: SyntaxError[]): void {
  const lines = input.split('\n');
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();
    
    // 检查 == 和 ===
    if (trimmed.includes(' == ') && !trimmed.includes(' === ')) {
      warnings.push({ line: lineNum, column: line.indexOf(' == '), message: '建议使用 === 代替 ==', severity: 'info' });
    }
    
    // 检查 var 使用
    if (trimmed.startsWith('var ')) {
      warnings.push({ line: lineNum, column: 1, message: '建议使用 let 或 const 代替 var', severity: 'info' });
    }
    
    // 检查 console.log
    if (trimmed.includes('console.log')) {
      warnings.push({ line: lineNum, column: line.indexOf('console.log'), message: '生产代码中应移除 console.log', severity: 'info' });
    }
  });
}

// HTML 标签匹配检查
function checkHtmlTagMatching(input: string, errors: SyntaxError[]): void {
  const selfClosingTags = new Set(['br', 'hr', 'img', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'param', 'source', 'track', 'wbr']);
  const tagStack: { tag: string; pos: number }[] = [];
  
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*\/?>/g;
  let match;
  
  while ((match = tagRegex.exec(input)) !== null) {
    const fullMatch = match[0];
    const tagName = match[1].toLowerCase();
    
    // 跳过自闭合标签
    if (selfClosingTags.has(tagName) || fullMatch.endsWith('/>')) continue;
    
    if (fullMatch.startsWith('</')) {
      // 闭合标签
      const last = tagStack.pop();
      if (!last) {
        const { line, column } = getLineAndColumn(input, match.index);
        errors.push({ line, column, message: `多余的闭合标签 </${tagName}>`, severity: 'error' });
      } else if (last.tag !== tagName) {
        const { line, column } = getLineAndColumn(input, match.index);
        errors.push({ line, column, message: `标签不匹配: 期望 </${last.tag}>, 实际 </${tagName}>`, severity: 'error' });
      }
    } else {
      // 开始标签
      tagStack.push({ tag: tagName, pos: match.index });
    }
  }
  
  // 检查未闭合的标签
  tagStack.forEach(t => {
    const { line, column } = getLineAndColumn(input, t.pos);
    errors.push({ line, column, message: `未闭合的标签 <${t.tag}>`, severity: 'error' });
  });
}

// HTML 属性检查
function checkHtmlAttributes(input: string, warnings: SyntaxError[]): void {
  // 检查没有引号的属性值
  const attrRegex = /\s([a-zA-Z-]+)=([^\s"'][^\s>]*)/g;
  let match;
  
  while ((match = attrRegex.exec(input)) !== null) {
    const { line, column } = getLineAndColumn(input, match.index);
    warnings.push({ line, column, message: `属性 ${match[1]} 的值建议使用引号包裹`, severity: 'warning' });
  }
}

// 获取行号和列号
function getLineAndColumn(input: string, position: number): { line: number; column: number } {
  const lines = input.substring(0, position).split('\n');
  return {
    line: lines.length,
    column: (lines[lines.length - 1]?.length || 0) + 1,
  };
}

// 统一语法检查入口
export function checkSyntax(input: string, language: string): SyntaxCheckResult {
  switch (language) {
    case 'json':
      return checkJsonSyntax(input);
    case 'javascript':
    case 'typescript':
      return checkJavaScriptSyntax(input);
    case 'html':
      return checkHtmlSyntax(input);
    case 'css':
    case 'scss':
    case 'less':
      return checkCssSyntax(input);
    case 'xml':
      return checkXmlSyntax(input);
    case 'yaml':
      return checkYamlSyntax(input);
    case 'python':
      return checkPythonSyntax(input);
    default:
      // 对于其他语言，只做基本的括号检查
      const errors: SyntaxError[] = [];
      checkBracketMatching(input, errors);
      return { valid: errors.length === 0, errors, warnings: [] };
  }
}
