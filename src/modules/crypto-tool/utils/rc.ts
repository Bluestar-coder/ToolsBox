import CryptoJS from 'crypto-js';

// ============ RC4 流密码 ============

export const rc4Encrypt = (plaintext: string, key: string): string => {
  return CryptoJS.RC4.encrypt(plaintext, key).toString();
};

export const rc4Decrypt = (ciphertext: string, key: string): string => {
  const bytes = CryptoJS.RC4.decrypt(ciphertext, key);
  return bytes.toString(CryptoJS.enc.Utf8);
};

// RC4Drop - 丢弃前N个字节，增强安全性
export const rc4DropEncrypt = (plaintext: string, key: string, drop: number = 768): string => {
  return CryptoJS.RC4Drop.encrypt(plaintext, key, { drop }).toString();
};

export const rc4DropDecrypt = (ciphertext: string, key: string, drop: number = 768): string => {
  const bytes = CryptoJS.RC4Drop.decrypt(ciphertext, key, { drop });
  return bytes.toString(CryptoJS.enc.Utf8);
};

// ============ RC2 分组密码 (纯JS实现) ============

// RC2 密钥扩展表
const PITABLE = [
  0xd9, 0x78, 0xf9, 0xc4, 0x19, 0xdd, 0xb5, 0xed, 0x28, 0xe9, 0xfd, 0x79, 0x4a, 0xa0, 0xd8, 0x9d,
  0xc6, 0x7e, 0x37, 0x83, 0x2b, 0x76, 0x53, 0x8e, 0x62, 0x4c, 0x64, 0x88, 0x44, 0x8b, 0xfb, 0xa2,
  0x17, 0x9a, 0x59, 0xf5, 0x87, 0xb3, 0x4f, 0x13, 0x61, 0x45, 0x6d, 0x8d, 0x09, 0x81, 0x7d, 0x32,
  0xbd, 0x8f, 0x40, 0xeb, 0x86, 0xb7, 0x7b, 0x0b, 0xf0, 0x95, 0x21, 0x22, 0x5c, 0x6b, 0x4e, 0x82,
  0x54, 0xd6, 0x65, 0x93, 0xce, 0x60, 0xb2, 0x1c, 0x73, 0x56, 0xc0, 0x14, 0xa7, 0x8c, 0xf1, 0xdc,
  0x12, 0x75, 0xca, 0x1f, 0x3b, 0xbe, 0xe4, 0xd1, 0x42, 0x3d, 0xd4, 0x30, 0xa3, 0x3c, 0xb6, 0x26,
  0x6f, 0xbf, 0x0e, 0xda, 0x46, 0x69, 0x07, 0x57, 0x27, 0xf2, 0x1d, 0x9b, 0xbc, 0x94, 0x43, 0x03,
  0xf8, 0x11, 0xc7, 0xf6, 0x90, 0xef, 0x3e, 0xe7, 0x06, 0xc3, 0xd5, 0x2f, 0xc8, 0x66, 0x1e, 0xd7,
  0x08, 0xe8, 0xea, 0xde, 0x80, 0x52, 0xee, 0xf7, 0x84, 0xaa, 0x72, 0xac, 0x35, 0x4d, 0x6a, 0x2a,
  0x96, 0x1a, 0xd2, 0x71, 0x5a, 0x15, 0x49, 0x74, 0x4b, 0x9f, 0xd0, 0x5e, 0x04, 0x18, 0xa4, 0xec,
  0xc2, 0xe0, 0x41, 0x6e, 0x0f, 0x51, 0xcb, 0xcc, 0x24, 0x91, 0xaf, 0x50, 0xa1, 0xf4, 0x70, 0x39,
  0x99, 0x7c, 0x3a, 0x85, 0x23, 0xb8, 0xb4, 0x7a, 0xfc, 0x02, 0x36, 0x5b, 0x25, 0x55, 0x97, 0x31,
  0x2d, 0x5d, 0xfa, 0x98, 0xe3, 0x8a, 0x92, 0xae, 0x05, 0xdf, 0x29, 0x10, 0x67, 0x6c, 0xba, 0xc9,
  0xd3, 0x00, 0xe6, 0xcf, 0xe1, 0x9e, 0xa8, 0x2c, 0x63, 0x16, 0x01, 0x3f, 0x58, 0xe2, 0x89, 0xa9,
  0x0d, 0x38, 0x34, 0x1b, 0xab, 0x33, 0xff, 0xb0, 0xbb, 0x48, 0x0c, 0x5f, 0xb9, 0xb1, 0xcd, 0x2e,
  0xc5, 0xf3, 0xdb, 0x47, 0xe5, 0xa5, 0x9c, 0x77, 0x0a, 0xa6, 0x20, 0x68, 0xfe, 0x7f, 0xc1, 0xad,
];

class RC2 {
  private K: number[] = new Array(64);

  constructor(key: Uint8Array, effectiveKeyBits: number = 1024) {
    this.expandKey(key, effectiveKeyBits);
  }

  private expandKey(key: Uint8Array, bits: number): void {
    const L = new Array(128).fill(0);
    const keyLen = key.length;
    const T8 = (bits + 7) >> 3;
    const TM = 0xff >> (8 - (bits & 7));

    for (let i = 0; i < keyLen; i++) L[i] = key[i];
    for (let i = keyLen; i < 128; i++) {
      L[i] = PITABLE[(L[i - 1] + L[i - keyLen]) & 0xff];
    }
    L[128 - T8] = PITABLE[L[128 - T8] & TM];
    for (let i = 127 - T8; i >= 0; i--) {
      L[i] = PITABLE[L[i + 1] ^ L[i + T8]];
    }
    for (let i = 0; i < 64; i++) {
      this.K[i] = L[2 * i] + (L[2 * i + 1] << 8);
    }
  }

