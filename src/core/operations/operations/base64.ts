/**
 * Base64操作实现示例
 */

import type { Operation, OperationParameter, OperationInput, OperationResult } from '../types';

// 图标组件将在运行时注入
const Base64OutlinedIcon = 'CodeOutlined';

/**
 * Base64解码操作
 */
export class Base64DecodeOperation implements Operation {
  id = 'base64_decode';
  name = 'Base64解码';
  description = '将Base64编码的数据解码为原始文本';
  category = 'encoding' as const;
  icon = Base64OutlinedIcon;
  inputType = 'base64';
  outputType = 'text';

  getParameters(): OperationParameter[] {
    return [
      {
        name: 'charset',
        type: 'select',
        defaultValue: 'utf-8',
        options: [
          { label: 'UTF-8', value: 'utf-8' },
          { label: 'UTF-16', value: 'utf-16' },
          { label: 'ISO-8859-1', value: 'iso-8859-1' },
        ],
        description: '输出字符编码',
      },
    ];
  }

  async execute(input: OperationInput, params: Record<string, unknown>): Promise<OperationResult> {
    const startTime = Date.now();
    
    try {
      const charset = typeof params.charset === 'string' ? params.charset : 'utf-8';
      
      // 检查输入是否为有效的Base64
      if (!this.isValidBase64(input.data)) {
        return {
          success: false,
          output: {
            data: '',
            dataType: 'text',
          },
          error: '无效的Base64数据',
          executionTime: Date.now() - startTime,
        };
      }

      // 解码Base64
      const decodedData = this.base64Decode(input.data, charset);
      
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

    if (!this.isValidBase64(input.data)) {
      return { valid: false, error: '无效的Base64数据' };
    }

    return { valid: true };
  }

  /**
   * 检查是否是有效的Base64
   */
  private isValidBase64(data: string): boolean {
    try {
      return btoa(atob(data)) === data;
    } catch {
      return false;
    }
  }

  /**
   * Base64解码（支持UTF-8中文）
   */
  private base64Decode(data: string, charset: string): string {
    // 使用支持UTF-8的解码方法
    const binaryString = atob(data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new TextDecoder(charset).decode(bytes);
  }
}

/**
 * Base64编码操作
 */
export class Base64EncodeOperation implements Operation {
  id = 'base64_encode';
  name = 'Base64编码';
  description = '将文本编码为Base64格式';
  category = 'encoding' as const;
  icon = Base64OutlinedIcon;
  inputType = 'text';
  outputType = 'base64';

  getParameters(): OperationParameter[] {
    return [
      {
        name: 'charset',
        type: 'select',
        defaultValue: 'utf-8',
        options: [
          { label: 'UTF-8', value: 'utf-8' },
          { label: 'UTF-16', value: 'utf-16' },
          { label: 'ISO-8859-1', value: 'iso-8859-1' },
        ],
        description: '输入字符编码',
      },
    ];
  }

  async execute(input: OperationInput, params: Record<string, unknown>): Promise<OperationResult> {
    const startTime = Date.now();
    
    try {
      const charset = typeof params.charset === 'string' ? params.charset : 'utf-8';

      // 编码为Base64
      const encodedData = this.base64Encode(input.data, charset);
      
      return {
        success: true,
        output: {
          data: encodedData,
          dataType: 'base64',
        },
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        output: {
          data: '',
          dataType: 'base64',
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
   * Base64编码（按指定字符编码输入）
   */
  private base64Encode(data: string, charset: string): string {
    const bytes = this.encodeToBytes(data, charset);
    let binaryString = '';
    for (let i = 0; i < bytes.length; i++) {
      binaryString += String.fromCharCode(bytes[i]);
    }
    return btoa(binaryString);
  }

  private encodeToBytes(data: string, charset: string): Uint8Array {
    const normalizedCharset = charset.toLowerCase();

    if (normalizedCharset === 'utf-8' || normalizedCharset === 'utf8') {
      return new TextEncoder().encode(data);
    }

    if (normalizedCharset === 'utf-16' || normalizedCharset === 'utf-16le' || normalizedCharset === 'utf16') {
      const bytes = new Uint8Array(data.length * 2);
      for (let i = 0; i < data.length; i++) {
        const code = data.charCodeAt(i);
        bytes[i * 2] = code & 0xff;
        bytes[i * 2 + 1] = code >>> 8;
      }
      return bytes;
    }

    if (normalizedCharset === 'iso-8859-1' || normalizedCharset === 'iso8859-1' || normalizedCharset === 'latin1') {
      const bytes = new Uint8Array(data.length);
      for (let i = 0; i < data.length; i++) {
        const code = data.charCodeAt(i);
        if (code > 0xff) {
          throw new Error('ISO-8859-1 不支持超过 0xFF 的字符');
        }
        bytes[i] = code;
      }
      return bytes;
    }

    throw new Error(`不支持的字符编码: ${charset}`);
  }
}
