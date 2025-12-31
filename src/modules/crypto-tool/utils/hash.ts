import CryptoJS from 'crypto-js';

/**
 * 哈希计算结果接口
 *
 * @remarks
 * 包含所有支持哈希算法的计算结果，键为算法名称，值为十六进制字符串
 *
 * @example
 * ```typescript
 * const result: HashResults = {
 *   MD5: 'd41d8cd98f00b204e9800998ecf8427e',
 *   SHA256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
 * };
 * ```
 */
export interface HashResults {
  [key: string]: string;
}

/**
 * 计算所有支持的哈希算法
 *
 * @param input - 要计算哈希的输入字符串
 * @returns 包含所有哈希算法结果的对象，键为算法名称（MD5、SHA1、SHA224、SHA256、SHA384、SHA512）
 *
 * @example
 * ```typescript
 * const hashes = calculateAllHashes('Hello, World!');
 * console.log(hashes.MD5);     // '65a8e27d8879283831b664bd8b7f0ad4'
 * console.log(hashes.SHA256);  // 'dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f'
 * ```
 *
 * @remarks
 * 支持的算法包括：
 * - MD5 (128位)
 * - SHA-1 (160位)
 * - SHA-224 (224位)
 * - SHA-256 (256位)
 * - SHA-384 (384位)
 * - SHA-512 (512位)
 */
export const calculateAllHashes = (input: string): HashResults => {
  return {
    MD5: CryptoJS.MD5(input).toString(),
    SHA1: CryptoJS.SHA1(input).toString(),
    SHA224: CryptoJS.SHA224(input).toString(),
    SHA256: CryptoJS.SHA256(input).toString(),
    SHA384: CryptoJS.SHA384(input).toString(),
    SHA512: CryptoJS.SHA512(input).toString(),
  };
};

/**
 * 计算单个哈希算法的结果
 *
 * @param input - 要计算哈希的输入字符串
 * @param algorithm - 哈希算法名称，支持：MD5、SHA1、SHA224、SHA256、SHA384、SHA512（不区分大小写）
 * @returns 十六进制格式的哈希字符串
 * @throws {@link Error} 如果传入不支持的算法名称
 *
 * @example
 * ```typescript
 * // MD5哈希
 * const md5 = calculateHash('Hello, World!', 'MD5');
 * console.log(md5);  // '65a8e27d8879283831b664bd8b7f0ad4'
 *
 * // SHA-256哈希
 * const sha256 = calculateHash('Hello, World!', 'SHA256');
 *
 * // 不区分大小写
 * const sha256lower = calculateHash('Hello, World!', 'sha256');  // 同上
 *
 * // 不支持的算法会抛出错误
 * calculateHash('test', 'INVALID');  // throws Error: 不支持的哈希算法: INVALID
 * ```
 */
export const calculateHash = (input: string, algorithm: string): string => {
  switch (algorithm.toUpperCase()) {
    case 'MD5':
      return CryptoJS.MD5(input).toString();
    case 'SHA1':
      return CryptoJS.SHA1(input).toString();
    case 'SHA224':
      return CryptoJS.SHA224(input).toString();
    case 'SHA256':
      return CryptoJS.SHA256(input).toString();
    case 'SHA384':
      return CryptoJS.SHA384(input).toString();
    case 'SHA512':
      return CryptoJS.SHA512(input).toString();
    default:
      throw new Error(`不支持的哈希算法: ${algorithm}`);
  }
};
