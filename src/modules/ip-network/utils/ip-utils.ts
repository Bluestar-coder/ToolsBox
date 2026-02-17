/**
 * 公共 IP 地址解析与转换工具
 */
import type { IPv4Formats, IPv6Formats, IpInputFormat } from './types';
import { isValidIPv4, isValidIPv6 } from './validators';

// ─── IPv4 ────────────────────────────────────────────────────────────────────

const MAX_IPV4 = 0xFFFFFFFF; // 4294967295

/**
 * 自动检测 IP 输入格式
 */
export function detectIpFormat(input: string): IpInputFormat {
  const trimmed = input.trim();
  if (trimmed === '') return 'unknown';

  // IPv6 check first (contains ":")
  if (trimmed.includes(':')) {
    return isValidIPv6(trimmed) ? 'ipv6' : 'unknown';
  }

  // Dotted decimal: "192.168.1.1"
  if (isValidIPv4(trimmed)) return 'dotted';

  // Binary: 32 bits with optional dots (e.g. "11000000.10101000.00000001.00000001" or "11000000101010000000000100000001")
  const binaryNoDots = trimmed.replace(/\./g, '');
  if (/^[01]+$/.test(binaryNoDots) && binaryNoDots.length === 32) return 'binary';

  // Hex: "C0A80101" or "0xC0A80101" or dotted hex "0xC0.0xA8.0x01.0x01"
  // Check hex before integer — hex requires: 0x prefix, hex letters (a-f), or dotted hex format
  if (isHexFormat(trimmed)) return 'hex';

  // Integer: pure digits, valid range
  if (/^\d+$/.test(trimmed)) {
    const num = Number(trimmed);
    if (num >= 0 && num <= MAX_IPV4 && Number.isSafeInteger(num)) return 'integer';
  }

  return 'unknown';
}

/**
 * Check if input is a hex IP format.
 * To distinguish from integer, plain hex (without 0x prefix) must contain at least one hex letter (a-f).
 */
function isHexFormat(input: string): boolean {
  // Dotted hex: "0xC0.0xA8.0x01.0x01"
  if (input.includes('.')) {
    const parts = input.split('.');
    if (parts.length === 4 && parts.every(p => /^0x[0-9a-fA-F]{1,2}$/i.test(p))) {
      return parts.every(p => {
        const val = parseInt(p, 16);
        return val >= 0 && val <= 255;
      });
    }
    return false;
  }
  // With 0x prefix: always hex
  if (input.startsWith('0x') || input.startsWith('0X')) {
    const hex = input.slice(2);
    return /^[0-9a-fA-F]{1,8}$/.test(hex) && parseInt(hex, 16) <= MAX_IPV4;
  }
  // Without prefix: must contain at least one hex letter (a-f) to distinguish from integer
  if (/^[0-9a-fA-F]{1,8}$/.test(input) && /[a-fA-F]/.test(input)) {
    return parseInt(input, 16) <= MAX_IPV4;
  }
  return false;
}

/**
 * 验证 IPv4 整数范围 (0 ~ 4294967295)
 */
export function isValidIPv4Integer(num: number): boolean {
  return Number.isInteger(num) && num >= 0 && num <= MAX_IPV4;
}

/**
 * 将任意格式的 IPv4 输入解析为 32 位整数
 */
export function parseIPv4ToInteger(input: string, format?: IpInputFormat): number {
  const trimmed = input.trim();
  const fmt = format ?? detectIpFormat(trimmed);

  switch (fmt) {
    case 'dotted':
      return dottedToInteger(trimmed);
    case 'hex':
      return hexToInteger(trimmed);
    case 'binary':
      return binaryToInteger(trimmed);
    case 'integer': {
      const num = Number(trimmed);
      if (!isValidIPv4Integer(num)) throw new Error(`Invalid IPv4 integer: ${trimmed}`);
      return num;
    }
    default:
      throw new Error(`Cannot parse "${trimmed}" as IPv4`);
  }
}

