import CryptoJS from 'crypto-js';
import 'crypto-js/blowfish';

// Blowfish (CryptoJS) - 标准实现，默认使用 ECB + PKCS7

const hexToWordArray = (hex: string): CryptoJS.lib.WordArray => {
  return CryptoJS.enc.Hex.parse(hex);
};

const wordArrayToHex = (wordArray: CryptoJS.lib.WordArray): string => {
  return wordArray.toString(CryptoJS.enc.Hex);
};

const validateKeyHex = (keyHex: string): void => {
  if (!/^[0-9a-fA-F]+$/.test(keyHex)) {
    throw new Error('密钥必须为 Hex 字符串');
  }
  const bytes = keyHex.length / 2;
  if (bytes < 4 || bytes > 56) {
    throw new Error('Blowfish 密钥长度必须在 4~56 字节之间');
  }
};

export const blowfishEncrypt = (plaintext: string, keyHex: string): string => {
  validateKeyHex(keyHex);
  const key = hexToWordArray(keyHex);
  const encrypted = CryptoJS.Blowfish.encrypt(plaintext, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  });
  return wordArrayToHex(encrypted.ciphertext);
};

export const blowfishDecrypt = (ciphertextHex: string, keyHex: string): string => {
  validateKeyHex(keyHex);
  if (!ciphertextHex || !/^[0-9a-fA-F]+$/.test(ciphertextHex)) {
    throw new Error('密文必须为 Hex 字符串');
  }
  const key = hexToWordArray(keyHex);
  const ciphertext = hexToWordArray(ciphertextHex);
  const cipherParams = CryptoJS.lib.CipherParams.create({ ciphertext });
  const decrypted = CryptoJS.Blowfish.decrypt(cipherParams, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  });
  const result = decrypted.toString(CryptoJS.enc.Utf8);
  if (!result) {
    throw new Error('解密失败，请检查密钥或密文');
  }
  return result;
};

export const generateBlowfishKey = (lengthBytes: number = 16): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(lengthBytes));
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
};
