import { useState, useEffect } from 'react';
import { moduleManager } from '../modules';
import type { LazyModuleList } from '../modules';

/**
 * 获取懒加载模块列表的 Hook
 * 自动订阅 ModuleManager 的更新
 */
export const useModules = (): LazyModuleList => {
  const [modules, setModules] = useState<LazyModuleList>(moduleManager.getLazyModules());

  useEffect(() => {
    // 初始设置，确保在组件挂载时获取最新状态
    setModules(moduleManager.getLazyModules());

    // 订阅更新
    const unsubscribe = moduleManager.subscribe(() => {
      setModules(moduleManager.getLazyModules());
    });

    return unsubscribe;
  }, []);

  return modules;
};
