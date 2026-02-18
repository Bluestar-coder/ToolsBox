/**
 * 子网掩码转换工具
 * 提供子网掩码在不同格式之间的转换功能
 */

/**
 * 子网掩码信息
 */
export interface SubnetMaskInfo {
  /** CIDR表示法 (例如: 24) */
  cidr: number;
  /** 点分十进制表示法 (例如: 255.255.255.0) */
  dottedDecimal: string;
  /** 二进制表示法 (例如: 11111111.11111111.11111111.00000000) */
  binary: string;
  /** 子网位数 */
  subnetBits: number;
  /** 主机位数 */
  hostBits: number;
  /** 子网数量 */
  subnetCount: number;
  /** 每个子网的主机数 */
  hostsPerSubnet: number;
  /** 可用主机数 */
  usableHosts: number;
  /** 子网掩码整数表示 */
  integer: number;
  /** 十六进制表示 */
  hexadecimal: string;
}

/**
 * 网络信息
 */
export interface NetworkInfo {
  /** 网络地址 */
  networkAddress: string;
  /** 广播地址 */
  broadcastAddress: string;
  /** 第一个可用IP地址 */
  firstUsableIp: string;
  /** 最后一个可用IP地址 */
  lastUsableIp: string;
  /** 子网掩码信息 */
  subnetMask: SubnetMaskInfo;
  /** 总主机数 */
  totalHosts: number;
  /** 通配符掩码 */
  wildcardMask: string;
}

/**
 * 子网规划信息
 */
export interface SubnetPlan {
  /** 子网索引 */
  index: number;
  /** 网络地址 */
  networkAddress: string;
  /** 广播地址 */
  broadcastAddress: string;
  /** 第一个可用IP */
  firstUsableIp: string;
  /** 最后一个可用IP */
  lastUsableIp: string;
  /** CIDR */
  cidr: number;
  /** 子网掩码 */
  subnetMask: string;
  /** 主机数量 */
  hostCount: number;
  /** 描述 */
  description?: string;
}

/**
 * 将CIDR转换为点分十进制子网掩码
 * @param cidr CIDR值 (0-32)
 * @returns 点分十进制子网掩码
 */
export function cidrToDottedDecimal(cidr: number): string {
  if (cidr < 0 || cidr > 32) {
    throw new Error('CIDR值必须在0-32之间');
  }

  // 特殊处理CIDR为0的情况
  if (cidr === 0) {
    return '0.0.0.0';
  }

  const mask = (0xffffffff << (32 - cidr)) >>> 0;
  const octets = [
    (mask >>> 24) & 0xff,
    (mask >>> 16) & 0xff,
    (mask >>> 8) & 0xff,
    mask & 0xff
  ];

  return octets.join('.');
}

/**
 * 将点分十进制子网掩码转换为CIDR
 * @param dottedDecimal 点分十进制子网掩码
 * @returns CIDR值
 */
export function dottedDecimalToCidr(dottedDecimal: string): number {
  const parts = dottedDecimal.split('.').map(part => parseInt(part, 10));
  
  if (parts.length !== 4 || parts.some(part => isNaN(part) || part < 0 || part > 255)) {
    throw new Error('无效的点分十进制子网掩码');
  }

  // 验证子网掩码是否连续
  const binary = parts.map(part => part.toString(2).padStart(8, '0')).join('');
  const hasInvalidPattern = /01/.test(binary);
  
  if (hasInvalidPattern) {
    throw new Error('无效的子网掩码，必须由连续的1后跟连续的0组成');
  }

  // 计算1的个数
  return binary.replace(/0/g, '').length;
}

/**
 * 将点分十进制转换为二进制表示
 * @param dottedDecimal 点分十进制子网掩码
 * @returns 二进制表示
 */
export function dottedDecimalToBinary(dottedDecimal: string): string {
  const parts = dottedDecimal.split('.').map(part => parseInt(part, 10));
  return parts.map(part => part.toString(2).padStart(8, '0')).join('.');
}

/**
 * 将二进制转换为点分十进制
 * @param binary 二进制表示 (例如: 11111111.11111111.11111111.00000000)
 * @returns 点分十进制表示
 */
export function binaryToDottedDecimal(binary: string): string {
  const parts = binary.split('.');
  if (parts.length !== 4) {
    throw new Error('无效的二进制子网掩码格式');
  }

  const dottedDecimal = parts.map(part => {
    if (part.length !== 8 || !/^[01]+$/.test(part)) {
      throw new Error('无效的二进制子网掩码');
    }
    return parseInt(part, 2).toString();
  }).join('.');

  // 验证转换后的点分十进制是否是有效的子网掩码
  try {
    dottedDecimalToCidr(dottedDecimal);
  } catch (error) {
    throw new Error('无效的二进制子网掩码');
  }

  return dottedDecimal;
}

