/**
 * 路由自动生成工具
 *
 * 用于从模块元数据自动生成路由配置
 */

import React, { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import type { ModuleMetadata } from '../modules/types';
import ModuleLoader from '../components/ModuleLoader';
import { createModuleElement, getLazyComponent } from './utils';

/**
 * 从模块元数据列表生成路由配置
 *
 * @param modules 模块元数据列表
 * @returns 路由配置对象数组
 *
 * @example
 * ```tsx
 * import { moduleMetadata as encoderMetadata } from '../modules/encoder-decoder/meta';
 * import { moduleMetadata as cryptoMetadata } from '../modules/crypto-tool/meta';
 *
 * const routes = generateRoutes([
 *   encoderMetadata,
 *   cryptoMetadata,
 * ]);
 * ```
 */
export function generateRoutes(modules: ModuleMetadata[]): RouteObject[] {
  return modules.flatMap(meta => {
    const routes: RouteObject[] = [];

    // 主路由
    routes.push({
      path: meta.routePath,
      element: createModuleElement(meta.component),
    });

    // 带子类型的路由
    if (meta.subTypes && meta.subTypes.length > 0) {
      routes.push({
        path: `${meta.routePath}/:type`,
        element: createModuleElement(meta.component),
      });
    }

    return routes;
  });
}

/**
 * 生成完整的路由配置（包含布局和404）
 */
export function generateCompleteRoutes(
  modules: ModuleMetadata[],
  mainLayout: () => Promise<{ default: React.ComponentType }>
): RouteObject[] {
  const MainLayout = lazy(mainLayout);
  const firstModulePath = modules.length > 0 ? modules[0].routePath : 'encoder';

  return [
    {
      path: '/',
      element: React.createElement(MainLayout),
      children: [
        {
          index: true,
          element: React.createElement(Navigate, { to: `/${firstModulePath}`, replace: true }),
        },
        ...generateRoutes(modules),
        {
          path: '*',
          element: React.createElement(Navigate, { to: `/${firstModulePath}`, replace: true }),
        },
      ],
    },
  ];
}

/**
 * 手动注册模块路由（用于不使用元数据的场景）
 */
export function createManualRoute(
  path: string,
  componentLoader: () => Promise<{ default: React.ComponentType }>,
  withParam = false
): RouteObject[] {
  const Component = getLazyComponent(componentLoader);
  const routes: RouteObject[] = [
    {
      path,
      element: React.createElement(ModuleLoader, { Component }),
    },
  ];

  if (withParam) {
    routes.push({
      path: `${path}/:type`,
      element: React.createElement(ModuleLoader, { Component }),
    });
  }

  return routes;
}
