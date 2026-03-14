import type { FormatOptions } from './formatter-types';
import { defaultFormatOptions } from './formatter-types';

let sqlFormatterPromise: Promise<typeof import('sql-formatter')> | null = null;

async function loadSqlFormatter(): Promise<typeof import('sql-formatter')> {
  if (!sqlFormatterPromise) {
    sqlFormatterPromise = import('sql-formatter');
  }

  return sqlFormatterPromise;
}

export async function formatSQL(input: string, options: FormatOptions = defaultFormatOptions): Promise<string> {
  try {
    const { format } = await loadSqlFormatter();
    return format(input, {
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

export function minifySQL(input: string): string {
  return input
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
