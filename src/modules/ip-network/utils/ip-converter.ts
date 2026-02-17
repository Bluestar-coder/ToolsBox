/**
 * IP 地址格式转换
 *
 * convertIPv4: 接受任意格式（dotted / hex / binary / integer）的 IPv4 输入，返回所有格式
 * convertIPv6: 接受任意格式的 IPv6 输入，返回 full / compressed / binary
 */
import type { IPv4Formats, IPv6Formats } from './types';
import {
  detectIpFormat,
  parseIPv4ToInteger,
  integerToIPv4Formats,
  parseIPv6,
  bigintToIPv6Formats,
} from './ip-utils';

/**
 * 转换 IPv4 地址：输入任意格式，输出所有格式
 * @throws Error 当输入无法解析为合法 IPv4 地址时
 */
export function convertIPv4(input: string): IPv4Formats {
  const trimmed = input.trim();
  if (trimmed === '') {
    throw new Error('Input cannot be empty');
  }

  const format = detectIpFormat(trimmed);

  if (format === 'ipv6') {
    throw new Error(`"${trimmed}" is an IPv6 address, not IPv4`);
  }

  if (format === 'unknown') {
    throw new Error(`Cannot parse "${trimmed}" as a valid IPv4 address`);
  }

  const integer = parseIPv4ToInteger(trimmed, format);
  return integerToIPv4Formats(integer);
}

/**
 * 转换 IPv6 地址：输入任意格式，输出 full / compressed / binary
 * @throws Error 当输入无法解析为合法 IPv6 地址时
 */
export function convertIPv6(input: string): IPv6Formats {
  const trimmed = input.trim();
  if (trimmed === '') {
    throw new Error('Input cannot be empty');
  }

  const format = detectIpFormat(trimmed);

  if (format !== 'ipv6') {
    throw new Error(`"${trimmed}" is not a valid IPv6 address`);
  }

  const bigint = parseIPv6(trimmed);
  return bigintToIPv6Formats(bigint);
}
