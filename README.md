# ToolsBox

[简体中文](./README.md) | [English](./README.en.md)

[![CI](https://img.shields.io/github/actions/workflow/status/Bluestar-coder/ToolsBox/ci.yml?branch=main&label=CI)](https://github.com/Bluestar-coder/ToolsBox/actions/workflows/ci.yml)
![React](https://img.shields.io/badge/React-19-149eca)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6)
![Tauri](https://img.shields.io/badge/Tauri-2-24c8db)
![License](https://img.shields.io/badge/License-MIT-green)

ToolsBox 是一款面向开发者、安全工程师、测试人员与运维团队的综合效率工具平台，提供统一的 Web 与桌面端体验，覆盖编码转换、密码学、时间处理、代码格式化、网络调试、二维码识别、IP/网络分析与可组合操作流等高频场景。

项目基于 React、TypeScript、Vite 与 Tauri 构建，强调以下目标：

- 单一入口下的多工具协同体验
- 本地执行优先的数据安全模型
- 可持续演进的模块化架构
- 面向重构的质量门禁与自动化验证

## 产品概览

ToolsBox 当前覆盖 10 个核心工具域：

| 工具域 | 说明 |
| --- | --- |
| 编码/解码 | Base 编码、文本编码、进制转换、图片与 Base64 互转 |
| 加密/解密 | 对称加密、非对称加密、哈希、KDF、JWT、古典密码、国密算法 |
| 时间工具 | 时间解析、时间计算、批量转换、时区处理、唯一 ID 生成 |
| 代码格式化 | JSON、SQL、HTTP 报文与多语言代码格式化 |
| 正则工具 | 测试、替换、分割与常用模板 |
| 二维码工具 | 二维码生成、摄像头扫描、图片识别、剪贴板识别 |
| 差异对比 | 文本、代码、JSON 差异对比 |
| HTTP 调试 | HTTP 请求调试、变量替换、历史记录、响应查看 |
| IP/网络工具 | IP 转换、CIDR、子网规划、归属地、端口速查 |
| Recipe | 参考 CyberChef 思路的链式操作流编排能力 |

## 核心能力

### 编码/解码

- 支持 Base64、Base16、Base32、Base32Hex、Base36、Base58、Base62、Base64URL、Base85、Base91
- 支持 URL 编码、HTML 实体、Unicode、Escape 等文本编码场景
- 支持二进制、八进制、十进制、十六进制及自定义进制转换
- 支持图片与 Base64 互转

### 加密与密码学

#### 对称加密

- AES：支持 CBC、ECB、CFB、OFB、CTR，覆盖 128/192/256 位密钥
- DES、3DES
- AES-GCM、AES-SIV、ChaCha20-Poly1305
- RC2、RC4、RC4Drop、Blowfish

#### 非对称加密与签名

- RSA：加密、解密、签名、验签
- ECDSA：支持 secp256k1、P-256、P-384
- Ed25519、X25519、ECDH

#### 哈希、KDF 与令牌

- 哈希：MD5、SHA-1、SHA-256、SHA-384、SHA-512
- KDF：PBKDF2、HKDF
- MAC：HMAC-MD5、HMAC-SHA1、HMAC-SHA256、HMAC-SHA512
- JWT：解码、校验、生成

#### 古典密码与国密算法

- 古典密码：凯撒、ROT13、ROT47、Atbash、仿射、维吉尼亚、Playfair、培根、栅栏、列换位、摩尔斯电码等
- 国密算法：SM2、SM3、SM4、ZUC

### 时间工具

- 智能解析：时间戳、ISO、常见日期时间格式
- 时间计算：时间差、时间加减
- 批量转换与时区处理
- 代码生成：JavaScript、Python、Java、Go 等
- 唯一 ID：UUID v1/v4、GUID、NanoID、ULID、Snowflake ID、ObjectId

### 代码格式化

- JSON：格式化、压缩、语法校验
- SQL：格式化、压缩、语句分析
- HTTP：请求/响应报文整理
- 通用语言：JavaScript、TypeScript、HTML、CSS、SCSS、LESS、XML、YAML、Markdown、GraphQL、PHP 等

### 正则表达式

- 实时匹配高亮
- 捕获组展示
- 替换与分割
- 常用正则模板

### 二维码

- 生成二维码：尺寸、边距、容错等级、前景色、背景色可配置
- 识别二维码：摄像头实时扫描、图片上传、剪贴板粘贴识别
- 优先使用浏览器原生 `BarcodeDetector`
- 不支持原生检测时自动回退到 `jsQR`

### 网络调试

#### HTTP Debug

- 支持 GET、POST、PUT、DELETE、PATCH、HEAD、OPTIONS
- 支持 JSON、Form、Multipart、Raw、Binary 等请求体
- 支持 `{{variable}}` 形式的变量替换
- 提供请求历史与响应查看器
- Tauri 桌面端支持无浏览器 CORS 限制的请求联调

#### WebSocket Debug

- 支持 `ws://` 与 `wss://`
- 支持文本与二进制消息
- 支持消息时间线记录
- 支持自动重连参数配置
- 支持自定义子协议

### IP/网络分析

- IPv4/IPv6 格式转换
- CIDR 计算、网络地址与广播地址推导
- 子网划分与子网掩码转换
- IP 归属地查询与批量查询
- 常见端口数据库检索与风险标注

### Recipe 操作流

- 提供链式步骤编排能力
- 适用于可重复的数据处理流程
- 面向复杂转换场景的可组合操作模型

## 版本形态

| 版本 | 适用场景 | 说明 |
| --- | --- | --- |
| Web | 浏览器快速使用、跨平台访问 | 零安装、适合日常在线工具使用 |
| Tauri Desktop | 本地联调、跨域请求、桌面集成 | 提供更强的本地能力与更接近原生的使用体验 |

## 语言支持

- 简体中文
- English

### Tauri 桌面版特性

- 无 CORS 限制的 HTTP 调试能力
- 窗口状态保存
- 原生桌面启动与运行体验
- 桌面自动化烟测支持

## 质量保证

ToolsBox 并非仅以“功能可用”为目标，而是将质量门禁、覆盖率与桌面自动化纳入持续交付体系。

### 测试与门禁

```bash
# 代码质量
npm run lint

# 核心模块快速回归
npm run test:core

# 全量测试与分组覆盖率门禁
npm run test:coverage:core

# 浏览器烟测
npm run test:e2e:smoke

# Tauri 桌面烟测
npm run test:e2e:tauri

# Tauri 安全基线检查
npm run security:tauri:check
```

### 覆盖率策略

覆盖率门禁脚本位于 `scripts/check-core-coverage.mjs`。当前采用分组阈值而非单一全局阈值，覆盖以下分组：

- `encoder`
- `core`
- `recipe`
- `formatter`
- `http-debug`
- `ip-network`
- `qrcode`
- `regex`
- `diff`
- `crypto-core`
- `time`
- `plugins`
- `infrastructure`

这种策略更适合模块化产品的持续重构，可避免总覆盖率掩盖局部风险。

### CI 与桌面自动化

- CI 工作流位于 `.github/workflows/ci.yml`
- Tauri 桌面烟测已接入 CI，并在 macOS runner 上执行
- 桌面 smoke 脚本位于 `scripts/tauri-desktop-smoke.mjs`
- 当前 smoke 能力包括：启动 `tauri dev`、自动清理端口冲突、激活 macOS 桌面窗口、内建窗口截图、亮度分析与白屏检测、上传测试产物

## 安全与隐私

- 绝大多数处理逻辑在本地完成，默认不依赖远端业务后端
- 浏览器端请求受 CORS 约束；需要跨域联调时推荐使用 Tauri 桌面版
- Tauri 安全基线脚本位于 `scripts/check-tauri-security.mjs`
- 当前安全基线要求：
  - 禁止 `app.security.csp` 回退为 `null`
  - 强制存在 `default-src`、`script-src`、`base-uri`、`form-action`、`object-src`
  - 保留 `connect-src` 的 `http/https/ws/wss` 以支持调试场景

安全使用建议：

- ECB 模式安全性较低，生产环境建议优先使用 CBC、GCM、CTR 或 AEAD 模式
- RC4 等古典算法仅适用于学习与兼容场景
- 请妥善保管私钥、密钥与令牌，敏感信息泄露风险需由使用方自行控制

## 技术栈

- React 19
- TypeScript 5.9
- Ant Design 6
- Vite 7
- Tauri 2
- React Router 7
- i18next
- Vitest + Testing Library
- Prettier / sql-formatter
- qrcode / BarcodeDetector / jsQR
- crypto-js / @noble/curves / @noble/ciphers / sm-crypto / jose

## 快速开始

### Web 版本

```bash
npm install
npm run dev
```

构建生产版本：

```bash
npm run build
```

### Tauri 桌面版

```bash
npm install
npm run tauri dev
```

执行桌面自动化烟测：

```bash
npm run test:e2e:tauri
```

说明：

- 该脚本默认启动 `npm run tauri dev`
- 当前 smoke 流程面向 macOS 桌面验证
- 本地运行不再依赖外部截图 helper，直接使用 macOS 内建窗口截图
- 若要复用已运行的 Vite/Tauri 环境，可设置 `TOOLSBOX_TAURI_SKIP_START=1`
- 可通过 `TOOLSBOX_TAURI_ARTIFACT_DIR` 持久化截图、亮度分析结果与 Tauri 日志

构建桌面应用：

```bash
npm run tauri build
```

## 工程架构

### 模块目录

- 模块元数据集中定义于 `src/modules/catalog.ts`
- 路由、菜单、页面标题与类型参数校验共用同一份模块定义
- 这保证了新增模块、重命名模块或扩展子类型时的一致性

### 运行时装载

- 首页与侧边栏通过 `src/hooks/useModules.ts` 订阅运行时模块列表
- `CodeFormatter`、`QRCodeTool` 等高依赖模块按 Tab 懒加载
- 重型能力已按入口拆分，避免无关页面加载不必要依赖

### 插件与扩展

- 插件管理器位于 `src/plugins/PluginManager.ts`
- 插件系统已纳入独立覆盖率门禁与测试夹具
- 为后续扩展和第三方集成预留了更稳定的演进边界

## 项目结构

```text
.
├── src/                     # Web 前端源码
│   ├── components/          # 通用组件
│   ├── context/             # React Context
│   ├── hooks/               # 自定义 Hooks
│   ├── i18n/                # 国际化配置
│   ├── modules/             # 功能模块与模块目录
│   ├── pages/               # 页面组件
│   ├── plugins/             # 插件系统
│   ├── router/              # 路由配置
│   ├── utils/               # 公共工具
│   └── types/               # 类型定义
├── src-tauri/               # Tauri 桌面端源码与配置
├── scripts/                 # 构建、测试、门禁脚本
├── .github/workflows/       # CI 工作流
├── TAURI_TEST_GUIDE.md      # 桌面端测试指南
├── TAURI_STATUS_SUMMARY.md  # 桌面端能力状态说明
└── README.md
```

## 相关文档

- [Tauri 测试指南](./TAURI_TEST_GUIDE.md)
- [Tauri 状态总结](./TAURI_STATUS_SUMMARY.md)

## 浏览器支持

支持 Chrome、Firefox、Safari、Edge 的现代版本。

## 许可证

MIT License
