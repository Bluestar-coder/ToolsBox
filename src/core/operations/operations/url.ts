/**
 * URL编码操作实现示例
 */

import type { Operation, OperationParameter, OperationInput, OperationResult } from '../types';

// 图标组件将在运行时注入
const LinkOutlinedIcon = 'LinkOutlined';

/**
 * URL解码操作
 */
export class URLDecodeOperation implements Operation {
  id = 'url_decode';
  name = 'URL解码';
  description = '将URL编码的数据解码为原始文本';
  category = 'encoding' as const;
  icon = LinkOutlinedIcon;
  inputType = 'url';
  outputType = 'text';

  getParameters(): OperationParameter[] {
    return [
      {
        name: 'strict',
        type: 'boolean',
        defaultValue: false,
        description: '严格模式，拒绝非标准编码',
      },
    ];
  }

  async execute(input: OperationInput, params: Record<string, unknown>): Promise<OperationResult> {
    const startTime = Date.now();

    try {
      const strict = typeof params.strict === 'boolean' ? params.strict : false;

      // 解码URL
      let decodedData: string;
      if (strict) {
        // 严格模式，只解码标准编码
        decodedData = this.strictUrlDecode(input.data);
      } else {
        // 宽松模式，使用标准decodeURIComponent
        // 首先尝试解码，如果失败则尝试修复常见的编码问题
        decodedData = this.safeUrlDecode(input.data);
      }

      return {
        success: true,
        output: {
          data: decodedData,
          dataType: 'text',
        },
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        output: {
          data: '',
          dataType: 'text',
        },
        error: error instanceof Error ? error.message : '解码失败',
        executionTime: Date.now() - startTime,
      };
    }
  }

  validateInput(input: OperationInput): { valid: boolean; error?: string } {
    if (!input.data) {
      return { valid: false, error: '输入数据不能为空' };
    }

    return { valid: true };
  }

  /**
   * 严格URL解码
   */
  private strictUrlDecode(data: string): string {
    // 检查是否包含非法字符
    if (!/^[A-Za-z0-9\-_.~%!]*$/.test(data)) {
      throw new Error('包含非法的URL编码字符');
    }

    return decodeURIComponent(data);
  }

  /**
   * 安全URL解码（支持中文和特殊字符）
   */
  private safeUrlDecode(data: string): string {
    try {
      // 首先尝试标准解码
      return decodeURIComponent(data);
    } catch {
      // 如果失败，尝试修复常见的编码问题
      // 1. 处理 + 号（在 URL 编码中 + 表示空格）
      let fixed = data.replace(/\+/g, ' ');

      // 2. 处理未编码的 % 符号
      fixed = fixed.replace(/%(?![0-9A-Fa-f]{2})/g, '%25');

      // 3. 处理不完整的编码序列
      fixed = fixed.replace(/%([0-9A-Fa-f])(?![0-9A-Fa-f])/g, '%25$1');

      return decodeURIComponent(fixed);
    }
  }
}

/**
 * URL编码操作
 */
export class URLEncodeOperation implements Operation {
  id = 'url_encode';
  name = 'URL编码';
  description = '将文本编码为URL安全格式';
  category = 'encoding' as const;
  icon = LinkOutlinedIcon;
  inputType = 'text';
  outputType = 'url';

  getParameters(): OperationParameter[] {
    return [
      {
        name: 'component',
        type: 'select',
        defaultValue: 'full',
        options: [
          { label: '完整URL编码', value: 'full' },
          { label: '路径部分', value: 'path' },
          { label: '查询参数', value: 'query' },
          { label: '表单数据', value: 'form' },
        ],
        description: '编码部分',
      },
    ];
  }

  async execute(input: OperationInput, params: Record<string, unknown>): Promise<OperationResult> {
    const startTime = Date.now();
    
    try {
      const component = typeof params.component === 'string' ? params.component : 'full';
      
      // 根据组件类型选择编码方法
      let encodedData: string;
      switch (component) {
        case 'full':
          encodedData = encodeURIComponent(input.data);
          break;
        case 'path':
          encodedData = this.encodePath(input.data);
          break;
        case 'query':
          encodedData = this.encodeQuery(input.data);
          break;
        case 'form':
          encodedData = this.encodeForm(input.data);
          break;
        default:
          encodedData = encodeURIComponent(input.data);
      }
      
      return {
        success: true,
        output: {
          data: encodedData,
          dataType: 'url',
        },
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        output: {
          data: '',
          dataType: 'url',
        },
        error: error instanceof Error ? error.message : '编码失败',
        executionTime: Date.now() - startTime,
      };
    }
  }

  validateInput(input: OperationInput): { valid: boolean; error?: string } {
    if (!input.data && input.data !== '') {
      return { valid: false, error: '输入数据不能为null或undefined' };
    }

    return { valid: true };
  }

  /**
   * 路径编码
   */
  private encodePath(data: string): string {
    // 路径部分不编码 / 字符
    return data.split('/').map(segment => encodeURIComponent(segment)).join('/');
  }

  /**
   * 查询参数编码
   */
  private encodeQuery(data: string): string {
    // 查询参数不编码 = & 字符
    return data.replace(/([^=&]+)=([^=&]*)/g, (match, key, value) => {
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    });
  }

  /**
   * 表单数据编码
   */
  private encodeForm(data: string): string {
    // application/x-www-form-urlencoded: 编码键值内容并将空格替换为 +
    return data
      .split('&')
      .map(pair => {
        const separatorIndex = pair.indexOf('=');
        if (separatorIndex < 0) {
          return this.encodeFormComponent(pair);
        }

        const key = pair.slice(0, separatorIndex);
        const value = pair.slice(separatorIndex + 1);
        return `${this.encodeFormComponent(key)}=${this.encodeFormComponent(value)}`;
      })
      .join('&');
  }

  private encodeFormComponent(value: string): string {
    return encodeURIComponent(value).replace(/%20/g, '+');
  }
}
