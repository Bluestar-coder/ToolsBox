import { describe, it, expect, beforeEach } from 'vitest';
import { saveToHistory, getHistory, clearHistory } from '../history-manager';
import type { HistoryEntry, HttpRequestConfig } from '../types';

/** Helper: create a minimal valid HistoryEntry */
function makeEntry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  const request: HttpRequestConfig = {
    method: 'GET',
    url: 'https://example.com',
    headers: [],
    bodyType: 'none',
    body: '',
  };
  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    request,
    ...overrides,
  };
}

describe('history-manager unit tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns empty array when no history exists', () => {
    expect(getHistory()).toEqual([]);
  });

  it('saves and retrieves a single entry', () => {
    const entry = makeEntry({ id: 'test-1', timestamp: 1000 });
    saveToHistory(entry);
    const history = getHistory();
    expect(history).toHaveLength(1);
    expect(history[0].id).toBe('test-1');
  });

  it('returns entries in time-descending order', () => {
    saveToHistory(makeEntry({ id: 'old', timestamp: 1000 }));
    saveToHistory(makeEntry({ id: 'new', timestamp: 2000 }));
    const history = getHistory();
    expect(history[0].id).toBe('new');
    expect(history[1].id).toBe('old');
  });

  it('clearHistory removes all entries', () => {
    saveToHistory(makeEntry());
    saveToHistory(makeEntry());
    clearHistory();
    expect(getHistory()).toEqual([]);
  });

  it('limits history to 100 entries, removing oldest', () => {
    for (let i = 0; i < 110; i++) {
      saveToHistory(makeEntry({ id: `entry-${i}`, timestamp: i }));
    }
    const history = getHistory();
    expect(history.length).toBeLessThanOrEqual(100);
    // The oldest entries (lowest timestamps) should have been dropped
    const ids = history.map((e) => e.id);
    expect(ids).not.toContain('entry-0');
    expect(ids).not.toContain('entry-9');
  });

  it('returns empty array when localStorage contains invalid JSON', () => {
    localStorage.setItem('http-debug-history', 'not-json');
    expect(getHistory()).toEqual([]);
  });

  it('preserves all fields of the saved entry', () => {
    const entry = makeEntry({
      id: 'full-test',
      timestamp: 12345,
      request: {
        method: 'POST',
        url: 'https://api.test.com/data',
        headers: [{ key: 'Authorization', value: 'Bearer token', enabled: true }],
        bodyType: 'json',
        body: '{"key":"value"}',
      },
    });
    saveToHistory(entry);
    const [retrieved] = getHistory();
    expect(retrieved).toEqual(entry);
  });
});

import fc from 'fast-check';

/**
 * Property 3: 历史记录持久化往返
 * **Validates: Requirements 4.1, 4.4**
 *
 * For any valid HistoryEntry, saving it via saveToHistory and then calling
 * getHistory should return a list containing that entry with all fields
 * matching the original data.
 */

/** Arbitrary: HttpMethod */
const arbHttpMethod = fc.constantFrom(
  'GET' as const,
  'POST' as const,
  'PUT' as const,
  'DELETE' as const,
  'PATCH' as const,
  'HEAD' as const,
  'OPTIONS' as const,
);

/** Arbitrary: BodyType */
const arbBodyType = fc.constantFrom(
  'none' as const,
  'json' as const,
  'form' as const,
  'multipart' as const,
  'raw' as const,
  'binary' as const,
);

/** Arbitrary: KeyValuePair */
const arbKeyValuePair = fc.record({
  key: fc.string({ minLength: 1, maxLength: 20 }),
  value: fc.string({ minLength: 0, maxLength: 50 }),
  enabled: fc.boolean(),
});

/** Arbitrary: HttpRequestConfig */
const arbHttpRequestConfig = fc.record({
  method: arbHttpMethod,
  url: fc.webUrl(),
  headers: fc.array(arbKeyValuePair, { minLength: 0, maxLength: 5 }),
  bodyType: arbBodyType,
  body: fc.string({ minLength: 0, maxLength: 100 }),
  formData: fc.option(fc.array(arbKeyValuePair, { minLength: 0, maxLength: 3 }), { nil: undefined }),
});

/** Arbitrary: HistoryEntry */
const arbHistoryEntry = fc.record({
  id: fc.uuid(),
  timestamp: fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }),
  request: arbHttpRequestConfig,
});

