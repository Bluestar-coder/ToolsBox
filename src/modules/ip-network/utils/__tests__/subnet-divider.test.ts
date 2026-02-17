import { describe, it, expect } from 'vitest';
import {
  divideBySubnetCount,
  divideByHostCount,
  getMaxSubnetCount,
  getMaxHostCount,
} from '../subnet-divider';

describe('getMaxSubnetCount', () => {
  it('returns 256 for /24', () => {
    expect(getMaxSubnetCount('192.168.1.0/24')).toBe(256);
  });

  it('returns 2 for /31', () => {
    expect(getMaxSubnetCount('10.0.0.0/31')).toBe(2);
  });

  it('returns 0 for /32', () => {
    expect(getMaxSubnetCount('10.0.0.1/32')).toBe(0);
  });

  it('throws on invalid CIDR', () => {
    expect(() => getMaxSubnetCount('invalid')).toThrow('Invalid CIDR');
  });
});

describe('getMaxHostCount', () => {
  it('returns 254 for /24', () => {
    expect(getMaxHostCount('192.168.1.0/24')).toBe(254);
  });

  it('returns 0 for /31', () => {
    expect(getMaxHostCount('10.0.0.0/31')).toBe(0);
  });

  it('returns 0 for /32', () => {
    expect(getMaxHostCount('10.0.0.1/32')).toBe(0);
  });

  it('throws on invalid CIDR', () => {
    expect(() => getMaxHostCount('bad')).toThrow('Invalid CIDR');
  });
});

describe('divideBySubnetCount', () => {
  it('divides /24 into 4 subnets', () => {
    const result = divideBySubnetCount('192.168.1.0/24', 4);
    expect(result.originalCidr).toBe('192.168.1.0/24');
    expect(result.newPrefixLength).toBe(26);
    expect(result.subnets).toHaveLength(4);

    expect(result.subnets[0]).toEqual({
      index: 1,
      networkAddress: '192.168.1.0',
      cidr: '192.168.1.0/26',
      firstHost: '192.168.1.1',
      lastHost: '192.168.1.62',
      broadcastAddress: '192.168.1.63',
      usableHosts: 62,
    });

    expect(result.subnets[3]).toEqual({
      index: 4,
      networkAddress: '192.168.1.192',
      cidr: '192.168.1.192/26',
      firstHost: '192.168.1.193',
      lastHost: '192.168.1.254',
      broadcastAddress: '192.168.1.255',
      usableHosts: 62,
    });
  });

  it('rounds non-power-of-2 count up to next power of 2', () => {
    const result = divideBySubnetCount('10.0.0.0/24', 3);
    // 3 rounds up to 4
    expect(result.subnets).toHaveLength(4);
    expect(result.newPrefixLength).toBe(26);
  });

  it('handles count of 1 (no subdivision)', () => {
    const result = divideBySubnetCount('10.0.0.0/24', 1);
    expect(result.subnets).toHaveLength(1);
    expect(result.newPrefixLength).toBe(24);
    expect(result.subnets[0].networkAddress).toBe('10.0.0.0');
    expect(result.subnets[0].broadcastAddress).toBe('10.0.0.255');
  });

  it('divides /16 into 256 subnets', () => {
    const result = divideBySubnetCount('172.16.0.0/16', 256);
    expect(result.subnets).toHaveLength(256);
    expect(result.newPrefixLength).toBe(24);
    expect(result.subnets[0].cidr).toBe('172.16.0.0/24');
    expect(result.subnets[255].cidr).toBe('172.16.255.0/24');
  });

  it('throws when count exceeds max', () => {
    expect(() => divideBySubnetCount('192.168.1.0/30', 8)).toThrow(
      'exceeds maximum of 4'
    );
  });

  it('throws on /32 network', () => {
    expect(() => divideBySubnetCount('10.0.0.1/32', 2)).toThrow(
      'Cannot subdivide'
    );
  });

  it('throws on invalid CIDR', () => {
    expect(() => divideBySubnetCount('bad', 2)).toThrow('Invalid CIDR');
  });

  it('throws on non-positive count', () => {
    expect(() => divideBySubnetCount('10.0.0.0/24', 0)).toThrow('positive integer');
    expect(() => divideBySubnetCount('10.0.0.0/24', -1)).toThrow('positive integer');
  });

  it('throws on non-integer count', () => {
    expect(() => divideBySubnetCount('10.0.0.0/24', 2.5)).toThrow('positive integer');
  });
});

