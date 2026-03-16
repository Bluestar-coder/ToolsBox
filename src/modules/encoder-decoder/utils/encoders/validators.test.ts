import { describe, expect, it } from 'vitest';
import {
  validateBase32HexInput,
  validateBase32Input,
  validateBase58Input,
  validateBase62Input,
  validateBase64Input,
  validateBase91Input,
  validateHexInput,
  validateJsonInput,
  validateUrlInput,
  validateUtf16HexInput,
  validateUtf32HexInput,
  validateUtf8HexInput,
} from './validators';

describe('encoder validators', () => {
  it('validates base and hex families', () => {
    expect(validateBase64Input('dGVzdA==')).toBe(true);
    expect(validateBase64Input('bad*value')).toBe(false);

    expect(validateBase32Input('MFRGG===')).toBe(true);
    expect(validateBase32Input('base32!')).toBe(false);

    expect(validateBase32HexInput('CPNMU===')).toBe(true);
    expect(validateBase32HexInput('xyz!')).toBe(false);

    expect(validateHexInput('48656c6c6f')).toBe(true);
    expect(validateHexInput('486')).toBe(false);
    expect(validateHexInput('zz')).toBe(false);

    expect(validateBase58Input('JxF12TrwUP45BMd')).toBe(true);
    expect(validateBase58Input('0OIl')).toBe(false);

    expect(validateBase62Input('abcXYZ123')).toBe(true);
    expect(validateBase62Input('abc-123')).toBe(false);

    expect(validateBase91Input('AB!~')).toBe(true);
    expect(validateBase91Input('含中文')).toBe(false);
  });

  it('validates url, json and utf hex helpers', () => {
    expect(validateUrlInput('https%3A%2F%2Fexample.com%2Fa+b')).toBe(true);
    expect(validateUrlInput('%E0%A4%A')).toBe(false);

    expect(validateJsonInput('{"a":1}')).toBe(true);
    expect(validateJsonInput('{bad')).toBe(false);

    expect(validateUtf8HexInput('e4 b8 ad')).toBe(true);
    expect(validateUtf8HexInput('e4b')).toBe(false);
    expect(validateUtf8HexInput('gg')).toBe(false);

    expect(validateUtf16HexInput('4f60 597d')).toBe(true);
    expect(validateUtf16HexInput('4f6')).toBe(false);

    expect(validateUtf32HexInput('00004f60')).toBe(true);
    expect(validateUtf32HexInput('00004f')).toBe(false);
  });
});
