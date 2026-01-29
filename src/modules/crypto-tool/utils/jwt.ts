/**
 * JWT 工具函数
 */

import * as jose from 'jose';

export type JWTAlgorithm = 'HS256' | 'HS384' | 'HS512' | 'RS256' | 'RS384' | 'RS512' | 'ES256' | 'ES384' | 'ES512' | 'PS256' | 'PS384' | 'PS512';

export const jwtAlgorithms: { value: JWTAlgorithm; label: string; type: 'symmetric' | 'asymmetric' }[] = [
  { value: 'HS256', label: 'HS256 (HMAC SHA-256)', type: 'symmetric' },
  { value: 'HS384', label: 'HS384 (HMAC SHA-384)', type: 'symmetric' },
  { value: 'HS512', label: 'HS512 (HMAC SHA-512)', type: 'symmetric' },
  { value: 'RS256', label: 'RS256 (RSA SHA-256)', type: 'asymmetric' },
  { value: 'RS384', label: 'RS384 (RSA SHA-384)', type: 'asymmetric' },
  { value: 'RS512', label: 'RS512 (RSA SHA-512)', type: 'asymmetric' },
  { value: 'ES256', label: 'ES256 (ECDSA P-256)', type: 'asymmetric' },
  { value: 'ES384', label: 'ES384 (ECDSA P-384)', type: 'asymmetric' },
  { value: 'ES512', label: 'ES512 (ECDSA P-521)', type: 'asymmetric' },
  { value: 'PS256', label: 'PS256 (RSA-PSS SHA-256)', type: 'asymmetric' },
  { value: 'PS384', label: 'PS384 (RSA-PSS SHA-384)', type: 'asymmetric' },
  { value: 'PS512', label: 'PS512 (RSA-PSS SHA-512)', type: 'asymmetric' },
];

export interface JWTHeader {
  alg: string;
  typ?: string;
  [key: string]: unknown;
}

export interface JWTPayload {
  iss?: string;
  sub?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  iat?: number;
  jti?: string;
  [key: string]: unknown;
}

export interface DecodeResult {
  header: JWTHeader;
  payload: JWTPayload;
  signature: string;
  isValid?: boolean;
  error?: string;
}

function base64UrlDecode(input: string): string {
  let base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = base64.length % 4;
  if (padding) {
    base64 += '='.repeat(4 - padding);
  }
  return atob(base64);
}

function createDecodeErrorResult(error: string): DecodeResult {
  return {
    header: { alg: '' },
    payload: {},
    signature: '',
    isValid: false,
    error,
  };
}

/**
 * 解析 JWT（不验证签名）
 */
export function decodeJWT(token: string): DecodeResult {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('无效的 JWT 格式，应包含三个部分');
    }

    const header = JSON.parse(base64UrlDecode(parts[0]));
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    const signature = parts[2];

    return { header, payload, signature };
  } catch (error) {
    throw new Error(`JWT 解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 验证 JWT 签名（对称算法）
 */
export async function verifyJWTWithSecret(token: string, secret: string): Promise<DecodeResult> {
  let decoded: DecodeResult;
  try {
    decoded = decodeJWT(token);
  } catch (error) {
    return createDecodeErrorResult(error instanceof Error ? error.message : '签名验证失败');
  }

  try {
    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jose.jwtVerify(token, secretKey);
    return {
      ...decoded,
      payload: payload as JWTPayload,
      isValid: true,
    };
  } catch (error) {
    return {
      ...decoded,
      isValid: false,
      error: error instanceof Error ? error.message : '签名验证失败',
    };
  }
}

/**
 * 验证 JWT 签名（非对称算法）
 */
export async function verifyJWTWithPublicKey(token: string, publicKeyPem: string): Promise<DecodeResult> {
  let decoded: DecodeResult;
  try {
    decoded = decodeJWT(token);
  } catch (error) {
    return createDecodeErrorResult(error instanceof Error ? error.message : '签名验证失败');
  }

  try {
    const publicKey = await jose.importSPKI(publicKeyPem, decoded.header.alg as JWTAlgorithm);
    const { payload } = await jose.jwtVerify(token, publicKey);
    return {
      ...decoded,
      payload: payload as JWTPayload,
      isValid: true,
    };
  } catch (error) {
    return {
      ...decoded,
      isValid: false,
      error: error instanceof Error ? error.message : '签名验证失败',
    };
  }
}

/**
 * 生成 JWT（对称算法）
 */
export async function generateJWTWithSecret(
  payload: JWTPayload,
  secret: string,
  algorithm: JWTAlgorithm = 'HS256',
  expiresIn?: string
): Promise<string> {
  const secretKey = new TextEncoder().encode(secret);
  
  let builder = new jose.SignJWT(payload)
    .setProtectedHeader({ alg: algorithm, typ: 'JWT' });
  
  if (payload.iat === undefined) {
    builder = builder.setIssuedAt();
  }
  
  if (expiresIn) {
    builder = builder.setExpirationTime(expiresIn);
  }
  
  return builder.sign(secretKey);
}

/**
 * 生成 JWT（非对称算法）
 */
export async function generateJWTWithPrivateKey(
  payload: JWTPayload,
  privateKeyPem: string,
  algorithm: JWTAlgorithm = 'RS256',
  expiresIn?: string
): Promise<string> {
  const privateKey = await jose.importPKCS8(privateKeyPem, algorithm);
  
  let builder = new jose.SignJWT(payload)
    .setProtectedHeader({ alg: algorithm, typ: 'JWT' });
  
  if (payload.iat === undefined) {
    builder = builder.setIssuedAt();
  }
  
  if (expiresIn) {
    builder = builder.setExpirationTime(expiresIn);
  }
  
  return builder.sign(privateKey);
}

/**
 * 生成 RSA 密钥对
 */
export async function generateRSAKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
  const { publicKey, privateKey } = await jose.generateKeyPair('RS256');
  
  const publicKeyPem = await jose.exportSPKI(publicKey);
  const privateKeyPem = await jose.exportPKCS8(privateKey);
  
  return { publicKey: publicKeyPem, privateKey: privateKeyPem };
}

/**
 * 生成 EC 密钥对
 */
export async function generateECKeyPair(algorithm: 'ES256' | 'ES384' | 'ES512' = 'ES256'): Promise<{ publicKey: string; privateKey: string }> {
  const { publicKey, privateKey } = await jose.generateKeyPair(algorithm);
  
  const publicKeyPem = await jose.exportSPKI(publicKey);
  const privateKeyPem = await jose.exportPKCS8(privateKey);
  
  return { publicKey: publicKeyPem, privateKey: privateKeyPem };
}

/**
 * 格式化时间戳为可读格式
 */
export function formatTimestamp(timestamp?: number): string {
  if (!timestamp) return '-';
  return new Date(timestamp * 1000).toLocaleString();
}

/**
 * 检查 JWT 是否过期
 */
export function isExpired(exp?: number): boolean {
  if (!exp) return false;
  return Date.now() > exp * 1000;
}

/**
 * 常用 Payload 字段说明
 */
export const payloadFieldDescriptions: Record<string, string> = {
  iss: '签发者 (Issuer)',
  sub: '主题 (Subject)',
  aud: '受众 (Audience)',
  exp: '过期时间 (Expiration Time)',
  nbf: '生效时间 (Not Before)',
  iat: '签发时间 (Issued At)',
  jti: 'JWT ID',
};
