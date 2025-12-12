import React, { useState } from 'react';
import { Card, Input, Select, Button, Space, message, Tabs } from 'antd';
import CryptoJS from 'crypto-js';
import { gcm, aessiv } from '@noble/ciphers/aes.js';
import { chacha20poly1305 } from '@noble/ciphers/chacha.js';
import * as smCrypto from 'sm-crypto';


const { sm2, sm3, sm4 } = smCrypto;

const { TextArea } = Input;

// AES 加密模式选项
const aesModeOptions = [
  { value: 'CBC', label: 'CBC (推荐)' },
  { value: 'ECB', label: 'ECB (不安全)' },
  { value: 'CFB', label: 'CFB' },
  { value: 'OFB', label: 'OFB' },
  { value: 'CTR', label: 'CTR' },
];

// DES/3DES 加密模式选项 (不包含 CTR)
const desModeOptions = [
  { value: 'CBC', label: 'CBC (推荐)' },
  { value: 'ECB', label: 'ECB (不安全)' },
  { value: 'CFB', label: 'CFB' },
  { value: 'OFB', label: 'OFB' },
];

// 填充方式选项
const paddingOptions = [
  { value: 'Pkcs7', label: 'Pkcs7/Pkcs5 (推荐)' },
  { value: 'Iso97971', label: 'ISO/IEC 9797-1' },
  { value: 'AnsiX923', label: 'ANSI X.923' },
  { value: 'Iso10126', label: 'ISO 10126' },
  { value: 'ZeroPadding', label: 'Zero Padding' },
  { value: 'NoPadding', label: 'No Padding (需对齐)' },
];

// 编码格式选项
const encodingOptions = [
  { value: 'Hex', label: 'Hex' },
  { value: 'Base64', label: 'Base64' },
  { value: 'Utf8', label: 'Utf8' },
];

// AES 密钥长度选项
const aesKeyLengthOptions = [
  { value: 16, label: 'AES-128 (16B)' },
  { value: 24, label: 'AES-192 (24B)' },
  { value: 32, label: 'AES-256 (32B)' },
];

// DES 密钥长度选项
const desKeyLengthOptions = [
  { value: 8, label: 'DES (8B)' },
];

// 3DES 密钥长度选项
const tripleDesKeyLengthOptions = [
  { value: 24, label: '3DES (24B)' },
];

// AEAD 密钥长度选项
const aeadKeyLengthOptions = [
  { value: 16, label: '128位 (16B)' },
  { value: 32, label: '256位 (32B)' },
];

// 生成随机字节
const generateRandomBytes = (length: number): Uint8Array => {
  return crypto.getRandomValues(new Uint8Array(length));
};

// ============ ZUC 祖冲之算法实现 (GM/T 0001-2012) ============

// ZUC S-Box
const ZUC_S0 = [
  0x3e,0x72,0x5b,0x47,0xca,0xe0,0x00,0x33,0x04,0xd1,0x54,0x98,0x09,0xb9,0x6d,0xcb,
  0x7b,0x1b,0xf9,0x32,0xaf,0x9d,0x6a,0xa5,0xb8,0x2d,0xfc,0x1d,0x08,0x53,0x03,0x90,
  0x4d,0x4e,0x84,0x99,0xe4,0xce,0xd9,0x91,0xdd,0xb6,0x85,0x48,0x8b,0x29,0x6e,0xac,
  0xcd,0xc1,0xf8,0x1e,0x73,0x43,0x69,0xc6,0xb5,0xbd,0xfd,0x39,0x63,0x20,0xd4,0x38,
  0x76,0x7d,0xb2,0xa7,0xcf,0xed,0x57,0xc5,0xf3,0x2c,0xbb,0x14,0x21,0x06,0x55,0x9b,
  0xe3,0xef,0x5e,0x31,0x4f,0x7f,0x5a,0xa4,0x0d,0x82,0x51,0x49,0x5f,0xba,0x58,0x1c,
  0x4a,0x16,0xd5,0x17,0xa8,0x92,0x24,0x1f,0x8c,0xff,0xd8,0xae,0x2e,0x01,0xd3,0xad,
  0x3b,0x4b,0xda,0x46,0xeb,0xc9,0xde,0x9a,0x8f,0x87,0xd7,0x3a,0x80,0x6f,0x2f,0xc8,
  0xb1,0xb4,0x37,0xf7,0x0a,0x22,0x13,0x28,0x7c,0xcc,0x3c,0x89,0xc7,0xc3,0x96,0x56,
  0x07,0xbf,0x7e,0xf0,0x0b,0x2b,0x97,0x52,0x35,0x41,0x79,0x61,0xa6,0x4c,0x10,0xfe,
  0xbc,0x26,0x95,0x88,0x8a,0xb0,0xa3,0xfb,0xc0,0x18,0x94,0xf2,0xe1,0xe5,0xe9,0x5d,
  0xd0,0xdc,0x11,0x66,0x64,0x5c,0xec,0x59,0x42,0x75,0x12,0xf5,0x74,0x9c,0xaa,0x23,
  0x0e,0x86,0xab,0xbe,0x2a,0x02,0xe7,0x67,0xe6,0x44,0xa2,0x6c,0xc2,0x93,0x9f,0xf1,
  0xf6,0xfa,0x36,0xd2,0x50,0x68,0x9e,0x62,0x71,0x15,0x3d,0xd6,0x40,0xc4,0xe2,0x0f,
  0x8e,0x83,0x77,0x6b,0x25,0x05,0x3f,0x0c,0x30,0xea,0x70,0xb7,0xa1,0xe8,0xa9,0x65,
  0x8d,0x27,0x1a,0xdb,0x81,0xb3,0xa0,0xf4,0x45,0x7a,0x19,0xdf,0xee,0x78,0x34,0x60
];

const ZUC_S1 = [
  0x55,0xc2,0x63,0x71,0x3b,0xc8,0x47,0x86,0x9f,0x3c,0xda,0x5b,0x29,0xaa,0xfd,0x77,
  0x8c,0xc5,0x94,0x0c,0xa6,0x1a,0x13,0x00,0xe3,0xa8,0x16,0x72,0x40,0xf9,0xf8,0x42,
  0x44,0x26,0x68,0x96,0x81,0xd9,0x45,0x3e,0x10,0x76,0xc6,0xa7,0x8b,0x39,0x43,0xe1,
  0x3a,0xb5,0x56,0x2a,0xc0,0x6d,0xb3,0x05,0x22,0x66,0xbf,0xdc,0x0b,0xfa,0x62,0x48,
  0xdd,0x20,0x11,0x06,0x36,0xc9,0xc1,0xcf,0xf6,0x27,0x52,0xbb,0x69,0xf5,0xd4,0x87,
  0x7f,0x84,0x4c,0xd2,0x9c,0x57,0xa4,0xbc,0x4f,0x9a,0xdf,0xfe,0xd6,0x8d,0x7a,0xeb,
  0x2b,0x53,0xd8,0x5c,0xa1,0x14,0x17,0xfb,0x23,0xd5,0x7d,0x30,0x67,0x73,0x08,0x09,
  0xee,0xb7,0x70,0x3f,0x61,0xb2,0x19,0x8e,0x4e,0xe5,0x4b,0x93,0x8f,0x5d,0xdb,0xa9,
  0xad,0xf1,0xae,0x2e,0xcb,0x0d,0xfc,0xf4,0x2d,0x46,0x6e,0x1d,0x97,0xe8,0xd1,0xe9,
  0x4d,0x37,0xa5,0x75,0x5e,0x83,0x9e,0xab,0x82,0x9d,0xb9,0x1c,0xe0,0xcd,0x49,0x89,
  0x01,0xb6,0xbd,0x58,0x24,0xa2,0x5f,0x38,0x78,0x99,0x15,0x90,0x50,0xb8,0x95,0xe4,
  0xd0,0x91,0xc7,0xce,0xed,0x0f,0xb4,0x6f,0xa0,0xcc,0xf0,0x02,0x4a,0x79,0xc3,0xde,
  0xa3,0xef,0xea,0x51,0xe6,0x6b,0x18,0xec,0x1b,0x2c,0x80,0xf7,0x74,0xe7,0xff,0x21,
  0x5a,0x6a,0x54,0x1e,0x41,0x31,0x92,0x35,0xc4,0x33,0x07,0x0a,0xba,0x7e,0x0e,0x34,
  0x88,0xb1,0x98,0x7c,0xf3,0x3d,0x60,0x6c,0x7b,0xca,0xd3,0x1f,0x32,0x65,0x04,0x28,
  0x64,0xbe,0x85,0x9b,0x2f,0x59,0x8a,0xd7,0xb0,0x25,0xac,0xaf,0x12,0x03,0xe2,0xf2
];

// ZUC D 常量
const ZUC_D = [
  0x44D7, 0x26BC, 0x626B, 0x135E, 0x5789, 0x35E2, 0x7135, 0x09AF,
  0x4D78, 0x2F13, 0x6BC4, 0x1AF1, 0x5E26, 0x3C4D, 0x789A, 0x47AC
];

// ZUC 类实现
class ZUCCipher {
  private LFSR: Uint32Array;
  private R1: number;
  private R2: number;

  constructor(key: Uint8Array, iv: Uint8Array) {
    this.LFSR = new Uint32Array(16);
    this.R1 = 0;
    this.R2 = 0;
    this.initialize(key, iv);
  }

  private mod31(a: number): number {
    return ((a >>> 31) + (a & 0x7FFFFFFF)) >>> 0;
  }

