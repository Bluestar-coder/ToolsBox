# Tauri 桌面端功能测试指南

## 启动 Tauri 应用

### 开发模式
```bash
npm run tauri dev
```

这将会：
1. 启动 Vite 开发服务器（端口 5173）
2. 编译 Rust 后端
3. 启动 Tauri 桌面应用窗口

### 构建生产版本
```bash
npm run tauri build
```

## Tauri 特有功能

### 1. HTTP 请求（绕过 CORS）

Tauri 应用使用 `tauri-plugin-http` 插件，可以绕过浏览器的 CORS 限制。

**测试步骤：**
1. 打开"网络调试"模块
2. 在 HTTP 标签页中，尝试请求一个有 CORS 限制的 API
3. 在浏览器版本中会看到 CORS 错误
4. 在 Tauri 版本中应该能成功请求

**代码实现位置：**
- `src/modules/http-debug/utils/http-client.ts`
- 自动检测 Tauri 环境：`isTauriEnvironment()`
- Tauri 请求：`sendViaTauri()`
- 浏览器请求：`sendViaFetch()`

### 2. 窗口状态保存

使用 `tauri-plugin-window-state` 插件，应用会自动保存和恢复窗口的：
- 位置
- 大小
- 最大化/最小化状态

**测试步骤：**
1. 调整窗口大小和位置
2. 关闭应用
3. 重新打开应用
4. 窗口应该恢复到之前的大小和位置

### 3. IP/网络工具

所有 IP 网络工具功能在 Tauri 端应该正常工作：

**测试项目：**
- ✅ IP 转换器（点分十进制、十六进制、二进制、整数、IPv6）
- ✅ CIDR 计算器
- ✅ 子网划分
- ✅ **子网掩码转换工具**（新增）
  - 多格式转换：CIDR、点分十进制、二进制、十六进制、整数
  - 网络信息计算：网络地址、广播地址、可用 IP 范围
  - 子网规划：生成子网列表
  - 智能推荐：根据主机数推荐子网掩码
- ✅ IP 归属地查询（需要网络连接）
  - 智能代理检测：自动识别国内/国外 IP
  - 多 API 备用：ip-api.com、ipapi.co、ip.sb
- ✅ 端口速查

**特别注意：**
- IP 归属地查询使用外部 API，在 Tauri 中不受 CORS 限制
- 所有翻译文本应该正确显示（已修复 i18n 问题）
- 子网掩码转换工具经过性能优化，交互响应时间 < 60ms

## 环境检测

应用会自动检测运行环境：

```typescript
// 检测是否在 Tauri 环境
function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && !!(window as any).__TAURI_INTERNALS__;
}
```

## 已知差异

### Tauri vs 浏览器

| 功能 | 浏览器 | Tauri |
|------|--------|-------|
| HTTP 请求 | 受 CORS 限制 | 无 CORS 限制 |
| 文件系统访问 | 受限 | 完整访问（需配置） |
| 窗口控制 | 无 | 完整控制 |
| 性能 | 依赖浏览器 | 原生性能 |

## 测试清单

### 基础功能
- [ ] 应用启动正常
- [ ] 窗口大小和位置可调整
- [ ] 窗口状态保存和恢复
- [ ] 主题切换（浅色/深色）
- [ ] 语言切换（中文/英文/韩文/日文）

### IP/网络工具
- [ ] IP 转换器：输入 `192.168.1.1` 显示所有格式
- [ ] CIDR 计算器：输入 `192.168.1.0/24` 显示网络信息
- [ ] 子网划分：输入 `192.168.0.0/24`，划分 2 个子网
- [ ] **子网掩码转换工具**（新增）：
  - [ ] 输入 `24` 显示所有格式转换结果
  - [ ] 输入 `255.255.255.0` 自动识别为点分十进制
  - [ ] 输入 `192.168.1.1` 查看网络信息
  - [ ] 测试子网规划功能
  - [ ] 测试智能推荐功能（输入主机数）
- [ ] IP 归属地：查询本机 IP
  - [ ] 测试国内 IP 查询
  - [ ] 测试国外 IP 查询
- [ ] 端口速查：显示高频端口列表

### HTTP 调试工具
- [ ] 发送 GET 请求到 `https://api.github.com`
- [ ] 发送 POST 请求（JSON body）
- [ ] 查看响应头和响应体
- [ ] 历史记录保存
- [ ] 环境变量功能

### 其他工具
- [ ] 编码/解码工具
- [ ] 时间工具
- [ ] 加密/解密工具
- [ ] 代码格式化
- [ ] 正则表达式工具
- [ ] 二维码工具
- [ ] Diff 工具

## 调试

### 查看日志
在开发模式下，Tauri 会在终端输出日志：
```bash
npm run tauri dev
```

### 打开开发者工具
在 Tauri 窗口中按 `F12` 或 `Cmd+Option+I` (macOS) 打开开发者工具。

### 检查 Tauri 环境
在浏览器控制台中运行：
```javascript
console.log('Is Tauri:', !!(window as any).__TAURI_INTERNALS__);
```

## 常见问题

### Q: Tauri 应用启动失败
A: 确保已安装 Rust 工具链：
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Q: HTTP 请求仍然有 CORS 错误
A: 检查 `tauri-plugin-http` 是否正确配置在 `src-tauri/src/lib.rs` 中。

### Q: 窗口状态不保存
A: 检查 `tauri-plugin-window-state` 是否正确配置。

### Q: 翻译文本显示为 key
A: 已修复，确保使用 `modules.ipNetwork.*` 前缀。

## 性能对比

建议测试以下场景的性能差异：

1. **大量数据处理**：子网划分大量子网
2. **频繁 HTTP 请求**：连续发送多个请求
3. **复杂计算**：加密/解密大文本

Tauri 版本应该在所有场景下都有更好的性能表现。
