import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { isValidIPv4, isValidIPv6, isValidCidr, isValidPort } from '../validators';

describe('isValidIPv4', () => {
  it('returns true for valid IPv4 addresses', () => {
    expect(isValidIPv4('0.0.0.0')).toBe(true);
    expect(isValidIPv4('192.168.1.1')).toBe(true);
    expect(isValidIPv4('255.255.255.255')).toBe(true);
    expect(isValidIPv4('10.0.0.1')).toBe(true);
    expect(isValidIPv4('127.0.0.1')).toBe(true);
  });

  it('returns false for invalid IPv4 addresses', () => {
    expect(isValidIPv4('')).toBe(false);
    expect(isValidIPv4('256.0.0.1')).toBe(false);
    expect(isValidIPv4('1.2.3')).toBe(false);
    expect(isValidIPv4('1.2.3.4.5')).toBe(false);
    expect(isValidIPv4('01.02.03.04')).toBe(false); // leading zeros
    expect(isValidIPv4('1.2.3.a')).toBe(false);
    expect(isValidIPv4('1.2.3.-1')).toBe(false);
    expect(isValidIPv4('...')).toBe(false);
    expect(isValidIPv4('1.2.3.')).toBe(false);
  });

  it('property: valid generated IPv4 always passes', () => {
    fc.assert(
      fc.property(
        fc.tuple(fc.nat(255), fc.nat(255), fc.nat(255), fc.nat(255)),
        ([a, b, c, d]) => {
          expect(isValidIPv4(`${a}.${b}.${c}.${d}`)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('isValidIPv6', () => {
  it('returns true for valid IPv6 addresses', () => {
    expect(isValidIPv6('2001:0db8:0000:0000:0000:0000:0000:0001')).toBe(true);
    expect(isValidIPv6('2001:db8::1')).toBe(true);
    expect(isValidIPv6('::')).toBe(true);
    expect(isValidIPv6('::1')).toBe(true);
    expect(isValidIPv6('fe80::1%eth0')).toBe(true);
    expect(isValidIPv6('ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff')).toBe(true);
  });

  it('returns false for invalid IPv6 addresses', () => {
    expect(isValidIPv6('')).toBe(false);
    expect(isValidIPv6('2001:db8::1::2')).toBe(false); // double ::
    expect(isValidIPv6('2001:db8:gggg::1')).toBe(false); // invalid hex
    expect(isValidIPv6('2001:db8:00000::1')).toBe(false); // 5-digit group
    expect(isValidIPv6('1:2:3:4:5:6:7:8:9')).toBe(false); // too many groups
  });
});

describe('isValidCidr', () => {
  it('returns true for valid CIDR notations', () => {
    expect(isValidCidr('192.168.1.0/24')).toBe(true);
    expect(isValidCidr('10.0.0.0/8')).toBe(true);
    expect(isValidCidr('0.0.0.0/0')).toBe(true);
    expect(isValidCidr('255.255.255.255/32')).toBe(true);
  });

  it('returns false for invalid CIDR notations', () => {
    expect(isValidCidr('')).toBe(false);
    expect(isValidCidr('192.168.1.0')).toBe(false); // no prefix
    expect(isValidCidr('192.168.1.0/33')).toBe(false); // prefix too large
    expect(isValidCidr('192.168.1.0/-1')).toBe(false);
    expect(isValidCidr('192.168.1.0/abc')).toBe(false);
    expect(isValidCidr('256.0.0.0/24')).toBe(false); // invalid IP
    expect(isValidCidr('192.168.1.0/08')).toBe(false); // leading zero in prefix
  });

  it('property: valid generated CIDR always passes', () => {
    fc.assert(
      fc.property(
        fc.tuple(fc.nat(255), fc.nat(255), fc.nat(255), fc.nat(255), fc.nat(32)),
        ([a, b, c, d, prefix]) => {
          expect(isValidCidr(`${a}.${b}.${c}.${d}/${prefix}`)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('isValidPort', () => {
  it('returns true for valid port numbers', () => {
    expect(isValidPort(0)).toBe(true);
    expect(isValidPort(80)).toBe(true);
    expect(isValidPort(443)).toBe(true);
    expect(isValidPort(65535)).toBe(true);
  });

  it('returns false for invalid port numbers', () => {
    expect(isValidPort(-1)).toBe(false);
    expect(isValidPort(65536)).toBe(false);
    expect(isValidPort(1.5)).toBe(false);
    expect(isValidPort(NaN)).toBe(false);
    expect(isValidPort(Infinity)).toBe(false);
  });

  it('property: any integer in [0, 65535] is valid', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 65535 }), (port) => {
        expect(isValidPort(port)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('property: any integer outside [0, 65535] is invalid', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.integer({ min: -1000, max: -1 }),
          fc.integer({ min: 65536, max: 100000 })
        ),
        (port) => {
          expect(isValidPort(port)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
