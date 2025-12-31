/**
 * 编码/解码工具 - 兼容层
 *
 * 这个文件保留作为向后兼容的入口，所有功能已经拆分到 encoders/ 目录下：
 * - encoders/common.ts - 公共类型和工具函数
 * - encoders/validators.ts - 输入验证函数
 * - encoders/base-family.ts - Base64, Base32, Base32Hex, Base16
 * - encoders/extended-base.ts - Base36, Base58, Base62, Base85, Base91
 * - encoders/utf-family.ts - UTF-7, UTF-8, UTF-16, UTF-32
 * - encoders/text-encoders.ts - URL, HTML, JSON, Unicode
 * - encoders/index.ts - 统一导出
 *
 * @deprecated 建议直接从 './encoders' 导入所需的函数
 */

// 重新导出所有内容以保持向后兼容
export * from './encoders/index';