describe('divideByHostCount', () => {
  it('divides /24 by 50 hosts per subnet', () => {
    const result = divideByHostCount('192.168.1.0/24', 50);
    // Need 50 hosts → 50+2=52 addresses → ceil(log2(52))=6 bits → /26 (62 usable)
    expect(result.newPrefixLength).toBe(26);
    expect(result.subnets).toHaveLength(4);
    expect(result.subnets[0].usableHosts).toBe(62);
    expect(result.subnets[0].usableHosts).toBeGreaterThanOrEqual(50);
  });

  it('divides /24 by 100 hosts per subnet', () => {
    const result = divideByHostCount('192.168.1.0/24', 100);
    // Need 100 hosts → 100+2=102 → ceil(log2(102))=7 bits → /25 (126 usable)
    expect(result.newPrefixLength).toBe(25);
    expect(result.subnets).toHaveLength(2);
    expect(result.subnets[0].usableHosts).toBe(126);
  });

  it('divides /16 by 1000 hosts per subnet', () => {
    const result = divideByHostCount('10.0.0.0/16', 1000);
    // Need 1000 hosts → 1002 addresses → ceil(log2(1002))=10 bits → /22 (1022 usable)
    // Subnets = 2^(22-16) = 64
    expect(result.newPrefixLength).toBe(22);
    expect(result.subnets).toHaveLength(64);
    expect(result.subnets[0].usableHosts).toBe(1022);
  });

  it('each subnet has at least the requested hosts', () => {
    const result = divideByHostCount('10.0.0.0/20', 200);
    for (const subnet of result.subnets) {
      expect(subnet.usableHosts).toBeGreaterThanOrEqual(200);
    }
  });

  it('throws when hosts exceed max', () => {
    expect(() => divideByHostCount('192.168.1.0/24', 255)).toThrow(
      'exceeds maximum of 254'
    );
  });

  it('throws on /31 network', () => {
    expect(() => divideByHostCount('10.0.0.0/31', 1)).toThrow(
      'Cannot subdivide'
    );
  });

  it('throws on invalid CIDR', () => {
    expect(() => divideByHostCount('bad', 10)).toThrow('Invalid CIDR');
  });

  it('throws on non-positive hosts', () => {
    expect(() => divideByHostCount('10.0.0.0/24', 0)).toThrow('positive integer');
  });
});

import * as fc from 'fast-check';
import { parseIPv4ToInteger } from '../ip-utils';

