import CryptoJS from 'crypto-js';

// 加密算法类型
export type AlgorithmType = 'aes' | 'des' | '3des' | 'rc4' | 'rabbit' | 'tripledes';

// 模式类型
export type ModeType = 'ecb' | 'cbc' | 'cfb' | 'ofb' | 'ctr';

// 填充类型
export type PaddingType = 'pkcs7' | 'pkcs5' | 'zero' | 'iso97971' | 'ansiX923';

// 输出格式类型
export type OutputFormatType = 'base64' | 'hex' | 'utf8';

// 加密选项接口
export interface EncryptOptions {
  algorithm: AlgorithmType;
  mode: ModeType;
  padding: PaddingType;
  iv?: string;
  outputFormat?: OutputFormatType;
}

// 解密选项接口
export interface DecryptOptions {
  algorithm: AlgorithmType;
  mode: ModeType;
  padding: PaddingType;
  iv?: string;
  outputFormat?: OutputFormatType;
}

/**
 * 获取加密模式
 * @param mode 模式类型
 * @param iv IV向量（如果需要）
 * @returns 加密模式对象
 */
const getMode = (mode: ModeType) => {
  switch (mode) {
    case 'ecb':
      return CryptoJS.mode.ECB;
    case 'cbc':
      return CryptoJS.mode.CBC;
    case 'cfb':
      return CryptoJS.mode.CFB;
    case 'ofb':
      return CryptoJS.mode.OFB;
    case 'ctr':
      return CryptoJS.mode.CTR;
    default:
      return CryptoJS.mode.CBC;
  }
};

/**
 * 获取填充方式
 * @param padding 填充类型
 * @returns 填充方式对象
 */
const getPadding = (padding: PaddingType) => {
  switch (padding) {
    case 'pkcs7':
      return CryptoJS.pad.Pkcs7;
    case 'pkcs5':
      return CryptoJS.pad.Pkcs7; // PKCS5是PKCS7的子集，CryptoJS使用Pkcs7处理
    case 'zero':
      return CryptoJS.pad.ZeroPadding;
    case 'iso97971':
      return CryptoJS.pad.Iso97971;
    case 'ansiX923':
      return CryptoJS.pad.AnsiX923;
    default:
      return CryptoJS.pad.Pkcs7;
  }
};

/**
 * 转换输出格式
 * @param ciphertext 密文
 * @param format 输出格式
 * @returns 转换后的密文
 */
const convertOutputFormat = (ciphertext: CryptoJS.lib.CipherParams, format: OutputFormatType): string => {
  switch (format) {
    case 'base64':
      return ciphertext.toString();
    case 'hex':
      return ciphertext.ciphertext.toString(CryptoJS.enc.Hex);
    case 'utf8':
      return ciphertext.ciphertext.toString(CryptoJS.enc.Utf8);
    default:
      return ciphertext.toString();
  }
};

/**
 * 加密函数
 * @param plaintext 明文
 * @param key 密钥
 * @param options 加密选项
 * @returns 加密后的密文
 */
