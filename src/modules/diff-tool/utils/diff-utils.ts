import { diffLines, diffJson } from 'diff';
import type { Change } from 'diff';

export type DiffMode = 'lines' | 'json';

export interface DiffResult {
  changes: Change[];
  addedCount: number;
  removedCount: number;
}

export const computeDiff = (
  oldText: string,
  newText: string,
  mode: DiffMode = 'lines'
): DiffResult => {
  let changes: Change[] = [];
  
  try {
    if (mode === 'json') {
      changes = diffJson(oldText, newText);
    } else {
      changes = diffLines(oldText, newText);
    }
  } catch (error) {
    console.error('Diff computation failed:', error);
    // Fallback to lines diff if JSON diff fails
    if (mode === 'json') {
      changes = diffLines(oldText, newText);
    } else {
      // Should rarely happen for text diffs
      changes = [{ value: newText, added: true, removed: false, count: 1 }];
    }
  }

  let addedCount = 0;
  let removedCount = 0;

  changes.forEach(change => {
    if (change.added) addedCount += change.count || 0;
    if (change.removed) removedCount += change.count || 0;
  });

  return { changes, addedCount, removedCount };
};
