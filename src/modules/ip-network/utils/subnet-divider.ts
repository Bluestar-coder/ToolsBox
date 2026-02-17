/**
 * 子网划分工具函数
 */
import type { SubnetEntry, SubnetDivisionResult } from './types';
import { calculateCidr, isValidCidr } from './cidr-calculator';
import { parseIPv4ToInteger, integerToIPv4Formats } from './ip-utils';

/**
 * 计算网段可划分的最大子网数
 *
 * 最大子网数 = 2^(32 - prefixLength)，但至少每个子网需要 /30（4 个地址）才有意义，
 * 所以最大子网数 = 2^(30 - prefixLength)。对于 /31 和 /32 无法再划分。
 *
 * @param cidr - CIDR 表示法字符串
 * @returns 最大可划分子网数
 */
export function getMaxSubnetCount(cidr: string): number {
  if (!isValidCidr(cidr)) {
    throw new Error(`Invalid CIDR notation: ${cidr}`);
  }
  const prefix = Number(cidr.split('/')[1]);
  // Can subdivide down to /32 at most
  const bitsAvailable = 32 - prefix;
  if (bitsAvailable <= 0) return 0;
  return Math.pow(2, bitsAvailable);
}

/**
 * 计算网段可容纳的最大每子网主机数
 *
 * 最大主机数 = 原始网段的可用主机数（即不再划分时的主机数）
 *
 * @param cidr - CIDR 表示法字符串
 * @returns 最大每子网可用主机数
 */
export function getMaxHostCount(cidr: string): number {
  if (!isValidCidr(cidr)) {
    throw new Error(`Invalid CIDR notation: ${cidr}`);
  }
  const prefix = Number(cidr.split('/')[1]);
  if (prefix >= 31) return 0;
  return Math.pow(2, 32 - prefix) - 2;
}

/**
 * 按子网数量划分网段
 *
 * count 会被向上取整到最近的 2 的幂次。
 * 新前缀长度 = 原前缀 + ceil(log2(count))
 *
 * @param cidr - CIDR 表示法字符串
 * @param count - 需要划分的子网数量（≥1）
 * @returns SubnetDivisionResult 划分结果
 */
export function divideBySubnetCount(cidr: string, count: number): SubnetDivisionResult {
  if (!isValidCidr(cidr)) {
    throw new Error(`Invalid CIDR notation: ${cidr}`);
  }
  if (!Number.isInteger(count) || count < 1) {
    throw new Error('Subnet count must be a positive integer');
  }

  const prefix = Number(cidr.split('/')[1]);
  const maxCount = getMaxSubnetCount(cidr);

  if (maxCount === 0) {
    throw new Error(`Cannot subdivide a /${prefix} network`);
  }
  if (count > maxCount) {
    throw new Error(
      `Requested ${count} subnets exceeds maximum of ${maxCount} for this network`
    );
  }

  // Round up to next power of 2
  const bitsNeeded = Math.ceil(Math.log2(count));
  const actualCount = Math.pow(2, bitsNeeded);
  const newPrefix = prefix + bitsNeeded;

  return generateSubnets(cidr, newPrefix, actualCount);
}

/**
 * 按每子网最小主机数量划分网段
 *
 * 新前缀长度 = 32 - ceil(log2(hostsPerSubnet + 2))
 *
 * @param cidr - CIDR 表示法字符串
 * @param hostsPerSubnet - 每个子网所需的最小可用主机数（≥1）
 * @returns SubnetDivisionResult 划分结果
 */
export function divideByHostCount(cidr: string, hostsPerSubnet: number): SubnetDivisionResult {
  if (!isValidCidr(cidr)) {
    throw new Error(`Invalid CIDR notation: ${cidr}`);
  }
  if (!Number.isInteger(hostsPerSubnet) || hostsPerSubnet < 1) {
    throw new Error('Hosts per subnet must be a positive integer');
  }

  const prefix = Number(cidr.split('/')[1]);
  const maxHosts = getMaxHostCount(cidr);

  if (maxHosts === 0) {
    throw new Error(`Cannot subdivide a /${prefix} network for host allocation`);
  }
  if (hostsPerSubnet > maxHosts) {
    throw new Error(
      `Requested ${hostsPerSubnet} hosts per subnet exceeds maximum of ${maxHosts} for this network`
    );
  }

  // Calculate new prefix: need at least hostsPerSubnet + 2 addresses (network + broadcast)
  const hostBits = Math.ceil(Math.log2(hostsPerSubnet + 2));
  const newPrefix = 32 - hostBits;

  // Number of subnets that fit
  const subnetCount = Math.pow(2, newPrefix - prefix);

  return generateSubnets(cidr, newPrefix, subnetCount);
}

/**
 * 生成子网列表
 */
function generateSubnets(
  cidr: string,
  newPrefix: number,
  subnetCount: number
): SubnetDivisionResult {
  const parentInfo = calculateCidr(cidr);
  const parentNetworkInt = parseIPv4ToInteger(parentInfo.networkAddress, 'dotted');

  // Size of each subnet in addresses
  const subnetSize = Math.pow(2, 32 - newPrefix);

  const subnets: SubnetEntry[] = [];

  for (let i = 0; i < subnetCount; i++) {
    const networkInt = (parentNetworkInt + i * subnetSize) >>> 0;
    const broadcastInt = (networkInt + subnetSize - 1) >>> 0;

    const networkAddr = integerToIPv4Formats(networkInt).dotted;
    const broadcastAddr = integerToIPv4Formats(broadcastInt).dotted;

    let firstHost: string;
    let lastHost: string;
    let usableHosts: number;

    if (newPrefix === 32) {
      firstHost = networkAddr;
      lastHost = networkAddr;
      usableHosts = 1;
    } else if (newPrefix === 31) {
      firstHost = networkAddr;
      lastHost = broadcastAddr;
      usableHosts = 2;
    } else {
      firstHost = integerToIPv4Formats((networkInt + 1) >>> 0).dotted;
      lastHost = integerToIPv4Formats((broadcastInt - 1) >>> 0).dotted;
      usableHosts = subnetSize - 2;
    }

    subnets.push({
      index: i + 1,
      networkAddress: networkAddr,
      cidr: `${networkAddr}/${newPrefix}`,
      firstHost,
      lastHost,
      broadcastAddress: broadcastAddr,
      usableHosts,
    });
  }

  return {
    originalCidr: cidr,
    newPrefixLength: newPrefix,
    subnets,
  };
}
