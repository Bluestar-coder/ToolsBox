import type { FormatOptions, GeneralFormatterLanguage } from './formatter-types';
import { defaultFormatOptions } from './formatter-types';

export async function formatGeneralCode(
  input: string,
  language: GeneralFormatterLanguage,
  options: FormatOptions = defaultFormatOptions
): Promise<string> {
  switch (language) {
    case 'javascript': {
      const { formatJavaScript } = await import('./prettier-formatters');
      return formatJavaScript(input, options);
    }
    case 'typescript': {
      const { formatTypeScript } = await import('./prettier-formatters');
      return formatTypeScript(input, options);
    }
    case 'html': {
      const { formatHTML } = await import('./prettier-formatters');
      return formatHTML(input, options);
    }
    case 'css': {
      const { formatCSS } = await import('./prettier-formatters');
      return formatCSS(input, options);
    }
    case 'scss': {
      const { formatSCSS } = await import('./prettier-formatters');
      return formatSCSS(input, options);
    }
    case 'less': {
      const { formatLESS } = await import('./prettier-formatters');
      return formatLESS(input, options);
    }
    case 'xml': {
      const { formatXML } = await import('./prettier-formatters');
      return formatXML(input, options);
    }
    case 'yaml': {
      const { formatYAML } = await import('./prettier-formatters');
      return formatYAML(input, options);
    }
    case 'markdown': {
      const { formatMarkdown } = await import('./prettier-formatters');
      return formatMarkdown(input, options);
    }
    case 'graphql': {
      const { formatGraphQL } = await import('./prettier-formatters');
      return formatGraphQL(input, options);
    }
    case 'php': {
      const { formatPHP } = await import('./prettier-formatters');
      return formatPHP(input, options);
    }
    case 'java': {
      const { formatJava } = await import('./lightweight-formatters');
      return formatJava(input, options);
    }
    case 'python': {
      const { formatPython } = await import('./lightweight-formatters');
      return formatPython(input, options);
    }
    case 'csharp': {
      const { formatCSharp } = await import('./lightweight-formatters');
      return formatCSharp(input, options);
    }
    case 'go': {
      const { formatGo } = await import('./lightweight-formatters');
      return formatGo(input, options);
    }
    default:
      return input;
  }
}

export async function minifyGeneralCode(input: string, language: GeneralFormatterLanguage): Promise<string> {
  const { minifyLightweightLanguage } = await import('./lightweight-formatters');
  return minifyLightweightLanguage(input, language);
}
