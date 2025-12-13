// SQL 专用工具函数

export interface SqlStatement {
  type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'CREATE' | 'ALTER' | 'DROP' | 'OTHER';
  tables: string[];
  columns: string[];
  raw: string;
}

// 解析 SQL 语句类型
export function parseSqlStatements(sql: string): SqlStatement[] {
  const statements = sql.split(';').filter(s => s.trim());
  return statements.map(parseSingleStatement);
}

function parseSingleStatement(sql: string): SqlStatement {
  const trimmed = sql.trim().toUpperCase();
  const raw = sql.trim();
  
  let type: SqlStatement['type'] = 'OTHER';
  const tables: string[] = [];
  const columns: string[] = [];
  
  if (trimmed.startsWith('SELECT')) {
    type = 'SELECT';
    // 提取表名
    const fromMatch = raw.match(/FROM\s+([^\s,]+)/gi);
    if (fromMatch) {
      fromMatch.forEach(m => {
        const table = m.replace(/FROM\s+/i, '').trim();
        tables.push(table);
      });
    }
    // 提取列名
    const selectMatch = raw.match(/SELECT\s+(.*?)\s+FROM/is);
    if (selectMatch) {
      const cols = selectMatch[1].split(',').map(c => c.trim());
      columns.push(...cols);
    }
  } else if (trimmed.startsWith('INSERT')) {
    type = 'INSERT';
    const tableMatch = raw.match(/INTO\s+([^\s(]+)/i);
    if (tableMatch) tables.push(tableMatch[1]);
  } else if (trimmed.startsWith('UPDATE')) {
    type = 'UPDATE';
    const tableMatch = raw.match(/UPDATE\s+([^\s]+)/i);
    if (tableMatch) tables.push(tableMatch[1]);
  } else if (trimmed.startsWith('DELETE')) {
    type = 'DELETE';
    const tableMatch = raw.match(/FROM\s+([^\s]+)/i);
    if (tableMatch) tables.push(tableMatch[1]);
  } else if (trimmed.startsWith('CREATE')) {
    type = 'CREATE';
    const tableMatch = raw.match(/TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([^\s(]+)/i);
    if (tableMatch) tables.push(tableMatch[1]);
  } else if (trimmed.startsWith('ALTER')) {
    type = 'ALTER';
    const tableMatch = raw.match(/TABLE\s+([^\s]+)/i);
    if (tableMatch) tables.push(tableMatch[1]);
  } else if (trimmed.startsWith('DROP')) {
    type = 'DROP';
    const tableMatch = raw.match(/TABLE\s+(?:IF\s+EXISTS\s+)?([^\s]+)/i);
    if (tableMatch) tables.push(tableMatch[1]);
  }
  
  return { type, tables, columns, raw };
}

// SQL 关键字高亮（返回带标记的文本）
export const SQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'LIKE', 'BETWEEN',
  'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT', 'OFFSET', 'AS', 'DISTINCT',
  'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN', 'CROSS JOIN',
  'ON', 'USING', 'UNION', 'UNION ALL', 'INTERSECT', 'EXCEPT',
  'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM',
  'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE', 'TRUNCATE TABLE',
  'CREATE INDEX', 'DROP INDEX', 'CREATE VIEW', 'DROP VIEW',
  'PRIMARY KEY', 'FOREIGN KEY', 'REFERENCES', 'UNIQUE', 'NOT NULL', 'DEFAULT',
  'NULL', 'TRUE', 'FALSE', 'IS', 'IS NOT',
  'COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'COALESCE', 'NULLIF',
  'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
  'ASC', 'DESC', 'NULLS FIRST', 'NULLS LAST',
  'EXISTS', 'ALL', 'ANY', 'SOME',
];

// 转换为大写关键字
export function uppercaseKeywords(sql: string): string {
  let result = sql;
  SQL_KEYWORDS.forEach(kw => {
    const regex = new RegExp(`\\b${kw.replace(/\s+/g, '\\s+')}\\b`, 'gi');
    result = result.replace(regex, kw);
  });
  return result;
}

// 转换为小写关键字
export function lowercaseKeywords(sql: string): string {
  let result = sql;
  SQL_KEYWORDS.forEach(kw => {
    const regex = new RegExp(`\\b${kw.replace(/\s+/g, '\\s+')}\\b`, 'gi');
    result = result.replace(regex, kw.toLowerCase());
  });
  return result;
}

// 添加表别名
export function addTableAliases(sql: string): string {
  const tableRegex = /\bFROM\s+([a-zA-Z_][a-zA-Z0-9_]*)\b(?!\s+(?:AS\s+)?[a-zA-Z])/gi;
  let aliasIndex = 0;
  const aliases = 'abcdefghijklmnopqrstuvwxyz';
  
  return sql.replace(tableRegex, (_match, table) => {
    const alias = aliases[aliasIndex++ % 26];
    return `FROM ${table} ${alias}`;
  });
}

// 移除注释
export function removeComments(sql: string): string {
  return sql
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\n\s*\n/g, '\n')
    .trim();
}

