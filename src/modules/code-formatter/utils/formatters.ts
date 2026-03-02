/**
 * 代码格式化工具集
 *
 * @remarks
 * 提供多种编程语言的代码格式化和压缩功能。
 * 重构后采用 Prettier 和 sql-formatter 作为核心引擎，提供更专业的格式化能力。
 *
 * @packageDocumentation
 */

import type { Plugin } from 'prettier';

import { format as formatSqlLib } from 'sql-formatter';

/**
 * 支持的编程语言列表
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

let parserXmlPromise: Promise<Plugin> | null = null;
let parserPhpPromise: Promise<Plugin> | null = null;
let prettierPromise: Promise<typeof import('prettier/standalone')> | null = null;
let parserBabelPromise: Promise<Plugin> | null = null;
let parserEstreePromise: Promise<Plugin> | null = null;
let parserHtmlPromise: Promise<Plugin> | null = null;
let parserCssPromise: Promise<Plugin> | null = null;
let parserYamlPromise: Promise<Plugin> | null = null;
let parserMarkdownPromise: Promise<Plugin> | null = null;
let parserGraphqlPromise: Promise<Plugin> | null = null;
let parserTypescriptPromise: Promise<Plugin> | null = null;

const toPlugin = (mod: unknown): Plugin => {
  return (mod as { default?: Plugin }).default ?? (mod as Plugin);
};

async function loadPrettier(): Promise<typeof import('prettier/standalone')> {
  if (!prettierPromise) {
    prettierPromise = import('prettier/standalone');
  }
  return prettierPromise;
}

async function loadBabelPlugin(): Promise<Plugin> {
  if (!parserBabelPromise) {
    parserBabelPromise = import('prettier/plugins/babel').then(toPlugin);
  }
  return parserBabelPromise;
}

async function loadEstreePlugin(): Promise<Plugin> {
  if (!parserEstreePromise) {
    parserEstreePromise = import('prettier/plugins/estree').then(toPlugin);
  }
  return parserEstreePromise;
}

async function loadHtmlPlugin(): Promise<Plugin> {
  if (!parserHtmlPromise) {
    parserHtmlPromise = import('prettier/plugins/html').then(toPlugin);
  }
  return parserHtmlPromise;
}

async function loadCssPlugin(): Promise<Plugin> {
  if (!parserCssPromise) {
    parserCssPromise = import('prettier/plugins/postcss').then(toPlugin);
  }
  return parserCssPromise;
}

async function loadYamlPlugin(): Promise<Plugin> {
  if (!parserYamlPromise) {
    parserYamlPromise = import('prettier/plugins/yaml').then(toPlugin);
  }
  return parserYamlPromise;
}

async function loadMarkdownPlugin(): Promise<Plugin> {
  if (!parserMarkdownPromise) {
    parserMarkdownPromise = import('prettier/plugins/markdown').then(toPlugin);
  }
  return parserMarkdownPromise;
}

async function loadGraphqlPlugin(): Promise<Plugin> {
  if (!parserGraphqlPromise) {
    parserGraphqlPromise = import('prettier/plugins/graphql').then(toPlugin);
  }
  return parserGraphqlPromise;
}

async function loadTypescriptPlugin(): Promise<Plugin> {
  if (!parserTypescriptPromise) {
    parserTypescriptPromise = import('prettier/plugins/typescript').then(toPlugin);
  }
  return parserTypescriptPromise;
}

async function loadXmlPlugin(): Promise<Plugin> {
  if (!parserXmlPromise) {
    parserXmlPromise = import('@prettier/plugin-xml')
      .then(toPlugin);
  }
  return parserXmlPromise;
}

async function loadPhpPlugin(): Promise<Plugin> {
  if (!parserPhpPromise) {
    parserPhpPromise = import('@prettier/plugin-php')
      .then(toPlugin);
  }
  return parserPhpPromise;
}

/**
 * 使用 Prettier 格式化代码的通用函数
 */
async function formatWithPrettier(
  input: string,
  parser: string,
  plugins: Plugin[],
  options: FormatOptions
): Promise<string> {
  try {
    const prettier = await loadPrettier();
    return await prettier.format(input, {
      parser,
      plugins,
      tabWidth: options.indentSize,
      useTabs: options.useTabs,
      printWidth: 80, // 默认行宽
    });
  } catch (error) {
    console.error('Prettier format error:', error);
    return input; // 格式化失败返回原文本，避免崩溃
  }
}

