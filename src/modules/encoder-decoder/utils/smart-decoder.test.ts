import { describe, expect, it } from 'vitest';
import { smartDecode } from './smart-decoder';

describe('smartDecode', () => {
  it('decodes obvious base64 segments in text', () => {
    const input = 'token=SGVsbG8gV29ybGQh';
    const result = smartDecode(input, {
      decodeUrl: false,
      decodeUnicode: false,
      decodeHtml: false,
      decodeHex: false,
      decodeBase64: true,
      maxIterations: 1,
    });

    expect(result.success).toBe(true);
    expect(result.result).toContain('Hello World!');
    expect(result.matches.some(match => match.type === 'Base64')).toBe(true);
  });

  it('does not decode plain english words that are not intended as base64', () => {
    const input = 'password';
    const result = smartDecode(input, {
      decodeUrl: false,
      decodeUnicode: false,
      decodeHtml: false,
      decodeHex: false,
      decodeBase64: true,
      maxIterations: 1,
    });

    expect(result.success).toBe(true);
    expect(result.result).toBe(input);
    expect(result.matches.some(match => match.type === 'Base64')).toBe(false);
  });

  it('tracks repeated URL-encoded segments as separate matches', () => {
    const input = 'a=%41&b=%41';
    const result = smartDecode(input, {
      decodeUrl: true,
      decodeUnicode: false,
      decodeHtml: false,
      decodeHex: false,
      decodeBase64: false,
      maxIterations: 1,
    });

    expect(result.success).toBe(true);
    expect(result.result).toBe('a=A&b=A');

    const urlMatches = result.matches.filter(match => match.type === 'URL');
    expect(urlMatches).toHaveLength(2);
    expect(urlMatches[0].original).toBe('%41');
    expect(urlMatches[1].original).toBe('%41');
  });

  it('tracks Unicode and Hex matches with precise ranges', () => {
    const input = 'x=\\u0041 y=\\u0042 z=\\x43';
    const result = smartDecode(input, {
      decodeUrl: false,
      decodeUnicode: true,
      decodeHtml: false,
      decodeHex: true,
      decodeBase64: false,
      maxIterations: 1,
    });

    expect(result.success).toBe(true);
    expect(result.result).toBe('x=A y=B z=C');

    const unicodeMatches = result.matches.filter(match => match.type === 'Unicode');
    const hexMatches = result.matches.filter(match => match.type === 'Hex');

    expect(unicodeMatches).toHaveLength(2);
    expect(hexMatches).toHaveLength(1);

    for (const match of [...unicodeMatches, ...hexMatches]) {
      expect(match.start).toBeGreaterThanOrEqual(0);
      expect(match.end).toBeGreaterThan(match.start);
      expect(match.end - match.start).toBe(match.original.length);
    }
  });

  it('decodes HTML entities per match and supports nested entity decoding', () => {
    const input = 'a=&lt; b=&amp;lt; c=&amp;';
    const result = smartDecode(input, {
      decodeUrl: false,
      decodeUnicode: false,
      decodeHtml: true,
      decodeHex: false,
      decodeBase64: false,
      maxIterations: 2,
    });

    expect(result.success).toBe(true);
    expect(result.result).toBe('a=< b=< c=&');

    const htmlMatches = result.matches.filter(match => match.type === 'HTML');
    expect(htmlMatches.length).toBeGreaterThanOrEqual(4);
    expect(htmlMatches.some(match => match.original === '&amp;')).toBe(true);
    expect(htmlMatches.some(match => match.original === '&lt;')).toBe(true);
  });
});