// 提取所有表名
export function extractTables(sql: string): string[] {
  const tables = new Set<string>();
  
  // FROM 子句
  const fromMatches = sql.matchAll(/\bFROM\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi);
  for (const match of fromMatches) {
    tables.add(match[1]);
  }
  
  // JOIN 子句
  const joinMatches = sql.matchAll(/\bJOIN\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi);
  for (const match of joinMatches) {
    tables.add(match[1]);
  }
  
  // INSERT INTO
  const insertMatches = sql.matchAll(/\bINTO\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi);
  for (const match of insertMatches) {
    tables.add(match[1]);
  }
  
  // UPDATE
  const updateMatches = sql.matchAll(/\bUPDATE\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi);
  for (const match of updateMatches) {
    tables.add(match[1]);
  }
  
  return Array.from(tables);
}

// SQL 验证（基础语法检查）
export interface SqlValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateSql(sql: string): SqlValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const trimmed = sql.trim();
  
  // 检查是否为空
  if (!trimmed) {
    errors.push('SQL 语句为空');
    return { valid: false, errors, warnings };
  }
  
  // 检查括号匹配
  const openParens = (trimmed.match(/\(/g) || []).length;
  const closeParens = (trimmed.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    errors.push(`括号不匹配: ${openParens} 个 '(' vs ${closeParens} 个 ')'`);
  }
  
  // 检查引号匹配
  const singleQuotes = (trimmed.match(/'/g) || []).length;
  if (singleQuotes % 2 !== 0) {
    errors.push('单引号不匹配');
  }
  
  // 检查 SELECT 是否有 FROM
  if (/\bSELECT\b/i.test(trimmed) && !/\bFROM\b/i.test(trimmed)) {
    warnings.push('SELECT 语句缺少 FROM 子句');
  }
  
  // 检查 WHERE 1=1 反模式
  if (/WHERE\s+1\s*=\s*1/i.test(trimmed)) {
    warnings.push('检测到 WHERE 1=1 模式，可能是动态 SQL 占位符');
  }
  
  // 检查 SELECT *
  if (/SELECT\s+\*/i.test(trimmed)) {
    warnings.push('使用 SELECT * 可能影响性能，建议明确指定列名');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// 生成 INSERT 语句模板
export function generateInsertTemplate(tableName: string, columns: string[]): string {
  const cols = columns.join(', ');
  const placeholders = columns.map(() => '?').join(', ');
  return `INSERT INTO ${tableName} (${cols})\nVALUES (${placeholders});`;
}

// 生成 SELECT 语句模板
export function generateSelectTemplate(tableName: string, columns: string[] = ['*']): string {
  const cols = columns.join(', ');
  return `SELECT ${cols}\nFROM ${tableName}\nWHERE 1 = 1;`;
}
