import { describe, expect, it } from 'vitest';
import {
  asciiDecode,
  asciiEncode,
  executeEncodeDecode,
  getEncoderDisplayName,
  htmlDecode,
  htmlEncode,
  jsonDecode,
  jsonEncode,
  unicodeDecode,
  unicodeEncode,
  urlDecode,
  urlEncode,
  urlFormEncode,
} from './text-encoders';

describe('text encoders', () => {
  it('encodes and decodes url, form-url, html, json, unicode and ascii values', () => {
    expect(urlEncode('a b?c=1')).toEqual({ success: true, result: 'a%20b%3Fc%3D1' });
    expect(urlDecode('a+b%3Fc%3D1')).toEqual({ success: true, result: 'a b?c=1' });
    expect(urlFormEncode('a b')).toEqual({ success: true, result: 'a+b' });

    expect(htmlEncode('<div>&</div>')).toEqual({ success: true, result: '&lt;div&gt;&amp;&lt;/div&gt;' });
    expect(htmlDecode('&lt;div&gt;&amp;&lt;/div&gt;')).toEqual({ success: true, result: '<div>&</div>' });

    expect(jsonEncode('{"a":1}')).toMatchObject({ success: true });
    expect(jsonDecode('{"a":1}')).toMatchObject({ success: true });

    expect(unicodeEncode('你好')).toEqual({ success: true, result: '\\u4f60\\u597d' });
    expect(unicodeDecode('\\u4f60\\u597d')).toEqual({ success: true, result: '你好' });

    expect(asciiEncode('ABC')).toEqual({ success: true, result: '65 66 67' });
    expect(asciiDecode('65,66;67')).toEqual({ success: true, result: 'ABC' });
  });

  it('returns errors for invalid text-encoding inputs and unsupported types', () => {
    expect(jsonEncode('{bad')).toMatchObject({ success: false });
    expect(jsonDecode('{bad')).toMatchObject({ success: false });
    expect(urlDecode('%E0%A4%A')).toMatchObject({ success: false });
    expect(asciiEncode('你好')).toMatchObject({ success: false });
    expect(asciiDecode('999')).toMatchObject({ success: false });
    expect(executeEncodeDecode('value', 'invalid-type' as never, 'encode')).toMatchObject({ success: false });
  });

  it('routes executeEncodeDecode across text and utf families and exposes display names', () => {
    expect(executeEncodeDecode('hello world', 'url', 'encode')).toEqual({ success: true, result: 'hello%20world' });
    expect(executeEncodeDecode('<b>x</b>', 'html', 'encode')).toEqual({ success: true, result: '&lt;b&gt;x&lt;/b&gt;' });
    expect(executeEncodeDecode('hi', 'ascii', 'encode')).toEqual({ success: true, result: '104 105' });
    expect(executeEncodeDecode('0048 0069', 'utf16be', 'decode')).toEqual({ success: true, result: 'Hi' });
    expect(executeEncodeDecode('', 'base64', 'encode')).toEqual({ success: true, result: '' });

    expect(getEncoderDisplayName('base64')).toBe('Base64');
    expect(getEncoderDisplayName('utf32le')).toBe('UTF-32 LE');
    expect(getEncoderDisplayName('unknown' as never)).toBe('unknown');
  });
});
