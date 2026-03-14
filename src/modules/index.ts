import type { ComponentType, LazyExoticComponent, ReactNode } from 'react';

// 模块接口定义
export interface ToolModule {
  id: string;               // 模块唯一标识
  name: string;             // 模块名称
  icon: ReactNode;          // 模块图标
  component: ComponentType<Record<string, unknown>>;  // 模块主组件
  description?: string;     // 模块描述
}

// 懒加载模块接口
export interface LazyToolModule {
  id: string;
  name: string;
  icon: ReactNode;
  component: LazyExoticComponent<ComponentType<Record<string, unknown>>>;
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
