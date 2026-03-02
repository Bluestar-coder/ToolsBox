/**
 * 数据类型自动检测功能
 * 基于CyberChef的Magic功能实现
 */

import type { DataTypeDetection } from './types';

/**
 * 数据类型检测器类
 */
export class DataTypeDetector {
  /**
   * 检测数据可能的类型
   * @param data 要检测的数据
   * @returns 检测结果列表，按置信度降序排列
   */
  detectDataTypes(data: string): DataTypeDetection[] {
    const results: DataTypeDetection[] = [];
    
    // 检测各种数据类型
    results.push(...this.detectBase64(data));
    results.push(...this.detectHex(data));
    results.push(...this.detectBinary(data));
    results.push(...this.detectUrlEncoded(data));
    results.push(...this.detectHtmlEntity(data));
    results.push(...this.detectUnicodeEscape(data));
    results.push(...this.detectJson(data));
    results.push(...this.detectTimestamp(data));
    results.push(...this.detectJwt(data));
    results.push(...this.detectUuid(data));
    results.push(...this.detectIpAddress(data));
    results.push(...this.detectMacAddress(data));
    
    // 按置信度降序排列
    return results.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * 检测Base64编码
   */
  private detectBase64(data: string): DataTypeDetection[] {
    const results: DataTypeDetection[] = [];
    
    // Base64标准检测
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (base64Regex.test(data) && data.length % 4 === 0 && data.length > 0) {
      // 计算置信度
      let confidence = 0.7;
      
      // 如果长度较长且包含典型的Base64字符，增加置信度
      if (data.length > 20) {
        confidence += 0.1;
      }
      
      // 如果以=结尾，增加置信度
      if (data.endsWith('=') || data.endsWith('==')) {
        confidence += 0.1;
      }
      
      results.push({
        type: 'base64',
        confidence: Math.min(confidence, 1.0),
        description: 'Base64编码数据',
        suggestedOperations: ['base64_decode'],
      });
    }
    
    // Base64URL检测
    const base64UrlRegex = /^[A-Za-z0-9_-]*$/;
    if (base64UrlRegex.test(data) && data.length > 0 && !data.includes('+') && !data.includes('/')) {
      results.push({
        type: 'base64url',
        confidence: 0.6,
        description: 'Base64URL编码数据',
        suggestedOperations: ['base64url_decode'],
      });
    }
    
    return results;
  }

  /**
   * 检测十六进制数据
   */
  private detectHex(data: string): DataTypeDetection[] {
    const results: DataTypeDetection[] = [];
    
    // 移除常见的十六进制前缀和空格
    const cleanData = data.replace(/^(0x|0X|\\x)/, '').replace(/\s/g, '');
    
    // 十六进制检测
    const hexRegex = /^[0-9A-Fa-f]+$/;
    if (hexRegex.test(cleanData) && cleanData.length > 0 && cleanData.length % 2 === 0) {
      let confidence = 0.7;
      
      // 如果长度较长，增加置信度
      if (cleanData.length > 10) {
        confidence += 0.1;
      }
      
      // 如果包含可打印ASCII字符，增加置信度
      try {
        const decoded = this.hexToString(cleanData);
        if (/^[\x20-\x7E]*$/.test(decoded)) {
          confidence += 0.2;
        }
      } catch {
        // 忽略错误
      }
      
      results.push({
        type: 'hex',
        confidence: Math.min(confidence, 1.0),
        description: '十六进制数据',
        suggestedOperations: ['from_hex'],
      });
    }
    
    return results;
  }

  /**
   * 检测二进制数据
   */
  private detectBinary(data: string): DataTypeDetection[] {
    const results: DataTypeDetection[] = [];
    
    // 二进制检测
    const binaryRegex = /^[01]+$/;
    if (binaryRegex.test(data) && data.length > 0 && data.length % 8 === 0) {
      results.push({
        type: 'binary',
        confidence: 0.8,
        description: '二进制数据',
        suggestedOperations: ['from_binary'],
      });
    }
    
    return results;
  }

  /**
   * 检测URL编码
   */
  private detectUrlEncoded(data: string): DataTypeDetection[] {
    const results: DataTypeDetection[] = [];
    
    // URL编码检测
    if (/%[0-9A-Fa-f]{2}/.test(data)) {
      let confidence = 0.8;
      
      // 如果包含多个URL编码字符，增加置信度
      const matches = data.match(/%[0-9A-Fa-f]{2}/g);
      if (matches && matches.length > 2) {
        confidence += 0.1;
      }
      
      results.push({
        type: 'url',
        confidence: Math.min(confidence, 1.0),
        description: 'URL编码数据',
        suggestedOperations: ['url_decode'],
      });
    }
    
    return results;
  }

  /**
   * 检测HTML实体编码
   */
  private detectHtmlEntity(data: string): DataTypeDetection[] {
    const results: DataTypeDetection[] = [];
    
    // HTML实体检测
    if (/&#[0-9]+;|&[a-zA-Z]+;/.test(data)) {
      results.push({
        type: 'html_entity',
        confidence: 0.9,
        description: 'HTML实体编码',
        suggestedOperations: ['html_entity_decode'],
      });
    }
    
    return results;
  }

  /**
   * 检测Unicode转义序列
   */
  private detectUnicodeEscape(data: string): DataTypeDetection[] {
    const results: DataTypeDetection[] = [];
    
    // Unicode转义检测
    if (/\\u[0-9A-Fa-f]{4}/.test(data)) {
      results.push({
        type: 'unicode_escape',
        confidence: 0.9,
        description: 'Unicode转义序列',
        suggestedOperations: ['unicode_unescape'],
      });
    }
    
    return results;
  }

  /**
   * 检测JSON数据
   */
  private detectJson(data: string): DataTypeDetection[] {
    const results: DataTypeDetection[] = [];
    
    // JSON检测
    if ((data.trim().startsWith('{') && data.trim().endsWith('}')) ||
        (data.trim().startsWith('[') && data.trim().endsWith(']'))) {
      try {
        JSON.parse(data);
        results.push({
          type: 'json',
          confidence: 0.95,
          description: 'JSON数据',
          suggestedOperations: ['json_format'],
        });
      } catch {
        // 不是有效的JSON
      }
    }
    
    return results;
  }

  /**
   * 检测时间戳
   */
  private detectTimestamp(data: string): DataTypeDetection[] {
    const results: DataTypeDetection[] = [];
    
    // 尝试解析为数字
    const num = parseInt(data, 10);
    if (!isNaN(num)) {
      // Unix时间戳（秒）
      if (num > 1000000000 && num < 2000000000) {
        results.push({
          type: 'unix_timestamp',
          confidence: 0.7,
          description: 'Unix时间戳（秒）',
          suggestedOperations: ['timestamp_to_date'],
        });
      }
      
      // Unix时间戳（毫秒）
      if (num > 1000000000000 && num < 2000000000000) {
        results.push({
          type: 'unix_timestamp_ms',
          confidence: 0.7,
          description: 'Unix时间戳（毫秒）',
          suggestedOperations: ['timestamp_to_date'],
        });
      }
    }
    
    return results;
  }

  /**
   * 检测JWT令牌
   */
  private detectJwt(data: string): DataTypeDetection[] {
    const results: DataTypeDetection[] = [];
    
    // JWT检测（三部分用点分隔）
    const parts = data.split('.');
    if (parts.length === 3) {
      const [header, payload] = parts;
      
      // 检查头部和载荷是否是Base64URL编码
      if (this.isValidBase64Url(header) && this.isValidBase64Url(payload)) {
        try {
          // 尝试解码头部和载荷
          const decodedHeader = JSON.parse(atob(this.base64UrlToBase64(header)));
          const decodedPayload = JSON.parse(atob(this.base64UrlToBase64(payload)));
          
          // 检查是否包含典型的JWT字段
          if (decodedHeader.typ === 'JWT' || decodedPayload.iss || decodedPayload.exp) {
            results.push({
              type: 'jwt',
              confidence: 0.9,
              description: 'JWT令牌',
              suggestedOperations: ['jwt_decode'],
            });
          }
        } catch {
          // 解码失败，不是有效的JWT
        }
      }
    }
    
    return results;
  }

  /**
   * 检测UUID
   */
  private detectUuid(data: string): DataTypeDetection[] {
    const results: DataTypeDetection[] = [];
    
    // UUID检测
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(data)) {
      results.push({
        type: 'uuid',
        confidence: 0.95,
        description: 'UUID',
        suggestedOperations: ['uuid_info'],
      });
    }
    
    return results;
  }

