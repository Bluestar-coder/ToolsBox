import { ed25519 } from '@noble/curves/ed25519.js';
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { p256, p384 } from '@noble/curves/nist.js';
import { uint8ArrayToHex, hexToUint8Array, strToUint8Array, uint8ArrayToBase64, base64ToUint8Array } from './helpers';

// ============ Ed25519 ============

export interface Ed25519KeyPair {
  publicKey: string;
  privateKey: string;
}

// 生成 Ed25519 密钥对
export const generateEd25519KeyPair = (): Ed25519KeyPair => {
  const { secretKey, publicKey } = ed25519.keygen();
  return {
    privateKey: uint8ArrayToHex(secretKey),
    publicKey: uint8ArrayToHex(publicKey),
  };
};

// Ed25519 签名
export const ed25519Sign = (message: string, privateKeyHex: string): string => {
  const privateKey = hexToUint8Array(privateKeyHex);
  const messageBytes = strToUint8Array(message);
  const signature = ed25519.sign(messageBytes, privateKey);
  return uint8ArrayToHex(signature);
};

// Ed25519 验签
export const ed25519Verify = (message: string, signatureHex: string, publicKeyHex: string): boolean => {
  try {
    const publicKey = hexToUint8Array(publicKeyHex);
    const signature = hexToUint8Array(signatureHex);
    const messageBytes = strToUint8Array(message);
    return ed25519.verify(signature, messageBytes, publicKey);
  } catch {
    return false;
  }
};

// ============ ECDSA (secp256k1, P-256, P-384) ============

export type ECDSACurve = 'secp256k1' | 'p256' | 'p384';

export interface ECDSAKeyPair {
  publicKey: string;
  privateKey: string;
  publicKeyUncompressed: string;
}

type CurveInstance = {
  keygen: () => { secretKey: Uint8Array; publicKey: Uint8Array };
  getPublicKey: (secretKey: Uint8Array, compressed: boolean) => Uint8Array;
  sign: (message: Uint8Array, secretKey: Uint8Array) => { toCompactRawBytes: () => Uint8Array };
  verify: (signature: Uint8Array, message: Uint8Array, publicKey: Uint8Array) => boolean;
  getSharedSecret: (privateKey: Uint8Array, publicKey: Uint8Array) => Uint8Array;
};

const getCurve = (curve: ECDSACurve): CurveInstance => {
  switch (curve) {
    case 'secp256k1': return secp256k1 as unknown as CurveInstance;
    case 'p256': return p256 as unknown as CurveInstance;
    case 'p384': return p384 as unknown as CurveInstance;
    default: return secp256k1 as unknown as CurveInstance;
  }
};

// 生成 ECDSA 密钥对
export const generateECDSAKeyPair = (curve: ECDSACurve = 'secp256k1'): ECDSAKeyPair => {
  const c = getCurve(curve);
  const { secretKey, publicKey } = c.keygen();
  const publicKeyUncompressed = c.getPublicKey(secretKey, false); // uncompressed
  return {
    privateKey: uint8ArrayToHex(secretKey),
    publicKey: uint8ArrayToHex(publicKey),
    publicKeyUncompressed: uint8ArrayToHex(publicKeyUncompressed),
  };
};

// ECDSA 签名
export const ecdsaSign = (message: string, privateKeyHex: string, curve: ECDSACurve = 'secp256k1'): string => {
  const c = getCurve(curve);
  const privateKey = hexToUint8Array(privateKeyHex);
  const messageBytes = strToUint8Array(message);
  const signature = c.sign(messageBytes, privateKey);
  return uint8ArrayToHex(signature.toCompactRawBytes());
};

// ECDSA 验签
export const ecdsaVerify = (message: string, signatureHex: string, publicKeyHex: string, curve: ECDSACurve = 'secp256k1'): boolean => {
  try {
    const c = getCurve(curve);
    const publicKey = hexToUint8Array(publicKeyHex);
    const signature = hexToUint8Array(signatureHex);
    const messageBytes = strToUint8Array(message);
    return c.verify(signature, messageBytes, publicKey);
  } catch {
    return false;
  }
};

// ============ RSA (使用 Web Crypto API) ============

export interface RSAKeyPair {
  publicKey: string;  // PEM 格式
  privateKey: string; // PEM 格式
}

// ArrayBuffer 转 Base64
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// Base64 转 ArrayBuffer
const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer as ArrayBuffer;
};

