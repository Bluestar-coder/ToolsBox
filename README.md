# 效率工具箱

一个功能强大的在线工具集，提供编码/解码、时间处理和加密/解密等实用工具。

## 功能特性

### 📝 编码/解码工具
- **Base家族编码**：支持Base64、Base16、Base32、Base32Hex、Base36、Base58、Base62、Base64URL、Base85、Base91
- **URL编码**：符合RFC 3986标准的URL编码和解码
- **HTML实体编码**：安全处理HTML特殊字符
- **JSON格式化**：美化和压缩JSON数据
- **Unicode编码**：转换Unicode字符和转义序列
- **进制转换**：支持二进制、八进制、十进制、十六进制和自定义进制转换
- **图片转换**：图片与Base64格式互转

### ⏰ 时间处理工具
- **智能时间解析**：支持多种时间格式解析
- **代码生成**：生成不同编程语言的时间处理代码
- **时间计算**：计算时间差和执行时间加减运算
- **批量转换**：批量转换多个时间值
- **时区转换**：支持全球主要时区转换
- **唯一ID生成**：支持UUID v1/v4、GUID、短UUID、NanoID、ULID、Snowflake ID、ObjectId等

### 🔒 加密/解密工具
- **AES加密**：支持ECB、CBC、CFB、OFB、CTR等多种模式
- **DES加密**：经典数据加密标准
- **3DES加密**：增强型DES加密
- **RC4加密**：流密码算法
- **Rabbit加密**：高效流密码算法
- **多种填充方式**：PKCS7、PKCS5、Zero、ISO 9797-1、ANSI X9.23
- **多种输出格式**：Base64、Hexadecimal、UTF-8

## 技术栈

- **React 19.2.0** - 现代化的前端框架
- **TypeScript 5.9.3** - 类型安全的JavaScript超集
- **Ant Design 6.0.1** - 企业级UI组件库
- **Vite 7.2.4** - 下一代前端构建工具
- **crypto-js 4.2.0** - 强大的加密库
- **html-entities 2.6.0** - HTML实体处理库

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

应用将在 `http://localhost:5173` 启动

### 构建生产版本

```bash
npm run build
```

构建产物将生成在 `dist` 目录

### 预览生产版本

```bash
npm run preview
```

### 运行代码检查

```bash
npm run lint
```

## 项目结构

```
src/
├── assets/          # 静态资源
├── components/      # 通用组件
│   ├── ErrorBoundary.tsx  # 全局错误边界组件
│   └── Layout/      # 布局组件
├── context/         # React Context状态管理
├── hooks/           # 自定义React Hooks
├── modules/         # 功能模块
│   ├── crypto-tool/       # 加密/解密工具
│   ├── encoder-decoder/   # 编码/解码工具
│   └── time-tool/         # 时间处理工具
├── plugins/         # 插件系统
│   ├── PluginManager.ts   # 插件管理器
│   └── types.ts           # 插件类型定义
├── utils/           # 工具函数
│   ├── encoders/    # 编码/解码工具函数
│   └── validators.ts      # 输入验证工具
├── App.css          # 应用样式
├── App.tsx          # 应用入口组件
├── index.css        # 全局样式
└── main.tsx         # 应用入口文件
```

## 模块开发指南

### 创建新模块

1. 在 `src/modules` 目录下创建新的模块目录
2. 创建模块入口文件 `index.tsx`，导出符合 `ToolModule` 接口的模块对象
3. 在 `src/modules/index.ts` 中注册新模块

### 模块接口

```typescript
interface ToolModule {
  id: string;               // 模块唯一标识
  name: string;             // 模块名称
  icon: React.ReactNode;    // 模块图标
  component: React.FC;      // 模块主组件
  description?: string;     // 模块描述
}
```

### 示例模块

```typescript
import { SomeIcon } from '@ant-design/icons';
import MyToolComponent from './components/MyToolComponent';
import type { ToolModule } from '../index';

const MyToolModule: ToolModule = {
  id: 'my-tool',
  name: '我的工具',
  icon: <SomeIcon />,
  component: MyToolComponent,
  description: '这是我的工具模块'
};

export default MyToolModule;
```

## 插件开发指南

### 创建插件

1. 创建插件项目目录
2. 实现插件接口
3. 配置插件元数据
4. 注册插件模块

### 插件接口

```typescript
interface Plugin {
  initialize: () => Promise<void>; // 插件初始化
  destroy: () => Promise<void>;    // 插件销毁
  registerModules?: () => void;    // 注册模块
  unregisterModules?: () => void;  // 注销模块
}
```

### 插件配置

```typescript
interface PluginConfig {
  name: string;               // 插件名称
  version: string;            // 插件版本
  description: string;        // 插件描述
  author: string;             // 插件作者
  icon?: React.ReactNode;      // 插件图标
  entryPoint: string;         // 插件入口点
  permissions: string[];       // 插件权限
  dependencies?: string[];     // 插件依赖
}
```

