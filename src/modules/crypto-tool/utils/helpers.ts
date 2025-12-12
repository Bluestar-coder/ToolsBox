import CryptoJS from 'crypto-js';

// 生成随机字节
export const generateRandomBytes = (length: number): Uint8Array => {
  return crypto.getRandomValues(new Uint8Array(length));
};

// 字符串转 Uint8Array
export const strToUint8Array = (str: string): Uint8Array => {
  return new TextEncoder().encode(str);
};

// Uint8Array 转字符串
export const uint8ArrayToStr = (arr: Uint8Array): string => {
  return new TextDecoder().decode(arr);
};

// Uint8Array 转 Base64
export const uint8ArrayToBase64 = (arr: Uint8Array): string => {
  let binary = '';
  for (let i = 0; i < arr.length; i++) {
    binary += String.fromCharCode(arr[i]);
  }
  return btoa(binary);
};

// Base64 转 Uint8Array
export const base64ToUint8Array = (base64: string): Uint8Array => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

// Hex 转 Uint8Array
export const hexToUint8Array = (hex: string): Uint8Array => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
};

// Uint8Array 转 Hex
export const uint8ArrayToHex = (arr: Uint8Array): string => {
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
};

// 解析密钥/IV (CryptoJS)
export const parseValue = (value: string, encoding: string): CryptoJS.lib.WordArray => {
  if (encoding === 'Hex') {
    return CryptoJS.enc.Hex.parse(value);
  } else if (encoding === 'Base64') {
    return CryptoJS.enc.Base64.parse(value);
  }
  return CryptoJS.enc.Utf8.parse(value);
};

// 解析密钥为 Uint8Array
export const parseKeyToUint8Array = (keyStr: string, encoding: string): Uint8Array => {
  if (encoding === 'Hex') {
    return hexToUint8Array(keyStr);
  } else if (encoding === 'Base64') {
    return base64ToUint8Array(keyStr);
  }
  return strToUint8Array(keyStr);
};

// 获取 CryptoJS 模式
export const getCryptoMode = (m: string) => {
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
export const getCryptoPadding = (p: string) => {
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
