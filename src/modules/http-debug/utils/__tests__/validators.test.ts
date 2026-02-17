import { describe, it, expect } from 'vitest';
import {
  isValidHttpUrl,
  isValidWsUrl,
  isValidHexString,
  hexToArrayBuffer,
  arrayBufferToHex,
} from '../validators';

describe('isValidHttpUrl', () => {
  it('returns true for valid http URLs', () => {
    expect(isValidHttpUrl('http://example.com')).toBe(true);
    expect(isValidHttpUrl('http://localhost')).toBe(true);
    expect(isValidHttpUrl('http://localhost:8080')).toBe(true);
    expect(isValidHttpUrl('http://192.168.1.1')).toBe(true);
    expect(isValidHttpUrl('http://example.com/path?q=1')).toBe(true);
  });

  it('returns true for valid https URLs', () => {
    expect(isValidHttpUrl('https://example.com')).toBe(true);
    expect(isValidHttpUrl('https://sub.example.com:443/api')).toBe(true);
  });

  it('returns false for ws/wss URLs', () => {
    expect(isValidHttpUrl('ws://example.com')).toBe(false);
    expect(isValidHttpUrl('wss://example.com')).toBe(false);
  });

  it('returns false for invalid inputs', () => {
    expect(isValidHttpUrl('')).toBe(false);
    expect(isValidHttpUrl('not-a-url')).toBe(false);
    expect(isValidHttpUrl('ftp://example.com')).toBe(false);
    expect(isValidHttpUrl('http://')).toBe(false);
    expect(isValidHttpUrl('://example.com')).toBe(false);
  });
});

describe('isValidWsUrl', () => {
  it('returns true for valid ws URLs', () => {
    expect(isValidWsUrl('ws://example.com')).toBe(true);
    expect(isValidWsUrl('ws://localhost:8080')).toBe(true);
    expect(isValidWsUrl('ws://192.168.1.1/ws')).toBe(true);
  });

  it('returns true for valid wss URLs', () => {
    expect(isValidWsUrl('wss://example.com')).toBe(true);
    expect(isValidWsUrl('wss://example.com:443/socket')).toBe(true);
  });

  it('returns false for http/https URLs', () => {
    expect(isValidWsUrl('http://example.com')).toBe(false);
    expect(isValidWsUrl('https://example.com')).toBe(false);
  });

  it('returns false for invalid inputs', () => {
    expect(isValidWsUrl('')).toBe(false);
    expect(isValidWsUrl('not-a-url')).toBe(false);
    expect(isValidWsUrl('ws://')).toBe(false);
  });
});

describe('isValidHexString', () => {
  it('returns true for valid even-length hex strings', () => {
    expect(isValidHexString('00')).toBe(true);
    expect(isValidHexString('ff')).toBe(true);
    expect(isValidHexString('FF')).toBe(true);
    expect(isValidHexString('48656c6c6f')).toBe(true);
    expect(isValidHexString('0123456789abcdefABCDEF')).toBe(true);
  });

  it('returns false for odd-length hex strings', () => {
    expect(isValidHexString('0')).toBe(false);
    expect(isValidHexString('abc')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isValidHexString('')).toBe(false);
  });

  it('returns false for non-hex characters', () => {
    expect(isValidHexString('gg')).toBe(false);
    expect(isValidHexString('zz')).toBe(false);
    expect(isValidHexString('0x00')).toBe(false);
  });
});

describe('hexToArrayBuffer', () => {
  it('converts hex string to correct ArrayBuffer', () => {
    const buf = hexToArrayBuffer('48656c6c6f');
    const bytes = new Uint8Array(buf);
    expect(Array.from(bytes)).toEqual([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
  });

  it('converts single byte', () => {
    const buf = hexToArrayBuffer('ff');
    expect(new Uint8Array(buf)[0]).toBe(255);
  });

  it('converts empty-like minimal hex', () => {
    const buf = hexToArrayBuffer('00');
    expect(new Uint8Array(buf)[0]).toBe(0);
  });
});

describe('arrayBufferToHex', () => {
  it('converts ArrayBuffer to lowercase hex string', () => {
    const buf = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]).buffer;
    expect(arrayBufferToHex(buf)).toBe('48656c6c6f');
  });

  it('pads single-digit hex values with leading zero', () => {
    const buf = new Uint8Array([0x00, 0x0a, 0x0f]).buffer;
    expect(arrayBufferToHex(buf)).toBe('000a0f');
  });

  it('handles empty ArrayBuffer', () => {
    const buf = new ArrayBuffer(0);
    expect(arrayBufferToHex(buf)).toBe('');
  });
});

describe('hexToArrayBuffer / arrayBufferToHex roundtrip', () => {
  it('roundtrips correctly', () => {
    const original = '48656c6c6f576f726c64';
    const buf = hexToArrayBuffer(original);
    const result = arrayBufferToHex(buf);
    expect(result).toBe(original.toLowerCase());
  });
});

import fc from 'fast-check';