  encryptBlock(block: Uint8Array): Uint8Array {
    let R0 = block[0] + (block[1] << 8);
    let R1 = block[2] + (block[3] << 8);
    let R2 = block[4] + (block[5] << 8);
    let R3 = block[6] + (block[7] << 8);

    for (let i = 0; i < 16; i++) {
      const j = i * 4;
      R0 = ((R0 + this.K[j] + (R3 & R2) + (~R3 & R1)) & 0xffff);
      R0 = ((R0 << 1) | (R0 >> 15)) & 0xffff;
      R1 = ((R1 + this.K[j + 1] + (R0 & R3) + (~R0 & R2)) & 0xffff);
      R1 = ((R1 << 2) | (R1 >> 14)) & 0xffff;
      R2 = ((R2 + this.K[j + 2] + (R1 & R0) + (~R1 & R3)) & 0xffff);
      R2 = ((R2 << 3) | (R2 >> 13)) & 0xffff;
      R3 = ((R3 + this.K[j + 3] + (R2 & R1) + (~R2 & R0)) & 0xffff);
      R3 = ((R3 << 5) | (R3 >> 11)) & 0xffff;
      if (i === 4 || i === 10) {
        R0 = (R0 + this.K[R3 & 63]) & 0xffff;
        R1 = (R1 + this.K[R0 & 63]) & 0xffff;
        R2 = (R2 + this.K[R1 & 63]) & 0xffff;
        R3 = (R3 + this.K[R2 & 63]) & 0xffff;
      }
    }

    return new Uint8Array([
      R0 & 0xff, (R0 >> 8) & 0xff,
      R1 & 0xff, (R1 >> 8) & 0xff,
      R2 & 0xff, (R2 >> 8) & 0xff,
      R3 & 0xff, (R3 >> 8) & 0xff,
    ]);
  }

  decryptBlock(block: Uint8Array): Uint8Array {
    let R0 = block[0] + (block[1] << 8);
    let R1 = block[2] + (block[3] << 8);
    let R2 = block[4] + (block[5] << 8);
    let R3 = block[6] + (block[7] << 8);

    for (let i = 15; i >= 0; i--) {
      const j = i * 4;
      if (i === 4 || i === 10) {
        R3 = (R3 - this.K[R2 & 63] + 0x10000) & 0xffff;
        R2 = (R2 - this.K[R1 & 63] + 0x10000) & 0xffff;
        R1 = (R1 - this.K[R0 & 63] + 0x10000) & 0xffff;
        R0 = (R0 - this.K[R3 & 63] + 0x10000) & 0xffff;
      }
      R3 = ((R3 >> 5) | (R3 << 11)) & 0xffff;
      R3 = (R3 - this.K[j + 3] - (R2 & R1) - (~R2 & R0) + 0x30000) & 0xffff;
      R2 = ((R2 >> 3) | (R2 << 13)) & 0xffff;
      R2 = (R2 - this.K[j + 2] - (R1 & R0) - (~R1 & R3) + 0x30000) & 0xffff;
      R1 = ((R1 >> 2) | (R1 << 14)) & 0xffff;
      R1 = (R1 - this.K[j + 1] - (R0 & R3) - (~R0 & R2) + 0x30000) & 0xffff;
      R0 = ((R0 >> 1) | (R0 << 15)) & 0xffff;
      R0 = (R0 - this.K[j] - (R3 & R2) - (~R3 & R1) + 0x30000) & 0xffff;
    }

    return new Uint8Array([
      R0 & 0xff, (R0 >> 8) & 0xff,
      R1 & 0xff, (R1 >> 8) & 0xff,
      R2 & 0xff, (R2 >> 8) & 0xff,
      R3 & 0xff, (R3 >> 8) & 0xff,
    ]);
  }
}

// PKCS7 填充
const pkcs7Pad = (data: Uint8Array, blockSize: number): Uint8Array => {
  const padLen = blockSize - (data.length % blockSize);
  const padded = new Uint8Array(data.length + padLen);
  padded.set(data);
  padded.fill(padLen, data.length);
  return padded;
};

const pkcs7Unpad = (data: Uint8Array): Uint8Array => {
  const padLen = data[data.length - 1];
  return data.slice(0, data.length - padLen);
};

// RC2 ECB 模式加密
export const rc2Encrypt = (plaintext: string, keyHex: string): string => {
  const key = hexToBytes(keyHex);
  const rc2 = new RC2(key);
  const data = new TextEncoder().encode(plaintext);
  const padded = pkcs7Pad(data, 8);
  const result = new Uint8Array(padded.length);

  for (let i = 0; i < padded.length; i += 8) {
    const block = padded.slice(i, i + 8);
    const encrypted = rc2.encryptBlock(block);
    result.set(encrypted, i);
  }
  return bytesToHex(result);
};

export const rc2Decrypt = (ciphertextHex: string, keyHex: string): string => {
  const key = hexToBytes(keyHex);
  const rc2 = new RC2(key);
  const data = hexToBytes(ciphertextHex);
  const result = new Uint8Array(data.length);

  for (let i = 0; i < data.length; i += 8) {
    const block = data.slice(i, i + 8);
    const decrypted = rc2.decryptBlock(block);
    result.set(decrypted, i);
  }
  return new TextDecoder().decode(pkcs7Unpad(result));
};

// 辅助函数
const hexToBytes = (hex: string): Uint8Array => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
};

const bytesToHex = (bytes: Uint8Array): string => {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
};

// 生成随机密钥
export const generateRC2Key = (length: number = 16): string => {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
};

export const generateRC4Key = (length: number = 16): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
};
