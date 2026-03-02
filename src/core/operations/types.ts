/**
 * 操作链系统核心类型定义
 * 基于CyberChef设计理念实现
 */

// 操作参数定义
export interface OperationParameter {
  /** 参数名称 */
  name: string;
  /** 参数类型 */
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect';
  /** 默认值 */
  defaultValue: unknown;
  /** 可选值列表（用于select/multiselect类型） */
  options?: Array<{ label: string; value: unknown }>;
  /** 是否必需 */
  required?: boolean;
  /** 参数描述 */
  description?: string;
}

// 操作输入类型
export interface OperationInput {
  /** 输入数据 */
  data: string;
  /** 数据类型 */
  dataType: string;
  /** 元数据 */
  metadata?: Record<string, unknown>;
}

// 操作输出类型
export interface OperationOutput {
  /** 输出数据 */
  data: string;
  /** 数据类型 */
  dataType: string;
  /** 元数据 */
  metadata?: Record<string, unknown>;
}

// 操作执行结果
export interface OperationResult {
  /** 是否成功 */
  success: boolean;
  /** 输出数据 */
  output: OperationOutput;
  /** 错误信息 */
  error?: string;
  /** 执行时间（毫秒） */
  executionTime?: number;
}

// 操作接口
export interface Operation {
  /** 操作唯一标识 */
  id: string;
  /** 操作名称 */
  name: string;
  /** 操作描述 */
  description: string;
  /** 操作分类 */
  category: OperationCategory;
  /** 操作图标 */
  icon?: React.ReactNode;
  /** 输入数据类型 */
  inputType: string;
  /** 输出数据类型 */
  outputType: string;
  /** 操作参数定义 */
  getParameters(): OperationParameter[];
  /** 执行操作 */
  execute(input: OperationInput, params: Record<string, unknown>): Promise<OperationResult>;
  /** 验证输入 */
  validateInput(input: OperationInput): ValidationResult;
}

// 操作分类
export type OperationCategory = 
  | 'encoding'        // 编码/解码
  | 'encryption'      // 加密/解密
  | 'hashing'         // 哈希计算
  | 'compression'     // 压缩/解压
  | 'data'            // 数据格式
  | 'network'         // 网络协议
  | 'time'            // 时间处理
  | 'analysis'        // 数据分析
  | 'binary'          // 二进制处理
  | 'utility';        // 实用工具

// 验证结果
export interface ValidationResult {
  /** 是否有效 */
  valid: boolean;
  /** 错误信息 */
  error?: string;
}

// 操作步骤（Recipe中的单个操作）
export interface OperationStep {
  /** 操作实例 */
  operation: Operation;
  /** 操作参数 */
  params: Record<string, unknown>;
  /** 是否启用 */
  enabled: boolean;
  /** 步骤ID */
  id: string;
  /** 是否为断点 */
  isBreakpoint?: boolean;
}

// 操作链（Recipe）
export interface Recipe {
  /** Recipe唯一标识 */
  id: string;
  /** Recipe名称 */
  name: string;
  /** Recipe描述 */
  description?: string;
  /** 操作步骤列表 */
  steps: OperationStep[];
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

// Recipe执行结果
export interface RecipeExecutionResult {
  /** 是否完成 */
  isComplete: boolean;
  /** 是否在断点处停止 */
  isBreakpoint?: boolean;
  /** 当前数据 */
  data: string;
  /** 当前数据类型 */
  dataType: string;
  /** 每个步骤的执行结果 */
  stepResults: StepResult[];
  /** 下一个步骤（如果在断点处停止） */
  nextStep?: OperationStep;
  /** 总执行时间 */
  totalExecutionTime?: number;
}

// 单个步骤的执行结果
export interface StepResult {
  /** 操作步骤 */
  step: OperationStep;
  /** 输入数据 */
  input: OperationInput;
  /** 输出数据 */
  output?: OperationOutput;
  /** 是否成功 */
  success: boolean;
  /** 错误信息 */
  error?: string;
  /** 执行时间 */
  executionTime?: number;
}

// 数据类型检测结果
export interface DataTypeDetection {
  /** 数据类型 */
  type: string;
  /** 置信度（0-1） */
  confidence: number;
  /** 描述 */
  description?: string;
  /** 建议的操作 */
  suggestedOperations?: string[];
}

// 操作注册表项
export interface OperationRegistryItem {
  /** 操作实例 */
  operation: Operation;
  /** 注册时间 */
  registeredAt: Date;
  /** 是否启用 */
  enabled: boolean;
}
