import type { Plugin } from 'prettier';
import type { FormatOptions } from './formatter-types';
import { defaultFormatOptions } from './formatter-types';

type PrettierFormatterLanguage =
  | 'json'
  | 'javascript'
  | 'typescript'
  | 'html'
  | 'css'
  | 'scss'
  | 'less'
  | 'yaml'
  | 'markdown'
  | 'graphql';

let prettierPromise: Promise<typeof import('prettier/standalone')> | null = null;
let parserBabelPromise: Promise<Plugin> | null = null;
let parserEstreePromise: Promise<Plugin> | null = null;
let parserHtmlPromise: Promise<Plugin> | null = null;
let parserCssPromise: Promise<Plugin> | null = null;
let parserYamlPromise: Promise<Plugin> | null = null;
let parserMarkdownPromise: Promise<Plugin> | null = null;
let parserGraphqlPromise: Promise<Plugin> | null = null;

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
      printWidth: 80,
    });
  } catch (error) {
    console.error('Prettier format error:', error);
    return input;
  }
}

export async function formatJSON(input: string, options: FormatOptions = defaultFormatOptions): Promise<string> {
  const [babel, estree] = await Promise.all([loadBabelPlugin(), loadEstreePlugin()]);
  return formatWithPrettier(input, 'json', [babel, estree], options);
}

export async function formatHTML(input: string, options: FormatOptions = defaultFormatOptions): Promise<string> {
  const parserHtml = await loadHtmlPlugin();
  return formatWithPrettier(input, 'html', [parserHtml], options);
}

export async function formatCSS(input: string, options: FormatOptions = defaultFormatOptions): Promise<string> {
  const parserCss = await loadCssPlugin();
  return formatWithPrettier(input, 'css', [parserCss], options);
}

export async function formatJavaScript(input: string, options: FormatOptions = defaultFormatOptions): Promise<string> {
  const [babel, estree] = await Promise.all([loadBabelPlugin(), loadEstreePlugin()]);
  return formatWithPrettier(input, 'babel', [babel, estree], options);
}

export async function formatTypeScript(input: string, options: FormatOptions = defaultFormatOptions): Promise<string> {
  const [babel, estree] = await Promise.all([loadBabelPlugin(), loadEstreePlugin()]);
  return formatWithPrettier(input, 'babel-ts', [babel, estree], options);
}

export async function formatSCSS(input: string, options: FormatOptions = defaultFormatOptions): Promise<string> {
  const parserCss = await loadCssPlugin();
  return formatWithPrettier(input, 'scss', [parserCss], options);
}

export async function formatLESS(input: string, options: FormatOptions = defaultFormatOptions): Promise<string> {
  const parserCss = await loadCssPlugin();
  return formatWithPrettier(input, 'less', [parserCss], options);
}

export async function formatYAML(input: string, options: FormatOptions = defaultFormatOptions): Promise<string> {
  const parserYaml = await loadYamlPlugin();
  return formatWithPrettier(input, 'yaml', [parserYaml], options);
}

export async function formatMarkdown(input: string, options: FormatOptions = defaultFormatOptions): Promise<string> {
  const parserMarkdown = await loadMarkdownPlugin();
  return formatWithPrettier(input, 'markdown', [parserMarkdown], options);
}

export async function formatGraphQL(input: string, options: FormatOptions = defaultFormatOptions): Promise<string> {
  const parserGraphql = await loadGraphqlPlugin();
  return formatWithPrettier(input, 'graphql', [parserGraphql], options);
}

export async function formatPrettierLanguage(
  input: string,
  language: PrettierFormatterLanguage,
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
    case 'yaml':
      return formatYAML(input, options);
    case 'markdown':
      return formatMarkdown(input, options);
    case 'graphql':
      return formatGraphQL(input, options);
    default:
      return input;
  }
}
