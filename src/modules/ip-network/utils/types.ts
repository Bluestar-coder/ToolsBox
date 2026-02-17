/** IPv4 地址的多格式表示 */
export interface IPv4Formats {
  dotted: string;      // "192.168.1.1"
  hex: string;         // "C0A80101"
  hexDotted: string;   // "0xC0.0xA8.0x01.0x01"
  binary: string;      // "11000000.10101000.00000001.00000001"
  integer: number;     // 3232235777
}

/** IPv6 地址的多格式表示 */
export interface IPv6Formats {
  full: string;        // "2001:0db8:0000:0000:0000:0000:0000:0001"
  compressed: string;  // "2001:db8::1"
  binary: string;      // 128位二进制字符串
}

/** IP 地址输入格式类型 */
export type IpInputFormat = 'dotted' | 'hex' | 'binary' | 'integer' | 'ipv6' | 'unknown';

/** CIDR 计算结果 */
export interface CidrInfo {
  networkAddress: string;
  broadcastAddress: string;
  subnetMask: string;
  subnetMaskBinary: string;
  wildcardMask: string;
  firstHost: string;
  lastHost: string;
  totalHosts: number;
  usableHosts: number;
  prefixLength: number;
}

/** 子网划分结果中的单个子网 */
export interface SubnetEntry {
  index: number;
  networkAddress: string;
  cidr: string;
  firstHost: string;
  lastHost: string;
  broadcastAddress: string;
  usableHosts: number;
}

/** 子网划分结果 */
export interface SubnetDivisionResult {
  originalCidr: string;
  newPrefixLength: number;
  subnets: SubnetEntry[];
}

/** IP 归属地信息 */
export interface GeolocationInfo {
  ip: string;
  country: string;
  region: string;
  city: string;
  isp: string;
  org: string;
  asNumber: string;
  status: 'success' | 'fail';
  message?: string;
}

/** 端口记录 */
export interface PortEntry {
  port: number;
  protocol: 'TCP' | 'UDP' | 'TCP/UDP';
  service: string;
  description: string;
  riskLevel: 'high' | 'medium' | 'low' | 'info';
}

/** 端口搜索结果 */
export interface PortSearchResult {
  entries: PortEntry[];
  totalCount: number;
}