  /**
   * 检测IP地址
   */
  private detectIpAddress(data: string): DataTypeDetection[] {
    const results: DataTypeDetection[] = [];
    
    if (this.isValidIPv4Address(data)) {
      results.push({
        type: 'ipv4',
        confidence: 0.95,
        description: 'IPv4地址',
        suggestedOperations: ['ip_info'],
      });
    }
    
    if (this.isValidIPv6Address(data)) {
      results.push({
        type: 'ipv6',
        confidence: 0.95,
        description: 'IPv6地址',
        suggestedOperations: ['ip_info'],
      });
    }
    
    return results;
  }

  private isValidIPv4Address(data: string): boolean {
    const parts = data.split('.');
    if (parts.length !== 4) return false;
    return parts.every((part) => {
      if (!/^\d+$/.test(part)) return false;
      if (part.length > 1 && part.startsWith('0')) return false;
      const value = Number(part);
      return value >= 0 && value <= 255;
    });
  }

  private isValidIPv6Address(data: string): boolean {
    const addr = data.split('%')[0];
    if (!addr) return false;

    if (addr.includes('.')) {
      const mixedMatch = addr.match(/^(.*:)(\d+\.\d+\.\d+\.\d+)$/);
      if (!mixedMatch) return false;
      const ipv4Part = mixedMatch[2];
      if (!this.isValidIPv4Address(ipv4Part)) return false;

      const octets = ipv4Part.split('.').map(Number);
      const upper = ((octets[0] << 8) | octets[1]).toString(16);
      const lower = ((octets[2] << 8) | octets[3]).toString(16);
      const normalized = `${mixedMatch[1]}${upper}:${lower}`;

      return this.isValidIPv6HextetPart(normalized, 8);
    }

    return this.isValidIPv6HextetPart(addr, 8);
  }

