/**
 * 插件管理器接口
 *
 * 用于解耦PluginContext与具体PluginManager实现的依赖
 * 便于测试和替换不同的插件管理器实现
 */

import type { PluginConfig, PluginLoadResult, PluginMetadata } from './types';

/**
 * 插件状态枚举
 */
export const PluginStatus = {
  LOADED: 'loaded',
  ENABLED: 'enabled',
  DISABLED: 'disabled',
  UNLOADED: 'unloaded',
  ERROR: 'error',
} as const;

export type PluginStatus = typeof PluginStatus[keyof typeof PluginStatus];

/**
 * 插件信息接口
 */
export interface PluginInfo {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  status: PluginStatus;
  metadata: PluginMetadata;
}

/**
 * 插件事件接口
 */
export interface IPluginEvent {
  type: string;
  pluginId?: string;
  metadata?: PluginMetadata;
  error?: string;
  timestamp: number;
}

/**
 * 插件事件监听器类型
 */
export type PluginEventListener = (event: IPluginEvent) => void;

/**
 * 插件管理器接口
 */
export interface IPluginManager {
  /**
   * 加载插件
   * @param pluginConfig 插件配置
   * @returns 加载结果
   */
  loadPlugin(pluginConfig: PluginConfig): Promise<PluginLoadResult>;

  /**
   * 启用插件
   * @param pluginId 插件ID
   * @returns 是否成功
   */
  enablePlugin(pluginId: string): Promise<boolean>;

  /**
   * 禁用插件
   * @param pluginId 插件ID
   * @returns 是否成功
   */
  disablePlugin(pluginId: string): Promise<boolean>;

  /**
   * 卸载插件
   * @param pluginId 插件ID
   * @returns 是否成功
   */
  unloadPlugin(pluginId: string): Promise<boolean>;

  /**
   * 获取所有插件
   * @returns 插件列表
   */
  getPlugins(): PluginMetadata[];

  /**
   * 根据ID获取插件
   * @param pluginId 插件ID
   * @returns 插件元数据或undefined
   */
  getPlugin(pluginId: string): PluginMetadata | undefined;

  /**
   * 注册事件监听器
   * @param listener 事件监听器
   */
  onEvent(listener: PluginEventListener): void;

  /**
   * 取消事件监听器
   * @param listener 事件监听器
   */
  offEvent(listener: PluginEventListener): void;

  /**
   * 获取插件状态
   * @param pluginId 插件ID
   * @returns 插件状态
   */
  getPluginStatus(pluginId: string): PluginStatus;

  /**
   * 获取所有插件信息
   * @returns 插件信息列表
   */
  getAllPluginInfo(): PluginInfo[];

  /**
   * 清理所有插件
   */
  cleanup(): Promise<void>;
}
