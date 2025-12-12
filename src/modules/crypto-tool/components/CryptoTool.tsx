import React, { useState } from 'react';
import { Card, Input, Select, Button, Space, message, Tabs } from 'antd';
import CryptoJS from 'crypto-js';
import { gcm, aessiv } from '@noble/ciphers/aes.js';
import { chacha20poly1305 } from '@noble/ciphers/chacha.js';

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

  // 标签页配置
  const tabItems = [
    { key: 'aes', label: 'AES' },
    { key: 'des', label: 'DES' },
    { key: '3des', label: '3DES' },
    { key: 'aes-gcm', label: 'AES-GCM' },
    { key: 'aes-siv', label: 'AES-SIV' },
    { key: 'chacha20', label: 'ChaCha20' },
    { key: 'hash', label: '哈希加密' },
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

      {/* 哈希加密界面 */}
      {activeTab === 'hash' ? (
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
