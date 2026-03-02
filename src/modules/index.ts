import React from 'react';
import type { ComponentType } from 'react';
import { AppIcon } from '../components/icons/AppIcon';

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

// 动态导入和注册模块的辅助函数（组件保持真正懒加载）
function registerLazyComponentModule(
  moduleMeta: Omit<LazyToolModule, 'component'>,
  componentImport: () => Promise<{ default: ComponentType<Record<string, unknown>> }>
): void {
  moduleManager.registerLazyModule({
    ...moduleMeta,
    component: React.lazy(componentImport),
  });
}

// 按顺序导入并注册模块（懒加载）
// 顺序：编码/解码、加密/解密、时间工具、正则工具、代码格式化、二维码工具

const shouldRegisterModules = !(
  import.meta.vitest ||
  import.meta.env.MODE === 'test' ||
  (typeof process !== 'undefined' && process.env.NODE_ENV === 'test')
);

if (shouldRegisterModules) {
  registerLazyComponentModule(
    {
      id: 'encoder-decoder',
      name: '编码/解码',
      icon: React.createElement(AppIcon, { name: 'encoder' }),
      description: '支持多种编码格式的编码和解码工具',
    },
    () => import('./encoder-decoder/components/EncoderDecoder')
  );

  registerLazyComponentModule(
    {
      id: 'crypto-tool',
      name: '加密/解密',
      icon: React.createElement(AppIcon, { name: 'crypto' }),
      description: '支持AES、DES、3DES等多种加密算法的加密解密工具',
    },
    () => import('./crypto-tool/components/CryptoTool')
  );

  registerLazyComponentModule(
    {
      id: 'time-tool',
      name: '时间工具',
      icon: React.createElement(AppIcon, { name: 'time' }),
      description: '时间格式转换、时间戳获取、UTC与本地时间转换等功能',
    },
    () => import('./time-tool/components/TimeTool')
  );

  registerLazyComponentModule(
    {
      id: 'regex-tool',
      name: '正则工具',
      icon: React.createElement(AppIcon, { name: 'regex' }),
      description: '正则表达式测试、替换和分割工具',
    },
    () => import('./regex-tool/components/RegexTool')
  );

  registerLazyComponentModule(
    {
      id: 'code-formatter',
      name: '代码格式化',
      icon: React.createElement(AppIcon, { name: 'formatter' }),
      description: '支持多种语言的代码格式化和压缩工具',
    },
    () => import('./code-formatter/components/CodeFormatter')
  );

  registerLazyComponentModule(
    {
      id: 'qrcode-tool',
      name: '二维码工具',
      icon: React.createElement(AppIcon, { name: 'qrcode' }),
      description: '二维码生成与识别工具',
    },
    () => import('./qrcode-tool/components/QRCodeTool')
  );

  registerLazyComponentModule(
    {
      id: 'diff-tool',
      name: 'Diff Tool',
      icon: React.createElement(AppIcon, { name: 'diff' }),
      description: 'Compare text, code, or JSON files to find differences.',
    },
    () => import('./diff-tool/components/DiffTool')
  );

  registerLazyComponentModule(
    {
      id: 'http-debug',
      name: '网络调试',
      icon: React.createElement(AppIcon, { name: 'http' }),
      description: 'HTTP 接口调试与 WebSocket 调试工具',
    },
    () => import('./http-debug/components/HttpDebugTool')
  );

  registerLazyComponentModule(
    {
      id: 'ip-network',
      name: 'IP/网络工具',
      icon: React.createElement(AppIcon, { name: 'network' }),
      description: 'IP 地址转换、CIDR 计算、子网划分、归属地查询、端口速查',
    },
    () => import('./ip-network/components/IpNetworkTool')
  );

  registerLazyComponentModule(
    {
      id: 'recipe-tool',
      name: 'Recipe工具',
      icon: React.createElement(AppIcon, { name: 'recipe' }),
      description: '基于CyberChef设计理念的操作链式处理工具',
    },
    () => import('./recipe-tool/components/RecipeTool')
  );
}
