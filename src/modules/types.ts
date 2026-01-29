/**
 * 模块元数据类型定义
 */
import type { ComponentType } from 'react';

/**
 * 模块元数据接口
 */
export interface ModuleMetadata {
  /** 模块唯一标识 */
  id: string;
  /** 模块名称（中文） */
  name: string;
  /** 路由路径 */
  routePath: string;
  /** 模块图标 */
  icon?: ComponentType;
  /** 懒加载组件 */
  component: () => Promise<{ default: ComponentType }>;
  /** 支持的子类型 */
  subTypes?: string[];
  /** 模块描述 */
  description?: string;
  /** 模块分类 */
  category?: 'converter' | 'generator' | 'analyzer' | 'other';
  /** 是否启用 */
  enabled?: boolean;
}

/**
 * 模块注册表类型
 */
export type ModuleRegistry = Record<string, ModuleMetadata>;
