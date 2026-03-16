import { describe, expect, it } from 'vitest';
import {
  base16Decode,
  base16Encode,
  base32Decode,
  base32Encode,
  base32HexDecode,
  base32HexEncode,
  base64Decode,
  base64Encode,
  base64UrlDecode,
  base64UrlEncode,
} from './base-family';

describe('base-family encoders', () => {
  it('round-trips base64, base32 and base32hex', () => {
    expect(base64Decode(base64Encode('Hello 世界').result)).toEqual({ success: true, result: 'Hello 世界' });
    expect(base32Decode(base32Encode('Hello世界').result)).toEqual({ success: true, result: 'Hello世界' });
    expect(base32HexDecode(base32HexEncode('Hello世界').result)).toEqual({ success: true, result: 'Hello世界' });
  });

  it('handles base16 and base64url conversions', () => {
    const base16 = base16Encode('Hi');
    expect(base16).toEqual({ success: true, result: '4869' });
    expect(base16Decode(base16.result)).toEqual({ success: true, result: 'Hi' });

    const base64url = base64UrlEncode('hello+/');
    expect(base64url.success).toBe(true);
    expect(base64url.result).not.toContain('=');
    expect(base64UrlDecode(base64url.result)).toEqual({ success: true, result: 'hello+/' });
  });

  it('returns errors for invalid decode inputs', () => {
    expect(base16Decode('GG')).toMatchObject({ success: false });
    expect(base32Decode('%%%')).toMatchObject({ success: false });
    expect(base32HexDecode('***')).toMatchObject({ success: false });
    expect(base64Decode('%')).toMatchObject({ success: false });
    expect(base64UrlDecode('%')).toMatchObject({ success: false });
  });
});
