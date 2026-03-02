/**
 * IP 归属地查询 API 调用
 * 使用 ip-api.com 免费 API（HTTP，非 HTTPS）
 * 
 * 注意：由于浏览器安全策略（Mixed Content），在 HTTPS 页面中无法直接调用 HTTP API。
 * 在 Tauri 桌面应用中会自动使用 Tauri HTTP 插件绕过此限制。
 */
import type { GeolocationInfo, TauriIpInfo } from './types';
import { parseIPv4ToInteger, parseIPv6 } from './ip-utils';
import { isValidIPv4 } from './validators';

const API_BASE = 'http://ip-api.com';
const BATCH_MAX = 20;
type FetchLike = (url: string, options?: RequestInit) => Promise<Response>;

// 备用 IP 查询服务（用于获取本机 IP）
const IP_DETECTION_SERVICES = [
  'https://api.ipify.org?format=json',
  'https://httpbin.org/ip',
  'https://api.my-ip.io/ip.json',
];

interface HttpsGeolocationProvider {
  name: string;
  queryUrl: (ip: string) => string;
  autodetectUrl: string;
  mapResult: (data: Record<string, unknown>, requestedIp: string) => GeolocationInfo | null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  return value as Record<string, unknown>;
}

function pickString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim() !== '') {
      return value.trim();
    }
    if (typeof value === 'number') {
      return String(value);
    }
  }
  return '';
}

const HTTPS_GEOLOCATION_PROVIDERS: HttpsGeolocationProvider[] = [
  {
    name: 'ipwho.is',
    queryUrl: (ip: string) => `https://ipwho.is/${encodeURIComponent(ip)}`,
    autodetectUrl: 'https://ipwho.is/',
    mapResult: (data, requestedIp) => {
      if (data.success === false) {
        return {
          ip: pickString(data.ip, requestedIp),
          country: '',
          region: '',
          city: '',
          isp: '',
          org: '',
          asNumber: '',
          status: 'fail',
          message: pickString(data.message, 'Unknown error'),
        };
      }

      const connection = asRecord(data.connection);
      const ip = pickString(data.ip, requestedIp);
      if (!ip) {
        return null;
      }

      return {
        ip,
        country: pickString(data.country),
        region: pickString(data.region),
        city: pickString(data.city),
        isp: pickString(connection?.isp, data.org),
        org: pickString(connection?.org, data.org),
        asNumber: pickString(connection?.asn),
        status: 'success',
      };
    },
  },
  {
    name: 'ipapi.co',
    queryUrl: (ip: string) => `https://ipapi.co/${encodeURIComponent(ip)}/json/`,
    autodetectUrl: 'https://ipapi.co/json/',
    mapResult: (data, requestedIp) => {
      if (data.error === true) {
        return {
          ip: pickString(data.ip, requestedIp),
          country: '',
          region: '',
          city: '',
          isp: '',
          org: '',
          asNumber: '',
          status: 'fail',
          message: pickString(data.reason, 'Unknown error'),
        };
      }

      const ip = pickString(data.ip, requestedIp);
      if (!ip) {
        return null;
      }

      return {
        ip,
        country: pickString(data.country_name, data.country),
        region: pickString(data.region),
        city: pickString(data.city),
        isp: pickString(data.org),
        org: pickString(data.org),
        asNumber: pickString(data.asn),
        status: 'success',
      };
    },
  },
];

/**
 * 检测是否运行在 Tauri 环境
 * 通过检查 window.__TAURI_INTERNALS__ 判断
 */
function isTauriEnvironment(): boolean {
  try {
    const tauriGlobal = globalThis as typeof globalThis & { __TAURI_INTERNALS__?: unknown };
    return typeof window !== 'undefined' && !!tauriGlobal.__TAURI_INTERNALS__;
  } catch {
    return false;
  }
}

/**
 * 使用 Tauri HTTP 插件发送请求
 * 动态导入 @tauri-apps/plugin-http 以避免构建错误
 */
async function tauriFetch(url: string, options?: RequestInit): Promise<Response> {
  try {
    // 动态导入 Tauri HTTP 插件
    const { fetch: tauriFetchFn } = await import('@tauri-apps/plugin-http');
    return tauriFetchFn(url, options);
  } catch (importError) {
    // 如果导入失败，可能是模块未正确加载，尝试使用全局 fetch
    console.warn('Tauri HTTP plugin import failed, falling back to native fetch:', importError);
    return fetch(url, options);
  }
}

