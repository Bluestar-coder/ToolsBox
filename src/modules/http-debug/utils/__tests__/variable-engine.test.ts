import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { replaceVariables } from '../variable-engine';
import type { KeyValuePair } from '../types';

/**
 * Property 1: 变量替换正确性
 * **Validates: Requirements 3.2, 3.3**
 *
 * For any template string and any set of defined environment variables,
 * replaceVariables should replace all matching {{variableName}} placeholders
 * with corresponding variable values; for placeholders referencing undefined
 * variables, the original placeholder text should be preserved.
 * Disabled variables should also be preserved as-is.
 */

/** Arbitrary: valid variable name (matches \w+ pattern used by the engine) */
const varName = fc
  .tuple(
    fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_'.split('')),
    fc.array(
      fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_'.split('')),
      { minLength: 0, maxLength: 10 },
    ),
  )
  .map(([first, rest]) => first + rest.join(''));

/** Arbitrary: a string value that does not contain {{ to avoid nested placeholders */
const safeValue = fc
  .string({ minLength: 0, maxLength: 30 })
  .map((s) => s.replace(/\{\{/g, '').replace(/\}\}/g, ''));

/** Arbitrary: literal text segment (no {{ or }}) */
const literalSegment = fc
  .string({ minLength: 0, maxLength: 20 })
  .map((s) => s.replace(/\{\{/g, '').replace(/\}\}/g, ''));

describe('Property-Based Tests: 变量替换正确性 (Property 1)', () => {
  it('replaces all enabled+defined variable placeholders with their values', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.tuple(varName, safeValue),
          { minLength: 1, maxLength: 5 },
        ),
        literalSegment,
        (pairs, prefix) => {
          // Deduplicate variable names
          const uniqueMap = new Map(pairs);
          const variables: KeyValuePair[] = [...uniqueMap].map(([key, value]) => ({
            key,
            value,
            enabled: true,
          }));

          // Build a template that uses each variable once
          const template = prefix + variables.map((v) => `{{${v.key}}}`).join('');
          const result = replaceVariables(template, variables);

          // The result should contain each variable's value, not the placeholder
          const expected = prefix + variables.map((v) => v.value).join('');
          expect(result).toBe(expected);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('preserves placeholders for undefined variables', () => {
    fc.assert(
      fc.property(
        varName,
        literalSegment,
        (undefinedVar, prefix) => {
          const template = `${prefix}{{${undefinedVar}}}`;
          // Pass empty variables array — no variables defined
          const result = replaceVariables(template, []);
          expect(result).toBe(template);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('does NOT replace disabled variable placeholders (preserves as-is)', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.tuple(varName, safeValue),
          { minLength: 1, maxLength: 5 },
        ),
        literalSegment,
        (pairs, prefix) => {
          const uniqueMap = new Map(pairs);
          const variables: KeyValuePair[] = [...uniqueMap].map(([key, value]) => ({
            key,
            value,
            enabled: false, // all disabled
          }));

          const template = prefix + variables.map((v) => `{{${v.key}}}`).join('');
          const result = replaceVariables(template, variables);

          // Disabled variables should be preserved — output equals input
          expect(result).toBe(template);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('replaces enabled variables and preserves disabled ones in the same template', () => {
    fc.assert(
      fc.property(
        fc.tuple(varName, safeValue),
        fc.tuple(varName, safeValue),
        literalSegment,
        ([enabledName, enabledValue], [disabledName, disabledValue], prefix) => {
          // Ensure distinct variable names
          fc.pre(enabledName !== disabledName);

          const variables: KeyValuePair[] = [
            { key: enabledName, value: enabledValue, enabled: true },
            { key: disabledName, value: disabledValue, enabled: false },
          ];

          const template = `${prefix}{{${enabledName}}}{{${disabledName}}}`;
          const result = replaceVariables(template, variables);

          const expected = `${prefix}${enabledValue}{{${disabledName}}}`;
          expect(result).toBe(expected);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('leaves template unchanged when it contains no placeholders', () => {
    fc.assert(
      fc.property(
        literalSegment,
        fc.array(
          fc.tuple(varName, safeValue),
          { minLength: 0, maxLength: 5 },
        ),
        (template, pairs) => {
          const variables: KeyValuePair[] = pairs.map(([key, value]) => ({
            key,
            value,
            enabled: true,
          }));
          const result = replaceVariables(template, variables);
          expect(result).toBe(template);
        },
      ),
      { numRuns: 100 },
    );
  });
});