  private rotl31(a: number, k: number): number {
    return this.mod31((a << k) | (a >>> (31 - k)));
  }

  private rotl32(a: number, k: number): number {
    return ((a << k) | (a >>> (32 - k))) >>> 0;
  }

  private L1(X: number): number {
    return (X ^ this.rotl32(X, 2) ^ this.rotl32(X, 10) ^ this.rotl32(X, 18) ^ this.rotl32(X, 24)) >>> 0;
  }

  private L2(X: number): number {
    return (X ^ this.rotl32(X, 8) ^ this.rotl32(X, 14) ^ this.rotl32(X, 22) ^ this.rotl32(X, 30)) >>> 0;
  }

  private makeu31(a: number, b: number, c: number): number {
    return (((a << 23) | (b << 8) | c) >>> 0);
  }

  private initialize(key: Uint8Array, iv: Uint8Array): void {
    for (let i = 0; i < 16; i++) {
      this.LFSR[i] = this.makeu31(key[i], ZUC_D[i], iv[i]);
    }
    this.R1 = 0;
    this.R2 = 0;

    for (let i = 0; i < 32; i++) {
      this.bitReconstruction();
      const W = this.F();
      this.LFSRWithInitialisationMode(W >>> 1);
    }
  }

  private bitReconstruction(): { X0: number; X1: number; X2: number; X3: number } {
    const X0 = ((this.LFSR[15] << 1) | (this.LFSR[14] >>> 30)) >>> 0;
    const X1 = ((this.LFSR[11] << 16) | (this.LFSR[9] >>> 15)) >>> 0;
    const X2 = ((this.LFSR[7] << 16) | (this.LFSR[5] >>> 15)) >>> 0;
    const X3 = ((this.LFSR[2] << 16) | (this.LFSR[0] >>> 15)) >>> 0;
    return { X0, X1, X2, X3 };
  }

  private F(): number {
    const X0 = ((this.LFSR[15] << 1) | (this.LFSR[14] >>> 30)) >>> 0;
    const X1 = ((this.LFSR[11] << 16) | (this.LFSR[9] >>> 15)) >>> 0;
    const X2 = ((this.LFSR[7] << 16) | (this.LFSR[5] >>> 15)) >>> 0;
    const W = ((X0 ^ this.R1) + this.R2) >>> 0;
    const W1 = (this.R1 + X1) >>> 0;
    const W2 = (this.R2 ^ X2) >>> 0;
    const u = this.L1(((W1 << 16) | (W2 >>> 16)) >>> 0);
    const v = this.L2(((W2 << 16) | (W1 >>> 16)) >>> 0);
    this.R1 = ((ZUC_S0[u >>> 24] << 24) | (ZUC_S1[(u >>> 16) & 0xFF] << 16) | (ZUC_S0[(u >>> 8) & 0xFF] << 8) | ZUC_S1[u & 0xFF]) >>> 0;
    this.R2 = ((ZUC_S0[v >>> 24] << 24) | (ZUC_S1[(v >>> 16) & 0xFF] << 16) | (ZUC_S0[(v >>> 8) & 0xFF] << 8) | ZUC_S1[v & 0xFF]) >>> 0;
    return W;
  }

  private LFSRWithInitialisationMode(u: number): void {
    let v = this.LFSR[0];
    v = this.mod31(v + this.rotl31(this.LFSR[0], 8));
    v = this.mod31(v + this.rotl31(this.LFSR[4], 20));
    v = this.mod31(v + this.rotl31(this.LFSR[10], 21));
    v = this.mod31(v + this.rotl31(this.LFSR[13], 17));
    v = this.mod31(v + this.rotl31(this.LFSR[15], 15));
    v = this.mod31(v + u);

    for (let i = 0; i < 15; i++) {
      this.LFSR[i] = this.LFSR[i + 1];
    }
    this.LFSR[15] = v === 0 ? 0x7FFFFFFF : v;
  }

  private LFSRWithWorkMode(): void {
    let v = this.LFSR[0];
    v = this.mod31(v + this.rotl31(this.LFSR[0], 8));
    v = this.mod31(v + this.rotl31(this.LFSR[4], 20));
    v = this.mod31(v + this.rotl31(this.LFSR[10], 21));
    v = this.mod31(v + this.rotl31(this.LFSR[13], 17));
    v = this.mod31(v + this.rotl31(this.LFSR[15], 15));

    for (let i = 0; i < 15; i++) {
      this.LFSR[i] = this.LFSR[i + 1];
    }
    this.LFSR[15] = v === 0 ? 0x7FFFFFFF : v;
  }

  generateKeystream(length: number): Uint32Array {
    const keystream = new Uint32Array(length);
    for (let i = 0; i < length; i++) {
      const { X3 } = this.bitReconstruction();
      const Z = (this.F() ^ X3) >>> 0;
      keystream[i] = Z;
      this.LFSRWithWorkMode();
    }
    return keystream;
  }

  encrypt(plaintext: Uint8Array): Uint8Array {
    const wordLen = Math.ceil(plaintext.length / 4);
    const keystream = this.generateKeystream(wordLen);
    const ciphertext = new Uint8Array(plaintext.length);
    
    for (let i = 0; i < plaintext.length; i++) {
      const wordIndex = Math.floor(i / 4);
      const byteIndex = 3 - (i % 4);
      const keystreamByte = (keystream[wordIndex] >>> (byteIndex * 8)) & 0xFF;
      ciphertext[i] = plaintext[i] ^ keystreamByte;
    }
    return ciphertext;
  }

  decrypt(ciphertext: Uint8Array): Uint8Array {
    return this.encrypt(ciphertext); // XOR 是对称的
  }
}

// ZUC 辅助函数
const zucHexToBytes = (hex: string): Uint8Array => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
};

const zucBytesToHex = (bytes: Uint8Array): string => {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
};

// ============ @noble/ciphers 实现 ============

// 字符串转 Uint8Array
const strToUint8Array = (str: string): Uint8Array => {
  return new TextEncoder().encode(str);
};

// Uint8Array 转字符串
const uint8ArrayToStr = (arr: Uint8Array): string => {
  return new TextDecoder().decode(arr);
};

// Uint8Array 转 Base64
const uint8ArrayToBase64 = (arr: Uint8Array): string => {
  let binary = '';
  for (let i = 0; i < arr.length; i++) {
    binary += String.fromCharCode(arr[i]);
  }
  return btoa(binary);
};

// Base64 转 Uint8Array
const base64ToUint8Array = (base64: string): Uint8Array => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

// Hex 转 Uint8Array
const hexToUint8Array = (hex: string): Uint8Array => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
};

// Uint8Array 转 Hex
const uint8ArrayToHex = (arr: Uint8Array): string => {
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
};

// AES-SIV 加密 (作为 AES-CCM 的替代，因为 noble 不直接支持 CCM)
const aesSivEncrypt = (plaintext: string, keyBytes: Uint8Array, nonce: Uint8Array): { ciphertext: string; tag: string } => {
  // AES-SIV 需要 32 或 64 字节密钥
  let key = keyBytes;
  if (keyBytes.length === 16) {
    // 扩展为 32 字节
    key = new Uint8Array(32);
    key.set(keyBytes);
    key.set(keyBytes, 16);
  } else if (keyBytes.length === 32) {
    // 扩展为 64 字节
    key = new Uint8Array(64);
    key.set(keyBytes);
    key.set(keyBytes, 32);
  }
  const cipher = aessiv(key, nonce);
  const encrypted = cipher.encrypt(strToUint8Array(plaintext));
  // SIV 输出前 16 字节是 tag
  const tag = encrypted.slice(0, 16);
  const ciphertext = encrypted.slice(16);
  return { ciphertext: uint8ArrayToBase64(ciphertext), tag: uint8ArrayToBase64(tag) };
};

// AES-SIV 解密
const aesSivDecrypt = (ciphertextB64: string, tagB64: string, keyBytes: Uint8Array, nonce: Uint8Array): string => {
  let key = keyBytes;
  if (keyBytes.length === 16) {
    key = new Uint8Array(32);
    key.set(keyBytes);
    key.set(keyBytes, 16);
  } else if (keyBytes.length === 32) {
    key = new Uint8Array(64);
    key.set(keyBytes);
    key.set(keyBytes, 32);
  }
  const cipher = aessiv(key, nonce);
  const tag = base64ToUint8Array(tagB64);
  const ciphertext = base64ToUint8Array(ciphertextB64);
  // 合并 tag + ciphertext
  const combined = new Uint8Array(tag.length + ciphertext.length);
  combined.set(tag);
  combined.set(ciphertext, tag.length);
  const decrypted = cipher.decrypt(combined);
  return uint8ArrayToStr(decrypted);
};

// ChaCha20-Poly1305 加密
const chacha20Encrypt = (plaintext: string, keyBytes: Uint8Array, nonce: Uint8Array): { ciphertext: string; tag: string } => {
  if (keyBytes.length !== 32) {
    throw new Error('ChaCha20-Poly1305 密钥必须是 32 字节');
  }
  if (nonce.length !== 12) {
    throw new Error('ChaCha20-Poly1305 Nonce 必须是 12 字节');
  }
  const cipher = chacha20poly1305(keyBytes, nonce);
  const encrypted = cipher.encrypt(strToUint8Array(plaintext));
  // 输出 = 密文 + 16字节 tag
  const ciphertext = encrypted.slice(0, -16);
  const tag = encrypted.slice(-16);
  return { ciphertext: uint8ArrayToBase64(ciphertext), tag: uint8ArrayToBase64(tag) };
};