// 生成 RSA 密钥对
export const generateRSAKeyPair = async (keySize: number = 2048): Promise<RSAKeyPair> => {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: keySize,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );

  const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  const publicKeyBase64 = arrayBufferToBase64(publicKeyBuffer);
  const privateKeyBase64 = arrayBufferToBase64(privateKeyBuffer);

  // 格式化为 PEM
  const publicKeyPem = `-----BEGIN PUBLIC KEY-----\n${publicKeyBase64.match(/.{1,64}/g)?.join('\n')}\n-----END PUBLIC KEY-----`;
  const privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${privateKeyBase64.match(/.{1,64}/g)?.join('\n')}\n-----END PRIVATE KEY-----`;

  return {
    publicKey: publicKeyPem,
    privateKey: privateKeyPem,
  };
};

// 从 PEM 提取 Base64
const extractBase64FromPem = (pem: string): string => {
  return pem
    .replace(/-----BEGIN.*-----/, '')
    .replace(/-----END.*-----/, '')
    .replace(/\s/g, '');
};

// RSA 加密
export const rsaEncrypt = async (plaintext: string, publicKeyPem: string): Promise<string> => {
  const publicKeyBase64 = extractBase64FromPem(publicKeyPem);
  const publicKeyBuffer = base64ToArrayBuffer(publicKeyBase64);

  const publicKey = await crypto.subtle.importKey(
    'spki',
    publicKeyBuffer,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt']
  );

  const plaintextBytes = strToUint8Array(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    plaintextBytes.buffer as ArrayBuffer
  );

  return uint8ArrayToBase64(new Uint8Array(ciphertext));
};

// RSA 解密
export const rsaDecrypt = async (ciphertextBase64: string, privateKeyPem: string): Promise<string> => {
  const privateKeyBase64 = extractBase64FromPem(privateKeyPem);
  const privateKeyBuffer = base64ToArrayBuffer(privateKeyBase64);

  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    privateKeyBuffer,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['decrypt']
  );

  const ciphertext = base64ToUint8Array(ciphertextBase64);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    ciphertext.buffer as ArrayBuffer
  );

  return new TextDecoder().decode(plaintext);
};

// 生成 RSA 签名密钥对
export const generateRSASignKeyPair = async (keySize: number = 2048): Promise<RSAKeyPair> => {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: keySize,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify']
  );

  const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  const publicKeyBase64 = arrayBufferToBase64(publicKeyBuffer);
  const privateKeyBase64 = arrayBufferToBase64(privateKeyBuffer);

  const publicKeyPem = `-----BEGIN PUBLIC KEY-----\n${publicKeyBase64.match(/.{1,64}/g)?.join('\n')}\n-----END PUBLIC KEY-----`;
  const privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${privateKeyBase64.match(/.{1,64}/g)?.join('\n')}\n-----END PRIVATE KEY-----`;

  return {
    publicKey: publicKeyPem,
    privateKey: privateKeyPem,
  };
};

// RSA 签名
export const rsaSign = async (message: string, privateKeyPem: string): Promise<string> => {
  const privateKeyBase64 = extractBase64FromPem(privateKeyPem);
  const privateKeyBuffer = base64ToArrayBuffer(privateKeyBase64);

  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    privateKeyBuffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const messageBytes = strToUint8Array(message);
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    messageBytes.buffer as ArrayBuffer
  );

  return uint8ArrayToBase64(new Uint8Array(signature));
};

// RSA 验签
export const rsaVerify = async (message: string, signatureBase64: string, publicKeyPem: string): Promise<boolean> => {
  try {
    const publicKeyBase64 = extractBase64FromPem(publicKeyPem);
    const publicKeyBuffer = base64ToArrayBuffer(publicKeyBase64);

    const publicKey = await crypto.subtle.importKey(
      'spki',
      publicKeyBuffer,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const messageBytes = strToUint8Array(message);
    const signature = base64ToUint8Array(signatureBase64);

    return await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      publicKey,
      signature.buffer as ArrayBuffer,
      messageBytes.buffer as ArrayBuffer
    );
  } catch {
    return false;
  }
};


// ============ X25519 密钥交换 ============
import { x25519 } from '@noble/curves/ed25519.js';

export interface X25519KeyPair {
  publicKey: string;
  privateKey: string;
}

// 生成 X25519 密钥对
export const generateX25519KeyPair = (): X25519KeyPair => {
  const privateKey = x25519.utils.randomSecretKey();
  const publicKey = x25519.getPublicKey(privateKey);
  return {
    privateKey: uint8ArrayToHex(privateKey),
    publicKey: uint8ArrayToHex(publicKey),
  };
};

// X25519 计算共享密钥
export const x25519GetSharedSecret = (privateKeyHex: string, publicKeyHex: string): string => {
  const privateKey = hexToUint8Array(privateKeyHex);
  const publicKey = hexToUint8Array(publicKeyHex);
  const sharedSecret = x25519.getSharedSecret(privateKey, publicKey);
  return uint8ArrayToHex(sharedSecret);
};

// ============ ECDH 密钥交换 (secp256k1, P-256, P-384) ============

export interface ECDHKeyPair {
  publicKey: string;
  privateKey: string;
}

// 生成 ECDH 密钥对
export const generateECDHKeyPair = (curve: ECDSACurve = 'secp256k1'): ECDHKeyPair => {
  const c = getCurve(curve);
  const { secretKey, publicKey } = c.keygen();
  return {
    privateKey: uint8ArrayToHex(secretKey),
    publicKey: uint8ArrayToHex(publicKey),
  };
};

// ECDH 计算共享密钥
export const ecdhGetSharedSecret = (
  privateKeyHex: string,
  publicKeyHex: string,
  curve: ECDSACurve = 'secp256k1'
): string => {
  const c = getCurve(curve);
  const privateKey = hexToUint8Array(privateKeyHex);
  const publicKey = hexToUint8Array(publicKeyHex);
  const sharedSecret = c.getSharedSecret(privateKey, publicKey);
  return uint8ArrayToHex(sharedSecret);
};
