/**
 * 子网掩码转换工具测试
 */

import {
  cidrToDottedDecimal,
  dottedDecimalToCidr,
  dottedDecimalToBinary,
  binaryToDottedDecimal,
  dottedDecimalToInteger,
  integerToDottedDecimal,
  dottedDecimalToHexadecimal,
  getSubnetMaskInfo,
  calculateNetworkInfo,
  planSubnets,
  recommendSubnetMask,
  validateSubnetMask,
  SubnetMaskInfo,
  NetworkInfo,
  SubnetPlan
} from '../subnet-mask-converter';

describe('子网掩码转换工具', () => {
  describe('cidrToDottedDecimal', () => {
    it('应该正确转换CIDR到点分十进制', () => {
      expect(cidrToDottedDecimal(24)).toBe('255.255.255.0');
      expect(cidrToDottedDecimal(16)).toBe('255.255.0.0');
      expect(cidrToDottedDecimal(8)).toBe('255.0.0.0');
      expect(cidrToDottedDecimal(0)).toBe('0.0.0.0');
      expect(cidrToDottedDecimal(32)).toBe('255.255.255.255');
    });

    it('应该拒绝无效的CIDR值', () => {
      expect(() => cidrToDottedDecimal(-1)).toThrow('CIDR值必须在0-32之间');
      expect(() => cidrToDottedDecimal(33)).toThrow('CIDR值必须在0-32之间');
    });
  });

  describe('dottedDecimalToCidr', () => {
    it('应该正确转换点分十进制到CIDR', () => {
      expect(dottedDecimalToCidr('255.255.255.0')).toBe(24);
      expect(dottedDecimalToCidr('255.255.0.0')).toBe(16);
      expect(dottedDecimalToCidr('255.0.0.0')).toBe(8);
      expect(dottedDecimalToCidr('0.0.0.0')).toBe(0);
      expect(dottedDecimalToCidr('255.255.255.255')).toBe(32);
    });

    it('应该拒绝无效的点分十进制', () => {
      expect(() => dottedDecimalToCidr('255.255.255.1')).toThrow('无效的子网掩码，必须由连续的1后跟连续的0组成');
      expect(() => dottedDecimalToCidr('255.255.255')).toThrow('无效的点分十进制子网掩码');
      expect(() => dottedDecimalToCidr('256.255.255.0')).toThrow('无效的点分十进制子网掩码');
    });
  });

  describe('dottedDecimalToBinary', () => {
    it('应该正确转换点分十进制到二进制', () => {
      expect(dottedDecimalToBinary('255.255.255.0')).toBe('11111111.11111111.11111111.00000000');
      expect(dottedDecimalToBinary('255.255.0.0')).toBe('11111111.11111111.00000000.00000000');
      expect(dottedDecimalToBinary('255.0.0.0')).toBe('11111111.00000000.00000000.00000000');
    });
  });

  describe('binaryToDottedDecimal', () => {
    it('应该正确转换二进制到点分十进制', () => {
      expect(binaryToDottedDecimal('11111111.11111111.11111111.00000000')).toBe('255.255.255.0');
      expect(binaryToDottedDecimal('11111111.11111111.00000000.00000000')).toBe('255.255.0.0');
      expect(binaryToDottedDecimal('11111111.00000000.00000000.00000000')).toBe('255.0.0.0');
    });

    it('应该拒绝无效的二进制', () => {
      expect(() => binaryToDottedDecimal('11111111.11111111.11111111')).toThrow('无效的二进制子网掩码格式');
      expect(() => binaryToDottedDecimal('11111111.11111111.11111111.0000000')).toThrow('无效的二进制子网掩码');
      expect(() => binaryToDottedDecimal('11111111.11111111.11111111.00000001')).toThrow('无效的二进制子网掩码');
    });
  });

  describe('dottedDecimalToInteger', () => {
    it('应该正确转换点分十进制到整数', () => {
      expect(dottedDecimalToInteger('255.255.255.0')).toBe(4294967040);
      expect(dottedDecimalToInteger('255.255.0.0')).toBe(4294901760);
      expect(dottedDecimalToInteger('255.0.0.0')).toBe(4278190080);
      expect(dottedDecimalToInteger('0.0.0.0')).toBe(0);
      expect(dottedDecimalToInteger('255.255.255.255')).toBe(4294967295);
    });
  });

  describe('integerToDottedDecimal', () => {
    it('应该正确转换整数到点分十进制', () => {
      expect(integerToDottedDecimal(4294967040)).toBe('255.255.255.0');
      expect(integerToDottedDecimal(4294901760)).toBe('255.255.0.0');
      expect(integerToDottedDecimal(4278190080)).toBe('255.0.0.0');
      expect(integerToDottedDecimal(0)).toBe('0.0.0.0');
      expect(integerToDottedDecimal(4294967295)).toBe('255.255.255.255');
    });
  });

  describe('dottedDecimalToHexadecimal', () => {
    it('应该正确转换点分十进制到十六进制', () => {
      expect(dottedDecimalToHexadecimal('255.255.255.0')).toBe('0xFFFFFF00');
      expect(dottedDecimalToHexadecimal('255.255.0.0')).toBe('0xFFFF0000');
      expect(dottedDecimalToHexadecimal('255.0.0.0')).toBe('0xFF000000');
      expect(dottedDecimalToHexadecimal('0.0.0.0')).toBe('0x00000000');
      expect(dottedDecimalToHexadecimal('255.255.255.255')).toBe('0xFFFFFFFF');
    });
  });

  describe('getSubnetMaskInfo', () => {
    it('应该正确获取子网掩码信息', () => {
      const info = getSubnetMaskInfo('255.255.255.0');
      
      expect(info.cidr).toBe(24);
      expect(info.dottedDecimal).toBe('255.255.255.0');
      expect(info.binary).toBe('11111111.11111111.11111111.00000000');
      expect(info.subnetBits).toBe(24);
      expect(info.hostBits).toBe(8);
      expect(info.subnetCount).toBe(16777216);
      expect(info.hostsPerSubnet).toBe(256);
      expect(info.usableHosts).toBe(254);
      expect(info.integer).toBe(4294967040);
      expect(info.hexadecimal).toBe('0xFFFFFF00');
    });

    it('应该处理不同格式的输入', () => {
      const cidrInfo = getSubnetMaskInfo(24);
      const dottedInfo = getSubnetMaskInfo('255.255.255.0');
      const binaryInfo = getSubnetMaskInfo('11111111.11111111.11111111.00000000');
      
      expect(cidrInfo.cidr).toBe(dottedInfo.cidr);
      expect(dottedInfo.cidr).toBe(binaryInfo.cidr);
    });
  });

  describe('calculateNetworkInfo', () => {
    it('应该正确计算网络信息', () => {
      const networkInfo = calculateNetworkInfo('192.168.1.100', '255.255.255.0');
      
      expect(networkInfo.networkAddress).toBe('192.168.1.0');
      expect(networkInfo.broadcastAddress).toBe('192.168.1.255');
      expect(networkInfo.firstUsableIp).toBe('192.168.1.1');
      expect(networkInfo.lastUsableIp).toBe('192.168.1.254');
      expect(networkInfo.wildcardMask).toBe('0.0.0.255');
      expect(networkInfo.totalHosts).toBe(256);
    });

    it('应该处理/32网络', () => {
      const networkInfo = calculateNetworkInfo('192.168.1.1', '255.255.255.255');
      
      expect(networkInfo.networkAddress).toBe('192.168.1.1');
      expect(networkInfo.broadcastAddress).toBe('192.168.1.1');
      expect(networkInfo.firstUsableIp).toBe('192.168.1.1');
      expect(networkInfo.lastUsableIp).toBe('192.168.1.1');
      expect(networkInfo.wildcardMask).toBe('0.0.0.0');
    });

    it('应该处理/31网络', () => {
      const networkInfo = calculateNetworkInfo('192.168.1.0', '255.255.255.254');
      
      expect(networkInfo.networkAddress).toBe('192.168.1.0');
      expect(networkInfo.broadcastAddress).toBe('192.168.1.1');
      expect(networkInfo.firstUsableIp).toBe('192.168.1.0');
      expect(networkInfo.lastUsableIp).toBe('192.168.1.1');
    });
  });

  describe('planSubnets', () => {
    it('应该正确规划子网', () => {
      const subnets = planSubnets('192.168.1.0', 24, 26);
      
      expect(subnets).toHaveLength(4);
      expect(subnets[0].networkAddress).toBe('192.168.1.0');
      expect(subnets[0].broadcastAddress).toBe('192.168.1.63');
      expect(subnets[0].firstUsableIp).toBe('192.168.1.1');
      expect(subnets[0].lastUsableIp).toBe('192.168.1.62');
      expect(subnets[0].cidr).toBe(26);
      expect(subnets[0].subnetMask).toBe('255.255.255.192');
      expect(subnets[0].hostCount).toBe(62);
      
      expect(subnets[1].networkAddress).toBe('192.168.1.64');
      expect(subnets[2].networkAddress).toBe('192.168.1.128');
      expect(subnets[3].networkAddress).toBe('192.168.1.192');
    });

    it('应该拒绝无效的子网CIDR', () => {
      expect(() => planSubnets('192.168.1.0', 24, 23)).toThrow('子网CIDR必须大于或等于主网络CIDR');
    });
  });

  describe('recommendSubnetMask', () => {
    it('应该正确推荐子网掩码', () => {
      expect(recommendSubnetMask(2)).toBe(30); // 2个主机需要/30
      expect(recommendSubnetMask(10)).toBe(28); // 10个主机需要/28
      expect(recommendSubnetMask(100)).toBe(25); // 100个主机需要/25
      expect(recommendSubnetMask(254)).toBe(24); // 254个主机需要/24
    });
  });

  describe('validateSubnetMask', () => {
    it('应该验证有效的子网掩码', () => {
      expect(validateSubnetMask('24')).toEqual({ isValid: true, format: 'cidr' });
      expect(validateSubnetMask('255.255.255.0')).toEqual({ isValid: true, format: 'dottedDecimal' });
      expect(validateSubnetMask('11111111.11111111.11111111.00000000')).toEqual({ isValid: true, format: 'binary' });
    });

    it('应该拒绝无效的子网掩码', () => {
      expect(validateSubnetMask('33')).toEqual({ isValid: false, error: '无法识别的子网掩码格式' });
      expect(validateSubnetMask('255.255.255.1')).toEqual({ isValid: false, error: '无效的子网掩码，必须由连续的1后跟连续的0组成' });
      expect(validateSubnetMask('invalid')).toEqual({ isValid: false, error: '无法识别的子网掩码格式' });
    });
  });
});