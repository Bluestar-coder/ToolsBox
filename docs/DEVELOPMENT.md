# ToolsBox 开发指南

欢迎参与 ToolsBox 项目的开发！本文档将帮助你了解项目的结构、开发流程和代码规范。

## 目录

- [环境要求](#环境要求)
- [安装步骤](#安装步骤)
- [项目结构](#项目结构)
- [开发命令](#开发命令)
- [调试方法](#调试方法)
- [代码规范](#代码规范)
- [测试指南](#测试指南)
- [构建部署](#构建部署)
- [提交规范](#提交规范)

## 环境要求

在开始开发之前，请确保你的开发环境满足以下要求：

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0 或 pnpm >= 8.0.0
- **Git**: >= 2.0.0

推荐的开发工具：
- **IDE**: VS Code、WebStorm 或其他支持 TypeScript 的编辑器
- **浏览器**: Chrome、Firefox、Safari 最新版本
- **终端**: 支持 ANSI 颜色的终端

## 安装步骤

### 1. 克隆仓库

```bash
git clone https://github.com/your-username/toolsbox.git
cd toolsbox
```

### 2. 安装依赖

使用 npm:
```bash
npm install
```

或使用 pnpm:
```bash
pnpm install
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173 查看应用。

## 项目结构

```
toolsbox/
├── .github/                  # GitHub Actions CI 配置
│   └── workflows/
│       └── ci.yml           # CI 工作流配置
├── docs/                     # 项目文档
│   ├── api/                 # API 文档（由 TypeDoc 生成）
│   └── DEVELOPMENT.md       # 开发指南（本文档）
├── public/                   # 静态资源
│   └── ...
├── src/                      # 源代码
│   ├── components/          # 全局共享组件
│   ├── context/            # React Context（主题、应用状态等）
│   ├── hooks/              # 自定义 React Hooks
│   ├── modules/            # 功能模块
│   │   ├── code-formatter/ # 代码格式化工具
│   │   ├── crypto-tool/    # 加密工具
│   │   ├── encoder-decoder/# 编码解码工具
│   │   ├── qrcode-tool/    # 二维码工具
│   │   ├── regex-tool/     # 正则表达式工具
│   │   └── time-tool/      # 时间工具
│   ├── types/              # TypeScript 类型定义
│   ├── utils/              # 工具函数
│   ├── App.tsx             # 应用根组件
│   └── main.tsx            # 应用入口
├── tests/                   # 测试文件（与源码同目录）
├── .eslintrc.js            # ESLint 配置
├── .gitignore              # Git 忽略配置
├── package.json            # 项目配置和依赖
├── tsconfig.json           # TypeScript 配置
├── vite.config.ts          # Vite 配置
├── vitest.config.ts        # Vitest 测试配置
└── typedoc.json            # TypeDoc API 文档配置
```

### 模块结构

每个功能模块遵循统一的结构：

```
module-name/
├── components/              # 模块专用组件
│   └── tabs/               # 标签页组件
├── utils/                  # 模块工具函数
│   ├── *.ts               # 工具函数
│   └── *.test.ts          # 测试文件
├── constants.ts            # 常量定义
└── index.tsx              # 模块入口
```

## 开发命令

### 开发相关

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

### 测试相关

```bash
# 运行所有测试
npm run test

# 运行测试并监听变化
npm run test:watch

# 运行测试并生成覆盖率报告
npm run test:coverage
```

### 代码质量

```bash
# 运行 ESLint 检查
npm run lint

# 自动修复 ESLint 问题
npm run lint:fix
```

### 文档生成

```bash
# 生成 API 文档
npm run docs:build

# 启动文档开发服务器
npm run docs:dev
```

## 调试方法

### 1. 浏览器调试

1. 在 Chrome 中打开开发者工具 (F12)
2. 使用 Sources 面板设置断点
3. 使用 Console.log 输出调试信息

### 2. VS Code 调试

创建 `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome against localhost",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/src"
    }
  ]
}
```

### 3. React DevTools

安装 [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi) 浏览器扩展，可以：
- 查看 React 组件树
- 检查组件 props 和 state
- 性能分析

### 4. 网络请求调试

对于涉及 HTTP 请求的工具，使用 Network 面板：
- 查看请求/响应详情
- 检查请求头和响应头
- 分析请求时序

## 代码规范

### TypeScript 规范

1. **使用类型注解**
   ```typescript
   // Good
   function calculateHash(input: string, algorithm: string): string {
     // ...
   }

   // Bad
   function calculateHash(input, algorithm) {
     // ...
   }
   ```

2. **使用接口定义数据结构**
   ```typescript
   interface HashResults {
     [key: string]: string;
   }
   ```

3. **避免使用 any**
   ```typescript
   // Good
   function process(data: unknown) {
     if (typeof data === 'string') {
       // ...
     }
   }

   // Bad
   function process(data: any) {
     // ...
   }
   ```

### React 规范

1. **使用函数组件和 Hooks**
   ```typescript
   const MyComponent: React.FC<Props> = ({ value }) => {
     const [state, setState] = useState(initialValue);
     // ...
   };
   ```

2. **使用 TypeScript 定义 Props**
   ```typescript
   interface ComponentProps {
     title: string;
     count?: number;
     onSubmit: () => void;
   }
   ```

3. **使用 useCallback 和 useMemo 优化性能**
   ```typescript
   const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
   const handleClick = useCallback(() => {}, []);
   ```

### 命名规范

- **文件名**: 使用 kebab-case (例如: `hash-utils.ts`)
- **组件名**: 使用 PascalCase (例如: `HashTool.tsx`)
- **函数名**: 使用 camelCase (例如: `calculateHash`)
- **常量名**: 使用 UPPER_SNAKE_CASE (例如: `MAX_INPUT_SIZE`)
- **接口/类型名**: 使用 PascalCase (例如: `HashResults`)

### 注释规范

使用 JSDoc 注释导出的函数和类型：

```typescript
/**
 * 计算哈希值
 *
 * @param input - 输入字符串
 * @param algorithm - 哈希算法名称
 * @returns 十六进制格式的哈希值
 *
 * @example
 * ```typescript
 * const hash = calculateHash('hello', 'MD5');
 * ```
 */
export function calculateHash(input: string, algorithm: string): string {
  // ...
}
```

### Git 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型 (type):**
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构（既不是新功能也不是修复）
- `test`: 添加测试
- `chore`: 构建过程或辅助工具的变动

**示例:**
```bash
git commit -m "feat(crypto): 添加 SM4 加密算法支持"
git commit -m "fix(formatter): 修复 JSON 格式化时的缩进问题"
git commit -m "docs: 更新 README 安装说明"
```

## 测试指南

### 测试框架

项目使用 Vitest 作为测试框架，它提供了：
- 快速的测试执行
- 与 Vite 的无缝集成
- ESM 原生支持
- Jest 兼容的 API

### 编写测试

1. **测试文件命名**
   - 与源文件同名，添加 `.test.ts` 或 `.spec.ts` 后缀
   - 放在源文件同一目录下

2. **基本测试结构**
   ```typescript
   import { describe, it, expect } from 'vitest';

   describe('功能模块名称', () => {
     it('应该正确执行基本功能', () => {
       const result = functionToTest('input');
       expect(result).toBe('expected');
     });

     it('应该处理边界条件', () => {
       expect(() => functionToTest('')).toThrow();
     });
   });
   ```

3. **测试覆盖率目标**
   - 核心工具函数: > 80%
   - 组件测试: > 60%
   - 整体覆盖率: > 50%

4. **运行特定测试**
   ```bash
   # 运行单个测试文件
   npm test hash.test.ts

   # 运行匹配模式的测试
   npm test -- --grep "哈希"
   ```

### 测试最佳实践

1. **测试单一功能**
   ```typescript
   // Good
   it('应该正确计算 MD5 哈希', () => {
     expect(calculateHash('test', 'MD5')).toBe('expected');
   });

   // Bad
   it('应该正确计算所有哈希', () => {
     // 测试多个功能...
   });
   ```

2. **使用描述性的测试名称**
   ```typescript
   // Good
   it('应该在输入为空时抛出错误', () => {});

   // Bad
   it('测试错误情况', () => {});
   ```

3. **使用 beforeEach 和 afterEach**
   ```typescript
   beforeEach(() => {
     // 每个测试前执行
   });

   afterEach(() => {
     // 每个测试后执行清理
   });
   ```

## 构建部署

### 构建生产版本

```bash
npm run build
```

构建产物将输出到 `dist/` 目录。

### 本地预览

```bash
npm run preview
```

### 环境变量

创建 `.env.production` 文件配置生产环境变量：

```env
VITE_API_BASE_URL=https://api.example.com
VITE_APP_TITLE=ToolsBox
```

## 常见问题

### Q: 如何添加新的工具模块？

1. 在 `src/modules/` 下创建新模块目录
2. 按照模块结构创建文件
3. 在 `src/modules/index.ts` 中导出模块
4. 在 `src/App.tsx` 中注册路由

### Q: 如何处理大型文件操作？

使用 `Blob` 和 `FileReader` API，并考虑使用 Web Worker 避免阻塞 UI。

### Q: 如何优化性能？

1. 使用 `useMemo` 和 `useCallback` 缓存计算和函数
2. 对于大量数据，使用虚拟滚动
3. 使用 Web Worker 处理密集计算
4. 懒加载组件和路由

### Q: 如何调试样式？

1. 使用浏览器开发工具检查元素
2. 临时添加 `style={{ border: '1px solid red' }}`
3. 使用 React DevTools 查看组件

## 资源链接

- [React 官方文档](https://react.dev/)
- [TypeScript 官方文档](https://www.typescriptlang.org/)
- [Vite 官方文档](https://vitejs.dev/)
- [Vitest 官方文档](https://vitest.dev/)
- [Ant Design 文档](https://ant.design/)

## 获取帮助

如果你在开发过程中遇到问题：

1. 查看项目文档
2. 搜索已有的 Issue
3. 创建新的 Issue 并提供详细信息
4. 在 Pull Request 中请求代码审查

感谢你对 ToolsBox 项目的贡献！
