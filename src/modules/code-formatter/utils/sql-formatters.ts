import type { FormatOptions } from './formatter-types';
import { defaultFormatOptions } from './formatter-types';
import { uppercaseKeywords } from './sql-utils';

const CLAUSE_BREAKS = [
  'SELECT',
  'FROM',
  'WHERE',
  'GROUP BY',
  'ORDER BY',
  'HAVING',
  'LIMIT',
  'OFFSET',
  'VALUES',
  'SET',
  'RETURNING',
  'UNION',
  'UNION ALL',
  'EXCEPT',
  'INTERSECT',
  'LEFT JOIN',
  'RIGHT JOIN',
  'INNER JOIN',
  'FULL JOIN',
  'CROSS JOIN',
  'JOIN',
  'ON',
] as const;

function escapeClause(clause: string): string {
  return clause.replace(/\s+/g, '\\s+');
}

function normalizeWhitespace(input: string): string {
  return input
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .replace(/\s*=\s*/g, ' = ')
    .trim();
}

function indentLines(lines: string[], indent: string): string {
  return lines
    .map((line, index) => (index === 0 ? line : `${indent}${line}`))
    .join('\n');
}

function formatSelectColumns(sql: string, indent: string): string {
  return sql.replace(/^SELECT\s+(.+?)(\nFROM\b)/is, (_match, columns, fromClause) => {
    const parts = String(columns)
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length <= 1) {
      return `SELECT ${parts[0] ?? String(columns).trim()}${fromClause}`;
    }

    return `SELECT\n${indent}${parts.join(`,\n${indent}`)}${fromClause}`;
  });
}

export async function formatSQL(input: string, options: FormatOptions = defaultFormatOptions): Promise<string> {
  try {
    const indent = options.useTabs ? '\t' : ' '.repeat(options.indentSize);
    let formatted = uppercaseKeywords(normalizeWhitespace(input));

    for (const clause of CLAUSE_BREAKS) {
      const pattern = new RegExp(`\\s+${escapeClause(clause)}\\b`, 'g');
      formatted = formatted.replace(pattern, `\n${clause}`);
    }

    formatted = formatted
      .replace(/\bON\b/g, '\nON')
      .replace(/\bAND\b/g, '\nAND')
      .replace(/\bOR\b/g, '\nOR');

    formatted = formatSelectColumns(formatted, indent);

    const normalizedLines = formatted
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    return indentLines(normalizedLines, indent);
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
