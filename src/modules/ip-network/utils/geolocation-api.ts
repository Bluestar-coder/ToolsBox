/**
 * IP 归属地查询 API 调用
 * 使用 ip-api.com 免费 API（HTTP，非 HTTPS）
 */
import type { GeolocationInfo } from './types';
import { parseIPv4ToInteger } from './ip-utils';
import { isValidIPv4, isValidIPv6 } from './validators';

const API_BASE = 'http://ip-api.com';
const BATCH_MAX = 20;

/**
 * 将 ip-api.com 的 JSON 响应映射为 GeolocationInfo
 */
function mapApiResponse(data: Record<string, unknown>): GeolocationInfo {
  if (data.status === 'fail') {
    return {
      ip: (data.query as string) ?? '',
      country: '',
      region: '',
      city: '',
      isp: '',
      org: '',
      asNumber: '',
      status: 'fail',
      message: (data.message as string) ?? 'Unknown error',
    };
  }
  return {
    ip: (data.query as string) ?? '',
    country: (data.country as string) ?? '',
    region: (data.regionName as string) ?? '',
    city: (data.city as string) ?? '',
    isp: (data.isp as string) ?? '',
    org: (data.org as string) ?? '',
    asNumber: (data.as as string) ?? '',
    status: 'success',
  };
}

/**
 * 查询单个 IP 归属地
 */
export async function queryGeolocation(ip: string): Promise<GeolocationInfo> {
  const trimmed = ip.trim();

  if (isPrivateOrReservedIp(trimmed)) {
    return {
      ip: trimmed,
      country: '',
      region: '',
      city: '',
      isp: '',
      org: '',
      asNumber: '',
      status: 'fail',
      message: 'Private or reserved IP address',
    };
  }

  const response = await fetch(`${API_BASE}/json/${encodeURIComponent(trimmed)}`);
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  return mapApiResponse(data);
}

/**
 * 批量查询 IP 归属地（最多 20 个）
 */
export async function batchQueryGeolocation(ips: string[]): Promise<GeolocationInfo[]> {
  if (ips.length === 0) return [];
  if (ips.length > BATCH_MAX) {
    throw new Error(`Batch query supports at most ${BATCH_MAX} IPs, got ${ips.length}`);
  }

  const trimmedIps = ips.map(ip => ip.trim());

  // Separate private/reserved IPs from public IPs
  const results: GeolocationInfo[] = new Array(trimmedIps.length);
  const publicIndices: number[] = [];
  const publicIps: string[] = [];

  for (let i = 0; i < trimmedIps.length; i++) {
    if (isPrivateOrReservedIp(trimmedIps[i])) {
      results[i] = {
        ip: trimmedIps[i],
        country: '',
        region: '',
        city: '',
        isp: '',
        org: '',
        asNumber: '',
        status: 'fail',
        message: 'Private or reserved IP address',
      };
    } else {
      publicIndices.push(i);
      publicIps.push(trimmedIps[i]);
    }
  }

  // Batch query public IPs
  if (publicIps.length > 0) {
    const response = await fetch(`${API_BASE}/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(publicIps),
    });
    if (!response.ok) {
      throw new Error(`Batch API request failed: ${response.status} ${response.statusText}`);
    }
    const data: Record<string, unknown>[] = await response.json();
    for (let i = 0; i < data.length; i++) {
      results[publicIndices[i]] = mapApiResponse(data[i]);
    }
  }

  return results;
}

/**
 * 查询本机公网 IP 及归属信息
 */
export async function queryMyIp(): Promise<GeolocationInfo> {
  const response = await fetch(`${API_BASE}/json/`);
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  return mapApiResponse(data);
}

/**
 * 判断是否为私有或保留 IPv4 地址
 *
 * RFC 1918 私有地址：
 *   10.0.0.0/8       (10.0.0.0 – 10.255.255.255)
 *   172.16.0.0/12    (172.16.0.0 – 172.31.255.255)
 *   192.168.0.0/16   (192.168.0.0 – 192.168.255.255)
 *
 * 保留地址：
 *   127.0.0.0/8      (127.0.0.0 – 127.255.255.255)  loopback
 *   169.254.0.0/16   (169.254.0.0 – 169.254.255.255) link-local
 *   0.0.0.0/8        (0.0.0.0 – 0.255.255.255)       "this" network
 */
export function isPrivateOrReservedIp(ip: string): boolean {
  const trimmed = ip.trim();

  // Only check IPv4 addresses
  if (!isValidIPv4(trimmed)) {
    // IPv6 private detection not in scope — treat as non-private
    return false;
  }

  const num = parseIPv4ToInteger(trimmed, 'dotted');

  // 10.0.0.0/8: mask 0xFF000000, network 0x0A000000
  if ((num & 0xFF000000) >>> 0 === 0x0A000000) return true;

  // 172.16.0.0/12: mask 0xFFF00000, network 0xAC100000
  if ((num & 0xFFF00000) >>> 0 === 0xAC100000) return true;

  // 192.168.0.0/16: mask 0xFFFF0000, network 0xC0A80000
  if ((num & 0xFFFF0000) >>> 0 === 0xC0A80000) return true;

  // 127.0.0.0/8: mask 0xFF000000, network 0x7F000000
  if ((num & 0xFF000000) >>> 0 === 0x7F000000) return true;

  // 169.254.0.0/16: mask 0xFFFF0000, network 0xA9FE0000
  if ((num & 0xFFFF0000) >>> 0 === 0xA9FE0000) return true;

  // 0.0.0.0/8: mask 0xFF000000, network 0x00000000
  if ((num & 0xFF000000) >>> 0 === 0x00000000) return true;

  return false;
}
