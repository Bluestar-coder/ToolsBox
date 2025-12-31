import React from 'react';
import type { ComponentType } from 'react';

// 模块接口定义
export interface ToolModule {
  id: string;               // 模块唯一标识
  name: string;             // 模块名称
  icon: React.ReactNode;    // 模块图标
  component: React.FC;      // 模块主组件
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

  /**
   * 注册模块
   * @param module 要注册的模块
   */
  registerModule(module: ToolModule): void {
    this.modules.set(module.id, module);
  }

  /**
   * 注册懒加载模块
   * @param module 要注册的懒加载模块
   */
  registerLazyModule(module: LazyToolModule): void {
    this.lazyModules.set(module.id, module);
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

// 1. 编码/解码模块
// @ts-expect-error - Type incompatibility is expected due to ToolModule structure
const EncoderDecoderModule = React.lazy(() => import('./encoder-decoder'));
void registerLazyModule(import('./encoder-decoder'), EncoderDecoderModule);

// 2. 加密/解密工具模块
// @ts-expect-error - Type incompatibility is expected due to ToolModule structure
const CryptoToolModule = React.lazy(() => import('./crypto-tool'));
void registerLazyModule(import('./crypto-tool'), CryptoToolModule);

// 3. 时间处理工具模块
// @ts-expect-error - Type incompatibility is expected due to ToolModule structure
const TimeToolModule = React.lazy(() => import('./time-tool'));
void registerLazyModule(import('./time-tool'), TimeToolModule);

// 4. 正则表达式工具模块
// @ts-expect-error - Type incompatibility is expected due to ToolModule structure
const RegexToolModule = React.lazy(() => import('./regex-tool'));
void registerLazyModule(import('./regex-tool'), RegexToolModule);

// 5. 代码格式化模块
// @ts-expect-error - Type incompatibility is expected due to ToolModule structure
const CodeFormatterModule = React.lazy(() => import('./code-formatter'));
void registerLazyModule(import('./code-formatter'), CodeFormatterModule);

// 6. 二维码工具模块
// @ts-expect-error - Type incompatibility is expected due to ToolModule structure
const QRCodeToolModule = React.lazy(() => import('./qrcode-tool'));
void registerLazyModule(import('./qrcode-tool'), QRCodeToolModule);
