import { describe, it, expect } from 'vitest';
import { calculateCidr, calculateMinimumCidr, isValidCidr } from '../cidr-calculator';

describe('calculateCidr', () => {
  it('computes /24 network correctly', () => {
    const result = calculateCidr('192.168.1.0/24');
    expect(result.networkAddress).toBe('192.168.1.0');
    expect(result.broadcastAddress).toBe('192.168.1.255');
    expect(result.subnetMask).toBe('255.255.255.0');
    expect(result.wildcardMask).toBe('0.0.0.255');
    expect(result.firstHost).toBe('192.168.1.1');
    expect(result.lastHost).toBe('192.168.1.254');
    expect(result.totalHosts).toBe(256);
    expect(result.usableHosts).toBe(254);
    expect(result.prefixLength).toBe(24);
  });

  it('computes /32 single host correctly', () => {
    const result = calculateCidr('10.0.0.1/32');
    expect(result.networkAddress).toBe('10.0.0.1');
    expect(result.broadcastAddress).toBe('10.0.0.1');
    expect(result.subnetMask).toBe('255.255.255.255');
    expect(result.wildcardMask).toBe('0.0.0.0');
    expect(result.firstHost).toBe('10.0.0.1');
    expect(result.lastHost).toBe('10.0.0.1');
    expect(result.totalHosts).toBe(1);
    expect(result.usableHosts).toBe(1);
  });

  it('computes /31 point-to-point link correctly', () => {
    const result = calculateCidr('10.0.0.0/31');
    expect(result.networkAddress).toBe('10.0.0.0');
    expect(result.broadcastAddress).toBe('10.0.0.1');
    expect(result.firstHost).toBe('10.0.0.0');
    expect(result.lastHost).toBe('10.0.0.1');
    expect(result.totalHosts).toBe(2);
    expect(result.usableHosts).toBe(2);
  });

  it('computes /0 entire address space correctly', () => {
    const result = calculateCidr('0.0.0.0/0');
    expect(result.networkAddress).toBe('0.0.0.0');
    expect(result.broadcastAddress).toBe('255.255.255.255');
    expect(result.subnetMask).toBe('0.0.0.0');
    expect(result.wildcardMask).toBe('255.255.255.255');
    expect(result.totalHosts).toBe(4294967296);
    expect(result.usableHosts).toBe(4294967294);
  });

  it('normalizes IP to network address', () => {
    const result = calculateCidr('192.168.1.100/24');
    expect(result.networkAddress).toBe('192.168.1.0');
  });

  it('computes /16 correctly', () => {
    const result = calculateCidr('172.16.0.0/16');
    expect(result.networkAddress).toBe('172.16.0.0');
    expect(result.broadcastAddress).toBe('172.16.255.255');
    expect(result.subnetMask).toBe('255.255.0.0');
    expect(result.usableHosts).toBe(65534);
  });

  it('computes subnet mask binary correctly', () => {
    const result = calculateCidr('10.0.0.0/8');
    expect(result.subnetMaskBinary).toBe('11111111.00000000.00000000.00000000');
  });

  it('throws on invalid CIDR', () => {
    expect(() => calculateCidr('invalid')).toThrow();
    expect(() => calculateCidr('192.168.1.0/33')).toThrow();
    expect(() => calculateCidr('256.0.0.0/24')).toThrow();
  });
});

describe('calculateMinimumCidr', () => {
  it('returns /32 for identical IPs', () => {
    expect(calculateMinimumCidr('10.0.0.1', '10.0.0.1')).toBe('10.0.0.1/32');
  });

  it('returns /31 for adjacent IPs', () => {
    expect(calculateMinimumCidr('10.0.0.0', '10.0.0.1')).toBe('10.0.0.0/31');
  });

  it('returns /24 for IPs in same /24', () => {
    expect(calculateMinimumCidr('192.168.1.1', '192.168.1.254')).toBe('192.168.1.0/24');
  });

  it('returns /0 for maximally different IPs', () => {
    expect(calculateMinimumCidr('0.0.0.0', '255.255.255.255')).toBe('0.0.0.0/0');
  });

  it('finds correct minimum CIDR across /24 boundary', () => {
    const result = calculateMinimumCidr('192.168.0.1', '192.168.1.1');
    expect(result).toBe('192.168.0.0/23');
  });

  it('throws on invalid IP', () => {
    expect(() => calculateMinimumCidr('invalid', '10.0.0.1')).toThrow();
    expect(() => calculateMinimumCidr('10.0.0.1', 'invalid')).toThrow();
  });
});

