import React from 'react';
import type { ComponentType } from 'react';

// 模块接口定义
export interface ToolModule {
  id: string;               // 模块唯一标识
  name: string;             // 模块名称
  icon: React.ReactNode;    // 模块图标
  component: ComponentType<Record<string, unknown>>;  // 模块主组件
  description?: string;     // 模块描述
}

// 懒加载模块接口
export interface LazyToolModule {
  id: string;
  name: string;
  icon: React.ReactNode;
  component: React.LazyExoticComponent<ComponentType<Record<string, unknown>>>;
  description?: string;
}

// 模块列表类型
export type ModuleList = ToolModule[];
export type LazyModuleList = LazyToolModule[];

// 模块管理类
class ModuleManager {
  private modules: Map<string, ToolModule> = new Map();
  private lazyModules: Map<string, LazyToolModule> = new Map();
  private listeners: Set<() => void> = new Set();

  /**
   * 注册模块
   * @param module 要注册的模块
   */
  registerModule(module: ToolModule): void {
    this.modules.set(module.id, module);
    this.notifyListeners();
  }

  /**
   * 注册懒加载模块
   * @param module 要注册的懒加载模块
   */
  registerLazyModule(module: LazyToolModule): void {
    this.lazyModules.set(module.id, module);
    this.notifyListeners();
  }

  /**
   * 订阅模块变更
   * @param listener 监听函数
   * @returns 取消订阅函数
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 通知所有监听者
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  /**
   * 获取所有注册的模块
   * @returns 模块列表
   */
  getModules(): ModuleList {
    return Array.from(this.modules.values());
  }

  /**
   * 获取所有注册的懒加载模块
   * @returns 懒加载模块列表
   */
  getLazyModules(): LazyModuleList {
    return Array.from(this.lazyModules.values());
  }

  /**
   * 根据ID获取模块
   * @param id 模块ID
   * @returns 模块或undefined
   */
  getModuleById(id: string): ToolModule | undefined {
    return this.modules.get(id);
  }

  /**
   * 根据ID获取懒加载模块
   * @param id 模块ID
   * @returns 懒加载模块或undefined
   */
  getLazyModuleById(id: string): LazyToolModule | undefined {
    return this.lazyModules.get(id);
  }
}

// 创建模块管理器实例
export const moduleManager = new ModuleManager();

// 动态导入和注册模块的辅助函数
async function registerLazyModule(
  moduleImport: Promise<{ default: ToolModule }>,
  lazyComponent: React.LazyExoticComponent<ComponentType<Record<string, unknown>>>
): Promise<void> {
  const module = await moduleImport;
  moduleManager.registerLazyModule({
    id: module.default.id,
    name: module.default.name,
    icon: module.default.icon,
    component: lazyComponent,
    description: module.default.description,
  });
}

// 按顺序导入并注册模块（懒加载）
// 顺序：编码/解码、加密/解密、时间工具、正则工具、代码格式化、二维码工具

const shouldRegisterModules = !(
  import.meta.vitest ||
  import.meta.env.MODE === 'test' ||
  (typeof process !== 'undefined' && process.env.NODE_ENV === 'test')
);

// 1. 编码/解码模块
const EncoderDecoderModule = React.lazy(() => import('./encoder-decoder'));
if (shouldRegisterModules) {
  void registerLazyModule(import('./encoder-decoder'), EncoderDecoderModule);
}

// 2. 加密/解密工具模块
const CryptoToolModule = React.lazy(() => import('./crypto-tool'));
if (shouldRegisterModules) {
  void registerLazyModule(import('./crypto-tool'), CryptoToolModule);
}

// 3. 时间处理工具模块
const TimeToolModule = React.lazy(() => import('./time-tool'));
if (shouldRegisterModules) {
  void registerLazyModule(import('./time-tool'), TimeToolModule);
}

// 4. 正则表达式工具模块
const RegexToolModule = React.lazy(() => import('./regex-tool'));
if (shouldRegisterModules) {
  void registerLazyModule(import('./regex-tool'), RegexToolModule);
}

// 5. 代码格式化模块
const CodeFormatterModule = React.lazy(() => import('./code-formatter'));
if (shouldRegisterModules) {
  void registerLazyModule(import('./code-formatter'), CodeFormatterModule);
}

// 6. 二维码工具模块
const QRCodeToolModule = React.lazy(() => import('./qrcode-tool'));
if (shouldRegisterModules) {
  void registerLazyModule(import('./qrcode-tool'), QRCodeToolModule);
}

// 7. 差异对比工具模块
const DiffToolModule = React.lazy(() => import('./diff-tool'));
if (shouldRegisterModules) {
  void registerLazyModule(import('./diff-tool'), DiffToolModule);
}

// 8. HTTP 调试模块
const HttpDebugModule = React.lazy(() => import('./http-debug'));
if (shouldRegisterModules) {
  void registerLazyModule(import('./http-debug'), HttpDebugModule);
}

// 9. IP/网络工具模块
const IpNetworkModule = React.lazy(() => import('./ip-network'));
if (shouldRegisterModules) {
  void registerLazyModule(import('./ip-network'), IpNetworkModule);
}