// Feature: ip-network-tool, Property 5: 子网划分完整性与不重叠
// **Validates: Requirements 3.1, 3.2**
describe('Property 5: 子网划分完整性与不重叠', () => {
  /**
   * Generate a random CIDR with prefix 20-28.
   * We use prefix >= 20 so that subnet counts stay small and tests run fast.
   * This still covers a wide range of network sizes (16 to 4096 addresses).
   */
  const cidrArb = fc.tuple(
    fc.nat(255),
    fc.nat(255),
    fc.nat(255),
    fc.nat(255),
    fc.integer({ min: 20, max: 28 }),
  ).map(([a, b, c, d, prefix]) => `${a}.${b}.${c}.${d}/${prefix}`);

  /** Helper: get [start, end] integer range for a subnet entry */
  function subnetRange(entry: { networkAddress: string; broadcastAddress: string }) {
    return {
      start: parseIPv4ToInteger(entry.networkAddress, 'dotted'),
      end: parseIPv4ToInteger(entry.broadcastAddress, 'dotted'),
    };
  }

  /** Helper: compute parent network and broadcast integers from CIDR string */
  function parentRange(cidr: string) {
    const [ipStr, prefixStr] = cidr.split('/');
    const prefix = Number(prefixStr);
    const maskInt = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
    const networkInt = (parseIPv4ToInteger(ipStr, 'dotted') & maskInt) >>> 0;
    const broadcastInt = (networkInt | (~maskInt >>> 0)) >>> 0;
    return { networkInt, broadcastInt };
  }

  // ── divideBySubnetCount ──────────────────────────────────────────────

  describe('divideBySubnetCount', () => {
    it('all subnets do not overlap', () => {
      fc.assert(
        fc.property(cidrArb, fc.integer({ min: 2, max: 16 }), (cidr, count) => {
          const maxCount = getMaxSubnetCount(cidr);
          if (count > maxCount) return; // skip invalid combos

          const result = divideBySubnetCount(cidr, count);
          const ranges = result.subnets.map(subnetRange);

          for (let i = 0; i < ranges.length; i++) {
            for (let j = i + 1; j < ranges.length; j++) {
              const overlaps =
                ranges[i].start <= ranges[j].end && ranges[j].start <= ranges[i].end;
              expect(overlaps).toBe(false);
            }
          }
        }),
        { numRuns: 100 },
      );
    });

    it('all subnets combined completely cover the original network', () => {
      fc.assert(
        fc.property(cidrArb, fc.integer({ min: 2, max: 16 }), (cidr, count) => {
          const maxCount = getMaxSubnetCount(cidr);
          if (count > maxCount) return;

          const result = divideBySubnetCount(cidr, count);
          const ranges = result.subnets.map(subnetRange);
          ranges.sort((a, b) => a.start - b.start);

          const parent = parentRange(cidr);
          expect(ranges[0].start).toBe(parent.networkInt);
          expect(ranges[ranges.length - 1].end).toBe(parent.broadcastInt);

          for (let i = 1; i < ranges.length; i++) {
            expect(ranges[i].start).toBe((ranges[i - 1].end + 1) >>> 0);
          }
        }),
        { numRuns: 100 },
      );
    });

    it('each subnet usableHosts is mathematically consistent with its prefix length', () => {
      fc.assert(
        fc.property(cidrArb, fc.integer({ min: 2, max: 16 }), (cidr, count) => {
          const maxCount = getMaxSubnetCount(cidr);
          if (count > maxCount) return;

          const result = divideBySubnetCount(cidr, count);
          const newPrefix = result.newPrefixLength;

          const expectedUsable =
            newPrefix >= 31
              ? newPrefix === 32 ? 1 : 2
              : Math.pow(2, 32 - newPrefix) - 2;

          for (const subnet of result.subnets) {
            expect(subnet.usableHosts).toBe(expectedUsable);
          }
        }),
        { numRuns: 100 },
      );
    });
  });

  // ── divideByHostCount ────────────────────────────────────────────────

  describe('divideByHostCount', () => {
    /**
     * For divideByHostCount, use prefix 20-28 and hostsPerSubnet 2-1000.
     * With prefix 20, max hosts = 2^12 - 2 = 4094, so hostsPerSubnet up to 1000 is valid.
     * The resulting subnet count stays small (at most 2^(28-20) = 256 subnets).
     */
    it('all subnets do not overlap', () => {
      fc.assert(
        fc.property(cidrArb, fc.integer({ min: 2, max: 1000 }), (cidr, hostsPerSubnet) => {
          const maxHosts = getMaxHostCount(cidr);
          if (maxHosts < 2 || hostsPerSubnet > maxHosts) return;

          const result = divideByHostCount(cidr, hostsPerSubnet);
          const ranges = result.subnets.map(subnetRange);

          for (let i = 0; i < ranges.length; i++) {
            for (let j = i + 1; j < ranges.length; j++) {
              const overlaps =
                ranges[i].start <= ranges[j].end && ranges[j].start <= ranges[i].end;
              expect(overlaps).toBe(false);
            }
          }
        }),
        { numRuns: 100 },
      );
    });

    it('all subnets combined completely cover the original network', () => {
      fc.assert(
        fc.property(cidrArb, fc.integer({ min: 2, max: 1000 }), (cidr, hostsPerSubnet) => {
          const maxHosts = getMaxHostCount(cidr);
          if (maxHosts < 2 || hostsPerSubnet > maxHosts) return;

          const result = divideByHostCount(cidr, hostsPerSubnet);
          const ranges = result.subnets.map(subnetRange);
          ranges.sort((a, b) => a.start - b.start);

          const parent = parentRange(cidr);
          expect(ranges[0].start).toBe(parent.networkInt);
          expect(ranges[ranges.length - 1].end).toBe(parent.broadcastInt);

          for (let i = 1; i < ranges.length; i++) {
            expect(ranges[i].start).toBe((ranges[i - 1].end + 1) >>> 0);
          }
        }),
        { numRuns: 100 },
      );
    });

    it('each subnet usableHosts is mathematically consistent with its prefix length', () => {
      fc.assert(
        fc.property(cidrArb, fc.integer({ min: 2, max: 1000 }), (cidr, hostsPerSubnet) => {
          const maxHosts = getMaxHostCount(cidr);
          if (maxHosts < 2 || hostsPerSubnet > maxHosts) return;

          const result = divideByHostCount(cidr, hostsPerSubnet);
          const newPrefix = result.newPrefixLength;

          const expectedUsable =
            newPrefix >= 31
              ? newPrefix === 32 ? 1 : 2
              : Math.pow(2, 32 - newPrefix) - 2;

          for (const subnet of result.subnets) {
            expect(subnet.usableHosts).toBe(expectedUsable);
          }
        }),
        { numRuns: 100 },
      );
    });

    it('each subnet usable hosts >= requested hosts', () => {
      fc.assert(
        fc.property(cidrArb, fc.integer({ min: 2, max: 1000 }), (cidr, hostsPerSubnet) => {
          const maxHosts = getMaxHostCount(cidr);
          if (maxHosts < 2 || hostsPerSubnet > maxHosts) return;

          const result = divideByHostCount(cidr, hostsPerSubnet);

          for (const subnet of result.subnets) {
            expect(subnet.usableHosts).toBeGreaterThanOrEqual(hostsPerSubnet);
          }
        }),
        { numRuns: 100 },
      );
    });
  });
});