/**
 * Property 2: URL 验证正确性
 * **Validates: Requirements 1.6, 6.6**
 *
 * For any string, isValidHttpUrl should only return true for URLs starting with
 * http:// or https:// with valid hostname; isValidWsUrl should only return true
 * for URLs starting with ws:// or wss:// with valid hostname; all other inputs
 * should return false.
 */

/**
 * Arbitrary: valid hostname.
 * Each segment starts with a letter to avoid purely-numeric segments that the
 * URL parser may reject as invalid IP address octets (e.g. "08", "a.0").
 */
const letterChar = fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split(''));
const alphanumChar = fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split(''));
const hostnameSegment = fc
  .tuple(
    letterChar,
    fc.array(alphanumChar, { minLength: 0, maxLength: 9 }),
  )
  .map(([first, rest]) => first + rest.join(''));
const validHostname = fc
  .array(hostnameSegment, { minLength: 1, maxLength: 3 })
  .map((parts) => parts.join('.'));

/** Arbitrary: optional port */
const optionalPort = fc.option(fc.integer({ min: 1, max: 65535 }), { nil: undefined });

/** Arbitrary: optional path */
const pathChar = fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789-_'.split(''));
const pathSegment = fc
  .array(pathChar, { minLength: 1, maxLength: 8 })
  .map((chars) => chars.join(''));
const optionalPath = fc.option(
  fc
    .array(pathSegment, { minLength: 1, maxLength: 3 })
    .map((segs) => '/' + segs.join('/')),
  { nil: undefined },
);

/** Build a URL string from protocol, hostname, optional port, optional path */
function buildUrl(
  protocol: string,
  hostname: string,
  port: number | undefined,
  path: string | undefined,
): string {
  let url = `${protocol}${hostname}`;
  if (port !== undefined) url += `:${port}`;
  if (path !== undefined) url += path;
  return url;
}

describe('Property-Based Tests: URL 验证正确性 (Property 2)', () => {
  describe('isValidHttpUrl', () => {
    it('returns true for any well-formed http:// URL with valid hostname', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('http://'),
          validHostname,
          optionalPort,
          optionalPath,
          (protocol, hostname, port, path) => {
            const url = buildUrl(protocol, hostname, port, path);
            expect(isValidHttpUrl(url)).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('returns true for any well-formed https:// URL with valid hostname', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('https://'),
          validHostname,
          optionalPort,
          optionalPath,
          (protocol, hostname, port, path) => {
            const url = buildUrl(protocol, hostname, port, path);
            expect(isValidHttpUrl(url)).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('returns false for any URL with non-http/https protocol', () => {
      const nonHttpProtocol = fc.constantFrom(
        'ftp://',
        'ws://',
        'wss://',
        'file://',
        'ssh://',
        'mailto:',
        'data:',
      );
      fc.assert(
        fc.property(
          nonHttpProtocol,
          validHostname,
          optionalPort,
          optionalPath,
          (protocol, hostname, port, path) => {
            const url = buildUrl(protocol, hostname, port, path);
            expect(isValidHttpUrl(url)).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('returns false for arbitrary non-URL strings', () => {
      const nonUrlString = fc
        .string({ minLength: 0, maxLength: 50 })
        .filter((s) => !s.startsWith('http://') && !s.startsWith('https://'));
      fc.assert(
        fc.property(nonUrlString, (s) => {
          expect(isValidHttpUrl(s)).toBe(false);
        }),
        { numRuns: 100 },
      );
    });
  });

  describe('isValidWsUrl', () => {
    it('returns true for any well-formed ws:// URL with valid hostname', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('ws://'),
          validHostname,
          optionalPort,
          optionalPath,
          (protocol, hostname, port, path) => {
            const url = buildUrl(protocol, hostname, port, path);
            expect(isValidWsUrl(url)).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('returns true for any well-formed wss:// URL with valid hostname', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('wss://'),
          validHostname,
          optionalPort,
          optionalPath,
          (protocol, hostname, port, path) => {
            const url = buildUrl(protocol, hostname, port, path);
            expect(isValidWsUrl(url)).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('returns false for any URL with non-ws/wss protocol', () => {
      const nonWsProtocol = fc.constantFrom(
        'http://',
        'https://',
        'ftp://',
        'file://',
        'ssh://',
        'mailto:',
        'data:',
      );
      fc.assert(
        fc.property(
          nonWsProtocol,
          validHostname,
          optionalPort,
          optionalPath,
          (protocol, hostname, port, path) => {
            const url = buildUrl(protocol, hostname, port, path);
            expect(isValidWsUrl(url)).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('returns false for arbitrary non-URL strings', () => {
      const nonWsString = fc
        .string({ minLength: 0, maxLength: 50 })
        .filter((s) => !s.startsWith('ws://') && !s.startsWith('wss://'));
      fc.assert(
        fc.property(nonWsString, (s) => {
          expect(isValidWsUrl(s)).toBe(false);
        }),
        { numRuns: 100 },
      );
    });
  });
});