/**
 * 检查是否为混合内容错误
 */
function isMixedContentError(error: Error): boolean {
  return error.message.includes('Mixed Content') || 
         error.message.includes('Failed to fetch') ||
         error.message.includes('NetworkError');
}

/**
 * 创建混合内容错误响应
 */
function createMixedContentError(): GeolocationInfo {
  return {
    ip: '',
    country: '',
    region: '',
    city: '',
    isp: '',
    org: '',
    asNumber: '',
    status: 'fail',
    message: 'MIXED_CONTENT_ERROR',
  };
}

async function queryGeolocationViaHttpsFallback(ip: string, fetchFn: FetchLike): Promise<GeolocationInfo | null> {
  for (const provider of HTTPS_GEOLOCATION_PROVIDERS) {
    const url = ip ? provider.queryUrl(ip) : provider.autodetectUrl;
    try {
      const response = await fetchFn(url);
      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const dataObj = asRecord(data);
      if (!dataObj) {
        continue;
      }

      const mapped = provider.mapResult(dataObj, ip);
      if (mapped) {
        return mapped;
      }
    } catch {
      // Ignore provider errors and continue with the next HTTPS provider.
    }
  }

  return null;
}

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

  try {
    // 根据环境选择 fetch 实现
    const fetchFn = isTauriEnvironment() ? tauriFetch : fetch;
    const response = await fetchFn(`${API_BASE}/json/${encodeURIComponent(trimmed)}`);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return mapApiResponse(data);
  } catch (error) {
    if (error instanceof Error && isMixedContentError(error)) {
      const fetchFn = isTauriEnvironment() ? tauriFetch : fetch;
      const fallbackResult = await queryGeolocationViaHttpsFallback(trimmed, fetchFn);
      if (fallbackResult) {
        return fallbackResult;
      }
      return createMixedContentError();
    }
    throw error;
  }
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
    try {
      // 根据环境选择 fetch 实现
      const fetchFn = isTauriEnvironment() ? tauriFetch : fetch;
      const response = await fetchFn(`${API_BASE}/batch`, {
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
    } catch (error) {
      if (error instanceof Error && isMixedContentError(error)) {
        // 在 HTTPS 页面里 batch endpoint 可能被阻止，回退到逐个 HTTPS 查询
        const fetchFn = isTauriEnvironment() ? tauriFetch : fetch;
        const fallbackResults = await Promise.all(
          publicIps.map((ip) => queryGeolocationViaHttpsFallback(ip, fetchFn))
        );

        for (let i = 0; i < fallbackResults.length; i++) {
          const index = publicIndices[i];
          const fallbackResult = fallbackResults[i];
          if (fallbackResult) {
            results[index] = fallbackResult;
            continue;
          }

          results[index] = {
            ip: trimmedIps[index],
            country: '',
            region: '',
            city: '',
            isp: '',
            org: '',
            asNumber: '',
            status: 'fail',
            message: 'MIXED_CONTENT_ERROR',
          };
        }
      } else {
        throw error;
      }
    }
  }

  return results;
}

/**
 * 通过 Tauri Command 获取本机公网 IP 信息
 * 这是最可靠的方式，因为 Rust 后端直接执行 HTTP 请求，不受前端代理影响
 * 返回包含真实 IP 和代理 IP 的完整信息
 */
async function getPublicIpViaTauri(): Promise<TauriIpInfo | null> {
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const ipInfo: TauriIpInfo = await invoke('get_public_ip');
    return ipInfo;
  } catch (error) {
    console.warn('Tauri command failed:', error);
    return null;
  }
}

/**
 * 获取本机公网 IP 地址
 * 使用多个备用服务确保获取到真实 IP
 * 
 * 策略：
 * 1. 如果在 Tauri 环境，优先使用 Tauri Command（最可靠）
 * 2. 否则使用原生 fetch 调用备用服务
 */
async function getMyPublicIp(): Promise<string | null> {
  // 如果在 Tauri 环境，优先使用 Rust Command
  if (isTauriEnvironment()) {
    const ipInfo = await getPublicIpViaTauri();
    if (ipInfo) return ipInfo.real_ip;
  }

  // 回退到前端 fetch
  for (const serviceUrl of IP_DETECTION_SERVICES) {
    try {
      const response = await fetch(serviceUrl);
      if (!response.ok) continue;

      const data = await response.json();

      // 不同服务的响应格式不同
      if (data.ip) return data.ip;
      if (data.origin) return data.origin;
      if (typeof data === 'string') return data.trim();
    } catch {
      // 继续尝试下一个服务
      continue;
    }
  }

  return null;
}

