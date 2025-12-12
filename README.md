# 效率工具箱

一个功能强大的在线工具集，提供编码/解码、时间处理和加密/解密等实用工具。基于 React + TypeScript + Ant Design 构建。

## 功能特性

### 📝 编码/解码工具
- **Base 编码**：Base64、Base16、Base32、Base32Hex、Base36、Base58、Base62、Base64URL、Base85、Base91
- **文本编码**：URL 编码、HTML 实体、Unicode、Escape
- **进制转换**：二进制、八进制、十进制、十六进制、自定义进制
- **图片转换**：图片与 Base64 互转

### ⏰ 时间处理工具
- **智能解析**：支持时间戳、ISO 格式、自然语言等多种格式
- **代码生成**：生成 JavaScript、Python、Java、Go 等语言的时间处理代码
- **时间计算**：时间差计算、时间加减运算
- **批量转换**：批量转换多个时间值
- **时区转换**：支持全球主要时区
- **唯一 ID 生成**：UUID v1/v4、GUID、NanoID、ULID、Snowflake ID、ObjectId 等

### 🔐 加密/解密工具

#### 对称加密
| 算法 | 说明 |
|------|------|
| AES | 支持 CBC/ECB/CFB/OFB/CTR 模式，128/192/256 位密钥 |
| DES | 经典加密标准 |
| 3DES | 三重 DES 加密 |
| AES-GCM | 认证加密模式 |
| AES-SIV | 抗 nonce 重用 |
| ChaCha20-Poly1305 | 高性能 AEAD |
| RC2/RC4/RC4Drop | RC 系列算法 |
| Blowfish | 可变密钥长度分组密码 |

#### 非对称加密
| 算法 | 功能 |
|------|------|
| RSA | 加密/解密、签名/验签 |
| ECDSA | 数字签名 (secp256k1/P-256/P-384) |
| Ed25519 | 高性能签名算法 |
| X25519 | 密钥交换 |
| ECDH | 椭圆曲线密钥交换 |

#### 哈希与密钥派生
| 类型 | 算法 |
|------|------|
| 哈希 | MD5、SHA-1、SHA-256、SHA-384、SHA-512 |
| KDF | PBKDF2、HKDF |
| MAC | HMAC-MD5、HMAC-SHA1、HMAC-SHA256、HMAC-SHA512 |

#### 古典密码 (CTF)
| 分类 | 密码 |
|------|------|
| 替换密码 | 凯撒、ROT13、ROT47、Atbash、仿射、维吉尼亚、Playfair、培根 |
| 换位密码 | 栅栏密码、列换位 |
| 特殊编码 | 摩尔斯电码、Polybius 棋盘、猪圈密码、键盘密码、手机九宫格 |

#### 国密算法
| 算法 | 说明 |
|------|------|
| SM2 | 椭圆曲线公钥密码 |
| SM3 | 密码杂凑算法 |
| SM4 | 分组密码算法 |
| ZUC | 祖冲之序列密码 |

## 技术栈

- **React 19** + **TypeScript 5.9**
- **Ant Design 6** - UI 组件库
- **Vite 7** - 构建工具
- **crypto-js** - 对称加密
- **@noble/curves** - 椭圆曲线密码
- **@noble/ciphers** - AEAD 加密
- **sm-crypto** - 国密算法

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 运行测试
npm run test
```

## 项目结构

```
src/
├── components/          # 通用组件
│   ├── ErrorBoundary.tsx
│   └── Layout/
├── context/             # React Context
├── hooks/               # 自定义 Hooks
├── modules/             # 功能模块
│   ├── crypto-tool/     # 加密/解密
│   │   ├── components/
│   │   │   └── tabs/    # 各算法 Tab 组件
│   │   └── utils/       # 加密算法实现
│   ├── encoder-decoder/ # 编码/解码
│   │   ├── components/
│   │   │   └── tabs/
│   │   └── utils/
│   └── time-tool/       # 时间工具
│       ├── components/
│       │   └── tabs/
│       └── utils/
├── plugins/             # 插件系统
├── utils/               # 公共工具
└── types/               # 类型定义
```

## 开发进度

- [x] 编码/解码工具模块
- [x] 时间处理工具模块
- [x] 加密/解密工具模块
  - [x] 对称加密 (AES/DES/3DES/AEAD/RC/Blowfish)
  - [x] 非对称加密 (RSA/ECDSA/Ed25519/X25519/ECDH)
  - [x] 哈希算法 (MD5/SHA/KDF/HMAC)
  - [x] 古典密码 (15 种 CTF 常用密码)
  - [x] 国密算法 (SM2/SM3/SM4/ZUC)
- [x] 项目结构优化 (模块化拆分)
- [x] 二级导航系统
- [ ] 主题切换
- [ ] 数据导入/导出
- [ ] 使用历史记录

## 安全说明

- 所有加密操作在客户端本地执行，数据不会上传服务器
- ECB 模式安全性较低，推荐使用 CBC/GCM/CTR 模式
- RC4 等古典算法仅供学习，不建议用于生产环境
- 请妥善保管密钥，丢失将无法恢复数据

## 浏览器支持

Chrome / Firefox / Safari / Edge 最新版本

## 许可证

MIT License