// ==========================================
// 格式化函数 (Formatters)
// ==========================================

// JSON
export async function formatJSON(input: string, options: FormatOptions = defaultOptions): Promise<string> {
  // JSON parser is inside babel
  const [babel, estree] = await Promise.all([loadBabelPlugin(), loadEstreePlugin()]);
  return formatWithPrettier(input, 'json', [babel, estree], options);
}

// HTML
export async function formatHTML(input: string, options: FormatOptions = defaultOptions): Promise<string> {
  const parserHtml = await loadHtmlPlugin();
  return formatWithPrettier(input, 'html', [parserHtml], options);
}

// CSS
export async function formatCSS(input: string, options: FormatOptions = defaultOptions): Promise<string> {
  const parserCss = await loadCssPlugin();
  return formatWithPrettier(input, 'css', [parserCss], options);
}

// XML
export async function formatXML(input: string, options: FormatOptions = defaultOptions): Promise<string> {
  const parserXml = await loadXmlPlugin();
  return formatWithPrettier(input, 'xml', [parserXml], options);
}

// SQL (使用 sql-formatter)
export function formatSQL(input: string, options: FormatOptions = defaultOptions): string {
  try {
    return formatSqlLib(input, {
      language: 'sql',
      tabWidth: options.indentSize,
      useTabs: options.useTabs,
      keywordCase: 'upper',
    });
  } catch (error) {
    console.error('SQL format error:', error);
    return input;
  }
}

// JavaScript
export async function formatJavaScript(input: string, options: FormatOptions = defaultOptions): Promise<string> {
  const [babel, estree] = await Promise.all([loadBabelPlugin(), loadEstreePlugin()]);
  return formatWithPrettier(input, 'babel', [babel, estree], options);
}

// TypeScript
export async function formatTypeScript(input: string, options: FormatOptions = defaultOptions): Promise<string> {
  const [parserTypescript, parserEstree] = await Promise.all([loadTypescriptPlugin(), loadEstreePlugin()]);
  return formatWithPrettier(input, 'typescript', [parserTypescript, parserEstree], options);
}

// SCSS
export async function formatSCSS(input: string, options: FormatOptions = defaultOptions): Promise<string> {
  const parserCss = await loadCssPlugin();
  return formatWithPrettier(input, 'scss', [parserCss], options);
}

// LESS
export async function formatLESS(input: string, options: FormatOptions = defaultOptions): Promise<string> {
  const parserCss = await loadCssPlugin();
  return formatWithPrettier(input, 'less', [parserCss], options);
}

// YAML
export async function formatYAML(input: string, options: FormatOptions = defaultOptions): Promise<string> {
  const parserYaml = await loadYamlPlugin();
  return formatWithPrettier(input, 'yaml', [parserYaml], options);
}

// Markdown
export async function formatMarkdown(input: string, options: FormatOptions = defaultOptions): Promise<string> {
  const parserMarkdown = await loadMarkdownPlugin();
  return formatWithPrettier(input, 'markdown', [parserMarkdown], options);
}

// GraphQL
export async function formatGraphQL(input: string, options: FormatOptions = defaultOptions): Promise<string> {
  const parserGraphql = await loadGraphqlPlugin();
  return formatWithPrettier(input, 'graphql', [parserGraphql], options);
}

// PHP
export async function formatPHP(input: string, options: FormatOptions = defaultOptions): Promise<string> {
  const parserPhp = await loadPhpPlugin();
  return formatWithPrettier(input, 'php', [parserPhp], options);
}

// ------------------------------------------------------------------
// 以下语言暂时保留简易实现 (Naive Implementation)
// 因为 Prettier 对这些语言的纯前端支持较重或缺乏
// ------------------------------------------------------------------

// Java (简易实现)
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
       // 保留换行，但不重复
    } else {
      formatted += char;
    }
  }
  
  return formatted.replace(/\n\s*\n/g, '\n').trim();
}

// Python (简易实现)
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
    const leadingSpaces = line.match(/^(\s*)/)?.[1].length || 0;
    const indentLevel = Math.floor(leadingSpaces / 4);
    formatted += indent.repeat(indentLevel) + trimmed + '\n';
  }
  return formatted.trim();
}

