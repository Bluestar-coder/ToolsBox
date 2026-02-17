import type { HistoryEntry } from './types';

const STORAGE_KEY = 'http-debug-history';
const MAX_ENTRIES = 100;

/**
 * 保存请求到历史记录。
 * 新条目插入到列表头部（时间倒序），超过 MAX_ENTRIES 时移除最旧的记录。
 */
export function saveToHistory(entry: HistoryEntry): void {
  const history = getHistory();
  history.unshift(entry);
  // 超出上限时截断
  if (history.length > MAX_ENTRIES) {
    history.length = MAX_ENTRIES;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

/**
 * 获取所有历史记录，按 timestamp 降序排列（最新在前）。
 */
export function getHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const entries: HistoryEntry[] = JSON.parse(raw);
    // 确保返回时间倒序
    entries.sort((a, b) => b.timestamp - a.timestamp);
    return entries;
  } catch {
    return [];
  }
}

/**
 * 清空全部历史记录。
 */
export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