/**
 * 将点分十进制转换为整数
 * @param dottedDecimal 点分十进制表示
 * @returns 整数表示
 */
export function dottedDecimalToInteger(dottedDecimal: string): number {
  const parts = dottedDecimal.split('.').map(part => parseInt(part, 10));
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

/**
 * 将整数转换为点分十进制
 * @param integer 整数表示
 * @returns 点分十进制表示
 */
export function integerToDottedDecimal(integer: number): string {
  return [
    (integer >>> 24) & 0xff,
    (integer >>> 16) & 0xff,
    (integer >>> 8) & 0xff,
    integer & 0xff
  ].join('.');
}

/**
 * 将点分十进制转换为十六进制
 * @param dottedDecimal 点分十进制表示
 * @returns 十六进制表示
 */
export function dottedDecimalToHexadecimal(dottedDecimal: string): string {
  const integer = dottedDecimalToInteger(dottedDecimal);
  return '0x' + integer.toString(16).toUpperCase().padStart(8, '0');
}

/**
 * 获取子网掩码的详细信息
 * @param input 输入值 (可以是CIDR、点分十进制或二进制)
 * @returns 子网掩码详细信息
 */
export function getSubnetMaskInfo(input: string | number): SubnetMaskInfo {
  let cidr: number;

  // 根据输入类型确定CIDR值
  if (typeof input === 'number') {
    cidr = input;
  } else if (input.includes('.')) {
    // 检查是否是二进制格式
    const parts = input.split('.');
    if (parts.length === 4 && parts.every(part => /^[01]+$/.test(part) && part.length === 8)) {
      // 二进制转点分十进制
      const dottedDecimal = binaryToDottedDecimal(input);
      cidr = dottedDecimalToCidr(dottedDecimal);
    } else {
      // 点分十进制
      cidr = dottedDecimalToCidr(input);
    }
  } else {
    // 假设是CIDR
    cidr = parseInt(input, 10);
  }

  if (cidr < 0 || cidr > 32) {
    throw new Error('CIDR值必须在0-32之间');
  }

  const dottedDecimal = cidrToDottedDecimal(cidr);
  const binary = dottedDecimalToBinary(dottedDecimal);
  const subnetBits = cidr;
  const hostBits = 32 - cidr;
  const subnetCount = Math.pow(2, subnetBits);
  const hostsPerSubnet = Math.pow(2, hostBits);
  const usableHosts = hostsPerSubnet > 2 ? hostsPerSubnet - 2 : (hostsPerSubnet === 1 ? 1 : 0);
  const integer = dottedDecimalToInteger(dottedDecimal);
  const hexadecimal = dottedDecimalToHexadecimal(dottedDecimal);

  return {
    cidr,
    dottedDecimal,
    binary,
    subnetBits,
    hostBits,
    subnetCount,
    hostsPerSubnet,
    usableHosts,
    integer,
    hexadecimal
  };
}

/**
 * 计算网络信息
 * @param ipAddress IP地址
 * @param subnetMask 子网掩码 (可以是CIDR、点分十进制或二进制)
 * @returns 网络信息
 */
export function calculateNetworkInfo(ipAddress: string, subnetMask: string | number): NetworkInfo {
  // 验证IP地址
  const ipParts = ipAddress.split('.').map(part => parseInt(part, 10));
  if (ipParts.length !== 4 || ipParts.some(part => isNaN(part) || part < 0 || part > 255)) {
    throw new Error('无效的IP地址');
  }

  // 获取子网掩码信息
  const maskInfo = getSubnetMaskInfo(subnetMask);
  const maskInteger = dottedDecimalToInteger(maskInfo.dottedDecimal);
  
  // 计算网络地址和广播地址
  const ipInteger = dottedDecimalToInteger(ipAddress);
  const networkAddressInteger = ipInteger & maskInteger;
  const broadcastAddressInteger = networkAddressInteger | (~maskInteger >>> 0);
  
  const networkAddress = integerToDottedDecimal(networkAddressInteger);
  const broadcastAddress = integerToDottedDecimal(broadcastAddressInteger);
  
  // 计算可用IP范围
  let firstUsableIp = networkAddress;
  let lastUsableIp = broadcastAddress;
  
  if (maskInfo.hostBits > 1) {
    // 如果有超过1个主机位，第一个可用IP是网络地址+1，最后一个是广播地址-1
    firstUsableIp = integerToDottedDecimal(networkAddressInteger + 1);
    lastUsableIp = integerToDottedDecimal(broadcastAddressInteger - 1);
  } else if (maskInfo.hostBits === 1) {
    // /31网络的特殊情况，两个IP地址都可用
    firstUsableIp = integerToDottedDecimal(networkAddressInteger);
    lastUsableIp = integerToDottedDecimal(broadcastAddressInteger);
  }
  
  // 计算通配符掩码
  const wildcardMaskInteger = ~maskInteger >>> 0;
  const wildcardMask = integerToDottedDecimal(wildcardMaskInteger);

  return {
    networkAddress,
    broadcastAddress,
    firstUsableIp,
    lastUsableIp,
    subnetMask: maskInfo,
    totalHosts: maskInfo.hostsPerSubnet,
    wildcardMask
  };
}

/**
 * 子网规划
 * @param networkAddress 网络地址
 * @param cidr 主网络的CIDR
 * @param subnetCidr 子网的CIDR
 * @returns 子网规划列表
 */
export function planSubnets(networkAddress: string, cidr: number, subnetCidr: number): SubnetPlan[] {
  if (subnetCidr < cidr) {
    throw new Error('子网CIDR必须大于或等于主网络CIDR');
  }

  const mainNetworkInfo = calculateNetworkInfo(networkAddress, cidr);
  const subnetMaskInfo = getSubnetMaskInfo(subnetCidr);
  
  const subnetBits = subnetCidr - cidr;
  const subnetCount = Math.pow(2, subnetBits);
  
  const subnets: SubnetPlan[] = [];
  
  for (let i = 0; i < subnetCount; i++) {
    // 计算子网的网络地址
    const subnetSize = Math.pow(2, 32 - subnetCidr);
    const networkAddressInteger = dottedDecimalToInteger(mainNetworkInfo.networkAddress) + (i * subnetSize);
    const subnetNetworkAddress = integerToDottedDecimal(networkAddressInteger);
    
    // 计算子网的广播地址
    const subnetMaskInteger = dottedDecimalToInteger(subnetMaskInfo.dottedDecimal);
    const broadcastAddressInteger = networkAddressInteger | (~subnetMaskInteger >>> 0);
    const broadcastAddress = integerToDottedDecimal(broadcastAddressInteger);
    
    // 计算可用IP范围
    let firstUsableIp = subnetNetworkAddress;
    let lastUsableIp = broadcastAddress;
    
    if (subnetMaskInfo.hostBits > 1) {
      firstUsableIp = integerToDottedDecimal(networkAddressInteger + 1);
      lastUsableIp = integerToDottedDecimal(broadcastAddressInteger - 1);
    } else if (subnetMaskInfo.hostBits === 1) {
      // /31网络的特殊情况，两个IP地址都可用
      firstUsableIp = integerToDottedDecimal(networkAddressInteger);
      lastUsableIp = integerToDottedDecimal(broadcastAddressInteger);
    }
    
    subnets.push({
      index: i + 1,
      networkAddress: subnetNetworkAddress,
      broadcastAddress,
      firstUsableIp,
      lastUsableIp,
      cidr: subnetCidr,
      subnetMask: subnetMaskInfo.dottedDecimal,
      hostCount: subnetMaskInfo.usableHosts
    });
  }
  
  return subnets;
}

/**
 * 根据所需主机数推荐子网掩码
 * @param hostCount 所需主机数
 * @returns 推荐的CIDR值
 */
export function recommendSubnetMask(hostCount: number): number {
  // 加上2个地址（网络地址和广播地址）
  const requiredHosts = hostCount + 2;
  
  // 找到最小的2的幂大于等于所需主机数
  let power = 1;
  let hostBits = 0;
  
  while (power < requiredHosts && hostBits < 32) {
    power *= 2;
    hostBits++;
  }
  
  return 32 - hostBits;
}

/**
 * 验证子网掩码格式
 * @param input 输入值
 * @returns 验证结果
 */
export function validateSubnetMask(input: string): { isValid: boolean; format?: string; error?: string } {
  try {
    // 尝试解析为CIDR
    if (/^\d+$/.test(input)) {
      const cidr = parseInt(input, 10);
      if (cidr >= 0 && cidr <= 32) {
        return { isValid: true, format: 'cidr' };
      }
    }
    
    // 尝试解析为二进制
    if (/^[01.]+$/.test(input)) {
      const parts = input.split('.');
      if (parts.length === 4 && parts.every(part => part.length === 8)) {
        const dottedDecimal = binaryToDottedDecimal(input);
        dottedDecimalToCidr(dottedDecimal);
        return { isValid: true, format: 'binary' };
      }
    }
    
    // 尝试解析为点分十进制
    if (/^\d+\.\d+\.\d+\.\d+$/.test(input)) {
      dottedDecimalToCidr(input);
      return { isValid: true, format: 'dottedDecimal' };
    }
    
    return { isValid: false, error: '无法识别的子网掩码格式' };
  } catch (error) {
    return { isValid: false, error: error instanceof Error ? error.message : '无效的子网掩码' };
  }
}