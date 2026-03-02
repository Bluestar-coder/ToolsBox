import { afterEach, describe, expect, it, vi } from 'vitest';
import { computeDiff } from './diff-utils';

describe('computeDiff', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not report changes for JSON key-order-only differences', () => {
    const result = computeDiff('{"a":1,"b":2}', '{"b":2,"a":1}', 'json');

    expect(result.addedCount).toBe(0);
    expect(result.removedCount).toBe(0);
    expect(result.changes.some(change => change.added || change.removed)).toBe(false);
  });

  it('falls back to line diff when JSON parsing fails', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = computeDiff('{"a":', '{"a":1}', 'json');

    expect(result.changes.length).toBeGreaterThan(0);
    expect(result.changes.some(change => change.added || change.removed)).toBe(true);
  });
});