describe('isValidCidr (re-exported)', () => {
  it('validates correct CIDR', () => {
    expect(isValidCidr('192.168.1.0/24')).toBe(true);
    expect(isValidCidr('0.0.0.0/0')).toBe(true);
    expect(isValidCidr('10.0.0.1/32')).toBe(true);
  });

  it('rejects invalid CIDR', () => {
    expect(isValidCidr('192.168.1.0/33')).toBe(false);
    expect(isValidCidr('192.168.1.0')).toBe(false);
    expect(isValidCidr('invalid/24')).toBe(false);
    expect(isValidCidr('')).toBe(false);
  });
});

import * as fc from 'fast-check';
import { parseIPv4ToInteger, integerToIPv4Formats } from '../ip-utils';

// Feature: ip-network-tool, Property 3: CIDR 计算数学一致性
// **Validates: Requirements 2.1, 2.2, 2.5**
describe('Property 3: CIDR 计算数学一致性', () => {
  const cidrArb = fc.tuple(
    fc.nat(255),
    fc.nat(255),
    fc.nat(255),
    fc.nat(255),
    fc.integer({ min: 0, max: 32 }),
  );

  it('networkAddress AND subnetMask equals networkAddress itself', () => {
    fc.assert(
      fc.property(cidrArb, ([a, b, c, d, prefix]) => {
        const cidr = `${a}.${b}.${c}.${d}/${prefix}`;
        const result = calculateCidr(cidr);

        const networkInt = parseIPv4ToInteger(result.networkAddress, 'dotted');
        const maskInt = parseIPv4ToInteger(result.subnetMask, 'dotted');

        expect((networkInt & maskInt) >>> 0).toBe(networkInt);
      }),
      { numRuns: 100 },
    );
  });

  it('broadcastAddress equals networkAddress OR wildcard mask', () => {
    fc.assert(
      fc.property(cidrArb, ([a, b, c, d, prefix]) => {
        const cidr = `${a}.${b}.${c}.${d}/${prefix}`;
        const result = calculateCidr(cidr);

        const networkInt = parseIPv4ToInteger(result.networkAddress, 'dotted');
        const wildcardInt = parseIPv4ToInteger(result.wildcardMask, 'dotted');
        const broadcastInt = parseIPv4ToInteger(result.broadcastAddress, 'dotted');

        expect((networkInt | wildcardInt) >>> 0).toBe(broadcastInt);
      }),
      { numRuns: 100 },
    );
  });

  it('wildcardMask equals bitwise NOT of subnetMask', () => {
    fc.assert(
      fc.property(cidrArb, ([a, b, c, d, prefix]) => {
        const cidr = `${a}.${b}.${c}.${d}/${prefix}`;
        const result = calculateCidr(cidr);

        const maskInt = parseIPv4ToInteger(result.subnetMask, 'dotted');
        const wildcardInt = parseIPv4ToInteger(result.wildcardMask, 'dotted');

        expect((~maskInt) >>> 0).toBe(wildcardInt);
      }),
      { numRuns: 100 },
    );
  });

  it('usableHosts equals 2^(32 - prefixLength) - 2 when prefixLength < 31', () => {
    const cidrArbNormal = fc.tuple(
      fc.nat(255),
      fc.nat(255),
      fc.nat(255),
      fc.nat(255),
      fc.integer({ min: 0, max: 30 }),
    );

    fc.assert(
      fc.property(cidrArbNormal, ([a, b, c, d, prefix]) => {
        const cidr = `${a}.${b}.${c}.${d}/${prefix}`;
        const result = calculateCidr(cidr);

        const expected = Math.pow(2, 32 - prefix) - 2;
        expect(result.usableHosts).toBe(expected);
      }),
      { numRuns: 100 },
    );
  });

  it('firstHost equals networkAddress + 1 and lastHost equals broadcastAddress - 1 when prefixLength < 31', () => {
    const cidrArbNormal = fc.tuple(
      fc.nat(255),
      fc.nat(255),
      fc.nat(255),
      fc.nat(255),
      fc.integer({ min: 0, max: 30 }),
    );

    fc.assert(
      fc.property(cidrArbNormal, ([a, b, c, d, prefix]) => {
        const cidr = `${a}.${b}.${c}.${d}/${prefix}`;
        const result = calculateCidr(cidr);

        const networkInt = parseIPv4ToInteger(result.networkAddress, 'dotted');
        const broadcastInt = parseIPv4ToInteger(result.broadcastAddress, 'dotted');
        const firstHostInt = parseIPv4ToInteger(result.firstHost, 'dotted');
        const lastHostInt = parseIPv4ToInteger(result.lastHost, 'dotted');

        expect(firstHostInt).toBe((networkInt + 1) >>> 0);
        expect(lastHostInt).toBe((broadcastInt - 1) >>> 0);
      }),
      { numRuns: 100 },
    );
  });
});

