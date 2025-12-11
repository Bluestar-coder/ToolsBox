// 插件类型定义

import React from 'react';

// 插件配置类型
export interface PluginConfig {
  name: string;               // 插件名称
  version: string;            // 插件版本
  description: string;        // 插件描述
  author: string;             // 插件作者
  icon?: React.ReactNode;      // 插件图标
  entryPoint: string;         // 插件入口点
  permissions: string[];       // 插件权限
  dependencies?: string[];     // 插件依赖
}

// 插件元数据类型
export interface PluginMetadata {
  id: string;                 // 插件唯一标识符
  config: PluginConfig;        // 插件配置
  status: 'enabled' | 'disabled' | 'error'; // 插件状态
  error?: string;             // 插件错误信息（如果有）
  instance?: Plugin;          // 插件实例
}

// 插件接口
export interface Plugin {
  initialize: () => Promise<void>; // 插件初始化
  destroy: () => Promise<void>;    // 插件销毁
  registerModules?: () => void;    // 注册模块
  unregisterModules?: () => void;  // 注销模块
}

// 插件加载结果类型
export interface PluginLoadResult {
  success: boolean;
  plugin?: PluginMetadata;
  error?: string;
}

// 插件管理器事件类型
export type PluginEvent = 
  | { type: 'PLUGIN_LOADED'; plugin: PluginMetadata }
  | { type: 'PLUGIN_ENABLED'; plugin: PluginMetadata }
  | { type: 'PLUGIN_DISABLED'; plugin: PluginMetadata }
  | { type: 'PLUGIN_UNLOADED'; pluginId: string }
  | { type: 'PLUGIN_ERROR'; plugin: PluginMetadata; error: string };