function dottedToInteger(ip: string): number {
  const parts = ip.split('.').map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function hexToInteger(input: string): number {
  // Dotted hex: "0xC0.0xA8.0x01.0x01"
  if (input.includes('.')) {
    const parts = input.split('.').map(p => parseInt(p, 16));
    return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
  }
  // Plain hex: "C0A80101" or "0xC0A80101"
  const hex = input.startsWith('0x') || input.startsWith('0X') ? input.slice(2) : input;
  const num = parseInt(hex, 16);
  if (!isValidIPv4Integer(num)) throw new Error(`Invalid hex IPv4: ${input}`);
  return num;
}

function binaryToInteger(input: string): number {
  const bits = input.replace(/\./g, '');
  if (bits.length !== 32 || !/^[01]+$/.test(bits)) {
    throw new Error(`Invalid binary IPv4: ${input}`);
  }
  return parseInt(bits, 2) >>> 0;
}

/**
 * 将 32 位整数转换为 IPv4 多格式表示
 */
export function integerToIPv4Formats(num: number): IPv4Formats {
  if (!isValidIPv4Integer(num)) {
    throw new Error(`Invalid IPv4 integer: ${num}`);
  }

  const octets = [
    (num >>> 24) & 0xFF,
    (num >>> 16) & 0xFF,
    (num >>> 8) & 0xFF,
    num & 0xFF,
  ];

  const dotted = octets.join('.');
  const hex = octets.map(o => o.toString(16).toUpperCase().padStart(2, '0')).join('');
  const hexDotted = octets.map(o => '0x' + o.toString(16).toUpperCase().padStart(2, '0')).join('.');
  const binary = octets.map(o => o.toString(2).padStart(8, '0')).join('.');

  return { dotted, hex, hexDotted, binary, integer: num };
}

// ─── IPv6 ────────────────────────────────────────────────────────────────────

const MAX_IPV6 = (1n << 128n) - 1n;

/**
 * 解析 IPv6 地址为 128 位 BigInt
 */
export function parseIPv6(input: string): bigint {
  const trimmed = input.trim();
  if (!isValidIPv6(trimmed)) {
    throw new Error(`Invalid IPv6 address: ${trimmed}`);
  }

  const groups = expandIPv6Groups(trimmed);
  let result = 0n;
  for (const g of groups) {
    result = (result << 16n) | BigInt(parseInt(g, 16));
  }
  return result;
}

/**
 * Expand an IPv6 address string into exactly 8 hex groups
 */
function expandIPv6Groups(ip: string): string[] {
  const addr = ip.split('%')[0]; // strip zone ID

  if (addr.includes('::')) {
    const [left, right] = addr.split('::');
    const leftGroups = left === '' ? [] : left.split(':');
    const rightGroups = right === '' ? [] : right.split(':');
    const missing = 8 - leftGroups.length - rightGroups.length;
    return [...leftGroups, ...Array(missing).fill('0'), ...rightGroups];
  }

  return addr.split(':');
}

/**
 * 将 BigInt 转换为 IPv6 多格式表示
 */
export function bigintToIPv6Formats(num: bigint): IPv6Formats {
  if (num < 0n || num > MAX_IPV6) {
    throw new Error(`Invalid IPv6 integer: ${num}`);
  }

  // Build 8 groups of 16-bit values
  const groups: string[] = [];
  let remaining = num;
  for (let i = 0; i < 8; i++) {
    groups.unshift((remaining & 0xFFFFn).toString(16));
    remaining >>= 16n;
  }

  // Full form: zero-padded 4-digit groups
  const full = groups.map(g => g.padStart(4, '0')).join(':');

  // Compressed form: collapse longest run of consecutive all-zero groups
  const compressed = compressIPv6(groups);

  // Binary: 128-bit string
  const binary = num.toString(2).padStart(128, '0');

  return { full, compressed, binary };
}

/**
 * Compress IPv6 groups by collapsing the longest run of zero groups into "::"
 */
function compressIPv6(groups: string[]): string {
  // Find the longest run of consecutive "0" groups
  let bestStart = -1;
  let bestLen = 0;
  let curStart = -1;
  let curLen = 0;

  for (let i = 0; i < groups.length; i++) {
    if (parseInt(groups[i], 16) === 0) {
      if (curStart === -1) curStart = i;
      curLen++;
      if (curLen > bestLen) {
        bestStart = curStart;
        bestLen = curLen;
      }
    } else {
      curStart = -1;
      curLen = 0;
    }
  }

  // Only compress if there's at least one zero group
  if (bestLen === 0) {
    return groups.map(g => parseInt(g, 16).toString(16)).join(':');
  }

  const before = groups.slice(0, bestStart).map(g => parseInt(g, 16).toString(16));
  const after = groups.slice(bestStart + bestLen).map(g => parseInt(g, 16).toString(16));

  if (before.length === 0 && after.length === 0) return '::';
  if (before.length === 0) return '::' + after.join(':');
  if (after.length === 0) return before.join(':') + '::';
  return before.join(':') + '::' + after.join(':');
}