// Feature: ip-network-tool, Property 4: 最小 CIDR 包含性
// **Validates: Requirements 2.6**
describe('Property 4: 最小 CIDR 包含性', () => {
  const ipArb = fc.tuple(fc.nat(255), fc.nat(255), fc.nat(255), fc.nat(255));

  it('calculateMinimumCidr returns a CIDR that contains both input addresses', () => {
    fc.assert(
      fc.property(ipArb, ipArb, (octets1, octets2) => {
        const ip1 = octets1.join('.');
        const ip2 = octets2.join('.');

        const cidr = calculateMinimumCidr(ip1, ip2);
        const info = calculateCidr(cidr);

        const ip1Int = parseIPv4ToInteger(ip1, 'dotted');
        const ip2Int = parseIPv4ToInteger(ip2, 'dotted');
        const networkInt = parseIPv4ToInteger(info.networkAddress, 'dotted');
        const broadcastInt = parseIPv4ToInteger(info.broadcastAddress, 'dotted');

        // Both IPs must fall within [networkAddress, broadcastAddress]
        expect(ip1Int >= networkInt && ip1Int <= broadcastInt).toBe(true);
        expect(ip2Int >= networkInt && ip2Int <= broadcastInt).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('no longer prefix (smaller network) can contain both addresses', () => {
    fc.assert(
      fc.property(ipArb, ipArb, (octets1, octets2) => {
        const ip1 = octets1.join('.');
        const ip2 = octets2.join('.');

        const cidr = calculateMinimumCidr(ip1, ip2);
        const info = calculateCidr(cidr);

        // If prefix is already 32, it's the tightest possible — skip
        if (info.prefixLength >= 32) return;

        // A CIDR with prefix+1 (smaller network) should NOT contain both IPs
        const longerPrefix = info.prefixLength + 1;
        const longerMask = longerPrefix === 0 ? 0 : (~0 << (32 - longerPrefix)) >>> 0;

        const ip1Int = parseIPv4ToInteger(ip1, 'dotted');
        const ip2Int = parseIPv4ToInteger(ip2, 'dotted');

        // Network address for ip1 with the longer prefix
        const net1 = (ip1Int & longerMask) >>> 0;
        const broadcast1 = (net1 | (~longerMask) >>> 0) >>> 0;

        // Check if ip2 falls within ip1's longer-prefix network
        const ip2InNet1 = ip2Int >= net1 && ip2Int <= broadcast1;

        // Network address for ip2 with the longer prefix
        const net2 = (ip2Int & longerMask) >>> 0;
        const broadcast2 = (net2 | (~longerMask) >>> 0) >>> 0;

        // Check if ip1 falls within ip2's longer-prefix network
        const ip1InNet2 = ip1Int >= net2 && ip1Int <= broadcast2;

        // No single prefix+1 network can contain both IPs
        // (unless both IPs happen to be in the same longer-prefix subnet,
        //  which would mean the original prefix wasn't minimal — contradiction)
        expect(ip2InNet1 && ip1InNet2 && net1 === net2).toBe(false);
      }),
      { numRuns: 100 },
    );
  });
});
