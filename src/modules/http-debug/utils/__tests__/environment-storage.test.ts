import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import {
  saveEnvironments,
  loadEnvironments,
  saveActiveEnvId,
  loadActiveEnvId,
} from '../variable-engine';
import type { Environment, KeyValuePair } from '../types';

/**
 * Property 6: 环境变量持久化往返
 * **Validates: Requirements 3.5**
 *
 * For any valid Environment object, saving it to localStorage and then
 * reading it back should yield an equivalent object.
 */

/** Arbitrary: non-empty printable string for ids and names */
const nonEmptyString = fc.string({ minLength: 1, maxLength: 30 });

/** Arbitrary: KeyValuePair */
const arbKeyValuePair: fc.Arbitrary<KeyValuePair> = fc.record({
  key: fc.string({ minLength: 0, maxLength: 20 }),
  value: fc.string({ minLength: 0, maxLength: 50 }),
  enabled: fc.boolean(),
});

/** Arbitrary: Environment */
const arbEnvironment: fc.Arbitrary<Environment> = fc.record({
  id: nonEmptyString,
  name: nonEmptyString,
  variables: fc.array(arbKeyValuePair, { minLength: 0, maxLength: 10 }),
});

/** Arbitrary: Environment[] */
const arbEnvironments: fc.Arbitrary<Environment[]> = fc.array(arbEnvironment, {
  minLength: 0,
  maxLength: 10,
});

describe('Property-Based Tests: 环境变量持久化往返 (Property 6)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saveEnvironments then loadEnvironments yields equivalent array', () => {
    fc.assert(
      fc.property(arbEnvironments, (envs) => {
        saveEnvironments(envs);
        const loaded = loadEnvironments();
        expect(loaded).toEqual(envs);
      }),
      { numRuns: 100 },
    );
  });

  it('saveActiveEnvId then loadActiveEnvId yields the same id', () => {
    fc.assert(
      fc.property(nonEmptyString, (id) => {
        saveActiveEnvId(id);
        const loaded = loadActiveEnvId();
        expect(loaded).toBe(id);
      }),
      { numRuns: 100 },
    );
  });

  it('saveActiveEnvId(null) then loadActiveEnvId yields null', () => {
    // First set a value, then clear it
    saveActiveEnvId('some-id');
    saveActiveEnvId(null);
    const loaded = loadActiveEnvId();
    expect(loaded).toBeNull();
  });

  it('loadEnvironments returns empty array when nothing is saved', () => {
    const loaded = loadEnvironments();
    expect(loaded).toEqual([]);
  });

  it('loadActiveEnvId returns null when nothing is saved', () => {
    const loaded = loadActiveEnvId();
    expect(loaded).toBeNull();
  });

  it('overwriting environments replaces previous data', () => {
    fc.assert(
      fc.property(arbEnvironments, arbEnvironments, (first, second) => {
        saveEnvironments(first);
        saveEnvironments(second);
        const loaded = loadEnvironments();
        expect(loaded).toEqual(second);
      }),
      { numRuns: 100 },
    );
  });
});
