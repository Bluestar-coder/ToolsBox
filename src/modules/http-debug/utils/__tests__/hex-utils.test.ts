import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { hexToArrayBuffer, arrayBufferToHex } from '../validators';

/**
 * Property 7: Hex 与 ArrayBuffer 往返转换
 * **Validates: Requirements 7.2**
 *
 * For any valid even-length hex string, hexToArrayBuffer followed by
 * arrayBufferToHex should return the original string (case-insensitive).
 */

/** Arbitrary: valid even-length hex string (1–64 bytes, i.e. 2–128 hex chars) */
const validHexString = fc
  .array(fc.integer({ min: 0, max: 255 }), { minLength: 1, maxLength: 64 })
  .map((bytes) => bytes.map((b) => b.toString(16).padStart(2, '0')).join(''));

/** Arbitrary: valid even-length hex string with mixed case */
const validHexStringMixedCase = fc
  .array(
    fc.tuple(
      fc.integer({ min: 0, max: 255 }),
      fc.boolean(), // true = uppercase, false = lowercase
    ),
    { minLength: 1, maxLength: 64 },
  )
  .map((pairs) =>
    pairs
      .map(([b, upper]) => {
        const hex = b.toString(16).padStart(2, '0');
        return upper ? hex.toUpperCase() : hex.toLowerCase();
      })
      .join(''),
  );

describe('Property-Based Tests: Hex 与 ArrayBuffer 往返转换 (Property 7)', () => {
  it('roundtrips any valid even-length hex string (lowercase)', () => {
    fc.assert(
      fc.property(validHexString, (hex) => {
        const buffer = hexToArrayBuffer(hex);
        const result = arrayBufferToHex(buffer);
        expect(result.toLowerCase()).toBe(hex.toLowerCase());
      }),
      { numRuns: 100 },
    );
  });

  it('roundtrips any valid even-length hex string with mixed case', () => {
    fc.assert(
      fc.property(validHexStringMixedCase, (hex) => {
        const buffer = hexToArrayBuffer(hex);
        const result = arrayBufferToHex(buffer);
        expect(result.toLowerCase()).toBe(hex.toLowerCase());
      }),
      { numRuns: 100 },
    );
  });
});
