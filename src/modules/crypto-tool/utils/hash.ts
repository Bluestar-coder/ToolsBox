import CryptoJS from 'crypto-js';

export interface HashResults {
  [key: string]: string;
}

// 计算所有哈希
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

// 计算单个哈希
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
