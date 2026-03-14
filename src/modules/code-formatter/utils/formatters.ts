/**
 * Legacy formatter facade kept for tests and compatibility.
 * Runtime tabs load narrower formatter entry points instead.
 */

export type {
  SupportedLanguage,
  GeneralFormatterLanguage,
  FormatOptions,
} from './formatter-types';

import type { SupportedLanguage, GeneralFormatterLanguage, FormatOptions } from './formatter-types';
import { defaultFormatOptions } from './formatter-types';
import {
  formatJSON,
  formatJavaScript,
  formatTypeScript,
} from './prettier-formatters';
import {
  formatHTML,
  formatCSS,
  formatXML,
  formatSCSS,
  formatLESS,
  formatYAML,
  formatMarkdown,
  formatGraphQL,
  formatPHP,
  formatJava,
  formatPython,
  formatCSharp,
  formatGo,
  minifyJSON,
  minifyHTML,
  minifyCSS,
  minifyJavaScript,
  minifyTypeScript,
  minifySCSS,
  minifyLESS,
  minifyXML,
  minifyYAML,
  minifyMarkdown,
  minifyGraphQL,
  minifyPython,
  minifyJava,
  minifyCSharp,
  minifyGo,
  minifyPHP,
} from './lightweight-formatters';
import { formatSQL, minifySQL } from './sql-formatters';

export {
  formatJSON,
  formatHTML,
  formatCSS,
  formatXML,
  formatSQL,
  formatJavaScript,
  formatTypeScript,
  formatSCSS,
  formatLESS,
  formatYAML,
  formatMarkdown,
  formatGraphQL,
  formatPHP,
  formatJava,
  formatPython,
  formatCSharp,
  formatGo,
  minifyJSON,
  minifyHTML,
  minifyCSS,
  minifySQL,
  minifyJavaScript,
  minifyTypeScript,
  minifySCSS,
  minifyLESS,
  minifyXML,
  minifyYAML,
  minifyMarkdown,
  minifyGraphQL,
  minifyPython,
  minifyJava,
  minifyCSharp,
  minifyGo,
  minifyPHP,
};

export async function formatCode(
  input: string,
  language: SupportedLanguage,
  options: FormatOptions = defaultFormatOptions
): Promise<string> {
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
    case 'php':
      return formatPHP(input, options);
    case 'java':
      return formatJava(input, options);
    case 'python':
      return formatPython(input, options);
    case 'csharp':
      return formatCSharp(input, options);
    case 'go':
      return formatGo(input, options);
    default:
      console.warn(`Unsupported language for formatting: ${language}`);
      return input;
  }
}

export async function formatGeneralCode(
  input: string,
  language: GeneralFormatterLanguage,
  options: FormatOptions = defaultFormatOptions
): Promise<string> {
  return formatCode(input, language, options);
}

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
      console.warn(`Unsupported language for minification: ${language}`);
      return input;
  }
}

export function minifyGeneralCode(input: string, language: GeneralFormatterLanguage): string {
  return minifyCode(input, language);
}
