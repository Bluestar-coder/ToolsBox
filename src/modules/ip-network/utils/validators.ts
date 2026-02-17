/**
 * IP/网络工具输入验证函数
 */

/**
 * 验证 IPv4 地址（点分十进制格式）
 * 合法格式：四个 0-255 的十进制数，以 "." 分隔
 */
export function isValidIPv4(ip: string): boolean {
  if (typeof ip !== 'string') return false;
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    if (part === '' || !/^\d+$/.test(part)) return false;
    // 禁止前导零（如 "01"），但允许单独的 "0"
    if (part.length > 1 && part[0] === '0') return false;
    const num = Number(part);
    return num >= 0 && num <= 255;
  });
}

/**
 * 验证 IPv6 地址
 * 支持完整形式、压缩形式（::）和混合形式
 */
export function isValidIPv6(ip: string): boolean {
  if (typeof ip !== 'string' || ip.length === 0) return false;

  // 去除可能的 zone ID（如 %eth0）
  const addr = ip.split('%')[0];

  // 处理 :: 压缩表示
  if (addr.includes('::')) {
    // :: 最多出现一次
    if (addr.indexOf('::') !== addr.lastIndexOf('::')) return false;

    const [left, right] = addr.split('::');
    const leftGroups = left === '' ? [] : left.split(':');
    const rightGroups = right === '' ? [] : right.split(':');

    // 总组数不能超过 8
    if (leftGroups.length + rightGroups.length > 7) return false;

    return (
      leftGroups.every(isValidIPv6Group) &&
      rightGroups.every(isValidIPv6Group)
    );
  }

  // 非压缩形式：必须恰好 8 组
  const groups = addr.split(':');
  if (groups.length !== 8) return false;
  return groups.every(isValidIPv6Group);
}

/** 验证单个 IPv6 组（1-4 位十六进制） */
function isValidIPv6Group(group: string): boolean {
  if (group.length === 0 || group.length > 4) return false;
  return /^[0-9a-fA-F]{1,4}$/.test(group);
}

/**
 * 验证 CIDR 表示法
 * 支持 IPv4 CIDR（前缀长度 0-32）
 */
export function isValidCidr(cidr: string): boolean {
  if (typeof cidr !== 'string') return false;
  const parts = cidr.split('/');
  if (parts.length !== 2) return false;

  const [ip, prefixStr] = parts;
  if (!isValidIPv4(ip)) return false;

  if (prefixStr === '' || !/^\d+$/.test(prefixStr)) return false;
  // 禁止前导零
  if (prefixStr.length > 1 && prefixStr[0] === '0') return false;

  const prefix = Number(prefixStr);
  return prefix >= 0 && prefix <= 32;
}

/**
 * 验证端口号范围 (0-65535)
 */
export function isValidPort(port: number): boolean {
  if (typeof port !== 'number' || !Number.isInteger(port)) return false;
  return port >= 0 && port <= 65535;
}