export const encrypt = (plaintext: string, key: string, options: EncryptOptions): string => {
  try {
    const { algorithm, mode, padding, iv, outputFormat = 'base64' } = options;
    
    // 转换密钥和IV为CryptoJS所需格式
    const keyBytes = CryptoJS.enc.Utf8.parse(key);
    const ivBytes = iv ? CryptoJS.enc.Utf8.parse(iv) : undefined;
    
    // 获取加密模式和填充方式
    const cryptoMode = getMode(mode);
    const cryptoPadding = getPadding(padding);
    
    let ciphertext: CryptoJS.lib.CipherParams;
    
    // 根据算法类型执行加密
    switch (algorithm) {
      case 'aes':
        ciphertext = CryptoJS.AES.encrypt(plaintext, keyBytes, {
          mode: cryptoMode,
          padding: cryptoPadding,
          iv: ivBytes,
        });
        break;
      case 'des':
        ciphertext = CryptoJS.DES.encrypt(plaintext, keyBytes, {
          mode: cryptoMode,
          padding: cryptoPadding,
          iv: ivBytes,
        });
        break;
      case '3des':
      case 'tripledes':
        ciphertext = CryptoJS.TripleDES.encrypt(plaintext, keyBytes, {
          mode: cryptoMode,
          padding: cryptoPadding,
          iv: ivBytes,
        });
        break;
      case 'rc4':
        ciphertext = CryptoJS.RC4.encrypt(plaintext, keyBytes);
        break;
      case 'rabbit':
        ciphertext = CryptoJS.Rabbit.encrypt(plaintext, keyBytes, {
          iv: ivBytes,
        });
        break;
      default:
        throw new Error(`不支持的加密算法: ${algorithm}`);
    }
    
    // 转换输出格式
    return convertOutputFormat(ciphertext, outputFormat);
  } catch (error) {
    throw new Error(`加密失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
};

/**
 * 解密函数
 * @param ciphertext 密文
 * @param key 密钥
 * @param options 解密选项
 * @returns 解密后的明文
 */
export const decrypt = (ciphertext: string, key: string, options: DecryptOptions): string => {
  try {
    const { algorithm, mode, padding, iv } = options;
    
    // 转换密钥和IV为CryptoJS所需格式
    const keyBytes = CryptoJS.enc.Utf8.parse(key);
    const ivBytes = iv ? CryptoJS.enc.Utf8.parse(iv) : undefined;
    
    // 获取加密模式和填充方式
    const cryptoMode = getMode(mode);
    const cryptoPadding = getPadding(padding);
    
    let plaintextBytes: CryptoJS.lib.WordArray;
    
    // 根据算法类型执行解密
    switch (algorithm) {
      case 'aes':
        plaintextBytes = CryptoJS.AES.decrypt(ciphertext, keyBytes, {
          mode: cryptoMode,
          padding: cryptoPadding,
          iv: ivBytes,
        });
        break;
      case 'des':
        plaintextBytes = CryptoJS.DES.decrypt(ciphertext, keyBytes, {
          mode: cryptoMode,
          padding: cryptoPadding,
          iv: ivBytes,
        });
        break;
      case '3des':
      case 'tripledes':
        plaintextBytes = CryptoJS.TripleDES.decrypt(ciphertext, keyBytes, {
          mode: cryptoMode,
          padding: cryptoPadding,
          iv: ivBytes,
        });
        break;
      case 'rc4':
        plaintextBytes = CryptoJS.RC4.decrypt(ciphertext, keyBytes);
        break;
      case 'rabbit':
        plaintextBytes = CryptoJS.Rabbit.decrypt(ciphertext, keyBytes, {
          iv: ivBytes,
        });
        break;
      default:
        throw new Error(`不支持的解密算法: ${algorithm}`);
    }
    
    // 转换输出为UTF-8字符串
    return plaintextBytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    throw new Error(`解密失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
};

/**
 * 生成随机密钥
 * @param length 密钥长度
 * @returns 随机密钥
 */
export const generateRandomKey = (length: number): string => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  const randomBytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(randomBytes, (b) => charset[b % charset.length]).join('');
};

/**
 * 验证密钥长度
 * @param algorithm 算法类型
 * @param key 密钥
 * @returns 是否有效
 */
export const validateKeyLength = (algorithm: AlgorithmType, key: string): boolean => {
  const keyLengths: Record<AlgorithmType, number> = {
    aes: 32,
    des: 8,
    '3des': 24,
    tripledes: 24,
    rc4: 32,
    rabbit: 16,
  };
  return key.length === keyLengths[algorithm];
};

/**
 * 验证IV长度
 * @param algorithm 算法类型
 * @param iv IV向量
 * @returns 是否有效
 */
export const validateIvLength = (algorithm: AlgorithmType, iv?: string): boolean => {
  if (!iv) return true;
  
  const ivLengths: Record<AlgorithmType, number> = {
    aes: 16,
    des: 8,
    '3des': 8,
    tripledes: 8,
    rc4: 0,
    rabbit: 8,
  };
  return iv.length === ivLengths[algorithm];
};

/**
 * 获取算法支持的模式列表
 * @param algorithm 算法类型
 * @returns 支持的模式列表
 */
export const getSupportedModes = (algorithm: AlgorithmType): ModeType[] => {
  const supportedModes: Record<AlgorithmType, ModeType[]> = {
    aes: ['ecb', 'cbc', 'cfb', 'ofb', 'ctr'],
    des: ['ecb', 'cbc', 'cfb', 'ofb', 'ctr'],
    '3des': ['ecb', 'cbc', 'cfb', 'ofb', 'ctr'],
    tripledes: ['ecb', 'cbc', 'cfb', 'ofb', 'ctr'],
    rc4: ['ecb'],
    rabbit: ['ecb'],
  };
  return supportedModes[algorithm] || [];
};

/**
 * 获取算法的默认密钥长度
 * @param algorithm 算法类型
 * @returns 默认密钥长度
 */
export const getDefaultKeyLength = (algorithm: AlgorithmType): number => {
  const keyLengths: Record<AlgorithmType, number> = {
    aes: 32,
    des: 8,
    '3des': 24,
    tripledes: 24,
    rc4: 32,
    rabbit: 16,
  };
  return keyLengths[algorithm] || 32;
};

/**
 * 获取算法的默认IV长度
 * @param algorithm 算法类型
 * @returns 默认IV长度
 */
export const getDefaultIvLength = (algorithm: AlgorithmType): number => {
  const ivLengths: Record<AlgorithmType, number> = {
    aes: 16,
    des: 8,
    '3des': 8,
    tripledes: 8,
    rc4: 0,
    rabbit: 8,
  };
  return ivLengths[algorithm] || 0;
};