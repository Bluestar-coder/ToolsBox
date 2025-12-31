# Sentry错误监控使用指南

## 概述

ToolsBox项目已集成Sentry错误监控服务，用于捕获和跟踪应用程序中的错误。

## 配置

### 1. 环境变量配置

在项目根目录创建 `.env` 文件（不要提交到版本控制）：

```bash
# Sentry DSN（从Sentry控制台获取）
VITE_SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0

# 应用版本号
VITE_APP_VERSION=1.0.0
```

参考 `.env.example` 文件获取更多配置选项。

### 2. 初始化

Sentry已在 `src/main.tsx` 中自动初始化：

```typescript
import { initSentry } from './utils/sentry'

// 初始化Sentry（只在生产环境）
initSentry()
```

## 使用方法

### 1. 捕获错误

```typescript
import { captureError } from '@/utils/sentry'

try {
  // 你的代码
} catch (error) {
  captureError(error as Error, {
    component: 'EncoderComponent',
    action: 'encode'
  })
}
```

### 2. 记录消息

```typescript
import { captureMessage } from '@/utils/sentry'

// 记录信息消息
captureMessage('User performed action', 'info')

// 记录警告
captureMessage('API rate limit approaching', 'warning')

// 记录错误
captureMessage('Critical failure occurred', 'error')
```

### 3. 设置用户信息

```typescript
import { setSentryUser } from '@/utils/sentry'

setSentryUser({
  id: 'user-123',
  email: 'user@example.com'
})
```

### 4. 添加面包屑（Breadcrumbs）

```typescript
import { addSentryBreadcrumb } from '@/utils/sentry'

// 在用户操作前添加面包屑
addSentryBreadcrumb(
  'Button clicked',
  'user-action',
  'info',
  { button: 'submit', form: 'login' }
)
```

### 5. 性能监控

```typescript
import { withPerformanceTracking } from '@/utils/sentry'

// 同步操作
const result = withPerformanceTracking(
  'data-processing',
  'transform',
  () => {
    return processData(data)
  }
)

// 异步操作
import { withPerformanceTrackingAsync } from '@/utils/sentry'

const result = await withPerformanceTrackingAsync(
  'api-fetch',
  'http-request',
  async () => {
    return await fetchData()
  }
)
```

## 错误边界集成

React错误边界已自动集成Sentry：

```typescript
// src/components/ErrorBoundary.tsx
componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  // 自动发送到Sentry
  Sentry.captureException(error, {
    contexts: {
      react: {
        componentStack: errorInfo.componentStack,
      },
    },
  });
}
```

## 性能监控配置

Sentry配置了以下性能监控：

- **追踪采样率**: 10%（tracesSampleRate）
- **会话回放采样率**: 10%（replaysSessionSampleRate）
- **错误时回放采样率**: 100%（replaysOnErrorSampleRate）

## 敏感信息过滤

已配置以下过滤器：

1. 移除所有cookies
2. 忽略ResizeObserver相关错误
3. 在生产环境才启用Sentry

## 开发环境

在开发环境中，Sentry不会初始化（`import.meta.env.PROD === false`），除非你设置了有效的DSN。

## 测试

Sentry工具函数包含完整的单元测试：

```bash
npm test -- src/utils/sentry.test.ts
```

## 查看错误

登录Sentry控制台查看错误报告：
- 错误详情和堆栈跟踪
- 用户上下文信息
- 面包屑轨迹
- 性能数据
- 会话回放

## 最佳实践

1. **在关键操作处添加面包屑**：帮助追踪用户操作路径
2. **捕获所有未处理的错误**：使用错误边界和全局错误处理器
3. **设置有意义的上下文**：为错误提供额外的调试信息
4. **设置用户信息**：帮助你了解哪些用户遇到了问题
5. **使用性能监控**：识别性能瓶颈
6. **不要记录敏感信息**：Sentry已配置过滤器，但也要注意不要手动记录密码、token等

## 故障排除

### Sentry不工作

1. 检查是否在生产环境
2. 验证 `VITE_SENTRY_DSN` 是否正确设置
3. 查看浏览器控制台是否有Sentry相关错误
4. 检查Sentry控制台的项目设置

### 错误未上报

1. 确认网络请求能够到达Sentry服务器
2. 检查浏览器的广告拦截器是否阻止了Sentry
3. 验证DSN配置是否正确

### 性能影响

如果担心Sentry对性能的影响：

1. 降低采样率（tracesSampleRate）
2. 禁用会话回放（replayIntegration）
3. 只在生产环境启用

## 相关文档

- [Sentry React文档](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Sentry Performance Monitoring](https://docs.sentry.io/platforms/javascript/guides/react/performance/)
- [Sentry Session Replay](https://docs.sentry.io/platforms/javascript/guides/react/session-replay/)
