/**
 * 操作系统初始化文件
 * 在应用启动时注册所有操作
 */

import { registerAllOperations } from './operations';

/**
 * 初始化操作系统
 */
export function initializeOperations(): void {
  // 注册所有操作
  registerAllOperations();
  
  // TODO: 可以在这里添加更多初始化逻辑
  // 例如：从本地存储加载自定义操作、注册插件等
}

// 导出初始化函数，供应用启动时调用
export default initializeOperations;