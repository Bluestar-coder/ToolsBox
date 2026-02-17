import { describe, it, expect } from 'vitest';
import { convertIPv4, convertIPv6 } from '../ip-converter';

describe('convertIPv4', () => {
  it('converts dotted decimal input', () => {
    const result = convertIPv4('192.168.1.1');
    expect(result.dotted).toBe('192.168.1.1');
    expect(result.hex).toBe('C0A80101');
    expect(result.hexDotted).toBe('0xC0.0xA8.0x01.0x01');
    expect(result.binary).toBe('11000000.10101000.00000001.00000001');
    expect(result.integer).toBe(3232235777);
  });

  it('converts hex input', () => {
    const result = convertIPv4('C0A80101');
    expect(result.dotted).toBe('192.168.1.1');
    expect(result.integer).toBe(3232235777);
  });

  it('converts hex input with 0x prefix', () => {
    const result = convertIPv4('0xC0A80101');
    expect(result.dotted).toBe('192.168.1.1');
  });

  it('converts dotted hex input', () => {
    const result = convertIPv4('0xC0.0xA8.0x01.0x01');
    expect(result.dotted).toBe('192.168.1.1');
  });

  it('converts binary input with dots', () => {
    const result = convertIPv4('11000000.10101000.00000001.00000001');
    expect(result.dotted).toBe('192.168.1.1');
    expect(result.integer).toBe(3232235777);
  });

  it('converts binary input without dots', () => {
    const result = convertIPv4('11000000101010000000000100000001');
    expect(result.dotted).toBe('192.168.1.1');
  });

  it('converts integer input', () => {
    const result = convertIPv4('3232235777');
    expect(result.dotted).toBe('192.168.1.1');
    expect(result.hex).toBe('C0A80101');
  });

  it('handles 0.0.0.0', () => {
    const result = convertIPv4('0.0.0.0');
    expect(result.integer).toBe(0);
    expect(result.hex).toBe('00000000');
  });

  it('handles 255.255.255.255', () => {
    const result = convertIPv4('255.255.255.255');
    expect(result.integer).toBe(4294967295);
    expect(result.hex).toBe('FFFFFFFF');
  });

  it('handles integer 0', () => {
    const result = convertIPv4('0');
    expect(result.dotted).toBe('0.0.0.0');
  });

  it('throws on empty input', () => {
    expect(() => convertIPv4('')).toThrow('Input cannot be empty');
  });

  it('throws on invalid input', () => {
    expect(() => convertIPv4('not-an-ip')).toThrow('Cannot parse');
  });

  it('throws on IPv6 input', () => {
    expect(() => convertIPv4('2001:db8::1')).toThrow('IPv6');
  });
});

describe('convertIPv6', () => {
  it('converts full IPv6 address', () => {
    const result = convertIPv6('2001:0db8:0000:0000:0000:0000:0000:0001');
    expect(result.full).toBe('2001:0db8:0000:0000:0000:0000:0000:0001');
    expect(result.compressed).toBe('2001:db8::1');
    expect(result.binary).toHaveLength(128);
  });

  it('converts compressed IPv6 address', () => {
    const result = convertIPv6('2001:db8::1');
    expect(result.full).toBe('2001:0db8:0000:0000:0000:0000:0000:0001');
    expect(result.compressed).toBe('2001:db8::1');
  });

  it('handles :: (all zeros)', () => {
    const result = convertIPv6('::');
    expect(result.full).toBe('0000:0000:0000:0000:0000:0000:0000:0000');
    expect(result.compressed).toBe('::');
    expect(result.binary).toBe('0'.repeat(128));
  });

  it('handles ::1 (loopback)', () => {
    const result = convertIPv6('::1');
    expect(result.full).toBe('0000:0000:0000:0000:0000:0000:0000:0001');
    expect(result.compressed).toBe('::1');
  });

  it('throws on empty input', () => {
    expect(() => convertIPv6('')).toThrow('Input cannot be empty');
  });

  it('throws on IPv4 input', () => {
    expect(() => convertIPv6('192.168.1.1')).toThrow('not a valid IPv6');
  });

  it('throws on invalid input', () => {
    expect(() => convertIPv6('not-an-ip')).toThrow('not a valid IPv6');
  });
});

