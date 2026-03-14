import React from 'react';
import { AppIcon } from '../components/icons/AppIcon';
import { toolModules, toolModulesById } from './catalog';
import type { LazyModuleList } from './index';

export interface DisplayModule {
  id: string;
  name: string;
  icon: React.ReactNode;
  description?: string;
  i18nKey?: string;
}

export function resolveDisplayModules(modules: LazyModuleList): DisplayModule[] {
  const modulesMap = new Map(modules.map((module) => [module.id, module]));
  const coreModules = toolModules.map((definition) => {
    const module = modulesMap.get(definition.id);
    return {
      id: definition.id,
      name: module?.name ?? definition.fallbackTitle,
      icon: module?.icon ?? React.createElement(AppIcon, { name: definition.iconName }),
      description: module?.description ?? definition.fallbackDescription,
      i18nKey: definition.i18nKey,
    };
  });
  const pluginModules = modules
    .filter((module) => !(module.id in toolModulesById))
    .map((module) => ({
      id: module.id,
      name: module.name,
      icon: module.icon,
      description: module.description,
      i18nKey: undefined,
    }));

  return [...coreModules, ...pluginModules];
}
