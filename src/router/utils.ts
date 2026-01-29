import React, { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import type { ModuleMetadata } from '../modules/types';
import ModuleLoader from '../components/ModuleLoader';

const lazyCache = new Map<ModuleMetadata['component'], React.LazyExoticComponent<React.ComponentType>>();

export function getLazyComponent(
  componentLoader: ModuleMetadata['component']
): React.LazyExoticComponent<React.ComponentType> {
  let Component = lazyCache.get(componentLoader);
  if (!Component) {
    Component = lazy(componentLoader);
    lazyCache.set(componentLoader, Component);
  }
  return Component;
}

export function createModuleElement(
  componentLoader: ModuleMetadata['component']
): React.ReactElement {
  const Component = getLazyComponent(componentLoader);
  return React.createElement(ModuleLoader, { Component });
}

/**
 * 从模块元数据生成路由对象
 */
export function createRouteFromModule(metadata: ModuleMetadata): RouteObject {
  return {
    path: metadata.routePath,
    element: createModuleElement(metadata.component),
  };
}
