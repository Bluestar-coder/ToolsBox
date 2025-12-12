// 密钥派生函数 (KDF) 实现
import CryptoJS from 'crypto-js';

// PBKDF2 密钥派生
export const pbkdf2Derive = (
  password: string,
  salt: string,
  iterations: number = 10000,
  keySize: number = 256,
  hash: 'SHA1' | 'SHA256' | 'SHA512' = 'SHA256'
): string => {
  const hashFn = hash === 'SHA1' ? CryptoJS.algo.SHA1 
    : hash === 'SHA512' ? CryptoJS.algo.SHA512 
    : CryptoJS.algo.SHA256;
  
  const key = CryptoJS.PBKDF2(password, salt, {
    keySize: keySize / 32,
    iterations,
    hasher: hashFn,
  });
  return key.toString(CryptoJS.enc.Hex);
};

// HMAC 消息认证码
export const hmacGenerate = (
  message: string,
  key: string,
  hash: 'MD5' | 'SHA1' | 'SHA256' | 'SHA512' = 'SHA256'
): string => {
  let hmac;
  switch (hash) {
    case 'MD5':
      hmac = CryptoJS.HmacMD5(message, key);
      break;
    case 'SHA1':
      hmac = CryptoJS.HmacSHA1(message, key);
      break;
    case 'SHA512':
      hmac = CryptoJS.HmacSHA512(message, key);
      break;
    default:
      hmac = CryptoJS.HmacSHA256(message, key);
  }
  return hmac.toString(CryptoJS.enc.Hex);
};

// HMAC 验证
export const hmacVerify = (
  message: string,
  key: string,
  expectedHmac: string,
  hash: 'MD5' | 'SHA1' | 'SHA256' | 'SHA512' = 'SHA256'
): boolean => {
  const computed = hmacGenerate(message, key, hash);
  return computed.toLowerCase() === expectedHmac.toLowerCase();
};

// 生成随机盐
export const generateSalt = (length: number = 16): string => {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
};

// scrypt 密钥派生 (使用 Web Crypto API 模拟，实际需要专门库)
// 这里提供一个基于 PBKDF2 的简化版本
export const scryptDerive = async (
  password: string,
  salt: string,
  N: number = 16384,
  r: number = 8,
  p: number = 1,
  keyLen: number = 32
): Promise<string> => {
  // 简化实现：使用 PBKDF2 模拟
  // 真正的 scrypt 需要专门的库如 scrypt-js
  const iterations = N * r * p;
  return pbkdf2Derive(password, salt, Math.min(iterations, 100000), keyLen * 8, 'SHA256');
};

// HKDF 密钥派生 (使用 Web Crypto API)
export const hkdfDerive = async (
  ikm: string, // 输入密钥材料
  salt: string,
  info: string,
  keyLen: number = 32
): Promise<string> => {
  const encoder = new TextEncoder();
  const ikmBytes = encoder.encode(ikm);
  const saltBytes = encoder.encode(salt);
  const infoBytes = encoder.encode(info);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    ikmBytes,
    'HKDF',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: saltBytes,
      info: infoBytes,
    },
    keyMaterial,
    keyLen * 8
  );

  return Array.from(new Uint8Array(derivedBits))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

// Argon2 简化说明 (需要 argon2-browser 库)
export const argon2Info = `
Argon2 是 2015 年密码哈希竞赛的获胜者，有三个变体：
- Argon2d: 抗 GPU 攻击，适合加密货币
- Argon2i: 抗侧信道攻击，适合密码哈希
- Argon2id: 混合模式，推荐用于密码存储

浏览器环境需要使用 argon2-browser 库实现。
`;

// bcrypt 简化说明 (需要 bcryptjs 库)
export const bcryptInfo = `
bcrypt 是基于 Blowfish 的密码哈希函数：
- 自动包含盐值
- 可调整工作因子 (cost factor)
- 广泛用于密码存储

浏览器环境需要使用 bcryptjs 库实现。
`;
