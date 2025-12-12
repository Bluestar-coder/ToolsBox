import { gcm, aessiv } from '@noble/ciphers/aes.js';
import { chacha20poly1305 } from '@noble/ciphers/chacha.js';
import { strToUint8Array, uint8ArrayToStr, uint8ArrayToBase64, base64ToUint8Array } from './helpers';

export interface AeadResult {
  ciphertext: string;
  tag: string;
}

// AES-SIV 加密
export const aesSivEncrypt = (plaintext: string, keyBytes: Uint8Array, nonce: Uint8Array): AeadResult => {
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
  const encrypted = cipher.encrypt(strToUint8Array(plaintext));
  const tag = encrypted.slice(0, 16);
  const ciphertext = encrypted.slice(16);
  return { ciphertext: uint8ArrayToBase64(ciphertext), tag: uint8ArrayToBase64(tag) };
};

// AES-SIV 解密
export const aesSivDecrypt = (ciphertextB64: string, tagB64: string, keyBytes: Uint8Array, nonce: Uint8Array): string => {
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
  const combined = new Uint8Array(tag.length + ciphertext.length);
  combined.set(tag);
  combined.set(ciphertext, tag.length);
  const decrypted = cipher.decrypt(combined);
  return uint8ArrayToStr(decrypted);
};

// ChaCha20-Poly1305 加密
export const chacha20Encrypt = (plaintext: string, keyBytes: Uint8Array, nonce: Uint8Array): AeadResult => {
  if (keyBytes.length !== 32) {
    throw new Error('ChaCha20-Poly1305 密钥必须是 32 字节');
  }
  if (nonce.length !== 12) {
    throw new Error('ChaCha20-Poly1305 Nonce 必须是 12 字节');
  }
  const cipher = chacha20poly1305(keyBytes, nonce);
  const encrypted = cipher.encrypt(strToUint8Array(plaintext));
  const ciphertext = encrypted.slice(0, -16);
  const tag = encrypted.slice(-16);
  return { ciphertext: uint8ArrayToBase64(ciphertext), tag: uint8ArrayToBase64(tag) };
};

// ChaCha20-Poly1305 解密
export const chacha20Decrypt = (ciphertextB64: string, tagB64: string, keyBytes: Uint8Array, nonce: Uint8Array): string => {
  if (keyBytes.length !== 32) {
    throw new Error('ChaCha20-Poly1305 密钥必须是 32 字节');
  }
  if (nonce.length !== 12) {
    throw new Error('ChaCha20-Poly1305 Nonce 必须是 12 字节');
  }
  const cipher = chacha20poly1305(keyBytes, nonce);
  const ciphertext = base64ToUint8Array(ciphertextB64);
  const tag = base64ToUint8Array(tagB64);
  const combined = new Uint8Array(ciphertext.length + tag.length);
  combined.set(ciphertext);
  combined.set(tag, ciphertext.length);
  const decrypted = cipher.decrypt(combined);
  return uint8ArrayToStr(decrypted);
};

// AES-GCM 加密 (noble/ciphers)
export const nobleAesGcmEncrypt = (plaintext: string, keyBytes: Uint8Array, nonce: Uint8Array): AeadResult => {
  if (![16, 24, 32].includes(keyBytes.length)) {
    throw new Error('AES-GCM 密钥必须是 16/24/32 字节');
  }
  const cipher = gcm(keyBytes, nonce);
  const encrypted = cipher.encrypt(strToUint8Array(plaintext));
  const ciphertext = encrypted.slice(0, -16);
  const tag = encrypted.slice(-16);
  return { ciphertext: uint8ArrayToBase64(ciphertext), tag: uint8ArrayToBase64(tag) };
};

// AES-GCM 解密 (noble/ciphers)
export const nobleAesGcmDecrypt = (ciphertextB64: string, tagB64: string, keyBytes: Uint8Array, nonce: Uint8Array): string => {
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