  private isValidIPv6HextetPart(hextetPart: string, expectedGroups: number): boolean {
    if (hextetPart.includes('::')) {
      if (hextetPart.indexOf('::') !== hextetPart.lastIndexOf('::')) return false;

      const [left, right] = hextetPart.split('::');
      const leftGroups = left === '' ? [] : left.split(':');
      const rightGroups = right === '' ? [] : right.split(':');

      const maxGroups = expectedGroups - 1;
      if (leftGroups.length + rightGroups.length > maxGroups) return false;

      return (
        leftGroups.every(group => this.isValidIPv6Group(group)) &&
        rightGroups.every(group => this.isValidIPv6Group(group))
      );
    }

    const groups = hextetPart.split(':');
    if (groups.length !== expectedGroups) return false;
    return groups.every(group => this.isValidIPv6Group(group));
  }

  private isValidIPv6Group(group: string): boolean {
    return /^[0-9a-fA-F]{1,4}$/.test(group);
  }

  /**
   * 检测MAC地址
   */
  private detectMacAddress(data: string): DataTypeDetection[] {
    const results: DataTypeDetection[] = [];
    
    // MAC地址检测（格式：XX:XX:XX:XX:XX:XX）
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    if (macRegex.test(data)) {
      results.push({
        type: 'mac',
        confidence: 0.95,
        description: 'MAC地址',
        suggestedOperations: ['mac_info'],
      });
    }
    
    return results;
  }

  /**
   * 十六进制转字符串
   */
  private hexToString(hex: string): string {
    let result = '';
    for (let i = 0; i < hex.length; i += 2) {
      result += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    return result;
  }

  /**
   * 检查是否是有效的Base64URL
   */
  private isValidBase64Url(str: string): boolean {
    try {
      if (!/^[A-Za-z0-9_-]+={0,2}$/.test(str)) {
        return false;
      }

      const normalizedInput = str.replace(/=+$/, '');
      const decoded = atob(this.base64UrlToBase64(str));
      const reEncoded = btoa(decoded)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      return reEncoded === normalizedInput;
    } catch {
      return false;
    }
  }

  /**
   * Base64URL转Base64
   */
  private base64UrlToBase64(str: string): string {
    const withoutPadding = str.replace(/=+$/, '').replace(/-/g, '+').replace(/_/g, '/');
    const paddingLength = (4 - (withoutPadding.length % 4)) % 4;
    return withoutPadding + '='.repeat(paddingLength);
  }
}

// 创建全局数据类型检测器实例
export const dataTypeDetector = new DataTypeDetector();
