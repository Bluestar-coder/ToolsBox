// 插件管理器

import type { Plugin, PluginConfig, PluginMetadata, PluginLoadResult, PluginEvent } from './types';

class PluginManager {
  private plugins: Map<string, PluginMetadata> = new Map();
  private eventListeners: Array<(event: PluginEvent) => void> = [];
  private pluginRegistry: Map<string, Plugin> = new Map();

  /**
   * 加载插件
   * @param pluginConfig 插件配置
   * @returns 加载结果
   */
  async loadPlugin(pluginConfig: PluginConfig): Promise<PluginLoadResult> {
    try {
      const pluginId = `${pluginConfig.name}-${pluginConfig.version}`;
      
      // 检查插件是否已加载
      if (this.plugins.has(pluginId)) {
        return { success: false, error: '插件已加载' };
      }

      // 创建插件元数据
      const metadata: PluginMetadata = {
        id: pluginId,
        config: pluginConfig,
        status: 'disabled',
      };

      // 添加到插件列表
      this.plugins.set(pluginId, metadata);

      // 尝试加载插件入口点
      try {
        // 这里使用动态导入，实际实现需要根据entryPoint的类型进行不同处理
        // 对于本地插件，可以直接导入
        // 对于远程插件，需要先下载，然后使用URL.createObjectURL创建本地URL
        const pluginModule = await import(/* @vite-ignore */ pluginConfig.entryPoint);
        const pluginInstance: Plugin = new pluginModule.default();
        
        // 初始化插件
        await pluginInstance.initialize();
        metadata.instance = pluginInstance;
        metadata.status = 'enabled';
        this.pluginRegistry.set(pluginId, pluginInstance);

        // 如果插件有注册模块的方法，调用它
        if (pluginInstance.registerModules) {
          pluginInstance.registerModules();
        }

        // 触发插件加载事件
        this.emitEvent({ type: 'PLUGIN_LOADED', plugin: metadata });
        this.emitEvent({ type: 'PLUGIN_ENABLED', plugin: metadata });

        return { success: true, plugin: metadata };
      } catch (error) {
        metadata.status = 'error';
        metadata.error = error instanceof Error ? error.message : '加载插件失败';
        this.emitEvent({ 
          type: 'PLUGIN_ERROR', 
          plugin: metadata, 
          error: metadata.error 
        });
        return { success: false, error: metadata.error };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '加载插件时发生未知错误' 
      };
    }
  }

  /**
   * 启用插件
   * @param pluginId 插件ID
   * @returns 是否成功
   */
  async enablePlugin(pluginId: string): Promise<boolean> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return false;

    try {
      // 如果插件未初始化，先初始化
      if (!plugin.instance) {
        const pluginModule = await import(/* @vite-ignore */ plugin.config.entryPoint);
        const pluginInstance: Plugin = new pluginModule.default();
        await pluginInstance.initialize();
        plugin.instance = pluginInstance;
        this.pluginRegistry.set(pluginId, pluginInstance);
      }

      // 调用注册模块方法（如果有）
      if (plugin.instance.registerModules) {
        plugin.instance.registerModules();
      }

      plugin.status = 'enabled';
      this.emitEvent({ type: 'PLUGIN_ENABLED', plugin });
      return true;
    } catch (error) {
      plugin.status = 'error';
      plugin.error = error instanceof Error ? error.message : '启用插件失败';
      this.emitEvent({ 
        type: 'PLUGIN_ERROR', 
        plugin, 
        error: plugin.error 
      });
      return false;
    }
  }

  /**
   * 禁用插件
   * @param pluginId 插件ID
   * @returns 是否成功
   */
  async disablePlugin(pluginId: string): Promise<boolean> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return false;

    try {
      // 调用注销模块方法（如果有）
      if (plugin.instance?.unregisterModules) {
        plugin.instance.unregisterModules();
      }

      plugin.status = 'disabled';
      this.emitEvent({ type: 'PLUGIN_DISABLED', plugin });
      return true;
    } catch (error) {
      plugin.status = 'error';
      plugin.error = error instanceof Error ? error.message : '禁用插件失败';
      this.emitEvent({ 
        type: 'PLUGIN_ERROR', 
        plugin, 
        error: plugin.error 
      });
      return false;
    }
  }

  /**
   * 卸载插件
   * @param pluginId 插件ID
   * @returns 是否成功
   */
  async unloadPlugin(pluginId: string): Promise<boolean> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return false;

    try {
      // 调用注销模块方法（如果有）
      if (plugin.instance?.unregisterModules) {
        plugin.instance.unregisterModules();
      }

      // 销毁插件
      if (plugin.instance?.destroy) {
        await plugin.instance.destroy();
      }

      // 从注册表中移除
      this.plugins.delete(pluginId);
      this.pluginRegistry.delete(pluginId);

      // 触发插件卸载事件
      this.emitEvent({ type: 'PLUGIN_UNLOADED', pluginId });
      return true;
    } catch (error) {
      plugin.status = 'error';
      plugin.error = error instanceof Error ? error.message : '卸载插件失败';
      this.emitEvent({ 
        type: 'PLUGIN_ERROR', 
        plugin, 
        error: plugin.error 
      });
      return false;
    }
  }

  /**
   * 获取所有插件
   * @returns 插件列表
   */
  getPlugins(): PluginMetadata[] {
    return Array.from(this.plugins.values());
  }

  /**
   * 根据ID获取插件
   * @param pluginId 插件ID
   * @returns 插件或undefined
   */
  getPluginById(pluginId: string): PluginMetadata | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * 注册事件监听器
   * @param listener 事件监听器
   */
  onEvent(listener: (event: PluginEvent) => void): void {
    this.eventListeners.push(listener);
  }

  /**
   * 移除事件监听器
   * @param listener 事件监听器
   */
  offEvent(listener: (event: PluginEvent) => void): void {
    this.eventListeners = this.eventListeners.filter(l => l !== listener);
  }

  /**
   * 触发事件
   * @param event 事件对象
   */
  private emitEvent(event: PluginEvent): void {
    this.eventListeners.forEach(listener => listener(event));
  }

  /**
   * 检查插件是否已加载
   * @param pluginId 插件ID
   * @returns 是否已加载
   */
  isPluginLoaded(pluginId: string): boolean {
    return this.plugins.has(pluginId);
  }

  /**
   * 检查插件是否已启用
   * @param pluginId 插件ID
   * @returns 是否已启用
   */
  isPluginEnabled(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId);
    return plugin?.status === 'enabled';
  }
}

// 创建插件管理器实例
export const pluginManager = new PluginManager();

export default PluginManager;
