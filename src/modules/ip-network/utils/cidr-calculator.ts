/**
 * CIDR 计算器工具函数
 */
import type { CidrInfo } from './types';
import { parseIPv4ToInteger, integerToIPv4Formats } from './ip-utils';
import { isValidCidr, isValidIPv4 } from './validators';

export { isValidCidr } from './validators';

/**
 * 根据 CIDR 表示法计算网络信息
 *
 * @param cidr - CIDR 表示法字符串，如 "192.168.1.0/24"
 * @returns CidrInfo 包含网络地址、广播地址、子网掩码等完整信息
 * @throws Error 如果 CIDR 格式无效
 */
export function calculateCidr(cidr: string): CidrInfo {
  if (!isValidCidr(cidr)) {
    throw new Error(`Invalid CIDR notation: ${cidr}`);
  }

  const [ipStr, prefixStr] = cidr.split('/');
  const prefix = Number(prefixStr);
  const ipInt = parseIPv4ToInteger(ipStr, 'dotted');

  // Compute subnet mask as unsigned 32-bit
  const maskInt = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  const wildcardInt = (~maskInt) >>> 0;

  const networkInt = (ipInt & maskInt) >>> 0;
  const broadcastInt = (networkInt | wildcardInt) >>> 0;

  const totalHosts = Math.pow(2, 32 - prefix);

  let usableHosts: number;
  let firstHostInt: number;
  let lastHostInt: number;

  if (prefix === 32) {
    // /32: single host
    usableHosts = 1;
    firstHostInt = networkInt;
    lastHostInt = networkInt;
  } else if (prefix === 31) {
    // /31: point-to-point link (RFC 3021)
    usableHosts = 2;
    firstHostInt = networkInt;
    lastHostInt = broadcastInt;
  } else {
    usableHosts = totalHosts - 2;
    firstHostInt = (networkInt + 1) >>> 0;
    lastHostInt = (broadcastInt - 1) >>> 0;
  }

  const networkFormats = integerToIPv4Formats(networkInt);
  const broadcastFormats = integerToIPv4Formats(broadcastInt);
  const maskFormats = integerToIPv4Formats(maskInt);
  const wildcardFormats = integerToIPv4Formats(wildcardInt);
  const firstHostFormats = integerToIPv4Formats(firstHostInt);
  const lastHostFormats = integerToIPv4Formats(lastHostInt);

  return {
    networkAddress: networkFormats.dotted,
    broadcastAddress: broadcastFormats.dotted,
    subnetMask: maskFormats.dotted,
    subnetMaskBinary: maskFormats.binary,
    wildcardMask: wildcardFormats.dotted,
    firstHost: firstHostFormats.dotted,
    lastHost: lastHostFormats.dotted,
    totalHosts,
    usableHosts,
    prefixLength: prefix,
  };
}

/**
 * 根据两个 IP 地址计算能同时包含它们的最小 CIDR 网段
 *
 * @param ip1 - 第一个 IPv4 地址（点分十进制）
 * @param ip2 - 第二个 IPv4 地址（点分十进制）
 * @returns CIDR 表示法字符串，如 "192.168.0.0/23"
 * @throws Error 如果任一 IP 地址无效
 */
export function calculateMinimumCidr(ip1: string, ip2: string): string {
  if (!isValidIPv4(ip1)) {
    throw new Error(`Invalid IPv4 address: ${ip1}`);
  }
  if (!isValidIPv4(ip2)) {
    throw new Error(`Invalid IPv4 address: ${ip2}`);
  }

  const int1 = parseIPv4ToInteger(ip1, 'dotted');
  const int2 = parseIPv4ToInteger(ip2, 'dotted');

  // XOR to find differing bits, then count leading common bits
  const xor = (int1 ^ int2) >>> 0;
  const prefix = xor === 0 ? 32 : Math.clz32(xor);

  // Compute the network address for this prefix
  const maskInt = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  const networkInt = (int1 & maskInt) >>> 0;
  const networkFormats = integerToIPv4Formats(networkInt);

  return `${networkFormats.dotted}/${prefix}`;
}
