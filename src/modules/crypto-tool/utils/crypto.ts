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

// 算法映射表，消除 encrypt/decrypt 中的重复 switch
const algorithmMap: Record<string, typeof CryptoJS.AES> = {
  aes: CryptoJS.AES,
  des: CryptoJS.DES,
  '3des': CryptoJS.TripleDES,
  tripledes: CryptoJS.TripleDES,
  rc4: CryptoJS.RC4,
  rabbit: CryptoJS.Rabbit,
};

// 流密码不支持 mode/padding 配置
const streamCiphers = new Set(['rc4']);

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

    // 验证密钥长度
    if (!validateKeyLength(algorithm, key)) {
      const expected = getDefaultKeyLength(algorithm);
      throw new Error(`密钥长度不正确: 期望 ${expected} 字节，实际 ${key.length} 字节`);
    }

    // 验证IV长度
    if (!validateIvLength(algorithm, iv)) {
      const expected = getDefaultIvLength(algorithm);
      throw new Error(`IV长度不正确: 期望 ${expected} 字节，实际 ${iv?.length ?? 0} 字节`);
    }

    const cipher = algorithmMap[algorithm];
    if (!cipher) {
      throw new Error(`不支持的加密算法: ${algorithm}`);
    }

    const keyBytes = CryptoJS.enc.Utf8.parse(key);
    const ivBytes = iv ? CryptoJS.enc.Utf8.parse(iv) : undefined;

    let ciphertext: CryptoJS.lib.CipherParams;

    if (streamCiphers.has(algorithm)) {
      ciphertext = cipher.encrypt(plaintext, keyBytes);
    } else {
      ciphertext = cipher.encrypt(plaintext, keyBytes, {
        mode: getMode(mode),
        padding: getPadding(padding),
        iv: ivBytes,
      });
    }

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

    // 验证密钥长度
    if (!validateKeyLength(algorithm, key)) {
      const expected = getDefaultKeyLength(algorithm);
      throw new Error(`密钥长度不正确: 期望 ${expected} 字节，实际 ${key.length} 字节`);
    }

    // 验证IV长度
    if (!validateIvLength(algorithm, iv)) {
      const expected = getDefaultIvLength(algorithm);
      throw new Error(`IV长度不正确: 期望 ${expected} 字节，实际 ${iv?.length ?? 0} 字节`);
    }

    const cipher = algorithmMap[algorithm];
    if (!cipher) {
      throw new Error(`不支持的解密算法: ${algorithm}`);
    }

    const keyBytes = CryptoJS.enc.Utf8.parse(key);
    const ivBytes = iv ? CryptoJS.enc.Utf8.parse(iv) : undefined;

    let plaintextBytes: CryptoJS.lib.WordArray;

    if (streamCiphers.has(algorithm)) {
      plaintextBytes = cipher.decrypt(ciphertext, keyBytes);
    } else {
      plaintextBytes = cipher.decrypt(ciphertext, keyBytes, {
        mode: getMode(mode),
        padding: getPadding(padding),
        iv: ivBytes,
      });
    }

    return plaintextBytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    throw new Error(`解密失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
};

/**
 * 生成随机密钥（使用 rejection sampling 消除取模偏差）
 * @param length 密钥长度
 * @returns 随机密钥
 */
export const generateRandomKey = (length: number): string => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  const charsetLen = charset.length;
  // 计算不产生偏差的最大可接受值（256 的最大整数倍 - 1）
  const maxValid = Math.floor(256 / charsetLen) * charsetLen;
  const result: string[] = [];

  while (result.length < length) {
    // 每次多申请一些字节以减少循环次数
    const batchSize = Math.max(length - result.length, 16);
    const randomBytes = crypto.getRandomValues(new Uint8Array(batchSize));
    for (let i = 0; i < randomBytes.length && result.length < length; i++) {
      // 丢弃会产生偏差的值
      if (randomBytes[i] < maxValid) {
        result.push(charset[randomBytes[i] % charsetLen]);
      }
    }
  }

  return result.join('');
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