describe('Property-Based Tests: 历史记录持久化往返 (Property 3)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('round-trips a single HistoryEntry through saveToHistory/getHistory with all fields preserved', () => {
    fc.assert(
      fc.property(arbHistoryEntry, (entry) => {
        localStorage.clear();
        saveToHistory(entry);
        const history = getHistory();

        // History should contain exactly one entry
        expect(history).toHaveLength(1);

        // All fields must match the original entry
        expect(history[0]).toEqual(entry);
      }),
      { numRuns: 100 },
    );
  });

  it('preserves entry among multiple saves — the saved entry is always retrievable', () => {
    fc.assert(
      fc.property(
        arbHistoryEntry,
        fc.array(arbHistoryEntry, { minLength: 0, maxLength: 10 }),
        (target, others) => {
          localStorage.clear();

          // Save the target entry first
          saveToHistory(target);

          // Save additional entries
          for (const other of others) {
            saveToHistory(other);
          }

          const history = getHistory();

          // Find the target entry by id
          const found = history.find((e) => e.id === target.id);
          expect(found).toBeDefined();
          expect(found).toEqual(target);
        },
      ),
      { numRuns: 100 },
    );
  });
});


/**
 * Property 4: 历史记录时间倒序
 * **Validates: Requirements 4.2**
 *
 * For any set of history entries, getHistory should always return the list
 * sorted by timestamp descending (newest first).
 */
describe('Property-Based Tests: 历史记录时间倒序 (Property 4)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('getHistory returns entries sorted by timestamp descending for any set of entries', () => {
    fc.assert(
      fc.property(
        fc.array(arbHistoryEntry, { minLength: 1, maxLength: 20 }),
        (entries) => {
          localStorage.clear();

          // Save all entries
          for (const entry of entries) {
            saveToHistory(entry);
          }

          const history = getHistory();

          // Verify descending order: each timestamp >= the next one
          for (let i = 0; i < history.length - 1; i++) {
            expect(history[i].timestamp).toBeGreaterThanOrEqual(history[i + 1].timestamp);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('getHistory returns descending order even when entries are saved with random timestamp order', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }),
          { minLength: 2, maxLength: 30 },
        ),
        (timestamps) => {
          localStorage.clear();

          // Save entries with the given timestamps in arbitrary order
          for (let i = 0; i < timestamps.length; i++) {
            saveToHistory({
              id: `entry-${i}`,
              timestamp: timestamps[i],
              request: {
                method: 'GET',
                url: 'https://example.com',
                headers: [],
                bodyType: 'none',
                body: '',
              },
            });
          }

          const history = getHistory();

          // Every consecutive pair must be in descending timestamp order
          for (let i = 0; i < history.length - 1; i++) {
            expect(history[i].timestamp).toBeGreaterThanOrEqual(history[i + 1].timestamp);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});


/**
 * Property 5: 历史记录最大条数限制
 * **Validates: Requirements 4.6**
 *
 * For any number of history write operations, getHistory should always return
 * a list of length <= 100; when exceeded, the oldest records should be removed.
 */
describe('Property-Based Tests: 历史记录最大条数限制 (Property 5)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('getHistory never returns more than 100 entries regardless of how many are saved', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 101, max: 200 }),
        (totalEntries) => {
          localStorage.clear();

          for (let i = 0; i < totalEntries; i++) {
            saveToHistory({
              id: `entry-${i}`,
              timestamp: i,
              request: {
                method: 'GET',
                url: 'https://example.com',
                headers: [],
                bodyType: 'none',
                body: '',
              },
            });
          }

          const history = getHistory();
          expect(history.length).toBeLessThanOrEqual(100);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('oldest entries (lowest timestamps) are removed when exceeding 100', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 101, max: 200 }),
        (totalEntries) => {
          localStorage.clear();

          // Save entries with strictly increasing timestamps so timestamp === index
          for (let i = 0; i < totalEntries; i++) {
            saveToHistory({
              id: `entry-${i}`,
              timestamp: i,
              request: {
                method: 'GET',
                url: 'https://example.com',
                headers: [],
                bodyType: 'none',
                body: '',
              },
            });
          }

          const history = getHistory();

          // Length must be exactly 100
          expect(history).toHaveLength(100);

          // The kept entries should be the 100 most recent (highest timestamps)
          const keptTimestamps = history.map((e) => e.timestamp);
          const minKept = Math.min(...keptTimestamps);

          // The minimum kept timestamp should be totalEntries - 100
          // (entries 0..totalEntries-101 were dropped)
          expect(minKept).toBe(totalEntries - 100);

          // No entry with timestamp < totalEntries - 100 should exist
          for (const entry of history) {
            expect(entry.timestamp).toBeGreaterThanOrEqual(totalEntries - 100);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
