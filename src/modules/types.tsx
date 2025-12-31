/**
 * 模块元数据类型定义
 */

import React from 'react';
import type { ComponentType } from 'react';
import type { RouteObject } from 'react-router-dom';

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

/**
 * 从模块元数据生成路由对象
 */
export function createRouteFromModule(metadata: ModuleMetadata): RouteObject {
  return {
    path: metadata.routePath,
    element: React.createElement(ModuleLoader, { metadata }),
  };
}

/**
 * 模块加载器组件
 */
function ModuleLoader({ metadata }: { metadata: ModuleMetadata }) {
  const Component = React.lazy(metadata.component);
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <Component />
    </React.Suspense>
  );
}
