// JSON 专用工具函数

// 安全限制
const MAX_DEPTH = 50;
const MAX_CHILDREN = 1000;

export interface JsonNode {
  key: string;
  value: unknown;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  path: string;
  depth: number;
  children?: JsonNode[];
  truncated?: boolean;
}

// 解析 JSON 为树结构
export function parseJsonToTree(json: string): JsonNode {
  const parsed = JSON.parse(json);
  return buildTree(parsed, 'root', '', 0);
}

function buildTree(value: unknown, key: string, path: string, depth: number): JsonNode {
  const currentPath = path ? `${path}.${key}` : key;
  
  // 深度限制保护
  if (depth >= MAX_DEPTH) {
    return { key, value: '[深度超限]', type: 'string', path: currentPath, depth, truncated: true };
  }
  
  if (value === null) {
    return { key, value, type: 'null', path: currentPath, depth };
  }
  
  if (Array.isArray(value)) {
    const truncated = value.length > MAX_CHILDREN;
    const items = truncated ? value.slice(0, MAX_CHILDREN) : value;
    return {
      key,
      value,
      type: 'array',
      path: currentPath,
      depth,
      truncated,
      children: items.map((item, index) => 
        buildTree(item, `[${index}]`, currentPath, depth + 1)
      ),
    };
  }
  
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    const truncated = entries.length > MAX_CHILDREN;
    const items = truncated ? entries.slice(0, MAX_CHILDREN) : entries;
    return {
      key,
      value,
      type: 'object',
      path: currentPath,
      depth,
      truncated,
      children: items.map(([k, v]) =>
        buildTree(v, k, currentPath, depth + 1)
      ),
    };
  }
  
  return {
    key,
    value,
    type: typeof value as 'string' | 'number' | 'boolean',
    path: currentPath,
    depth,
  };
}

// 获取 JSON 深度
export function getJsonDepth(json: string): number {
  const parsed = JSON.parse(json);
  return calculateDepth(parsed, 0);
}

function calculateDepth(value: unknown, currentDepth: number): number {
  // 深度限制保护
  if (currentDepth >= MAX_DEPTH) return currentDepth;
  
  if (value === null || typeof value !== 'object') {
    return currentDepth;
  }
  
  if (Array.isArray(value)) {
    if (value.length === 0) return currentDepth + 1;
    // 只检查前100个元素
    const sample = value.slice(0, 100);
    return Math.max(...sample.map(v => calculateDepth(v, currentDepth + 1)));
  }
  
  const values = Object.values(value as Record<string, unknown>);
  if (values.length === 0) return currentDepth + 1;
  // 只检查前100个属性
  const sample = values.slice(0, 100);
  return Math.max(...sample.map(v => calculateDepth(v, currentDepth + 1)));
}

// 按层级展开 JSON
export function expandToDepth(json: string, maxDepth: number, indentSize: number = 2): string {
  const parsed = JSON.parse(json);
  return stringifyWithDepth(parsed, maxDepth, 0, indentSize);
}

function stringifyWithDepth(
  value: unknown, 
  maxDepth: number, 
  currentDepth: number,
  indentSize: number
): string {
  const indent = ' '.repeat(indentSize);
  
  if (value === null) return 'null';
  if (typeof value !== 'object') return JSON.stringify(value);
  
  if (currentDepth >= maxDepth) {
    return JSON.stringify(value);
  }
  
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const items = value.map(item => 
      indent.repeat(currentDepth + 1) + stringifyWithDepth(item, maxDepth, currentDepth + 1, indentSize)
    );
    return '[\n' + items.join(',\n') + '\n' + indent.repeat(currentDepth) + ']';
  }
  
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) return '{}';
  
  const items = entries.map(([k, v]) =>
    indent.repeat(currentDepth + 1) + 
    JSON.stringify(k) + ': ' + 
    stringifyWithDepth(v, maxDepth, currentDepth + 1, indentSize)
  );
  return '{\n' + items.join(',\n') + '\n' + indent.repeat(currentDepth) + '}';
}

// 移除转义字符（处理双重转义的 JSON 字符串）
export function unescapeJson(input: string): string {
  // 尝试解析为字符串，如果是转义的 JSON 字符串
  try {
    const parsed = JSON.parse(input);
    if (typeof parsed === 'string') {
      // 如果解析结果是字符串，可能是双重转义
      try {
        JSON.parse(parsed);
        return parsed; // 返回解转义后的 JSON 字符串
      } catch {
        return parsed;
      }
    }
    return input;
  } catch {
    // 手动处理常见转义
    return input
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t');
  }
}

// 添加转义（将 JSON 转为可嵌入字符串）
export function escapeJson(input: string): string {
  return JSON.stringify(input);
}

// 获取 JSON 路径的值
export function getValueByPath(json: string, path: string): unknown {
  const parsed = JSON.parse(json);
  const keys = path.split('.').filter(k => k && k !== 'root');
  
  let current: unknown = parsed;
  for (const key of keys) {
    if (current === null || typeof current !== 'object') {
      return undefined;
    }
    
    // 处理数组索引 [0], [1] 等
    const arrayMatch = key.match(/^\[(\d+)\]$/);
    if (arrayMatch && Array.isArray(current)) {
      current = current[parseInt(arrayMatch[1])];
    } else {
      current = (current as Record<string, unknown>)[key];
    }
  }
  
  return current;
}

