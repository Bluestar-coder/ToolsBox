import { describe, expect, it } from 'vitest';
import {
  utf16BEDecode,
  utf16BEEncode,
  utf16LEDecode,
  utf16LEEncode,
  utf32BEDecode,
  utf32BEEncode,
  utf32LEDecode,
  utf32LEEncode,
  utf7Decode,
  utf7Encode,
  utf8Decode,
  utf8Encode,
} from './utf-family';

describe('utf-family encoders', () => {
  it('round-trips utf7 and utf8 values', () => {
    expect(utf7Encode('Hello+你好')).toEqual({ success: true, result: 'Hello+-+T2BZfQ-' });
    expect(utf7Decode('Hello+-+T2BZfQ-')).toEqual({ success: true, result: 'Hello+你好' });

    expect(utf8Encode('Hi')).toEqual({ success: true, result: '48 69' });
    expect(utf8Decode('48 69')).toEqual({ success: true, result: 'Hi' });
  });

  it('round-trips utf16 and utf32 in both endian formats', () => {
    expect(utf16BEEncode('Hi')).toEqual({ success: true, result: '0048 0069' });
    expect(utf16BEDecode('0048 0069')).toEqual({ success: true, result: 'Hi' });

    expect(utf16LEEncode('Hi')).toEqual({ success: true, result: '4800 6900' });
    expect(utf16LEDecode('4800 6900')).toEqual({ success: true, result: 'Hi' });

    expect(utf32BEEncode('A😀')).toEqual({ success: true, result: '00000041 0001f600' });
    expect(utf32BEDecode('00000041 0001f600')).toEqual({ success: true, result: 'A😀' });

    expect(utf32LEEncode('A😀')).toEqual({ success: true, result: '41000000 00f60100' });
    expect(utf32LEDecode('41000000 00f60100')).toEqual({ success: true, result: 'A😀' });
  });

  it('returns failures for clearly invalid utf decode inputs', () => {
    expect(utf32BEDecode('FFFFFFFF')).toMatchObject({ success: false });
    expect(utf32LEDecode('FFFFFFFF')).toMatchObject({ success: false });
  });
});
