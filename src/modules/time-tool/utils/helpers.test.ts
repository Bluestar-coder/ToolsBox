import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseSmartTime } from './helpers';

describe('parseSmartTime', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('parses "today" as the start of the current day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-02T15:04:05.000Z'));

    const result = parseSmartTime('today');

    expect(result).not.toBeNull();
    expect(result?.getHours()).toBe(0);
    expect(result?.getMinutes()).toBe(0);
    expect(result?.getSeconds()).toBe(0);
    expect(result?.getMilliseconds()).toBe(0);
  });

  it('parses "now" as current instant', () => {
    vi.useFakeTimers();
    const now = new Date('2026-03-02T15:04:05.000Z');
    vi.setSystemTime(now);

    const result = parseSmartTime('now');

    expect(result).not.toBeNull();
    expect(result?.getTime()).toBe(now.getTime());
  });
});