### 插件示例

```typescript
class MyPlugin {
  async initialize() {
    console.log('插件初始化');
  }

  async destroy() {
    console.log('插件销毁');
  }

  registerModules() {
    // 注册自定义模块
  }

  unregisterModules() {
    // 注销自定义模块
  }
}

export default MyPlugin;
```

## API 文档

### 编码/解码工具 API

#### `executeEncodeDecode(input, type, operation)`

执行编码或解码操作

- **参数**：
  - `input`: 输入字符串
  - `type`: 编码类型（如 'base64', 'url', 'html' 等）
  - `operation`: 操作类型（'encode' 或 'decode'）
- **返回**：
  ```typescript
  {
    success: boolean;
    result: string;
    error?: string;
  }
  ```

### 加密/解密工具 API

#### `encrypt(plaintext, key, options)`

执行加密操作

- **参数**：
  - `plaintext`: 明文
  - `key`: 密钥
  - `options`: 加密选项
    ```typescript
    {
      algorithm: 'aes' | 'des' | '3des' | 'rc4' | 'rabbit' | 'tripledes';
      mode: 'ecb' | 'cbc' | 'cfb' | 'ofb' | 'ctr';
      padding: 'pkcs7' | 'pkcs5' | 'zero' | 'iso97971' | 'ansiX923';
      iv?: string;
      outputFormat?: 'base64' | 'hex' | 'utf8';
    }
    ```
- **返回**：加密后的密文

#### `decrypt(ciphertext, key, options)`

执行解密操作

- **参数**：与 `encrypt` 相同
- **返回**：解密后的明文

### 时间处理工具 API

#### `parseSmartTime(input)`

智能解析时间字符串

- **参数**：
  - `input`: 时间字符串（支持时间戳、ISO格式、自然语言等）
- **返回**：解析后的 Date 对象或 null

### 插件系统 API

#### `pluginManager.loadPlugin(pluginConfig)`

加载插件

- **参数**：
  - `pluginConfig`: 插件配置
- **返回**：
  ```typescript
  {
    success: boolean;
    plugin?: PluginMetadata;
    error?: string;
  }
  ```

#### `pluginManager.enablePlugin(pluginId)`

启用插件

- **参数**：
  - `pluginId`: 插件ID
- **返回**：`boolean` - 启用结果

#### `pluginManager.disablePlugin(pluginId)`

禁用插件

- **参数**：
  - `pluginId`: 插件ID
- **返回**：`boolean` - 禁用结果

#### `pluginManager.unloadPlugin(pluginId)`

卸载插件

- **参数**：
  - `pluginId`: 插件ID
- **返回**：`boolean` - 卸载结果

#### `pluginManager.getPlugins()`

获取所有插件

- **返回**：`PluginMetadata[]` - 插件列表

### 输入验证 API

#### `validateRequired(input, fieldName)`

验证字段是否必填

- **参数**：
  - `input`: 输入值
  - `fieldName`: 字段名称
- **返回**：
  ```typescript
  {
    valid: boolean;
    error?: string;
  }
  ```

#### `validateLength(input, minLength, maxLength, fieldName)`

验证字符串长度范围

- **参数**：
  - `input`: 输入值
  - `minLength`: 最小长度
  - `maxLength`: 最大长度
  - `fieldName`: 字段名称
- **返回**：
  ```typescript
  {
    valid: boolean;
    error?: string;
  }
  ```

#### `validateBase64(input)`

验证是否为有效的Base64字符串

- **参数**：
  - `input`: 输入值
- **返回**：
  ```typescript
  {
    valid: boolean;
    error?: string;
  }
  ```

#### `validateEncryptionKeyLength(algorithm, key)`

验证密钥长度是否符合算法要求

- **参数**：
  - `algorithm`: 算法类型
  - `key`: 密钥
- **返回**：
  ```typescript
  {
    valid: boolean;
    error?: string;
  }
  ```

## 安全注意事项

1. 加密/解密操作在客户端执行，敏感数据不会发送到服务器
2. 请妥善保管您的密钥和IV，丢失将无法恢复数据
3. ECB模式安全性较低，建议使用CBC或CTR模式
4. 不要在不安全的网络环境下处理敏感数据

## 浏览器支持

- Chrome (最新版本)
- Firefox (最新版本)
- Safari (最新版本)
- Edge (最新版本)

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 开发计划

- [x] 实现编码/解码工具
- [x] 实现时间处理工具
- [x] 实现加密/解密工具
- [x] 支持插件扩展
- [ ] 添加更多工具模块
- [ ] 添加主题切换功能
- [ ] 支持数据导出和导入
- [ ] 添加使用历史记录

## 联系方式

如有问题或建议，请通过以下方式联系：

- 创建 GitHub Issue
- 发送邮件至：[your-email@example.com]

---

**效率工具箱** - 让工作更高效！ 🚀