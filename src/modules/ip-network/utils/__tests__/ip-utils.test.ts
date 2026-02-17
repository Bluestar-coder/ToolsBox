import { describe, it, expect } from 'vitest';
import {
  detectIpFormat,
  parseIPv4ToInteger,
  integerToIPv4Formats,
  isValidIPv4Integer,
  parseIPv6,
  bigintToIPv6Formats,
} from '../ip-utils';

describe('detectIpFormat', () => {
  it('detects dotted decimal', () => {
    expect(detectIpFormat('192.168.1.1')).toBe('dotted');
    expect(detectIpFormat('0.0.0.0')).toBe('dotted');
    expect(detectIpFormat('255.255.255.255')).toBe('dotted');
  });

  it('detects hex format', () => {
    expect(detectIpFormat('C0A80101')).toBe('hex');
    expect(detectIpFormat('0xC0A80101')).toBe('hex');
    expect(detectIpFormat('0xC0.0xA8.0x01.0x01')).toBe('hex');
    expect(detectIpFormat('0x00000000')).toBe('hex');
    expect(detectIpFormat('FFFFFFFF')).toBe('hex');
  });

  it('detects binary format', () => {
    expect(detectIpFormat('11000000101010000000000100000001')).toBe('binary');
    expect(detectIpFormat('11000000.10101000.00000001.00000001')).toBe('binary');
  });

  it('detects integer format', () => {
    expect(detectIpFormat('3232235777')).toBe('integer');
    expect(detectIpFormat('0')).toBe('integer');
    expect(detectIpFormat('4294967295')).toBe('integer');
  });

  it('detects IPv6 format', () => {
    expect(detectIpFormat('2001:0db8::1')).toBe('ipv6');
    expect(detectIpFormat('::1')).toBe('ipv6');
    expect(detectIpFormat('::')).toBe('ipv6');
    expect(detectIpFormat('fe80::1%eth0')).toBe('ipv6');
  });

  it('returns unknown for invalid input', () => {
    expect(detectIpFormat('')).toBe('unknown');
    expect(detectIpFormat('hello')).toBe('unknown');
    expect(detectIpFormat('999.999.999.999')).toBe('unknown');
    expect(detectIpFormat('ZZZZZZZZ')).toBe('unknown');
  });
});

describe('isValidIPv4Integer', () => {
  it('accepts valid range', () => {
    expect(isValidIPv4Integer(0)).toBe(true);
    expect(isValidIPv4Integer(4294967295)).toBe(true);
    expect(isValidIPv4Integer(3232235777)).toBe(true);
  });

  it('rejects out of range', () => {
    expect(isValidIPv4Integer(-1)).toBe(false);
    expect(isValidIPv4Integer(4294967296)).toBe(false);
    expect(isValidIPv4Integer(1.5)).toBe(false);
    expect(isValidIPv4Integer(NaN)).toBe(false);
  });
});

describe('parseIPv4ToInteger', () => {
  it('parses dotted decimal', () => {
    expect(parseIPv4ToInteger('192.168.1.1')).toBe(3232235777);
    expect(parseIPv4ToInteger('0.0.0.0')).toBe(0);
    expect(parseIPv4ToInteger('255.255.255.255')).toBe(4294967295);
  });

  it('parses hex', () => {
    expect(parseIPv4ToInteger('C0A80101')).toBe(3232235777);
    expect(parseIPv4ToInteger('0xC0A80101')).toBe(3232235777);
    expect(parseIPv4ToInteger('0xC0.0xA8.0x01.0x01')).toBe(3232235777);
  });

  it('parses binary', () => {
    expect(parseIPv4ToInteger('11000000101010000000000100000001')).toBe(3232235777);
    expect(parseIPv4ToInteger('11000000.10101000.00000001.00000001')).toBe(3232235777);
  });

  it('parses integer', () => {
    expect(parseIPv4ToInteger('3232235777')).toBe(3232235777);
    expect(parseIPv4ToInteger('0')).toBe(0);
  });

  it('throws on invalid input', () => {
    expect(() => parseIPv4ToInteger('hello')).toThrow();
    expect(() => parseIPv4ToInteger('2001:db8::1')).toThrow();
  });
});

describe('integerToIPv4Formats', () => {
  it('converts 192.168.1.1', () => {
    const result = integerToIPv4Formats(3232235777);
    expect(result.dotted).toBe('192.168.1.1');
    expect(result.hex).toBe('C0A80101');
    expect(result.hexDotted).toBe('0xC0.0xA8.0x01.0x01');
    expect(result.binary).toBe('11000000.10101000.00000001.00000001');
    expect(result.integer).toBe(3232235777);
  });

  it('converts 0.0.0.0', () => {
    const result = integerToIPv4Formats(0);
    expect(result.dotted).toBe('0.0.0.0');
    expect(result.hex).toBe('00000000');
    expect(result.integer).toBe(0);
  });

  it('converts 255.255.255.255', () => {
    const result = integerToIPv4Formats(4294967295);
    expect(result.dotted).toBe('255.255.255.255');
    expect(result.hex).toBe('FFFFFFFF');
    expect(result.integer).toBe(4294967295);
  });

  it('throws on invalid integer', () => {
    expect(() => integerToIPv4Formats(-1)).toThrow();
    expect(() => integerToIPv4Formats(4294967296)).toThrow();
  });
});

describe('parseIPv6', () => {
  it('parses full form', () => {
    expect(parseIPv6('2001:0db8:0000:0000:0000:0000:0000:0001')).toBe(
      0x20010db8000000000000000000000001n
    );
  });

  it('parses compressed form', () => {
    expect(parseIPv6('2001:db8::1')).toBe(0x20010db8000000000000000000000001n);
    expect(parseIPv6('::1')).toBe(1n);
    expect(parseIPv6('::')).toBe(0n);
  });

  it('parses all-ones', () => {
    expect(parseIPv6('ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff')).toBe(
      (1n << 128n) - 1n
    );
  });

  it('throws on invalid input', () => {
    expect(() => parseIPv6('not-ipv6')).toThrow();
    expect(() => parseIPv6('192.168.1.1')).toThrow();
  });
});

describe('bigintToIPv6Formats', () => {
  it('converts ::1', () => {
    const result = bigintToIPv6Formats(1n);
    expect(result.full).toBe('0000:0000:0000:0000:0000:0000:0000:0001');
    expect(result.compressed).toBe('::1');
    expect(result.binary).toHaveLength(128);
    expect(result.binary.endsWith('1')).toBe(true);
  });

  it('converts ::', () => {
    const result = bigintToIPv6Formats(0n);
    expect(result.full).toBe('0000:0000:0000:0000:0000:0000:0000:0000');
    expect(result.compressed).toBe('::');
  });

  it('converts 2001:db8::1', () => {
    const result = bigintToIPv6Formats(0x20010db8000000000000000000000001n);
    expect(result.full).toBe('2001:0db8:0000:0000:0000:0000:0000:0001');
    expect(result.compressed).toBe('2001:db8::1');
  });

  it('converts all-ones', () => {
    const result = bigintToIPv6Formats((1n << 128n) - 1n);
    expect(result.full).toBe('ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff');
    expect(result.compressed).toBe('ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff');
  });

  it('throws on out of range', () => {
    expect(() => bigintToIPv6Formats(-1n)).toThrow();
    expect(() => bigintToIPv6Formats(1n << 128n)).toThrow();
  });
});
