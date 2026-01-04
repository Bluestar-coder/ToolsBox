import type { EncoderType } from './encoders';

// Base 家族编码类型
export const baseEncoders: EncoderType[] = [
  'base16', 'base32', 'base32hex', 'base36', 'base58', 
  'base62', 'base64', 'base64url', 'base85', 'base91'
];

// UTF 家族编码类型
export const utfEncoders: EncoderType[] = [
  'utf7', 'utf8', 'utf16be', 'utf16le', 'utf32be', 'utf32le'
];

// 其他编码类型
export const otherEncoders: EncoderType[] = ['url', 'html', 'json', 'unicode', 'ascii'];

// 一级分类
export const categoryItems = [
  { key: 'base', label: 'Base 编码' },
  { key: 'utf', label: 'UTF 编码' },
  { key: 'other', label: '其他编码' },
  { key: 'radix', label: '进制转换' },
  { key: 'image', label: '图片转换' },
];

// 进制二级导航选项
export const radixTabItems = [
  { key: 'bin', label: '二进制' },
  { key: 'oct', label: '八进制' },
  { key: 'dec', label: '十进制' },
  { key: 'hex', label: '十六进制' },
  { key: 'custom', label: '自定义' },
];

// 图片模式标签
export const imageModeItems = [
  { key: 'toBase64', label: '图片转Base64' },
  { key: 'toImage', label: 'Base64转图片' },
];

// 进制映射
export const radixMap: Record<string, number> = {
  bin: 2,
  oct: 8,
  dec: 10,
  hex: 16,
};
