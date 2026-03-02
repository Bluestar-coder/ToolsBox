import type { Operation, OperationInput, OperationParameter, OperationResult } from '../types';
import {
  bigintToIPv6Formats,
  detectIpFormat,
  integerToIPv4Formats,
  parseIPv4ToInteger,
  parseIPv6,
} from '../../../modules/ip-network/utils/ip-utils';
import { isValidIPv4, isValidIPv6 } from '../../../modules/ip-network/utils/validators';

function successResult(
  data: string,
  dataType: string,
  startTime: number
): OperationResult {
  return {
    success: true,
    output: {
      data,
      dataType,
    },
    executionTime: Date.now() - startTime,
  };
}

function errorResult(
  error: string,
  dataType: string,
  startTime: number
): OperationResult {
  return {
    success: false,
    output: {
      data: '',
      dataType,
    },
    error,
    executionTime: Date.now() - startTime,
  };
}

export class TimestampToDateOperation implements Operation {
  id = 'timestamp_to_date';
  name = '时间戳转日期';
  description = '将 Unix 时间戳（秒/毫秒）转换为可读时间';
  category = 'time' as const;
  icon = 'ClockCircleOutlined';
  inputType = 'number';
  outputType = 'text';

  getParameters(): OperationParameter[] {
    return [];
  }

  async execute(input: OperationInput): Promise<OperationResult> {
    const startTime = Date.now();
    const raw = input.data.trim();

    if (!/^-?\d{10,13}$/.test(raw)) {
      return errorResult('请输入 10 位（秒）或 13 位（毫秒）时间戳', this.outputType, startTime);
    }

    const millis = raw.length <= 10 ? Number(raw) * 1000 : Number(raw);
    const date = new Date(millis);
    if (Number.isNaN(date.getTime())) {
      return errorResult('无效时间戳', this.outputType, startTime);
    }

    const output = [
      `输入: ${raw}`,
      `Unix秒: ${Math.floor(millis / 1000)}`,
      `Unix毫秒: ${millis}`,
      `本地时间: ${date.toLocaleString()}`,
      `UTC时间: ${date.toUTCString()}`,
      `ISO 8601: ${date.toISOString()}`,
    ].join('\n');

    return successResult(output, this.outputType, startTime);
  }

  validateInput(input: OperationInput): { valid: boolean; error?: string } {
    const raw = input.data.trim();
    if (!raw) {
      return { valid: false, error: '输入数据不能为空' };
    }
    if (!/^-?\d{10,13}$/.test(raw)) {
      return { valid: false, error: '请输入 10 位（秒）或 13 位（毫秒）时间戳' };
    }
    return { valid: true };
  }
}

export class JWTDecodeOperation implements Operation {
  id = 'jwt_decode';
  name = 'JWT解析';
  description = '解析 JWT 头部、载荷和签名信息';
  category = 'analysis' as const;
  icon = 'SafetyOutlined';
  inputType = 'jwt';
  outputType = 'json';

  getParameters(): OperationParameter[] {
    return [];
  }

  async execute(input: OperationInput): Promise<OperationResult> {
    const startTime = Date.now();
    const token = input.data.trim();

    if (!token) {
      return errorResult('输入数据不能为空', this.outputType, startTime);
    }

    try {
      const { decodeJWT, formatTimestamp, isExpired } = await import('../../../modules/crypto-tool/utils/jwt');
      const decoded = decodeJWT(token);
      const payload = decoded.payload;
      const exp = typeof payload.exp === 'number' ? payload.exp : undefined;
      const iat = typeof payload.iat === 'number' ? payload.iat : undefined;
      const nbf = typeof payload.nbf === 'number' ? payload.nbf : undefined;

      const result = {
        header: decoded.header,
        payload: decoded.payload,
        signature: decoded.signature,
        summary: {
          expiresAt: formatTimestamp(exp),
          issuedAt: formatTimestamp(iat),
          notBefore: formatTimestamp(nbf),
          expired: isExpired(exp),
        },
      };

      return successResult(JSON.stringify(result, null, 2), this.outputType, startTime);
    } catch (error) {
      return errorResult(
        error instanceof Error ? error.message : 'JWT 解析失败',
        this.outputType,
        startTime
      );
    }
  }