// Feature: ip-network-tool, Property 1: IPv4 格式转换往返一致性
import * as fc from 'fast-check';
import { detectIpFormat } from '../ip-utils';
import { integerToIPv4Formats } from '../ip-utils';

describe('Property 1: IPv4 round-trip conversion', () => {
  /**
   * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.7**
   *
   * For any valid 32-bit unsigned integer (0 ~ 4294967295), convert it to
   * IPv4 dotted/hex/binary/integer formats, then parse each back via
   * convertIPv4. The resulting integer field should equal the original.
   * Additionally, detectIpFormat should correctly identify each format.
   */

  const ipv4Integer = fc.integer({ min: 0, max: 4294967295 });

  it('round-trips through dotted decimal format', () => {
    fc.assert(
      fc.property(ipv4Integer, (num) => {
        const formats = integerToIPv4Formats(num);
        const result = convertIPv4(formats.dotted);
        expect(result.integer).toBe(num);
        expect(detectIpFormat(formats.dotted)).toBe('dotted');
      }),
      { numRuns: 100 },
    );
  });

  it('round-trips through hexDotted format', () => {
    fc.assert(
      fc.property(ipv4Integer, (num) => {
        const formats = integerToIPv4Formats(num);
        // hexDotted (e.g. "0xC0.0xA8.0x01.0x01") is unambiguous hex
        const result = convertIPv4(formats.hexDotted);
        expect(result.integer).toBe(num);
        expect(detectIpFormat(formats.hexDotted)).toBe('hex');
      }),
      { numRuns: 100 },
    );
  });

  it('round-trips through 0x-prefixed hex format', () => {
    fc.assert(
      fc.property(ipv4Integer, (num) => {
        const formats = integerToIPv4Formats(num);
        // Prefix with 0x to make hex unambiguous
        const hexWithPrefix = '0x' + formats.hex;
        const result = convertIPv4(hexWithPrefix);
        expect(result.integer).toBe(num);
        expect(detectIpFormat(hexWithPrefix)).toBe('hex');
      }),
      { numRuns: 100 },
    );
  });

  it('round-trips through binary format', () => {
    fc.assert(
      fc.property(ipv4Integer, (num) => {
        const formats = integerToIPv4Formats(num);
        const result = convertIPv4(formats.binary);
        expect(result.integer).toBe(num);
        expect(detectIpFormat(formats.binary)).toBe('binary');
      }),
      { numRuns: 100 },
    );
  });

  it('round-trips through integer format', () => {
    fc.assert(
      fc.property(ipv4Integer, (num) => {
        const formats = integerToIPv4Formats(num);
        const result = convertIPv4(String(formats.integer));
        expect(result.integer).toBe(num);
        // Note: pure-digit integers that also happen to be valid hex (no a-f letters)
        // will be detected as 'integer' by detectIpFormat, which is correct behavior
        const detected = detectIpFormat(String(formats.integer));
        expect(['integer', 'dotted']).toContain(detected);
      }),
      { numRuns: 100 },
    );
  });
});

// Feature: ip-network-tool, Property 2: IPv6 格式转换往返一致性
import { bigintToIPv6Formats } from '../ip-utils';

describe('Property 2: IPv6 round-trip conversion', () => {
  /**
   * **Validates: Requirements 1.5**
   *
   * For any valid 128-bit unsigned integer (0 ~ 2^128-1), convert it to
   * IPv6 compressed form, then parse it back via convertIPv6. The resulting
   * full form and binary representation should match those obtained by
   * directly converting from the original integer.
   */

  const ipv6Integer = fc.bigInt({ min: 0n, max: (1n << 128n) - 1n });

  it('round-trips through compressed IPv6 form', () => {
    fc.assert(
      fc.property(ipv6Integer, (num) => {
        // Convert integer directly to IPv6 formats
        const directFormats = bigintToIPv6Formats(num);

        // Round-trip: compressed → convertIPv6 → formats
        const roundTripped = convertIPv6(directFormats.compressed);

        // Full form should match
        expect(roundTripped.full).toBe(directFormats.full);
        // Binary representation should match
        expect(roundTripped.binary).toBe(directFormats.binary);
      }),
      { numRuns: 100 },
    );
  });
});
