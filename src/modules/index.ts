import React from 'react';

// 模块接口定义
export interface ToolModule {
  id: string;               // 模块唯一标识
  name: string;             // 模块名称
  icon: React.ReactNode;    // 模块图标
  component: React.FC;      // 模块主组件
  description?: string;     // 模块描述
}

// 模块列表类型
export type ModuleList = ToolModule[];

// 模块管理类
class ModuleManager {
  private modules: Map<string, ToolModule> = new Map();

  /**
   * 注册模块
   * @param module 要注册的模块
   */
  registerModule(module: ToolModule): void {
    this.modules.set(module.id, module);
  }

  /**
   * 获取所有注册的模块
   * @returns 模块列表
   */
  getModules(): ModuleList {
    return Array.from(this.modules.values());
  }

  /**
   * 根据ID获取模块
   * @param id 模块ID
   * @returns 模块或undefined
   */
  getModuleById(id: string): ToolModule | undefined {
    return this.modules.get(id);
  }
}

// 创建模块管理器实例
export const moduleManager = new ModuleManager();

// 导入并注册编码/解码模块
import EncoderDecoderModule from './encoder-decoder';
moduleManager.registerModule(EncoderDecoderModule);

// 导入并注册时间处理工具模块
import TimeToolModule from './time-tool';
moduleManager.registerModule(TimeToolModule);

// 导入并注册加密/解密工具模块
import CryptoToolModule from './crypto-tool';
moduleManager.registerModule(CryptoToolModule);

// 导入并注册代码格式化模块
import CodeFormatterModule from './code-formatter';
moduleManager.registerModule(CodeFormatterModule);

// 导入并注册正则表达式工具模块
import RegexToolModule from './regex-tool';
moduleManager.registerModule(RegexToolModule);

// 导入并注册二维码工具模块
import QRCodeToolModule from './qrcode-tool';
moduleManager.registerModule(QRCodeToolModule);
