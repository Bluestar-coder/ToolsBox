/**
 * IP 归属地查询 API 调用
 * 使用 ip-api.com 免费 API（HTTP，非 HTTPS）
 * 
 * 注意：由于浏览器安全策略（Mixed Content），在 HTTPS 页面中无法直接调用 HTTP API。
 * 在 Tauri 桌面应用中会自动使用 Tauri HTTP 插件绕过此限制。
 */
import type { GeolocationInfo, TauriIpInfo } from './types';
import { parseIPv4ToInteger } from './ip-utils';
import { isValidIPv4, isValidIPv6 } from './validators';

const API_BASE = 'http://ip-api.com';
const BATCH_MAX = 20;

// 备用 IP 查询服务（用于获取本机 IP）
const IP_DETECTION_SERVICES = [
  'https://api.ipify.org?format=json',
  'https://httpbin.org/ip',
  'https://api.my-ip.io/ip.json',
];

/**
 * 检测是否运行在 Tauri 环境
 * 通过检查 window.__TAURI_INTERNALS__ 判断
 */
function isTauriEnvironment(): boolean {
  try {
    return typeof window !== 'undefined' && !!(window as any).__TAURI_INTERNALS__;
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
    // @ts-ignore - @tauri-apps/plugin-http is only available in Tauri runtime
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
        // 为所有公共 IP 返回混合内容错误
        for (const index of publicIndices) {
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
    // @ts-ignore - Tauri API is only available in Tauri runtime
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
    const response = await fetchFn(`${API_BASE}/json/`);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return mapApiResponse(data);
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