  validateInput(input: OperationInput): { valid: boolean; error?: string } {
    const token = input.data.trim();
    if (!token) {
      return { valid: false, error: '输入数据不能为空' };
    }
    if (token.split('.').length !== 3) {
      return { valid: false, error: 'JWT 必须包含 3 段内容（header.payload.signature）' };
    }
    return { valid: true };
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-([1-5])[0-9a-f]{3}-([0-9a-f])[0-9a-f]{3}-[0-9a-f]{12}$/i;

function getUuidVariant(code: string): string {
  const nibble = parseInt(code, 16);
  if ((nibble & 0b1000) === 0) return 'NCS';
  if ((nibble & 0b1100) === 0b1000) return 'RFC 4122';
  if ((nibble & 0b1110) === 0b1100) return 'Microsoft';
  return 'Future';
}

export class UUIDInfoOperation implements Operation {
  id = 'uuid_info';
  name = 'UUID信息解析';
  description = '解析 UUID 的版本、变体和规范化格式';
  category = 'analysis' as const;
  icon = 'DatabaseOutlined';
  inputType = 'uuid';
  outputType = 'json';

  getParameters(): OperationParameter[] {
    return [];
  }

  async execute(input: OperationInput): Promise<OperationResult> {
    const startTime = Date.now();
    const raw = input.data.trim();
    const match = raw.match(UUID_REGEX);
    if (!match) {
      return errorResult('无效 UUID，需满足 RFC 4122 格式', this.outputType, startTime);
    }

    const normalized = raw.toLowerCase();
    const version = Number(match[1]);
    const variant = getUuidVariant(match[2]);
    const nilUuid = normalized === '00000000-0000-0000-0000-000000000000';

    const result = {
      normalized,
      version,
      variant,
      nil: nilUuid,
    };

    return successResult(JSON.stringify(result, null, 2), this.outputType, startTime);
  }

  validateInput(input: OperationInput): { valid: boolean; error?: string } {
    if (!input.data.trim()) {
      return { valid: false, error: '输入数据不能为空' };
    }
    if (!UUID_REGEX.test(input.data.trim())) {
      return { valid: false, error: '无效 UUID，需满足 RFC 4122 格式' };
    }
    return { valid: true };
  }
}

function classifyIPv4(ip: string): string {
  const [a, b] = ip.split('.').map(Number);
  if (a === 127) return 'loopback';
  if (a === 10) return 'private';
  if (a === 172 && b >= 16 && b <= 31) return 'private';
  if (a === 192 && b === 168) return 'private';
  if (a === 169 && b === 254) return 'link-local';
  if (a >= 224 && a <= 239) return 'multicast';
  return 'public';
}

function classifyIPv6(ip: string): string {
  const lower = ip.toLowerCase();
  if (lower === '::1') return 'loopback';
  if (lower === '::') return 'unspecified';
  if (lower.startsWith('fe80:')) return 'link-local';
  if (lower.startsWith('ff')) return 'multicast';
  if (lower.startsWith('fc') || lower.startsWith('fd')) return 'unique-local';
  return 'global-unicast';
}

export class IPInfoOperation implements Operation {
  id = 'ip_info';
  name = 'IP信息解析';
  description = '解析 IP 地址格式并输出常见表示';
  category = 'network' as const;
  icon = 'CloudServerOutlined';
  inputType = 'ip';
  outputType = 'json';

  getParameters(): OperationParameter[] {
    return [];
  }

  async execute(input: OperationInput): Promise<OperationResult> {
    const startTime = Date.now();
    const raw = input.data.trim();
    if (!raw) {
      return errorResult('输入数据不能为空', this.outputType, startTime);
    }

    try {
      const detectedFormat = detectIpFormat(raw);
      if (isValidIPv6(raw) || detectedFormat === 'ipv6') {
        const value = parseIPv6(raw);
        const formats = bigintToIPv6Formats(value);
        const result = {
          family: 'IPv6',
          classification: classifyIPv6(formats.compressed),
          formats,
        };
        return successResult(JSON.stringify(result, null, 2), this.outputType, startTime);
      }

      if (isValidIPv4(raw) || detectedFormat !== 'unknown') {
        const value = parseIPv4ToInteger(raw, detectedFormat === 'unknown' ? undefined : detectedFormat);
        const formats = integerToIPv4Formats(value);
        const result = {
          family: 'IPv4',
          classification: classifyIPv4(formats.dotted),
          detectedFormat,
          formats,
        };
        return successResult(JSON.stringify(result, null, 2), this.outputType, startTime);
      }

      return errorResult('输入不是有效的 IPv4/IPv6 地址', this.outputType, startTime);
    } catch (error) {
      return errorResult(
        error instanceof Error ? error.message : 'IP 解析失败',
        this.outputType,
        startTime
      );
    }
  }

  validateInput(input: OperationInput): { valid: boolean; error?: string } {
    const raw = input.data.trim();
    if (!raw) {
      return { valid: false, error: '输入数据不能为空' };
    }

    const format = detectIpFormat(raw);
    if (!isValidIPv4(raw) && !isValidIPv6(raw) && format === 'unknown') {
      return { valid: false, error: '输入不是有效的 IPv4/IPv6 地址' };
    }
    return { valid: true };
  }
}

const MAC_REGEX = /^([0-9a-f]{2}([:-])){5}[0-9a-f]{2}$/i;
const MAC_COMPACT_REGEX = /^[0-9a-f]{12}$/i;

function normalizeMac(raw: string): string | null {
  const trimmed = raw.trim();
  const normalizedHex = MAC_REGEX.test(trimmed)
    ? trimmed.replace(/[:-]/g, '')
    : MAC_COMPACT_REGEX.test(trimmed)
      ? trimmed
      : null;

  if (!normalizedHex) {
    return null;
  }

  return normalizedHex
    .toUpperCase()
    .match(/.{2}/g)!
    .join(':');
}

export class MACInfoOperation implements Operation {
  id = 'mac_info';
  name = 'MAC信息解析';
  description = '解析 MAC 地址并识别单播/组播与管理位';
  category = 'network' as const;
  icon = 'ApiOutlined';
  inputType = 'mac';
  outputType = 'json';

  getParameters(): OperationParameter[] {
    return [];
  }

  async execute(input: OperationInput): Promise<OperationResult> {
    const startTime = Date.now();
    const normalized = normalizeMac(input.data);

    if (!normalized) {
      return errorResult('输入不是有效的 MAC 地址', this.outputType, startTime);
    }

    const firstByte = parseInt(normalized.slice(0, 2), 16);
    const isMulticast = (firstByte & 0x01) === 0x01;
    const isLocallyAdministered = (firstByte & 0x02) === 0x02;

    const result = {
      normalized,
      oui: normalized.split(':').slice(0, 3).join(':'),
      type: isMulticast ? 'multicast' : 'unicast',
      administration: isLocallyAdministered ? 'locally-administered' : 'globally-unique',
    };

    return successResult(JSON.stringify(result, null, 2), this.outputType, startTime);
  }

  validateInput(input: OperationInput): { valid: boolean; error?: string } {
    if (!input.data.trim()) {
      return { valid: false, error: '输入数据不能为空' };
    }
    if (!normalizeMac(input.data)) {
      return { valid: false, error: '输入不是有效的 MAC 地址' };
    }
    return { valid: true };
  }
}

export function createContextOperations(): Operation[] {
  return [
    new TimestampToDateOperation(),
    new JWTDecodeOperation(),
    new UUIDInfoOperation(),
    new IPInfoOperation(),
    new MACInfoOperation(),
  ];
}