// ChaCha20-Poly1305 解密
const chacha20Decrypt = (ciphertextB64: string, tagB64: string, keyBytes: Uint8Array, nonce: Uint8Array): string => {
  if (keyBytes.length !== 32) {
    throw new Error('ChaCha20-Poly1305 密钥必须是 32 字节');
  }
  if (nonce.length !== 12) {
    throw new Error('ChaCha20-Poly1305 Nonce 必须是 12 字节');
  }
  const cipher = chacha20poly1305(keyBytes, nonce);
  const ciphertext = base64ToUint8Array(ciphertextB64);
  const tag = base64ToUint8Array(tagB64);
  // 合并密文和 tag
  const combined = new Uint8Array(ciphertext.length + tag.length);
  combined.set(ciphertext);
  combined.set(tag, ciphertext.length);
  const decrypted = cipher.decrypt(combined);
  return uint8ArrayToStr(decrypted);
};

// noble/ciphers AES-GCM 加密
const nobleAesGcmEncrypt = (plaintext: string, keyBytes: Uint8Array, nonce: Uint8Array): { ciphertext: string; tag: string } => {
  if (![16, 24, 32].includes(keyBytes.length)) {
    throw new Error('AES-GCM 密钥必须是 16/24/32 字节');
  }
  const cipher = gcm(keyBytes, nonce);
  const encrypted = cipher.encrypt(strToUint8Array(plaintext));
  // 输出 = 密文 + 16字节 tag
  const ciphertext = encrypted.slice(0, -16);
  const tag = encrypted.slice(-16);
  return { ciphertext: uint8ArrayToBase64(ciphertext), tag: uint8ArrayToBase64(tag) };
};

// noble/ciphers AES-GCM 解密
const nobleAesGcmDecrypt = (ciphertextB64: string, tagB64: string, keyBytes: Uint8Array, nonce: Uint8Array): string => {
  if (![16, 24, 32].includes(keyBytes.length)) {
    throw new Error('AES-GCM 密钥必须是 16/24/32 字节');
  }
  const cipher = gcm(keyBytes, nonce);
  const ciphertext = base64ToUint8Array(ciphertextB64);
  const tag = base64ToUint8Array(tagB64);
  const combined = new Uint8Array(ciphertext.length + tag.length);
  combined.set(ciphertext);
  combined.set(tag, ciphertext.length);
  const decrypted = cipher.decrypt(combined);
  return uint8ArrayToStr(decrypted);
};

const CryptoTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState('aes');
  
  // 通用状态
  const [inputText, setInputText] = useState('');
  const [mode, setMode] = useState('CBC');
  const [padding, setPadding] = useState('Pkcs7');
  const [key, setKey] = useState('');
  const [keyEncoding, setKeyEncoding] = useState('Utf8');
  const [iv, setIv] = useState('');
  const [ivEncoding, setIvEncoding] = useState('Utf8');
  const [ciphertextEncoding, setCiphertextEncoding] = useState('Base64'); // 密文格式
  const [outputEncoding, setOutputEncoding] = useState('Base64'); // 输出格式
  
  // 结果状态
  const [outputText, setOutputText] = useState('');
  const [outputError, setOutputError] = useState('');
  
  // AEAD 专用状态
  const [aeadTag, setAeadTag] = useState(''); // 认证标签

  // 获取 CryptoJS 模式
  const getCryptoMode = (m: string) => {
    const modes: Record<string, typeof CryptoJS.mode.CBC> = {
      CBC: CryptoJS.mode.CBC,
      CFB: CryptoJS.mode.CFB,
      CTR: CryptoJS.mode.CTR,
      OFB: CryptoJS.mode.OFB,
      ECB: CryptoJS.mode.ECB,
    };
    return modes[m] || CryptoJS.mode.CBC;
  };

  // 获取 CryptoJS 填充方式
  const getCryptoPadding = (p: string) => {
    const paddings: Record<string, typeof CryptoJS.pad.Pkcs7> = {
      Pkcs7: CryptoJS.pad.Pkcs7,
      Iso97971: CryptoJS.pad.Iso97971,
      AnsiX923: CryptoJS.pad.AnsiX923,
      Iso10126: CryptoJS.pad.Iso10126,
      ZeroPadding: CryptoJS.pad.ZeroPadding,
      NoPadding: CryptoJS.pad.NoPadding,
    };
    return paddings[p] || CryptoJS.pad.Pkcs7;
  };

  // 解析密钥/IV
  const parseValue = (value: string, encoding: string): CryptoJS.lib.WordArray => {
    if (encoding === 'Hex') {
      return CryptoJS.enc.Hex.parse(value);
    } else if (encoding === 'Base64') {
      return CryptoJS.enc.Base64.parse(value);
    }
    return CryptoJS.enc.Utf8.parse(value);
  };



  // 生成随机密钥
  const generateRandomKey = (length: number) => {
    const randomBytes = CryptoJS.lib.WordArray.random(length);
    setKey(randomBytes.toString(CryptoJS.enc.Hex));
    setKeyEncoding('Hex');
  };

  // 生成随机 IV
  const generateRandomIv = (length: number = 16) => {
    const randomBytes = CryptoJS.lib.WordArray.random(length);
    setIv(randomBytes.toString(CryptoJS.enc.Hex));
    setIvEncoding('Hex');
  };

  // 一键生成密钥和 IV
  const generateKeyAndIv = () => {
    // 根据算法类型生成正确长度的密钥
    if (activeTab === 'aes') {
      generateRandomKey(16); // AES-128
      generateRandomIv(16);
    } else if (activeTab === 'des') {
      generateRandomKey(8);
      generateRandomIv(8);
    } else if (activeTab === '3des') {
      generateRandomKey(24);
      generateRandomIv(8);
    }
  };

  // 验证密钥长度
  const validateKeyLength = (keyBytes: number): boolean => {
    if (activeTab === 'aes') {
      if (![16, 24, 32].includes(keyBytes)) {
        message.error(`AES 密钥长度必须是 16/24/32 字节，当前: ${keyBytes} 字节`);
        return false;
      }
    } else if (activeTab === 'des') {
      if (keyBytes !== 8) {
        message.error(`DES 密钥长度必须是 8 字节，当前: ${keyBytes} 字节`);
        return false;
      }
    } else if (activeTab === '3des') {
      if (keyBytes !== 24) {
        message.error(`3DES 密钥长度必须是 24 字节，当前: ${keyBytes} 字节`);
        return false;
      }
    }
    return true;
  };

  // 验证 IV 长度
  const validateIvLength = (ivBytes: number): boolean => {
    const requiredLength = activeTab === 'aes' ? 16 : 8;
    if (ivBytes !== requiredLength) {
      message.error(`${activeTab.toUpperCase()} IV 长度必须是 ${requiredLength} 字节，当前: ${ivBytes} 字节`);
      return false;
    }
    return true;
  };

  // 加密
  const handleEncrypt = () => {
    if (!inputText) {
      message.warning('请输入要加密的内容');
      return;
    }
    if (!key) {
      message.warning('请输入密钥');
      return;
    }

    try {
      const keyWordArray = parseValue(key, keyEncoding);
      
      // 验证密钥长度
      if (!validateKeyLength(keyWordArray.sigBytes)) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const options: any = {
        mode: getCryptoMode(mode),
        padding: getCryptoPadding(padding),
      };

      if (mode !== 'ECB') {
        if (!iv) {
          message.warning('请输入偏移量IV');
          return;
        }
        const ivWordArray = parseValue(iv, ivEncoding);
        // 验证 IV 长度
        if (!validateIvLength(ivWordArray.sigBytes)) return;
        options.iv = ivWordArray;
      }

      let encrypted;
      if (activeTab === 'aes') {
        encrypted = CryptoJS.AES.encrypt(inputText, keyWordArray, options);
      } else if (activeTab === 'des') {
        encrypted = CryptoJS.DES.encrypt(inputText, keyWordArray, options);
      } else if (activeTab === '3des') {
        encrypted = CryptoJS.TripleDES.encrypt(inputText, keyWordArray, options);
      }

      if (encrypted) {
        let result: string;
        if (outputEncoding === 'Base64') {
          result = encrypted.ciphertext.toString(CryptoJS.enc.Base64);
        } else {
          result = encrypted.ciphertext.toString(CryptoJS.enc.Hex);
        }
        setOutputText(result);
        setOutputError('');
        message.success('加密成功');
      }
    } catch (error) {
      setOutputText('');
      setOutputError('加密失败: ' + (error as Error).message);
    }
  };

  // 解密
  const handleDecrypt = () => {
    if (!inputText) {
      message.warning('请输入要解密的内容');
      return;
    }
    if (!key) {
      message.warning('请输入密钥');
      return;
    }

    try {
      const keyWordArray = parseValue(key, keyEncoding);
      
      // 验证密钥长度
      if (!validateKeyLength(keyWordArray.sigBytes)) return;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const options: any = {
        mode: getCryptoMode(mode),
        padding: getCryptoPadding(padding),
      };

      if (mode !== 'ECB') {
        if (!iv) {
          message.warning('请输入偏移量IV');
          return;
        }
        const ivWordArray = parseValue(iv, ivEncoding);
        // 验证 IV 长度
        if (!validateIvLength(ivWordArray.sigBytes)) return;
        options.iv = ivWordArray;
      }

      // 根据密文格式解析
      let ciphertextWordArray: CryptoJS.lib.WordArray;
      if (ciphertextEncoding === 'Base64') {
        ciphertextWordArray = CryptoJS.enc.Base64.parse(inputText);
      } else {
        ciphertextWordArray = CryptoJS.enc.Hex.parse(inputText);
      }
      
      const cipherParams = CryptoJS.lib.CipherParams.create({
        ciphertext: ciphertextWordArray,
      });

      let decrypted;
      if (activeTab === 'aes') {
        decrypted = CryptoJS.AES.decrypt(cipherParams, keyWordArray, options);
      } else if (activeTab === 'des') {
        decrypted = CryptoJS.DES.decrypt(cipherParams, keyWordArray, options);
      } else if (activeTab === '3des') {
        decrypted = CryptoJS.TripleDES.decrypt(cipherParams, keyWordArray, options);
      }

      if (decrypted) {
        const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
        if (!plaintext) {
          setOutputText('');
          setOutputError('解密失败，请检查原文、密匙及模式是否正确');
          return;
        }
        setOutputText(plaintext);
        setOutputError('');
        message.success('解密成功');
      }
    } catch (error) {
      setOutputText('');
      setOutputError('解密失败，请检查原文、密匙及模式是否正确');
    }
  };

  // JSON格式化
  const handleJsonFormat = () => {
    if (!outputText) return;
    try {
      const parsed = JSON.parse(outputText);
      setOutputText(JSON.stringify(parsed, null, 2));
    } catch {
      message.error('不是有效的JSON格式');
    }
  };

  // Unicode转中文
  const handleUnicodeToChinese = () => {
    if (!outputText) return;
    try {
      const result = outputText.replace(/\\u([0-9a-fA-F]{4})/g, (_, code) => 
        String.fromCharCode(parseInt(code, 16))
      );
      setOutputText(result);
    } catch {
      message.error('转换失败');
    }
  };

  // 复制结果
  const handleCopyOutput = async () => {
    if (!outputText) {
      message.warning('没有可复制的内容');
      return;
    }
    try {
      await navigator.clipboard.writeText(outputText);
      message.success('已复制到剪贴板');
    } catch {
      message.error('复制失败');
    }
  };

  // 复制
  const handleCopy = async () => {
    if (!inputText) {
      message.warning('没有可复制的内容');
      return;
    }
    try {
      await navigator.clipboard.writeText(inputText);
      message.success('已复制到剪贴板');
    } catch {
      message.error('复制失败');
    }
  };

  // 清空
  const handleClear = () => {
    setInputText('');
    setOutputText('');
    setOutputError('');
    setKey('');
    setIv('');
    setAeadTag('');
  };

  // ============ AEAD 加密/解密 ============
  
  // 解析密钥为 Uint8Array
  const parseKeyToUint8Array = (keyStr: string, encoding: string): Uint8Array => {
    if (encoding === 'Hex') {
      return hexToUint8Array(keyStr);
    } else if (encoding === 'Base64') {
      return base64ToUint8Array(keyStr);
    }
    return strToUint8Array(keyStr);
  };

  // AES-GCM 加密处理
  const handleAesGcmEncrypt = () => {
    if (!inputText) { message.warning('请输入要加密的内容'); return; }
    if (!key) { message.warning('请输入密钥'); return; }
    if (!iv) { message.warning('请输入 IV/Nonce (推荐12字节)'); return; }

    try {
      const keyBytes = parseKeyToUint8Array(key, keyEncoding);
      const ivBytes = parseKeyToUint8Array(iv, ivEncoding);
      
      if (![16, 24, 32].includes(keyBytes.length)) {
        message.error('AES-GCM 密钥长度必须是 16/24/32 字节');
        return;
      }

      const result = nobleAesGcmEncrypt(inputText, keyBytes, ivBytes);
      setOutputText(result.ciphertext);
      setAeadTag(result.tag);
      setOutputError('');
      message.success('AES-GCM 加密成功');
    } catch (error) {
      setOutputError('加密失败: ' + (error as Error).message);
    }
  };

  // AES-GCM 解密处理
  const handleAesGcmDecrypt = () => {
    if (!inputText) { message.warning('请输入要解密的密文'); return; }
    if (!key) { message.warning('请输入密钥'); return; }
    if (!iv) { message.warning('请输入 IV/Nonce'); return; }
    if (!aeadTag) { message.warning('请输入认证标签 (Tag)'); return; }

    try {
      const keyBytes = parseKeyToUint8Array(key, keyEncoding);
      const ivBytes = parseKeyToUint8Array(iv, ivEncoding);

      const plaintext = nobleAesGcmDecrypt(inputText, aeadTag, keyBytes, ivBytes);
      setOutputText(plaintext);
      setOutputError('');
      message.success('AES-GCM 解密成功');
    } catch (error) {
      setOutputError('解密失败: 认证标签验证失败或密钥/IV 错误');
    }
  };

  // AES-SIV 加密处理 (作为 AES-CCM 替代)
  const handleAesCcmEncrypt = () => {
    if (!inputText) { message.warning('请输入要加密的内容'); return; }
    if (!key) { message.warning('请输入密钥'); return; }
    if (!iv) { message.warning('请输入 Nonce'); return; }

    try {
      const keyBytes = parseKeyToUint8Array(key, keyEncoding);
      const ivBytes = parseKeyToUint8Array(iv, ivEncoding);
      
      if (![16, 32].includes(keyBytes.length)) {
        message.error('AES-SIV 密钥长度必须是 16 或 32 字节');
        return;
      }

      const result = aesSivEncrypt(inputText, keyBytes, ivBytes);
      setOutputText(result.ciphertext);
      setAeadTag(result.tag);
      setOutputError('');
      message.success('AES-SIV 加密成功');
    } catch (error) {
      setOutputError('加密失败: ' + (error as Error).message);
    }
  };

  // AES-SIV 解密处理
  const handleAesCcmDecrypt = () => {
    if (!inputText) { message.warning('请输入要解密的密文'); return; }
    if (!key) { message.warning('请输入密钥'); return; }
    if (!iv) { message.warning('请输入 Nonce'); return; }
    if (!aeadTag) { message.warning('请输入认证标签 (Tag)'); return; }

    try {
      const keyBytes = parseKeyToUint8Array(key, keyEncoding);
      const ivBytes = parseKeyToUint8Array(iv, ivEncoding);

      const plaintext = aesSivDecrypt(inputText, aeadTag, keyBytes, ivBytes);
      setOutputText(plaintext);
      setOutputError('');
      message.success('AES-SIV 解密成功');
    } catch (error) {
      setOutputError('解密失败: 认证标签验证失败或密钥/Nonce 错误');
    }
  };

  // ChaCha20-Poly1305 加密处理
  const handleChaCha20Encrypt = () => {
    if (!inputText) { message.warning('请输入要加密的内容'); return; }
    if (!key) { message.warning('请输入密钥 (32字节)'); return; }
    if (!iv) { message.warning('请输入 Nonce (12字节)'); return; }

    try {
      const keyBytes = parseKeyToUint8Array(key, keyEncoding);
      const ivBytes = parseKeyToUint8Array(iv, ivEncoding);
      
      if (keyBytes.length !== 32) {
        message.error('ChaCha20-Poly1305 密钥必须是 32 字节');
        return;
      }
      if (ivBytes.length !== 12) {
        message.error('ChaCha20-Poly1305 Nonce 必须是 12 字节');
        return;
      }

      const result = chacha20Encrypt(inputText, keyBytes, ivBytes);
      setOutputText(result.ciphertext);
      setAeadTag(result.tag);
      setOutputError('');
      message.success('ChaCha20-Poly1305 加密成功');
    } catch (error) {
      setOutputError('加密失败: ' + (error as Error).message);
    }
  };

  // ChaCha20-Poly1305 解密处理
  const handleChaCha20Decrypt = () => {
    if (!inputText) { message.warning('请输入要解密的密文'); return; }
    if (!key) { message.warning('请输入密钥 (32字节)'); return; }
    if (!iv) { message.warning('请输入 Nonce (12字节)'); return; }
    if (!aeadTag) { message.warning('请输入认证标签 (Tag)'); return; }

    try {
      const keyBytes = parseKeyToUint8Array(key, keyEncoding);
      const ivBytes = parseKeyToUint8Array(iv, ivEncoding);

      const plaintext = chacha20Decrypt(inputText, aeadTag, keyBytes, ivBytes);
      setOutputText(plaintext);
      setOutputError('');
      message.success('ChaCha20-Poly1305 解密成功');
    } catch (error) {
      setOutputError('解密失败: 认证标签验证失败或密钥/Nonce 错误');
    }
  };

  // 生成 AEAD 随机密钥
  const generateAeadKey = (length: number) => {
    const randomBytes = generateRandomBytes(length);
    setKey(uint8ArrayToHex(randomBytes));
    setKeyEncoding('Hex');
  };

  // 生成 AEAD 随机 IV/Nonce
  const generateAeadIv = () => {
    // GCM 推荐 12 字节 nonce
    const randomBytes = generateRandomBytes(12);
    setIv(uint8ArrayToHex(randomBytes));
    setIvEncoding('Hex');
  };

  // 哈希计算
  const [hashInput, setHashInput] = useState('');
  const [hashResults, setHashResults] = useState<Record<string, string>>({});

  const calculateHash = () => {
    if (!hashInput) {
      message.warning('请输入要计算哈希的内容');
      return;
    }
    const results: Record<string, string> = {
      MD5: CryptoJS.MD5(hashInput).toString(),
      SHA1: CryptoJS.SHA1(hashInput).toString(),
      SHA224: CryptoJS.SHA224(hashInput).toString(),
      SHA256: CryptoJS.SHA256(hashInput).toString(),
      SHA384: CryptoJS.SHA384(hashInput).toString(),
      SHA512: CryptoJS.SHA512(hashInput).toString(),
    };
    setHashResults(results);
    message.success('哈希计算完成');
  };

  const copyHashResult = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      message.success('已复制到剪贴板');
    } catch {
      message.error('复制失败');
    }
  };

  // ============ 国密算法 ============
  
  // SM2 状态
  const [sm2PublicKey, setSm2PublicKey] = useState('');
  const [sm2PrivateKey, setSm2PrivateKey] = useState('');
  const [sm2CipherMode, setSm2CipherMode] = useState<0 | 1>(1); // 0: C1C2C3, 1: C1C3C2

  // SM4 状态
  const [sm4Mode, setSm4Mode] = useState('ecb');

  // 生成 SM2 密钥对
  const generateSm2KeyPair = () => {
    const keypair = sm2.generateKeyPairHex();
    setSm2PublicKey(keypair.publicKey);
    setSm2PrivateKey(keypair.privateKey);
    message.success('SM2 密钥对生成成功');
  };

  // SM2 加密
  const handleSm2Encrypt = () => {
    if (!inputText) { message.warning('请输入要加密的内容'); return; }
    if (!sm2PublicKey) { message.warning('请输入或生成公钥'); return; }

    try {
      const encrypted = sm2.doEncrypt(inputText, sm2PublicKey, sm2CipherMode);
      setOutputText(encrypted);
      setOutputError('');
      message.success('SM2 加密成功');
    } catch (error) {
      setOutputError('SM2 加密失败: ' + (error as Error).message);
    }
  };

  // SM2 解密
  const handleSm2Decrypt = () => {
    if (!inputText) { message.warning('请输入要解密的密文'); return; }
    if (!sm2PrivateKey) { message.warning('请输入私钥'); return; }

    try {
      const decrypted = sm2.doDecrypt(inputText, sm2PrivateKey, sm2CipherMode);
      if (!decrypted) {
        setOutputError('SM2 解密失败，请检查密文和私钥');
        return;
      }
      setOutputText(decrypted);
      setOutputError('');
      message.success('SM2 解密成功');
    } catch (error) {
      setOutputError('SM2 解密失败: ' + (error as Error).message);
    }
  };

  // SM2 签名
  const handleSm2Sign = () => {
    if (!inputText) { message.warning('请输入要签名的内容'); return; }
    if (!sm2PrivateKey) { message.warning('请输入私钥'); return; }

    try {
      const signature = sm2.doSignature(inputText, sm2PrivateKey);
      setOutputText(signature);
      setOutputError('');
      message.success('SM2 签名成功');
    } catch (error) {
      setOutputError('SM2 签名失败: ' + (error as Error).message);
    }
  };

  // SM2 验签
  const handleSm2Verify = () => {
    if (!inputText) { message.warning('请输入原文'); return; }
    if (!outputText) { message.warning('请在结果框输入签名'); return; }
    if (!sm2PublicKey) { message.warning('请输入公钥'); return; }

    try {
      const isValid = sm2.doVerifySignature(inputText, outputText, sm2PublicKey);
      if (isValid) {
        message.success('SM2 签名验证通过 ✓');
        setOutputError('');
      } else {
        setOutputError('SM2 签名验证失败 ✗');
      }
    } catch (error) {
      setOutputError('SM2 验签失败: ' + (error as Error).message);
    }
  };

  // SM3 哈希
  const [sm3Results, setSm3Results] = useState<Record<string, string>>({});
  
  const calculateSm3 = () => {
    if (!hashInput) {
      message.warning('请输入要计算哈希的内容');
      return;
    }
    const hash = sm3(hashInput);
    setSm3Results({ SM3: hash });
    message.success('SM3 哈希计算完成');
  };

  // SM4 加密
  const handleSm4Encrypt = () => {
    if (!inputText) { message.warning('请输入要加密的内容'); return; }
    if (!key) { message.warning('请输入密钥 (16字节/32位Hex)'); return; }

    try {
      let keyHex = key;
      if (keyEncoding === 'Utf8') {
        keyHex = Array.from(new TextEncoder().encode(key)).map(b => b.toString(16).padStart(2, '0')).join('');
      } else if (keyEncoding === 'Base64') {
        const bytes = atob(key);
        keyHex = Array.from(bytes).map((_, i) => bytes.charCodeAt(i).toString(16).padStart(2, '0')).join('');
      }

      if (keyHex.length !== 32) {
        message.error('SM4 密钥必须是 16 字节 (32位Hex)');
        return;
      }

      let encrypted: string;
      if (sm4Mode === 'cbc') {
        if (!iv) { message.warning('CBC 模式需要输入 IV'); return; }
        let ivHex = iv;
        if (ivEncoding === 'Utf8') {
          ivHex = Array.from(new TextEncoder().encode(iv)).map(b => b.toString(16).padStart(2, '0')).join('');
        }
        encrypted = sm4.encrypt(inputText, keyHex, { mode: 'cbc', iv: ivHex });
      } else {
        encrypted = sm4.encrypt(inputText, keyHex);
      }
      
      setOutputText(encrypted);
      setOutputError('');
      message.success('SM4 加密成功');
    } catch (error) {
      setOutputError('SM4 加密失败: ' + (error as Error).message);
    }
  };

  // SM4 解密
  const handleSm4Decrypt = () => {
    if (!inputText) { message.warning('请输入要解密的密文'); return; }
    if (!key) { message.warning('请输入密钥 (16字节/32位Hex)'); return; }

    try {
      let keyHex = key;
      if (keyEncoding === 'Utf8') {
        keyHex = Array.from(new TextEncoder().encode(key)).map(b => b.toString(16).padStart(2, '0')).join('');
      } else if (keyEncoding === 'Base64') {
        const bytes = atob(key);
        keyHex = Array.from(bytes).map((_, i) => bytes.charCodeAt(i).toString(16).padStart(2, '0')).join('');
      }

      if (keyHex.length !== 32) {
        message.error('SM4 密钥必须是 16 字节 (32位Hex)');
        return;
      }

      let decrypted: string;
      if (sm4Mode === 'cbc') {
        if (!iv) { message.warning('CBC 模式需要输入 IV'); return; }
        let ivHex = iv;
        if (ivEncoding === 'Utf8') {
          ivHex = Array.from(new TextEncoder().encode(iv)).map(b => b.toString(16).padStart(2, '0')).join('');
        }
        decrypted = sm4.decrypt(inputText, keyHex, { mode: 'cbc', iv: ivHex });
      } else {
        decrypted = sm4.decrypt(inputText, keyHex);
      }
      
      if (!decrypted) {
        setOutputError('SM4 解密失败，请检查密文和密钥');
        return;
      }
      setOutputText(decrypted);
      setOutputError('');
      message.success('SM4 解密成功');
    } catch (error) {
      setOutputError('SM4 解密失败: ' + (error as Error).message);
    }
  };

  // 生成 SM4 随机密钥
  const generateSm4Key = () => {
    const randomBytes = generateRandomBytes(16);
    setKey(uint8ArrayToHex(randomBytes));
    setKeyEncoding('Hex');
  };

  // 生成 SM4 随机 IV
  const generateSm4Iv = () => {
    const randomBytes = generateRandomBytes(16);
    setIv(uint8ArrayToHex(randomBytes));
    setIvEncoding('Hex');
  };

  // ============ ZUC 祖冲之算法 ============

  // ZUC 加密
  const handleZucEncrypt = () => {
    if (!inputText) { message.warning('请输入要加密的内容'); return; }
    if (!key) { message.warning('请输入密钥 (16字节/32位Hex)'); return; }
    if (!iv) { message.warning('请输入 IV (16字节/32位Hex)'); return; }

    try {
      let keyHex = key;
      if (keyEncoding === 'Utf8') {
        keyHex = Array.from(new TextEncoder().encode(key)).map(b => b.toString(16).padStart(2, '0')).join('');
      } else if (keyEncoding === 'Base64') {
        const bytes = atob(key);
        keyHex = Array.from(bytes).map((_, i) => bytes.charCodeAt(i).toString(16).padStart(2, '0')).join('');
      }

      let ivHex = iv;
      if (ivEncoding === 'Utf8') {
        ivHex = Array.from(new TextEncoder().encode(iv)).map(b => b.toString(16).padStart(2, '0')).join('');
      } else if (ivEncoding === 'Base64') {
        const bytes = atob(iv);
        ivHex = Array.from(bytes).map((_, i) => bytes.charCodeAt(i).toString(16).padStart(2, '0')).join('');
      }

      if (keyHex.length !== 32) {
        message.error('ZUC 密钥必须是 16 字节 (32位Hex)');
        return;
      }
      if (ivHex.length !== 32) {
        message.error('ZUC IV 必须是 16 字节 (32位Hex)');
        return;
      }

      const keyBytes = zucHexToBytes(keyHex);
      const ivBytes = zucHexToBytes(ivHex);
      const zuc = new ZUCCipher(keyBytes, ivBytes);
      const plaintextBytes = new TextEncoder().encode(inputText);
      const encrypted = zuc.encrypt(plaintextBytes);
      setOutputText(zucBytesToHex(encrypted));
      setOutputError('');
      message.success('ZUC 加密成功');
    } catch (error) {
      setOutputError('ZUC 加密失败: ' + (error as Error).message);
    }
  };

  // ZUC 解密
  const handleZucDecrypt = () => {
    if (!inputText) { message.warning('请输入要解密的密文 (Hex格式)'); return; }
    if (!key) { message.warning('请输入密钥 (16字节/32位Hex)'); return; }
    if (!iv) { message.warning('请输入 IV (16字节/32位Hex)'); return; }

    try {
      let keyHex = key;
      if (keyEncoding === 'Utf8') {
        keyHex = Array.from(new TextEncoder().encode(key)).map(b => b.toString(16).padStart(2, '0')).join('');
      } else if (keyEncoding === 'Base64') {
        const bytes = atob(key);
        keyHex = Array.from(bytes).map((_, i) => bytes.charCodeAt(i).toString(16).padStart(2, '0')).join('');
      }

      let ivHex = iv;
      if (ivEncoding === 'Utf8') {
        ivHex = Array.from(new TextEncoder().encode(iv)).map(b => b.toString(16).padStart(2, '0')).join('');
      } else if (ivEncoding === 'Base64') {
        const bytes = atob(iv);
        ivHex = Array.from(bytes).map((_, i) => bytes.charCodeAt(i).toString(16).padStart(2, '0')).join('');
      }

      if (keyHex.length !== 32) {
        message.error('ZUC 密钥必须是 16 字节 (32位Hex)');
        return;
      }
      if (ivHex.length !== 32) {
        message.error('ZUC IV 必须是 16 字节 (32位Hex)');
        return;
      }

      const keyBytes = zucHexToBytes(keyHex);
      const ivBytes = zucHexToBytes(ivHex);
      const zuc = new ZUCCipher(keyBytes, ivBytes);
      const ciphertextBytes = zucHexToBytes(inputText);
      const decrypted = zuc.decrypt(ciphertextBytes);
      const decryptedText = new TextDecoder().decode(decrypted);
      if (!decryptedText) {
        setOutputError('ZUC 解密失败，请检查密文和密钥');
        return;
      }
      setOutputText(decryptedText);
      setOutputError('');
      message.success('ZUC 解密成功');
    } catch (error) {
      setOutputError('ZUC 解密失败: ' + (error as Error).message);
    }
  };

  // 生成 ZUC 随机密钥
  const generateZucKey = () => {
    const randomBytes = generateRandomBytes(16);
    setKey(uint8ArrayToHex(randomBytes));
    setKeyEncoding('Hex');
  };

  // 生成 ZUC 随机 IV
  const generateZucIv = () => {
    const randomBytes = generateRandomBytes(16);
    setIv(uint8ArrayToHex(randomBytes));
    setIvEncoding('Hex');
  };

  // 标签页配置
  const tabItems = [
    { key: 'aes', label: 'AES' },
    { key: 'des', label: 'DES' },
    { key: '3des', label: '3DES' },
    { key: 'aes-gcm', label: 'AES-GCM' },
    { key: 'aes-siv', label: 'AES-SIV' },
    { key: 'chacha20', label: 'ChaCha20' },
    { key: 'sm2', label: 'SM2 国密' },
    { key: 'sm4', label: 'SM4 国密' },
    { key: 'zuc', label: 'ZUC 祖冲之' },
    { key: 'hash', label: '哈希加密' },
    { key: 'sm3', label: 'SM3 国密' },
    { key: 'gm-info', label: '国密说明' },
  ];

  // 判断是否是 AEAD 模式
  const isAeadMode = ['aes-gcm', 'aes-siv', 'chacha20'].includes(activeTab);

  // 获取 AEAD 加密处理函数
  const getAeadEncryptHandler = () => {
    if (activeTab === 'aes-gcm') return handleAesGcmEncrypt;
    if (activeTab === 'aes-siv') return handleAesCcmEncrypt;
    if (activeTab === 'chacha20') return handleChaCha20Encrypt;
    return handleAesGcmEncrypt;
  };

  // 获取 AEAD 解密处理函数
  const getAeadDecryptHandler = () => {
    if (activeTab === 'aes-gcm') return handleAesGcmDecrypt;
    if (activeTab === 'aes-siv') return handleAesCcmDecrypt;
    if (activeTab === 'chacha20') return handleChaCha20Decrypt;
    return handleAesGcmDecrypt;
  };

  return (
    <Card title="加密/解密工具" bordered={false}>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        style={{ marginBottom: 16 }}
      />

      {/* SM2 国密界面 */}
      {activeTab === 'sm2' ? (
        <>
          <TextArea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="请输入要加密/签名的内容"
            rows={6}
            style={{ marginBottom: 16, fontFamily: 'monospace' }}
          />

          <Space style={{ marginBottom: 16 }}>
            <Button type="primary" style={{ backgroundColor: '#52c41a' }} onClick={handleSm2Encrypt}>
              加密
            </Button>
            <Button type="primary" onClick={handleSm2Decrypt}>
              解密
            </Button>
            <Button style={{ backgroundColor: '#722ed1', borderColor: '#722ed1', color: '#fff' }} onClick={handleSm2Sign}>
              签名
            </Button>
            <Button style={{ backgroundColor: '#13c2c2', borderColor: '#13c2c2', color: '#fff' }} onClick={handleSm2Verify}>
              验签
            </Button>
            <Button danger onClick={handleClear}>
              清空
            </Button>
          </Space>

          {(outputText || outputError) && (
            <Card size="small" style={{ marginBottom: 16, backgroundColor: outputError ? '#fff2f0' : '#f6ffed', borderColor: outputError ? '#ffccc7' : '#b7eb8f' }}>
              {outputError ? (
                <div style={{ color: '#ff4d4f' }}>{outputError}</div>
              ) : (
                <>
                  <TextArea value={outputText} readOnly rows={4} style={{ fontFamily: 'monospace', fontSize: 12, marginBottom: 8 }} />
                  <Button size="small" onClick={handleCopyOutput}>复制</Button>
                </>
              )}
            </Card>
          )}

          <Card size="small" title="SM2 密钥设置" style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '12px 16px', alignItems: 'center' }}>
              <span>公钥:</span>
              <Space direction="vertical" style={{ width: '100%' }}>
                <TextArea
                  value={sm2PublicKey}
                  onChange={(e) => setSm2PublicKey(e.target.value)}
                  placeholder="04开头的公钥 (用于加密和验签)"
                  rows={2}
                  style={{ fontFamily: 'monospace', fontSize: 11 }}
                />
              </Space>

              <span>私钥:</span>
              <Space direction="vertical" style={{ width: '100%' }}>
                <TextArea
                  value={sm2PrivateKey}
                  onChange={(e) => setSm2PrivateKey(e.target.value)}
                  placeholder="私钥 (用于解密和签名)"
                  rows={2}
                  style={{ fontFamily: 'monospace', fontSize: 11 }}
                />
              </Space>

              <span>密文格式:</span>
              <Space>
                <Select
                  value={sm2CipherMode}
                  onChange={(v) => setSm2CipherMode(v as 0 | 1)}
                  style={{ width: 150 }}
                  options={[
                    { value: 1, label: 'C1C3C2 (推荐)' },
                    { value: 0, label: 'C1C2C3 (旧版)' },
                  ]}
                />
                <Button type="primary" onClick={generateSm2KeyPair}>生成密钥对</Button>
              </Space>
            </div>
            <div style={{ marginTop: 12, padding: 8, backgroundColor: '#e6f7ff', borderRadius: 4 }}>
              ℹ️ SM2 是中国国家密码管理局发布的椭圆曲线公钥密码算法，用于数字签名和加密
            </div>
          </Card>
        </>
      ) : activeTab === 'sm4' ? (
        <>
          <TextArea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="请输入要加密/解密的内容"
            rows={6}
            style={{ marginBottom: 16, fontFamily: 'monospace' }}
          />

          <Space style={{ marginBottom: 16 }}>
            <Button type="primary" style={{ backgroundColor: '#52c41a' }} onClick={handleSm4Encrypt}>
              加密
            </Button>
            <Button type="primary" onClick={handleSm4Decrypt}>
              解密
            </Button>
            <Button style={{ backgroundColor: '#faad14', borderColor: '#faad14', color: '#fff' }} onClick={handleCopy}>
              复制
            </Button>
            <Button danger onClick={handleClear}>
              清空
            </Button>
          </Space>

          {(outputText || outputError) && (
            <Card size="small" style={{ marginBottom: 16, backgroundColor: outputError ? '#fff2f0' : '#f6ffed', borderColor: outputError ? '#ffccc7' : '#b7eb8f' }}>
              {outputError ? (
                <div style={{ color: '#ff4d4f' }}>{outputError}</div>
              ) : (
                <>
                  <TextArea value={outputText} readOnly rows={4} style={{ fontFamily: 'monospace', fontSize: 12, marginBottom: 8 }} />
                  <Button size="small" onClick={handleCopyOutput}>复制</Button>
                </>
              )}
            </Card>
          )}

          <Card size="small" title="SM4 选项设置" style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '12px 16px', alignItems: 'center' }}>
              <span>加密模式:</span>
              <Select
                value={sm4Mode}
                onChange={setSm4Mode}
                style={{ width: 160 }}
                options={[
                  { value: 'ecb', label: 'ECB' },
                  { value: 'cbc', label: 'CBC' },
                ]}
              />

              <span>密钥:</span>
              <Space>
                <Input
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="16字节 (32位Hex)"
                  style={{ width: 300 }}
                />
                <Select value={keyEncoding} onChange={setKeyEncoding} options={encodingOptions} style={{ width: 80 }} />
                <Button onClick={generateSm4Key}>随机生成</Button>
              </Space>

              {sm4Mode === 'cbc' && (
                <>
                  <span>偏移量IV:</span>
                  <Space>
                    <Input
                      value={iv}
                      onChange={(e) => setIv(e.target.value)}
                      placeholder="16字节 (32位Hex)"
                      style={{ width: 300 }}
                    />
                    <Select value={ivEncoding} onChange={setIvEncoding} options={encodingOptions} style={{ width: 80 }} />
                    <Button onClick={generateSm4Iv}>随机生成</Button>
                  </Space>
                </>
              )}
            </div>
            <div style={{ marginTop: 12, padding: 8, backgroundColor: '#e6f7ff', borderRadius: 4 }}>
              ℹ️ SM4 是中国国家密码管理局发布的分组密码算法，密钥长度 128 位，分组长度 128 位
            </div>
          </Card>
        </>
      ) : activeTab === 'zuc' ? (
        <>
          <TextArea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="请输入要加密/解密的内容"
            rows={6}
            style={{ marginBottom: 16, fontFamily: 'monospace' }}
          />

          <Space style={{ marginBottom: 16 }}>
            <Button type="primary" style={{ backgroundColor: '#52c41a' }} onClick={handleZucEncrypt}>
              加密
            </Button>
            <Button type="primary" onClick={handleZucDecrypt}>
              解密
            </Button>
            <Button style={{ backgroundColor: '#faad14', borderColor: '#faad14', color: '#fff' }} onClick={handleCopy}>
              复制
            </Button>
            <Button danger onClick={handleClear}>
              清空
            </Button>
          </Space>

          {(outputText || outputError) && (
            <Card size="small" style={{ marginBottom: 16, backgroundColor: outputError ? '#fff2f0' : '#f6ffed', borderColor: outputError ? '#ffccc7' : '#b7eb8f' }}>
              {outputError ? (
                <div style={{ color: '#ff4d4f' }}>{outputError}</div>
              ) : (
                <>
                  <TextArea value={outputText} readOnly rows={4} style={{ fontFamily: 'monospace', fontSize: 12, marginBottom: 8 }} />
                  <Button size="small" onClick={handleCopyOutput}>复制</Button>
                </>
              )}
            </Card>
          )}

          <Card size="small" title="ZUC 选项设置" style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '12px 16px', alignItems: 'center' }}>
              <span>密钥:</span>
              <Space>
                <Input
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="16字节 (32位Hex)"
                  style={{ width: 300 }}
                />
                <Select value={keyEncoding} onChange={setKeyEncoding} options={encodingOptions} style={{ width: 80 }} />
                <Button onClick={generateZucKey}>随机生成</Button>
              </Space>

              <span>偏移量IV:</span>
              <Space>
                <Input
                  value={iv}
                  onChange={(e) => setIv(e.target.value)}
                  placeholder="16字节 (32位Hex)"
                  style={{ width: 300 }}
                />
                <Select value={ivEncoding} onChange={setIvEncoding} options={encodingOptions} style={{ width: 80 }} />
                <Button onClick={generateZucIv}>随机生成</Button>
              </Space>
            </div>
            <div style={{ marginTop: 12, padding: 8, backgroundColor: '#e6f7ff', borderRadius: 4 }}>
              ℹ️ ZUC（祖冲之算法）是中国国家密码管理局发布的流密码算法，用于 3GPP LTE 加密（EEA3）和完整性保护（EIA3）
            </div>
          </Card>
        </>
      ) : activeTab === 'sm3' ? (
        <>
          <TextArea
            value={hashInput}
            onChange={(e) => setHashInput(e.target.value)}
            placeholder="请输入要计算 SM3 哈希的内容"
            rows={6}
            style={{ marginBottom: 16, fontFamily: 'monospace' }}
          />
          <Space style={{ marginBottom: 16 }}>
            <Button type="primary" style={{ backgroundColor: '#52c41a' }} onClick={calculateSm3}>
              计算 SM3
            </Button>
            <Button type="primary" onClick={calculateHash}>
              计算全部哈希
            </Button>
            <Button danger onClick={() => { setHashInput(''); setHashResults({}); setSm3Results({}); }}>
              清空
            </Button>
          </Space>
          {(Object.keys(sm3Results).length > 0 || Object.keys(hashResults).length > 0) && (
            <Card size="small" style={{ backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }}>
              {Object.entries({ ...sm3Results, ...hashResults }).map(([algo, value]) => (
                <div key={algo} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 500, width: 70, color: algo === 'SM3' ? '#722ed1' : undefined }}>{algo}:</span>
                    <Button size="small" onClick={() => copyHashResult(value)}>复制</Button>
                  </div>
                  <Input value={value} readOnly style={{ fontFamily: 'monospace', fontSize: 12 }} />
                </div>
              ))}
            </Card>
          )}
          <div style={{ marginTop: 16, padding: 8, backgroundColor: '#e6f7ff', borderRadius: 4 }}>
            ℹ️ SM3 是中国国家密码管理局发布的密码杂凑算法，输出 256 位哈希值，安全性与 SHA-256 相当
          </div>
        </>
      ) : activeTab === 'gm-info' ? (
        <Card size="small" title="国密算法说明" style={{ marginBottom: 16 }}>
          <div style={{ lineHeight: 2 }}>
            <h4 style={{ color: '#1890ff', marginBottom: 8 }}>✅ 已实现的国密算法</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  <th style={{ padding: 8, border: '1px solid #d9d9d9', textAlign: 'left' }}>算法</th>
                  <th style={{ padding: 8, border: '1px solid #d9d9d9', textAlign: 'left' }}>类型</th>
                  <th style={{ padding: 8, border: '1px solid #d9d9d9', textAlign: 'left' }}>说明</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: 8, border: '1px solid #d9d9d9', fontWeight: 500, color: '#722ed1' }}>SM2</td>
                  <td style={{ padding: 8, border: '1px solid #d9d9d9' }}>非对称加密</td>
                  <td style={{ padding: 8, border: '1px solid #d9d9d9' }}>椭圆曲线公钥密码，支持加密/解密、签名/验签</td>
                </tr>
                <tr>
                  <td style={{ padding: 8, border: '1px solid #d9d9d9', fontWeight: 500, color: '#722ed1' }}>SM3</td>
                  <td style={{ padding: 8, border: '1px solid #d9d9d9' }}>哈希算法</td>
                  <td style={{ padding: 8, border: '1px solid #d9d9d9' }}>密码杂凑算法，256位输出，安全性与 SHA-256 相当</td>
                </tr>
                <tr>
                  <td style={{ padding: 8, border: '1px solid #d9d9d9', fontWeight: 500, color: '#722ed1' }}>SM4</td>
                  <td style={{ padding: 8, border: '1px solid #d9d9d9' }}>对称加密</td>
                  <td style={{ padding: 8, border: '1px solid #d9d9d9' }}>分组密码，128位密钥/分组，支持 ECB/CBC 模式</td>
                </tr>
                <tr>
                  <td style={{ padding: 8, border: '1px solid #d9d9d9', fontWeight: 500, color: '#722ed1' }}>ZUC</td>
                  <td style={{ padding: 8, border: '1px solid #d9d9d9' }}>流密码</td>
                  <td style={{ padding: 8, border: '1px solid #d9d9d9' }}>祖冲之算法，128位密钥/IV，用于 3GPP LTE 加密（EEA3/EIA3）</td>
                </tr>
              </tbody>
            </table>

            <h4 style={{ color: '#faad14', marginBottom: 8 }}>⚠️ 无法实现的国密算法</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  <th style={{ padding: 8, border: '1px solid #d9d9d9', textAlign: 'left' }}>算法</th>
                  <th style={{ padding: 8, border: '1px solid #d9d9d9', textAlign: 'left' }}>类型</th>
                  <th style={{ padding: 8, border: '1px solid #d9d9d9', textAlign: 'left' }}>无法实现原因</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: 8, border: '1px solid #d9d9d9', fontWeight: 500, color: '#ff4d4f' }}>SM1</td>
                  <td style={{ padding: 8, border: '1px solid #d9d9d9' }}>对称加密</td>
                  <td style={{ padding: 8, border: '1px solid #d9d9d9' }}>
                    <strong>算法不公开</strong>，只能通过专用硬件芯片实现（加密卡、USB Key、智能IC卡等），无法用纯软件实现
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: 8, border: '1px solid #d9d9d9', fontWeight: 500, color: '#ff4d4f' }}>SM9</td>
                  <td style={{ padding: 8, border: '1px solid #d9d9d9' }}>标识密码</td>
                  <td style={{ padding: 8, border: '1px solid #d9d9d9' }}>
                    基于标识的密码算法（IBC），目前 <strong>JavaScript 生态中没有成熟的开源实现</strong>
                  </td>
                </tr>
              </tbody>
            </table>

            <h4 style={{ color: '#52c41a', marginBottom: 8 }}>📚 国密算法标准</h4>
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              <li><strong>SM1</strong>: GM/T 0002-2012 (硬件实现)</li>
              <li><strong>SM2</strong>: GM/T 0003-2012 椭圆曲线公钥密码算法</li>
              <li><strong>SM3</strong>: GM/T 0004-2012 密码杂凑算法</li>
              <li><strong>SM4</strong>: GM/T 0002-2012 分组密码算法</li>
              <li><strong>SM9</strong>: GM/T 0044-2016 标识密码算法</li>
              <li><strong>ZUC</strong>: GM/T 0001-2012 祖冲之序列密码算法 (用于4G/5G通信)</li>
            </ul>

            <div style={{ marginTop: 16, padding: 12, backgroundColor: '#fffbe6', borderRadius: 4, border: '1px solid #ffe58f' }}>
              <strong>💡 提示：</strong>如需使用 SM1 或 SM9，请联系专业的密码设备供应商获取硬件支持或专业软件库。
            </div>
          </div>
        </Card>
      ) : activeTab === 'hash' ? (
        <>
          <TextArea
            value={hashInput}
            onChange={(e) => setHashInput(e.target.value)}
            placeholder="请输入要计算哈希的内容"
            rows={6}
            style={{ marginBottom: 16, fontFamily: 'monospace' }}
          />
          <Space style={{ marginBottom: 16 }}>
            <Button type="primary" style={{ backgroundColor: '#52c41a' }} onClick={calculateHash}>
              计算哈希
            </Button>
            <Button danger onClick={() => { setHashInput(''); setHashResults({}); }}>
              清空
            </Button>
          </Space>
          {Object.keys(hashResults).length > 0 && (
            <Card size="small" style={{ backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }}>
              {Object.entries(hashResults).map(([algo, value]) => (
                <div key={algo} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 500, width: 70 }}>{algo}:</span>
                    <Button size="small" onClick={() => copyHashResult(value)}>复制</Button>
                  </div>
                  <Input value={value} readOnly style={{ fontFamily: 'monospace', fontSize: 12 }} />
                </div>
              ))}
            </Card>
          )}
        </>
      ) : isAeadMode ? (
        /* AEAD 加密界面 */
        <>
          <TextArea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="请在这里填写原文/密文"
            rows={6}
            style={{ marginBottom: 16, fontFamily: 'monospace' }}
          />

          {/* AEAD 操作按钮 */}
          <Space style={{ marginBottom: 16 }}>
            <Button 
              type="primary" 
              style={{ backgroundColor: '#52c41a' }} 
              onClick={getAeadEncryptHandler()}
            >
              加密
            </Button>
            <Button 
              type="primary" 
              onClick={getAeadDecryptHandler()}
            >
              解密
            </Button>
            <Button style={{ backgroundColor: '#faad14', borderColor: '#faad14', color: '#fff' }} onClick={handleCopy}>
              复制
            </Button>
            <Button danger onClick={handleClear}>
              清空
            </Button>
          </Space>

          {/* AEAD 结果显示 */}
          {(outputText || outputError) && (
            <Card size="small" style={{ marginBottom: 16, backgroundColor: outputError ? '#fff2f0' : '#f6ffed', borderColor: outputError ? '#ffccc7' : '#b7eb8f' }}>
              {outputError ? (
                <div style={{ color: '#ff4d4f' }}>{outputError}</div>
              ) : (
                <>
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>密文:</div>
                    <TextArea value={outputText} readOnly rows={3} style={{ fontFamily: 'monospace', fontSize: 12 }} />
                  </div>
                  {aeadTag && (
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontWeight: 500, marginBottom: 4 }}>认证标签 (Tag):</div>
                      <Input value={aeadTag} readOnly style={{ fontFamily: 'monospace', fontSize: 12 }} />
                    </div>
                  )}
                  <Button size="small" onClick={handleCopyOutput}>复制密文</Button>
                </>
              )}
            </Card>
          )}

          {/* AEAD 选项设置 */}
          <Card size="small" title={`${activeTab.toUpperCase()} 选项设置`} style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '12px 16px', alignItems: 'center' }}>
              <span>密钥:</span>
              <Space>
                <Input
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="16或32字节"
                  style={{ width: 280 }}
                />
                <Select value={keyEncoding} onChange={setKeyEncoding} options={encodingOptions} style={{ width: 80 }} />
                <Select
                  placeholder="随机生成"
                  onChange={(value) => generateAeadKey(value)}
                  options={aeadKeyLengthOptions}
                  style={{ width: 120 }}
                  allowClear
                />
              </Space>

              <span>IV/Nonce:</span>
              <Space>
                <Input
                  value={iv}
                  onChange={(e) => setIv(e.target.value)}
                  placeholder="推荐12字节"
                  style={{ width: 280 }}
                />
                <Select value={ivEncoding} onChange={setIvEncoding} options={encodingOptions} style={{ width: 80 }} />
                <Button onClick={generateAeadIv}>随机12B</Button>
              </Space>

              <span>认证标签:</span>
              <Input
                value={aeadTag}
                onChange={(e) => setAeadTag(e.target.value)}
                placeholder="解密时需要输入加密生成的Tag"
                style={{ width: 400 }}
              />
            </div>
            
            {activeTab === 'aes-siv' && (
              <div style={{ marginTop: 12, padding: 8, backgroundColor: '#e6f7ff', borderRadius: 4 }}>
                ℹ️ AES-SIV (Synthetic IV) 是一种确定性 AEAD 模式，提供抗重放攻击保护
              </div>
            )}
            {activeTab === 'chacha20' && (
              <div style={{ marginTop: 12, padding: 8, backgroundColor: '#e6f7ff', borderRadius: 4 }}>
                ℹ️ ChaCha20-Poly1305 是现代流密码，密钥必须 32 字节，Nonce 必须 12 字节
              </div>
            )}
          </Card>
        </>
      ) : (
        <>
          {/* 输入区域 */}
          <TextArea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="请在这里填写原文/密文"
            rows={8}
            style={{ marginBottom: 16, fontFamily: 'monospace' }}
          />

      {/* 操作按钮 */}
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" style={{ backgroundColor: '#52c41a' }} onClick={handleEncrypt}>
          加密
        </Button>
        <Button type="primary" onClick={handleDecrypt}>
          解密
        </Button>
        <Button style={{ backgroundColor: '#faad14', borderColor: '#faad14', color: '#fff' }} onClick={handleCopy}>
          复制
        </Button>
        <Button danger onClick={handleClear}>
          清空
        </Button>
      </Space>

      {/* 结果显示区域 */}
      {(outputText || outputError) && (
        <Card 
          size="small" 
          style={{ 
            marginBottom: 16,
            backgroundColor: outputError ? '#fff2f0' : '#f6ffed',
            borderColor: outputError ? '#ffccc7' : '#b7eb8f'
          }}
        >
          {outputError ? (
            <div style={{ color: '#ff4d4f' }}>{outputError}</div>
          ) : (
            <>
              <TextArea
                value={outputText}
                readOnly
                rows={6}
                style={{ 
                  marginBottom: 8, 
                  fontFamily: 'monospace',
                  backgroundColor: 'transparent',
                  border: 'none'
                }}
              />
              <Space>
                <Button size="small" onClick={handleJsonFormat}>JSON格式化</Button>
                <Button size="small" onClick={handleUnicodeToChinese}>Unicode转中文</Button>
                <Button size="small" onClick={handleCopyOutput}>复制</Button>
              </Space>
            </>
          )}
        </Card>
      )}

      {/* 选项设置 */}
      <Card size="small" title="选项设置" style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '12px 16px', alignItems: 'center' }}>
          {/* 加密模式 */}
          <span>加密模式:</span>
          <Select
            value={mode}
            onChange={setMode}
            options={activeTab === 'aes' ? aesModeOptions : desModeOptions}
            style={{ width: 160 }}
          />

          {/* 填充方式 */}
          <span>填充方式:</span>
          <Select
            value={padding}
            onChange={setPadding}
            options={paddingOptions}
            style={{ width: 180 }}
          />

          {/* 密钥 */}
          <span>密　钥:</span>
          <Space>
            <Input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder={activeTab === 'aes' ? '16/24/32字节' : activeTab === 'des' ? '8字节' : '24字节'}
              style={{ width: 240 }}
            />
            <Select
              value={keyEncoding}
              onChange={setKeyEncoding}
              options={encodingOptions}
              style={{ width: 80 }}
            />
            <Select
              placeholder="随机生成"
              onChange={(value) => generateRandomKey(value)}
              options={activeTab === 'aes' ? aesKeyLengthOptions : activeTab === 'des' ? desKeyLengthOptions : tripleDesKeyLengthOptions}
              style={{ width: 130 }}
              allowClear
            />
            <Button onClick={generateKeyAndIv}>一键生成</Button>
          </Space>

          {/* 偏移量IV */}
          <span>偏移量IV:</span>
          <Space>
            <Input
              value={iv}
              onChange={(e) => setIv(e.target.value)}
              placeholder={activeTab === 'aes' ? '16字节' : '8字节'}
              style={{ width: 240 }}
              disabled={mode === 'ECB'}
            />
            <Select
              value={ivEncoding}
              onChange={setIvEncoding}
              options={encodingOptions}
              style={{ width: 80 }}
              disabled={mode === 'ECB'}
            />
            <Button onClick={() => generateRandomIv(activeTab === 'aes' ? 16 : 8)} disabled={mode === 'ECB'}>
              随机{activeTab === 'aes' ? '16' : '8'}B
            </Button>
          </Space>

          {/* 密文格式 */}
          <span>密文格式:</span>
          <Space>
            <Select
              value={ciphertextEncoding}
              onChange={setCiphertextEncoding}
              style={{ width: 140 }}
              options={[
                { value: 'Hex', label: 'Hex（解密用）' },
                { value: 'Base64', label: 'Base64（解密用）' },
              ]}
            />
            <Select
              value={outputEncoding}
              onChange={setOutputEncoding}
              style={{ width: 140 }}
              options={[
                { value: 'Hex', label: 'Hex（加密输出）' },
                { value: 'Base64', label: 'Base64（加密输出）' },
              ]}
            />
          </Space>
        </div>
      </Card>
        </>
      )}
    </Card>
  );
};

export default CryptoTool;
