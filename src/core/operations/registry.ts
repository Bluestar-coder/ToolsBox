/**
 * 操作注册系统
 * 管理所有可用的操作
 */

import type { Operation, OperationCategory, OperationRegistryItem } from './types';

/**
 * 操作注册表类
 */
class OperationRegistry {
  private operations = new Map<string, OperationRegistryItem>();
  private categoryMap = new Map<OperationCategory, Operation[]>();
  private listeners: Set<() => void> = new Set();

  /**
   * 注册操作
   * @param operation 要注册的操作
   */
  register(operation: Operation): void {
    const item: OperationRegistryItem = {
      operation,
      registeredAt: new Date(),
      enabled: true,
    };

    this.operations.set(operation.id, item);
    this.updateCategoryMap(operation);
    this.notifyListeners();
  }

  /**
   * 注销操作
   * @param operationId 操作ID
   */
  unregister(operationId: string): void {
    const item = this.operations.get(operationId);
    if (item) {
      this.operations.delete(operationId);
      this.updateCategoryMap(item.operation, true);
      this.notifyListeners();
    }
  }

  /**
   * 获取操作
   * @param operationId 操作ID
   * @returns 操作实例或undefined
   */
  get(operationId: string): Operation | undefined {
    const item = this.operations.get(operationId);
    return item?.enabled ? item.operation : undefined;
  }

  /**
   * 获取所有操作
   * @returns 所有已启用的操作
   */
  getAll(): Operation[] {
    return Array.from(this.operations.values())
      .filter(item => item.enabled)
      .map(item => item.operation);
  }

  /**
   * 按分类获取操作
   * @param category 操作分类
   * @returns 该分类下的所有操作
   */
  getByCategory(category: OperationCategory): Operation[] {
    const operations = this.categoryMap.get(category) || [];
    return operations.filter(op => {
      const item = this.operations.get(op.id);
      return item?.enabled;
    });
  }

  /**
   * 搜索操作
   * @param query 搜索关键词
   * @returns 匹配的操作列表
   */
  search(query: string): Operation[] {
    const lowerQuery = query.toLowerCase();
    return this.getAll().filter(operation => 
      operation.name.toLowerCase().includes(lowerQuery) ||
      operation.description.toLowerCase().includes(lowerQuery) ||
      operation.id.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * 启用/禁用操作
   * @param operationId 操作ID
   * @param enabled 是否启用
   */
  setEnabled(operationId: string, enabled: boolean): void {
    const item = this.operations.get(operationId);
    if (item && item.enabled !== enabled) {
      item.enabled = enabled;
      this.updateCategoryMap(item.operation, !enabled);
      this.notifyListeners();
    }
  }

  /**
   * 订阅操作变更
   * @param listener 监听函数
   * @returns 取消订阅函数
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 通知所有监听者
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  /**
   * 更新分类映射
   * @param operation 操作实例
   * @param remove 是否移除
   */
  private updateCategoryMap(operation: Operation, remove = false): void {
    const category = operation.category;
    let operations = this.categoryMap.get(category);
    
    if (!operations) {
      operations = [];
      this.categoryMap.set(category, operations);
    }

    if (remove) {
      const index = operations.findIndex(op => op.id === operation.id);
      if (index !== -1) {
        operations.splice(index, 1);
      }
    } else {
      if (!operations.find(op => op.id === operation.id)) {
        operations.push(operation);
      }
    }
  }

  /**
   * 获取所有分类
   * @returns 所有操作分类
   */
  getCategories(): OperationCategory[] {
    return Array.from(this.categoryMap.keys());
  }

  /**
   * 清空所有操作
   */
  clear(): void {
    this.operations.clear();
    this.categoryMap.clear();
    this.notifyListeners();
  }
}

// 创建全局操作注册表实例
export const operationRegistry = new OperationRegistry();

/**
 * 操作装饰器，用于自动注册操作
 * @param category 操作分类
 */
export function RegisterOperation(_category: OperationCategory) {
  void _category;
  return function<T extends new (...args: unknown[]) => Operation>(constructor: T) {
    const instance = new constructor();
    operationRegistry.register(instance);
    return constructor;
  };
}