// JSON 统计信息
export interface JsonStats {
  totalKeys: number;
  maxDepth: number;
  arrayCount: number;
  objectCount: number;
  stringCount: number;
  numberCount: number;
  booleanCount: number;
  nullCount: number;
}

export function getJsonStats(json: string): JsonStats {
  const parsed = JSON.parse(json);
  const stats: JsonStats = {
    totalKeys: 0,
    maxDepth: 0,
    arrayCount: 0,
    objectCount: 0,
    stringCount: 0,
    numberCount: 0,
    booleanCount: 0,
    nullCount: 0,
  };
  
  collectStats(parsed, 0, stats);
  return stats;
}

function collectStats(value: unknown, depth: number, stats: JsonStats): void {
  stats.maxDepth = Math.max(stats.maxDepth, depth);
  
  if (value === null) {
    stats.nullCount++;
    return;
  }
  
  if (Array.isArray(value)) {
    stats.arrayCount++;
    value.forEach(item => collectStats(item, depth + 1, stats));
    return;
  }
  
  if (typeof value === 'object') {
    stats.objectCount++;
    const entries = Object.entries(value as Record<string, unknown>);
    stats.totalKeys += entries.length;
    entries.forEach(([, v]) => collectStats(v, depth + 1, stats));
    return;
  }
  
  switch (typeof value) {
    case 'string':
      stats.stringCount++;
      break;
    case 'number':
      stats.numberCount++;
      break;
    case 'boolean':
      stats.booleanCount++;
      break;
  }
}

// JSON 路径查询 (简单的 JSONPath 实现)
export function queryJsonPath(json: string, query: string): unknown[] {
  const parsed = JSON.parse(json);
  const results: unknown[] = [];
  
  // 简单支持 $.key, $..key, $[0] 等
  if (query === '$') {
    return [parsed];
  }
  
  if (query.startsWith('$..')) {
    // 递归搜索
    const key = query.slice(3);
    findAllByKey(parsed, key, results);
  } else if (query.startsWith('$.')) {
    // 直接路径
    const path = query.slice(2);
    const value = getValueByPath(json, path);
    if (value !== undefined) {
      results.push(value);
    }
  }
  
  return results;
}

function findAllByKey(value: unknown, key: string, results: unknown[]): void {
  if (value === null || typeof value !== 'object') return;
  
  if (Array.isArray(value)) {
    value.forEach(item => findAllByKey(item, key, results));
  } else {
    const obj = value as Record<string, unknown>;
    if (key in obj) {
      results.push(obj[key]);
    }
    Object.values(obj).forEach(v => findAllByKey(v, key, results));
  }
}

// JSON 比较
export function compareJson(json1: string, json2: string): { equal: boolean; diff: string } {
  try {
    const obj1 = JSON.parse(json1);
    const obj2 = JSON.parse(json2);
    
    const equal = JSON.stringify(obj1) === JSON.stringify(obj2);
    
    if (equal) {
      return { equal: true, diff: '两个 JSON 完全相同' };
    }
    
    const diffs: string[] = [];
    findDifferences(obj1, obj2, 'root', diffs);
    
    return { equal: false, diff: diffs.join('\n') };
  } catch (e) {
    return { equal: false, diff: `解析错误: ${e instanceof Error ? e.message : '未知错误'}` };
  }
}

function findDifferences(
  val1: unknown, 
  val2: unknown, 
  path: string, 
  diffs: string[]
): void {
  if (val1 === val2) return;
  
  if (typeof val1 !== typeof val2) {
    diffs.push(`${path}: 类型不同 (${typeof val1} vs ${typeof val2})`);
    return;
  }
  
  if (val1 === null || val2 === null) {
    diffs.push(`${path}: ${JSON.stringify(val1)} → ${JSON.stringify(val2)}`);
    return;
  }
  
  if (Array.isArray(val1) && Array.isArray(val2)) {
    if (val1.length !== val2.length) {
      diffs.push(`${path}: 数组长度不同 (${val1.length} vs ${val2.length})`);
    }
    const maxLen = Math.max(val1.length, val2.length);
    for (let i = 0; i < maxLen; i++) {
      findDifferences(val1[i], val2[i], `${path}[${i}]`, diffs);
    }
    return;
  }
  
  if (typeof val1 === 'object' && typeof val2 === 'object') {
    const keys1 = Object.keys(val1 as object);
    const keys2 = Object.keys(val2 as object);
    const allKeys = new Set([...keys1, ...keys2]);
    
    for (const key of allKeys) {
      const v1 = (val1 as Record<string, unknown>)[key];
      const v2 = (val2 as Record<string, unknown>)[key];
      
      if (!(key in (val1 as object))) {
        diffs.push(`${path}.${key}: 仅存在于第二个 JSON`);
      } else if (!(key in (val2 as object))) {
        diffs.push(`${path}.${key}: 仅存在于第一个 JSON`);
      } else {
        findDifferences(v1, v2, `${path}.${key}`, diffs);
      }
    }
    return;
  }
  
  if (val1 !== val2) {
    diffs.push(`${path}: ${JSON.stringify(val1)} → ${JSON.stringify(val2)}`);
  }
}
