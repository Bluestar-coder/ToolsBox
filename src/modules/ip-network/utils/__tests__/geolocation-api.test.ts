import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { isPrivateOrReservedIp } from '../geolocation-api';
import { integerToIPv4Formats } from '../ip-utils';

// Feature: ip-network-tool, Property 6: 私有/保留地址识别
// **Validates: Requirements 4.3**

/**
 * Helper: convert a 32-bit integer to dotted-decimal IPv4 string.
 */
function intToIp(num: number): string {
  return integerToIPv4Formats(num).dotted;
}

/**
 * All private/reserved ranges as [min, max] integer pairs.
 */
const PRIVATE_RESERVED_RANGES: Array<[number, number]> = [
  [0x0A000000, 0x0AFFFFFF], // 10.0.0.0/8
  [0xAC100000, 0xAC1FFFFF], // 172.16.0.0/12
  [0xC0A80000, 0xC0A8FFFF], // 192.168.0.0/16
  [0x7F000000, 0x7FFFFFFF], // 127.0.0.0/8
  [0xA9FE0000, 0xA9FEFFFF], // 169.254.0.0/16
  [0x00000000, 0x00FFFFFF], // 0.0.0.0/8
];

/**
 * Check if an integer falls within any private/reserved range.
 */
function isInPrivateReservedRange(num: number): boolean {
  return PRIVATE_RESERVED_RANGES.some(([min, max]) => num >= min && num <= max);
}

/**
 * Arbitrary that generates a public (non-private, non-reserved) IPv4 integer.
 */
const publicIpArb = fc.integer({ min: 0, max: 0xFFFFFFFF }).filter(
  (num) => !isInPrivateReservedRange(num)
);

