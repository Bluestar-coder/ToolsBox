export interface MatchResult {
  match: string;
  index: number;
  groups: string[];
  namedGroups?: Record<string, string>;
}

export interface RegexTestResult {
  isValid: boolean;
  matches: MatchResult[];
  error?: string;
  matchCount: number;
}

/**
 * 测试正则表达式
 */
export function testRegex(pattern: string, flags: string, testString: string): RegexTestResult {
  if (!pattern) {
    return { isValid: false, matches: [], matchCount: 0, error: '请输入正则表达式' };
  }

  try {
    const regex = new RegExp(pattern, flags);
    const matches: MatchResult[] = [];

    if (flags.includes('g')) {
      let match;
      while ((match = regex.exec(testString)) !== null) {
        matches.push({
          match: match[0],
          index: match.index,
          groups: match.slice(1),
          namedGroups: match.groups,
        });
        // 防止无限循环
        if (match[0].length === 0) {
          regex.lastIndex++;
        }
      }
    } else {
      const match = regex.exec(testString);
      if (match) {
        matches.push({
          match: match[0],
          index: match.index,
          groups: match.slice(1),
          namedGroups: match.groups,
        });
      }
    }

    return { isValid: true, matches, matchCount: matches.length };
  } catch (e) {
    return {
      isValid: false,
      matches: [],
      matchCount: 0,
      error: e instanceof Error ? e.message : '无效的正则表达式',
    };
  }
}

/**
 * 替换文本
 */
export function replaceWithRegex(
  pattern: string,
  flags: string,
  testString: string,
  replacement: string
): { result: string; error?: string } {
  if (!pattern) {
    return { result: testString, error: '请输入正则表达式' };
  }

  try {
    const regex = new RegExp(pattern, flags);
    const result = testString.replace(regex, replacement);
    return { result };
  } catch (e) {
    return {
      result: testString,
      error: e instanceof Error ? e.message : '替换失败',
    };
  }
}

/**
 * 高亮匹配文本（返回带标记的HTML）
 */
export function highlightMatches(testString: string, matches: MatchResult[]): string {
  if (matches.length === 0) return escapeHtml(testString);

  // 按索引排序
  const sortedMatches = [...matches].sort((a, b) => a.index - b.index);
  
  let result = '';
  let lastIndex = 0;

  for (const match of sortedMatches) {
    // 添加匹配前的文本
    result += escapeHtml(testString.slice(lastIndex, match.index));
    // 添加高亮的匹配文本
    result += `<mark class="regex-match">${escapeHtml(match.match)}</mark>`;
    lastIndex = match.index + match.match.length;
  }

  // 添加剩余文本
  result += escapeHtml(testString.slice(lastIndex));

  return result;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * 分割文本
 */
export function splitWithRegex(
  pattern: string,
  flags: string,
  testString: string
): { result: string[]; error?: string } {
  if (!pattern) {
    return { result: [testString], error: '请输入正则表达式' };
  }

  try {
    const regex = new RegExp(pattern, flags);
    const result = testString.split(regex);
    return { result };
  } catch (e) {
    return {
      result: [testString],
      error: e instanceof Error ? e.message : '分割失败',
    };
  }
}