// C#
export function formatCSharp(input: string, options: FormatOptions = defaultOptions): string {
  return formatJava(input, options);
}

// Go
export function formatGo(input: string, options: FormatOptions = defaultOptions): string {
  const goOptions = { ...options, useTabs: true };
  return formatJava(input, goOptions);
}

// ==========================================
// 压缩函数 (Minifiers)
// 注意：这些仍然是基于正则的简单压缩，仅移除空白和注释
// ==========================================

export function minifyJSON(input: string): string {
  try {
    return JSON.stringify(JSON.parse(input));
  } catch {
    return input;
  }
}

export function minifyHTML(input: string): string {
  return input
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .replace(/\s+>/g, '>')
    .replace(/<\s+/g, '<')
    .trim();
}

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

export function minifySQL(input: string): string {
  return input
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function minifyJavaScript(input: string): string {
  return input
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}();,:])\s*/g, '$1')
    .trim();
}

// 复用 JS Minifier
export const minifyTypeScript = minifyJavaScript;
export const minifySCSS = minifyCSS;
export const minifyLESS = minifyCSS;
export const minifyJava = minifyJavaScript;
export const minifyCSharp = minifyJavaScript;
export const minifyGo = minifyJavaScript;
export const minifyPHP = minifyJavaScript;

export function minifyXML(input: string): string {
  return input
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/>\s+</g, '><')
    .replace(/\s+/g, ' ')
    .trim();
}

export function minifyYAML(input: string): string {
  return input.split('\n').filter(l => l.trim() && !l.trim().startsWith('#')).join('\n');
}

export function minifyMarkdown(input: string): string {
  return input.replace(/\n{2,}/g, '\n').trim();
}

export function minifyGraphQL(input: string): string {
  return input
    .replace(/#.*$/gm, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}(),:])\s*/g, '$1')
    .trim();
}

export function minifyPython(input: string): string {
  return input.split('\n').filter(l => l.trim() && !l.trim().startsWith('#')).join('\n');
}

// ==========================================
// 统一入口
// ==========================================

export async function formatCode(
  input: string, 
  language: SupportedLanguage, 
  options: FormatOptions = defaultOptions
): Promise<string> {
  switch (language) {
    case 'json': return formatJSON(input, options);
    case 'javascript': return formatJavaScript(input, options);
    case 'typescript': return formatTypeScript(input, options);
    case 'html': return formatHTML(input, options);
    case 'css': return formatCSS(input, options);
    case 'scss': return formatSCSS(input, options);
    case 'less': return formatLESS(input, options);
    case 'xml': return formatXML(input, options);
    case 'sql': return formatSQL(input, options);
    case 'yaml': return formatYAML(input, options);
    case 'markdown': return formatMarkdown(input, options);
    case 'graphql': return formatGraphQL(input, options);
    case 'php': return formatPHP(input, options);
    // Legacy / Naive implementations
    case 'java': return formatJava(input, options);
    case 'python': return formatPython(input, options);
    case 'csharp': return formatCSharp(input, options);
    case 'go': return formatGo(input, options);
    default:
      console.warn(`Unsupported language for formatting: ${language}`);
      return input;
  }
}

export function minifyCode(input: string, language: SupportedLanguage): string {
  switch (language) {
    case 'json': return minifyJSON(input);
    case 'javascript': return minifyJavaScript(input);
    case 'typescript': return minifyTypeScript(input);
    case 'html': return minifyHTML(input);
    case 'css': return minifyCSS(input);
    case 'scss': return minifySCSS(input);
    case 'less': return minifyLESS(input);
    case 'xml': return minifyXML(input);
    case 'sql': return minifySQL(input);
    case 'yaml': return minifyYAML(input);
    case 'markdown': return minifyMarkdown(input);
    case 'graphql': return minifyGraphQL(input);
    case 'java': return minifyJava(input);
    case 'python': return minifyPython(input);
    case 'csharp': return minifyCSharp(input);
    case 'go': return minifyGo(input);
    case 'php': return minifyPHP(input);
    default:
      console.warn(`Unsupported language for minification: ${language}`);
      return input;
  }
}