describe('Property 6: 私有/保留地址识别', () => {
  it('10.0.0.0/8 addresses are detected as private', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0x0A000000, max: 0x0AFFFFFF }),
        (num) => {
          const ip = intToIp(num);
          expect(isPrivateOrReservedIp(ip)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('172.16.0.0/12 addresses are detected as private', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0xAC100000, max: 0xAC1FFFFF }),
        (num) => {
          const ip = intToIp(num);
          expect(isPrivateOrReservedIp(ip)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('192.168.0.0/16 addresses are detected as private', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0xC0A80000, max: 0xC0A8FFFF }),
        (num) => {
          const ip = intToIp(num);
          expect(isPrivateOrReservedIp(ip)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('127.0.0.0/8 addresses are detected as reserved (loopback)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0x7F000000, max: 0x7FFFFFFF }),
        (num) => {
          const ip = intToIp(num);
          expect(isPrivateOrReservedIp(ip)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('169.254.0.0/16 addresses are detected as reserved (link-local)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0xA9FE0000, max: 0xA9FEFFFF }),
        (num) => {
          const ip = intToIp(num);
          expect(isPrivateOrReservedIp(ip)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('0.0.0.0/8 addresses are detected as reserved', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0x00000000, max: 0x00FFFFFF }),
        (num) => {
          const ip = intToIp(num);
          expect(isPrivateOrReservedIp(ip)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('public IPs are not detected as private or reserved', () => {
    fc.assert(
      fc.property(
        publicIpArb,
        (num) => {
          const ip = intToIp(num);
          expect(isPrivateOrReservedIp(ip)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================
// Unit tests for geolocation API (mocked fetch)
// Task 6.3 — Validates: Requirements 4.1, 4.3, 4.4
// ============================================================

import { vi, beforeEach, afterEach } from 'vitest';
import {
  queryGeolocation,
  batchQueryGeolocation,
  queryMyIp,
} from '../geolocation-api';

describe('queryGeolocation — unit tests', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --- Requirement 4.1: successful query ---
  it('returns geolocation info for a valid public IP', async () => {
    const mockResponse = {
      status: 'success',
      query: '8.8.8.8',
      country: 'United States',
      regionName: 'Virginia',
      city: 'Ashburn',
      isp: 'Google LLC',
      org: 'Google Public DNS',
      as: 'AS15169 Google LLC',
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await queryGeolocation('8.8.8.8');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://ip-api.com/json/8.8.8.8'
    );
    expect(result).toEqual({
      ip: '8.8.8.8',
      country: 'United States',
      region: 'Virginia',
      city: 'Ashburn',
      isp: 'Google LLC',
      org: 'Google Public DNS',
      asNumber: 'AS15169 Google LLC',
      status: 'success',
    });
  });

  // --- Requirement 4.4: API failure (non-200) ---
  it('throws on non-200 HTTP response', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
    });

    await expect(queryGeolocation('8.8.8.8')).rejects.toThrow(
      'API request failed: 429 Too Many Requests'
    );
  });

  // --- Requirement 4.4: timeout / network error ---
  it('throws on network error (e.g. timeout)', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new TypeError('Failed to fetch')
    );

    await expect(queryGeolocation('8.8.8.8')).rejects.toThrow(
      'Failed to fetch'
    );
  });

  // --- Requirement 4.3: private IP rejection ---
  it('returns fail status for private IP without calling fetch', async () => {
    const result = await queryGeolocation('192.168.1.1');

    expect(global.fetch).not.toHaveBeenCalled();
    expect(result).toEqual({
      ip: '192.168.1.1',
      country: '',
      region: '',
      city: '',
      isp: '',
      org: '',
      asNumber: '',
      status: 'fail',
      message: 'Private or reserved IP address',
    });
  });

  it('returns fail status for loopback address without calling fetch', async () => {
    const result = await queryGeolocation('127.0.0.1');

    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.status).toBe('fail');
    expect(result.message).toBe('Private or reserved IP address');
  });

  // --- API returns fail status (e.g. invalid query) ---
  it('maps API fail response correctly', async () => {
    const mockResponse = {
      status: 'fail',
      message: 'invalid query',
      query: '999.999.999.999',
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await queryGeolocation('999.999.999.999');

    expect(result.status).toBe('fail');
    expect(result.message).toBe('invalid query');
  });
});

describe('batchQueryGeolocation — unit tests', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns results for a batch of public IPs', async () => {
    const mockBatchResponse = [
      {
        status: 'success',
        query: '8.8.8.8',
        country: 'United States',
        regionName: 'Virginia',
        city: 'Ashburn',
        isp: 'Google LLC',
        org: 'Google Public DNS',
        as: 'AS15169 Google LLC',
      },
      {
        status: 'success',
        query: '1.1.1.1',
        country: 'Australia',
        regionName: 'Queensland',
        city: 'South Brisbane',
        isp: 'Cloudflare, Inc.',
        org: 'APNIC and Cloudflare DNS Resolver project',
        as: 'AS13335 Cloudflare, Inc.',
      },
    ];

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockBatchResponse,
    });

    const results = await batchQueryGeolocation(['8.8.8.8', '1.1.1.1']);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith('http://ip-api.com/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(['8.8.8.8', '1.1.1.1']),
    });
    expect(results).toHaveLength(2);
    expect(results[0].status).toBe('success');
    expect(results[1].status).toBe('success');
  });

  it('handles mixed private and public IPs', async () => {
    const mockBatchResponse = [
      {
        status: 'success',
        query: '8.8.8.8',
        country: 'United States',
        regionName: 'Virginia',
        city: 'Ashburn',
        isp: 'Google LLC',
        org: 'Google Public DNS',
        as: 'AS15169 Google LLC',
      },
    ];

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockBatchResponse,
    });

    const results = await batchQueryGeolocation([
      '192.168.1.1',
      '8.8.8.8',
      '10.0.0.1',
    ]);

    expect(results).toHaveLength(3);
    // Private IPs get fail status
    expect(results[0].status).toBe('fail');
    expect(results[0].message).toBe('Private or reserved IP address');
    expect(results[2].status).toBe('fail');
    expect(results[2].message).toBe('Private or reserved IP address');
    // Public IP gets success
    expect(results[1].status).toBe('success');
    expect(results[1].country).toBe('United States');
  });

  it('returns empty array for empty input', async () => {
    const results = await batchQueryGeolocation([]);
    expect(results).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('throws when batch exceeds 20 IPs', async () => {
    const ips = Array.from({ length: 21 }, (_, i) => `1.2.3.${i % 256}`);
    await expect(batchQueryGeolocation(ips)).rejects.toThrow(
      'Batch query supports at most 20 IPs'
    );
  });

  it('throws on batch API failure', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(
      batchQueryGeolocation(['8.8.8.8'])
    ).rejects.toThrow('Batch API request failed: 500 Internal Server Error');
  });
});

describe('queryMyIp — unit tests', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns current public IP info', async () => {
    const mockResponse = {
      status: 'success',
      query: '203.0.113.50',
      country: 'Japan',
      regionName: 'Tokyo',
      city: 'Tokyo',
      isp: 'Example ISP',
      org: 'Example Org',
      as: 'AS12345 Example',
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await queryMyIp();

    expect(global.fetch).toHaveBeenCalledWith('http://ip-api.com/json/');
    expect(result.status).toBe('success');
    expect(result.ip).toBe('203.0.113.50');
    expect(result.country).toBe('Japan');
  });

  it('throws on API failure', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
    });

    await expect(queryMyIp()).rejects.toThrow(
      'API request failed: 503 Service Unavailable'
    );
  });
});
