// AES 加密模式选项
export const aesModeOptions = [
  { value: 'CBC', label: 'CBC (推荐)' },
  { value: 'ECB', label: 'ECB (不安全)' },
  { value: 'CFB', label: 'CFB' },
  { value: 'OFB', label: 'OFB' },
  { value: 'CTR', label: 'CTR' },
];

// DES/3DES 加密模式选项 (不包含 CTR)
export const desModeOptions = [
  { value: 'CBC', label: 'CBC (推荐)' },
  { value: 'ECB', label: 'ECB (不安全)' },
  { value: 'CFB', label: 'CFB' },
  { value: 'OFB', label: 'OFB' },
];

// 填充方式选项
export const paddingOptions = [
  { value: 'Pkcs7', label: 'Pkcs7/Pkcs5 (推荐)' },
  { value: 'Iso97971', label: 'ISO/IEC 9797-1' },
  { value: 'AnsiX923', label: 'ANSI X.923' },
  { value: 'Iso10126', label: 'ISO 10126' },
  { value: 'ZeroPadding', label: 'Zero Padding' },
  { value: 'NoPadding', label: 'No Padding (需对齐)' },
];

// 编码格式选项
export const encodingOptions = [
  { value: 'Hex', label: 'Hex' },
  { value: 'Base64', label: 'Base64' },
  { value: 'Utf8', label: 'Utf8' },
];

// AES 密钥长度选项
export const aesKeyLengthOptions = [
  { value: 16, label: 'AES-128 (16B)' },
  { value: 24, label: 'AES-192 (24B)' },
  { value: 32, label: 'AES-256 (32B)' },
];

// DES 密钥长度选项
export const desKeyLengthOptions = [{ value: 8, label: 'DES (8B)' }];

// 3DES 密钥长度选项
export const tripleDesKeyLengthOptions = [{ value: 24, label: '3DES (24B)' }];

// AEAD 密钥长度选项
export const aeadKeyLengthOptions = [
  { value: 16, label: '128位 (16B)' },
  { value: 32, label: '256位 (32B)' },
];

// 一级分类标签页
export const categoryItems = [
  { key: 'symmetric', label: '🔐 对称加密' },
  { key: 'asymmetric', label: '🔑 非对称加密' },
  { key: 'hash', label: '#️⃣ 哈希算法' },
  { key: 'gm', label: '🇨🇳 国密算法' },
];

// 对称加密二级标签
export const symmetricTabItems = [
  { key: 'aes', label: 'AES' },
  { key: 'des', label: 'DES' },
  { key: '3des', label: '3DES' },
  { key: 'aes-gcm', label: 'AES-GCM' },
  { key: 'aes-siv', label: 'AES-SIV' },
  { key: 'chacha20', label: 'ChaCha20' },
  { key: 'rc', label: 'RC系列' },
  { key: 'blowfish', label: 'Blowfish' },
];

// 非对称加密二级标签
export const asymmetricTabItems = [
  { key: 'rsa', label: 'RSA' },
  { key: 'ecdsa', label: 'ECDSA' },
  { key: 'ed25519', label: 'Ed25519' },
  { key: 'x25519', label: 'X25519' },
  { key: 'ecdh', label: 'ECDH' },
];

// 哈希算法二级标签
export const hashTabItems = [
  { key: 'hash', label: 'MD5/SHA' },
  { key: 'sm3', label: 'SM3 国密' },
  { key: 'kdf', label: 'KDF/HMAC' },
];

// 国密算法二级标签
export const gmTabItems = [
  { key: 'sm2', label: 'SM2 非对称' },
  { key: 'sm4', label: 'SM4 对称' },
  { key: 'zuc', label: 'ZUC 祖冲之' },
  { key: 'gm-info', label: '国密说明' },
];