/**
 * 查询本机公网 IP 及归属信息
 * 在 Tauri 环境中会同时获取真实 IP 和代理 IP
 */
export async function queryMyIp(): Promise<GeolocationInfo> {
  try {
    // 在 Tauri 环境中，使用 Command 获取完整 IP 信息
    if (isTauriEnvironment()) {
      const ipInfo = await getPublicIpViaTauri();
      if (ipInfo) {
        // 查询真实 IP 的归属地
        const realIpInfo = await queryGeolocation(ipInfo.real_ip);
        
        // 如果使用了代理，在消息中显示代理 IP
        if (ipInfo.using_proxy && ipInfo.proxy_ip) {
          return {
            ...realIpInfo,
            message: `检测到代理: 真实 IP ${ipInfo.real_ip}, 代理 IP ${ipInfo.proxy_ip}`,
          };
        }
        
        return realIpInfo;
      }
    }

    // 非 Tauri 环境，使用传统方式
    const myIp = await getMyPublicIp();
    if (myIp) {
      return await queryGeolocation(myIp);
    }

    // 如果无法获取 IP，尝试直接调用 ip-api.com 的自动检测
    const fetchFn = isTauriEnvironment() ? tauriFetch : fetch;
    try {
      const response = await fetchFn(`${API_BASE}/json/`);
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      return mapApiResponse(data);
    } catch (error) {
      if (error instanceof Error && isMixedContentError(error)) {
        const fallbackResult = await queryGeolocationViaHttpsFallback('', fetchFn);
        if (fallbackResult) {
          return fallbackResult;
        }
        return createMixedContentError();
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof Error && isMixedContentError(error)) {
      return createMixedContentError();
    }
    throw error;
  }
}

/**
 * 获取本机 IP 的完整信息（包括真实 IP 和代理 IP）
 * 仅在 Tauri 环境中有效
 */
export async function queryMyIpDetailed(): Promise<{ realIp: GeolocationInfo; proxyIp?: GeolocationInfo } | null> {
  if (!isTauriEnvironment()) {
    return null;
  }

  try {
    const ipInfo = await getPublicIpViaTauri();
    if (!ipInfo) return null;

    const realIpInfo = await queryGeolocation(ipInfo.real_ip);
    
    if (ipInfo.proxy_ip && ipInfo.proxy_ip !== ipInfo.real_ip) {
      const proxyIpInfo = await queryGeolocation(ipInfo.proxy_ip);
      return { realIp: realIpInfo, proxyIp: proxyIpInfo };
    }

    return { realIp: realIpInfo };
  } catch (error) {
    console.error('Failed to get detailed IP info:', error);
    return null;
  }
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

  if (isValidIPv4(trimmed)) {
    const num = parseIPv4ToInteger(trimmed, 'dotted');
    return isPrivateOrReservedIPv4(num);
  }

  try {
    const num = parseIPv6(trimmed);
    return isPrivateOrReservedIPv6(num);
  } catch {
    return false;
  }
}

function isPrivateOrReservedIPv4(num: number): boolean {
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

function isPrivateOrReservedIPv6(num: bigint): boolean {
  // ::/128 unspecified
  if (num === 0n) return true;

  // ::1/128 loopback
  if (num === 1n) return true;

  const top8 = Number((num >> 120n) & 0xFFn);
  const top16 = Number((num >> 112n) & 0xFFFFn);
  const top32 = Number((num >> 96n) & 0xFFFFFFFFn);

  // fc00::/7 unique local
  if ((top8 & 0xFE) === 0xFC) return true;

  // fe80::/10 link-local
  if ((top16 & 0xFFC0) === 0xFE80) return true;

  // ff00::/8 multicast
  if (top8 === 0xFF) return true;

  // 2001:db8::/32 documentation range
  if (top32 === 0x20010DB8) return true;

  // ::ffff:0:0/96 IPv4-mapped addresses; reuse IPv4 private/reserved checks
  if ((num >> 32n) === 0xFFFFn) {
    const mappedIPv4 = Number(num & 0xFFFFFFFFn);
    return isPrivateOrReservedIPv4(mappedIPv4);
  }

  return false;
}
