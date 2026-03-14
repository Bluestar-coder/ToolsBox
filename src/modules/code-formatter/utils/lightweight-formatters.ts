import type { FormatOptions, GeneralFormatterLanguage } from './formatter-types';
import { defaultFormatOptions } from './formatter-types';

type LightweightFormatterLanguage = Exclude<GeneralFormatterLanguage, 'javascript' | 'typescript'>;

export function formatJava(input: string, options: FormatOptions = defaultFormatOptions): string {
  const indent = options.useTabs ? '\t' : ' '.repeat(options.indentSize);
  let formatted = '';
  let indentLevel = 0;
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < input.length; i += 1) {
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
      formatted += ` {\n${indent.repeat(++indentLevel)}`;
    } else if (char === '}') {
      indentLevel = Math.max(0, indentLevel - 1);
      formatted = `${formatted.trimEnd()}\n${indent.repeat(indentLevel)}}`;
    } else if (char === ';') {
      formatted += `;\n${indent.repeat(indentLevel)}`;
    } else if (char !== '\n') {
      formatted += char;
    }
  }

  return formatted.replace(/\n\s*\n/g, '\n').trim();
}

export function formatPython(input: string, options: FormatOptions = defaultFormatOptions): string {
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
    formatted += `${indent.repeat(indentLevel)}${trimmed}\n`;
  }

  return formatted.trim();
}

export function formatCSharp(input: string, options: FormatOptions = defaultFormatOptions): string {
  return formatJava(input, options);
}

export function formatGo(input: string, options: FormatOptions = defaultFormatOptions): string {
  return formatJava(input, { ...options, useTabs: true });
}

export function formatLightweightLanguage(
  input: string,
  language: LightweightFormatterLanguage,
  options: FormatOptions = defaultFormatOptions
): string {
  switch (language) {
    case 'java':
      return formatJava(input, options);
    case 'python':
      return formatPython(input, options);
    case 'csharp':
      return formatCSharp(input, options);
    case 'go':
      return formatGo(input, options);
    default:
      return input;
  }
}

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

export function minifyJavaScript(input: string): string {
  return input
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}();,:])\s*/g, '$1')
    .trim();
}

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
  return input
    .split('\n')
    .filter((line) => line.trim() && !line.trim().startsWith('#'))
    .join('\n');
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
  return input
    .split('\n')
    .filter((line) => line.trim() && !line.trim().startsWith('#'))
    .join('\n');
}

export function minifyLightweightLanguage(input: string, language: GeneralFormatterLanguage): string {
  switch (language) {
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
      return input;
  }
}
