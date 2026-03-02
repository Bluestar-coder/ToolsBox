import type {
  Operation,
  OperationCategory,
  OperationInput,
  OperationParameter,
  OperationResult,
} from '../types';
import type { EncoderType, OperationType } from '../../../modules/encoder-decoder/utils/encoders/common';

interface LazyEncodingOperationConfig {
  id: string;
  name: string;
  description: string;
  encoderType: EncoderType;
  mode: OperationType;
  inputType: string;
  outputType: string;
  category?: OperationCategory;
  icon?: string;
}

class LazyEncodingOperation implements Operation {
  id: string;
  name: string;
  description: string;
  category: OperationCategory;
  icon?: string;
  inputType: string;
  outputType: string;
  private encoderType: EncoderType;
  private mode: OperationType;

  constructor(config: LazyEncodingOperationConfig) {
    this.id = config.id;
    this.name = config.name;
    this.description = config.description;
    this.category = config.category ?? 'encoding';
    this.icon = config.icon ?? 'CodeOutlined';
    this.inputType = config.inputType;
    this.outputType = config.outputType;
    this.encoderType = config.encoderType;
    this.mode = config.mode;
  }

  getParameters(): OperationParameter[] {
    return [];
  }

  async execute(input: OperationInput): Promise<OperationResult> {
    const startTime = Date.now();

    try {
      const { executeEncodeDecode } = await import('../../../modules/encoder-decoder/utils/encoders/text-encoders');
      const result = executeEncodeDecode(input.data, this.encoderType, this.mode);

      if (!result.success) {
        return {
          success: false,
          output: {
            data: '',
            dataType: this.outputType,
          },
          error: result.error ?? `${this.name}失败`,
          executionTime: Date.now() - startTime,
        };
      }

      return {
        success: true,
        output: {
          data: result.result,
          dataType: this.outputType,
        },
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        output: {
          data: '',
          dataType: this.outputType,
        },
        error: error instanceof Error ? error.message : `${this.name}失败`,
        executionTime: Date.now() - startTime,
      };
    }
  }

  validateInput(input: OperationInput): { valid: boolean; error?: string } {
    if (input.data === null || input.data === undefined) {
      return { valid: false, error: '输入数据不能为null或undefined' };
    }
    return { valid: true };
  }
}

class BinaryEncodeOperation implements Operation {
  id = 'to_binary';
  name = '二进制编码';
  description = '将文本转换为8位二进制序列';
  category = 'binary' as const;
  icon = 'CodeOutlined';
  inputType = 'text';
  outputType = 'binary';

  getParameters(): OperationParameter[] {
    return [];
  }

  async execute(input: OperationInput): Promise<OperationResult> {
    const startTime = Date.now();
    try {
      const bytes = new TextEncoder().encode(input.data);
      const result = Array.from(bytes)
        .map(byte => byte.toString(2).padStart(8, '0'))
        .join(' ');

      return {
        success: true,
        output: {
          data: result,
          dataType: 'binary',
        },
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        output: {
          data: '',
          dataType: 'binary',
        },
        error: error instanceof Error ? error.message : '二进制编码失败',
        executionTime: Date.now() - startTime,
      };
    }
  }

  validateInput(input: OperationInput): { valid: boolean; error?: string } {
    if (input.data === null || input.data === undefined) {
      return { valid: false, error: '输入数据不能为null或undefined' };
    }
    return { valid: true };
  }
}

class BinaryDecodeOperation implements Operation {
  id = 'from_binary';
  name = '二进制解码';
  description = '将8位二进制序列解码为文本';
  category = 'binary' as const;
  icon = 'CodeOutlined';
  inputType = 'binary';
  outputType = 'text';

  getParameters(): OperationParameter[] {
    return [];
  }

  async execute(input: OperationInput): Promise<OperationResult> {
    const startTime = Date.now();
    try {
      const clean = input.data.trim().replace(/\s+/g, '');
      if (!clean) {
        return {
          success: true,
          output: {
            data: '',
            dataType: 'text',
          },
          executionTime: Date.now() - startTime,
        };
      }

      if (!/^[01]+$/.test(clean) || clean.length % 8 !== 0) {
        return {
          success: false,
          output: {
            data: '',
            dataType: 'text',
          },
          error: '二进制输入必须仅包含0/1且长度为8的倍数',
          executionTime: Date.now() - startTime,
        };
      }

      const bytes = new Uint8Array(clean.length / 8);
      for (let i = 0; i < clean.length; i += 8) {
        bytes[i / 8] = parseInt(clean.slice(i, i + 8), 2);
      }

      const decoded = new TextDecoder().decode(bytes);
      return {
        success: true,
        output: {
          data: decoded,
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
        error: error instanceof Error ? error.message : '二进制解码失败',
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
}

const EXTENDED_ENCODING_OPERATION_CONFIGS: LazyEncodingOperationConfig[] = [
  {
    id: 'to_hex',
    name: 'Hex编码',
    description: '将文本编码为十六进制字符串',
    encoderType: 'base16',
    mode: 'encode',
    inputType: 'text',
    outputType: 'hex',
  },
  {
    id: 'from_hex',
    name: 'Hex解码',
    description: '将十六进制字符串解码为文本',
    encoderType: 'base16',
    mode: 'decode',
    inputType: 'hex',
    outputType: 'text',
  },
  {
    id: 'base32_encode',
    name: 'Base32编码',
    description: '将文本编码为Base32格式',
    encoderType: 'base32',
    mode: 'encode',
    inputType: 'text',
    outputType: 'base32',
  },
  {
    id: 'base32_decode',
    name: 'Base32解码',
    description: '将Base32编码数据解码为文本',
    encoderType: 'base32',
    mode: 'decode',
    inputType: 'base32',
    outputType: 'text',
  },
  {
    id: 'base32hex_encode',
    name: 'Base32Hex编码',
    description: '将文本编码为Base32Hex格式',
    encoderType: 'base32hex',
    mode: 'encode',
    inputType: 'text',
    outputType: 'base32hex',
  },
  {
    id: 'base32hex_decode',
    name: 'Base32Hex解码',
    description: '将Base32Hex编码数据解码为文本',
    encoderType: 'base32hex',
    mode: 'decode',
    inputType: 'base32hex',
    outputType: 'text',
  },
  {
    id: 'base36_encode',
    name: 'Base36编码',
    description: '将文本编码为Base36格式',
    encoderType: 'base36',
    mode: 'encode',
    inputType: 'text',
    outputType: 'base36',
  },
  {
    id: 'base36_decode',
    name: 'Base36解码',
    description: '将Base36编码数据解码为文本',
    encoderType: 'base36',
    mode: 'decode',
    inputType: 'base36',
    outputType: 'text',
  },
  {
    id: 'base58_encode',
    name: 'Base58编码',
    description: '将文本编码为Base58格式',
    encoderType: 'base58',
    mode: 'encode',
    inputType: 'text',
    outputType: 'base58',
  },
  {
    id: 'base58_decode',
    name: 'Base58解码',
    description: '将Base58编码数据解码为文本',
    encoderType: 'base58',
    mode: 'decode',
    inputType: 'base58',
    outputType: 'text',
  },
  {
    id: 'base62_encode',
    name: 'Base62编码',
    description: '将文本编码为Base62格式',
    encoderType: 'base62',
    mode: 'encode',
    inputType: 'text',
    outputType: 'base62',
  },
  {
    id: 'base62_decode',
    name: 'Base62解码',
    description: '将Base62编码数据解码为文本',
    encoderType: 'base62',
    mode: 'decode',
    inputType: 'base62',
    outputType: 'text',
  },
  {
    id: 'base64url_encode',
    name: 'Base64URL编码',
    description: '将文本编码为Base64URL格式',
    encoderType: 'base64url',
    mode: 'encode',
    inputType: 'text',
    outputType: 'base64url',
  },
  {
    id: 'base64url_decode',
    name: 'Base64URL解码',
    description: '将Base64URL编码数据解码为文本',
    encoderType: 'base64url',
    mode: 'decode',
    inputType: 'base64url',
    outputType: 'text',
  },
  {
    id: 'base85_encode',
    name: 'Base85编码',
    description: '将文本编码为Base85格式',
    encoderType: 'base85',
    mode: 'encode',
    inputType: 'text',
    outputType: 'base85',
  },
  {
    id: 'base85_decode',
    name: 'Base85解码',
    description: '将Base85编码数据解码为文本',
    encoderType: 'base85',
    mode: 'decode',
    inputType: 'base85',
    outputType: 'text',
  },
  {
    id: 'base91_encode',
    name: 'Base91编码',
    description: '将文本编码为Base91格式',
    encoderType: 'base91',
    mode: 'encode',
    inputType: 'text',
    outputType: 'base91',
  },
  {
    id: 'base91_decode',
    name: 'Base91解码',
    description: '将Base91编码数据解码为文本',
    encoderType: 'base91',
    mode: 'decode',
    inputType: 'base91',
    outputType: 'text',
  },
  {
    id: 'html_entity_encode',
    name: 'HTML实体编码',
    description: '将文本编码为HTML实体',
    encoderType: 'html',
    mode: 'encode',
    inputType: 'text',
    outputType: 'html',
    icon: 'FileTextOutlined',
  },
  {
    id: 'html_entity_decode',
    name: 'HTML实体解码',
    description: '将HTML实体解码为文本',
    encoderType: 'html',
    mode: 'decode',
    inputType: 'html',
    outputType: 'text',
    icon: 'FileTextOutlined',
  },
  {
    id: 'json_format',
    name: 'JSON格式化',
    description: '格式化JSON文本并输出标准缩进',
    encoderType: 'json',
    mode: 'encode',
    inputType: 'json',
    outputType: 'json',
    category: 'data',
    icon: 'FileTextOutlined',
  },
  {
    id: 'unicode_escape',
    name: 'Unicode编码',
    description: '将文本编码为Unicode转义序列',
    encoderType: 'unicode',
    mode: 'encode',
    inputType: 'text',
    outputType: 'unicode',
    icon: 'FileTextOutlined',
  },
  {
    id: 'unicode_unescape',
    name: 'Unicode解码',
    description: '将Unicode转义序列解码为文本',
    encoderType: 'unicode',
    mode: 'decode',
    inputType: 'unicode',
    outputType: 'text',
    icon: 'FileTextOutlined',
  },
  {
    id: 'ascii_encode',
    name: 'ASCII编码',
    description: '将文本编码为ASCII码值序列',
    encoderType: 'ascii',
    mode: 'encode',
    inputType: 'text',
    outputType: 'ascii',
    icon: 'FileTextOutlined',
  },
  {
    id: 'ascii_decode',
    name: 'ASCII解码',
    description: '将ASCII码值序列解码为文本',
    encoderType: 'ascii',
    mode: 'decode',
    inputType: 'ascii',
    outputType: 'text',
    icon: 'FileTextOutlined',
  },
  {
    id: 'utf7_encode',
    name: 'UTF-7编码',
    description: '将文本编码为UTF-7',
    encoderType: 'utf7',
    mode: 'encode',
    inputType: 'text',
    outputType: 'utf7',
  },
  {
    id: 'utf7_decode',
    name: 'UTF-7解码',
    description: '将UTF-7文本解码为普通文本',
    encoderType: 'utf7',
    mode: 'decode',
    inputType: 'utf7',
    outputType: 'text',
  },
  {
    id: 'utf8_encode',
    name: 'UTF-8编码',
    description: '将文本编码为UTF-8字节表示',
    encoderType: 'utf8',
    mode: 'encode',
    inputType: 'text',
    outputType: 'utf8',
  },
  {
    id: 'utf8_decode',
    name: 'UTF-8解码',
    description: '将UTF-8字节表示解码为文本',
    encoderType: 'utf8',
    mode: 'decode',
    inputType: 'utf8',
    outputType: 'text',
  },
  {
    id: 'utf16be_encode',
    name: 'UTF-16BE编码',
    description: '将文本编码为UTF-16BE',
    encoderType: 'utf16be',
    mode: 'encode',
    inputType: 'text',
    outputType: 'utf16be',
  },
  {
    id: 'utf16be_decode',
    name: 'UTF-16BE解码',
    description: '将UTF-16BE数据解码为文本',
    encoderType: 'utf16be',
    mode: 'decode',
    inputType: 'utf16be',
    outputType: 'text',
  },
  {
    id: 'utf16le_encode',
    name: 'UTF-16LE编码',
    description: '将文本编码为UTF-16LE',
    encoderType: 'utf16le',
    mode: 'encode',
    inputType: 'text',
    outputType: 'utf16le',
  },
  {
    id: 'utf16le_decode',
    name: 'UTF-16LE解码',
    description: '将UTF-16LE数据解码为文本',
    encoderType: 'utf16le',
    mode: 'decode',
    inputType: 'utf16le',
    outputType: 'text',
  },
  {
    id: 'utf32be_encode',
    name: 'UTF-32BE编码',
    description: '将文本编码为UTF-32BE',
    encoderType: 'utf32be',
    mode: 'encode',
    inputType: 'text',
    outputType: 'utf32be',
  },
  {
    id: 'utf32be_decode',
    name: 'UTF-32BE解码',
    description: '将UTF-32BE数据解码为文本',
    encoderType: 'utf32be',
    mode: 'decode',
    inputType: 'utf32be',
    outputType: 'text',
  },
  {
    id: 'utf32le_encode',
    name: 'UTF-32LE编码',
    description: '将文本编码为UTF-32LE',
    encoderType: 'utf32le',
    mode: 'encode',
    inputType: 'text',
    outputType: 'utf32le',
  },
  {
    id: 'utf32le_decode',
    name: 'UTF-32LE解码',
    description: '将UTF-32LE数据解码为文本',
    encoderType: 'utf32le',
    mode: 'decode',
    inputType: 'utf32le',
    outputType: 'text',
  },
];

export function createExtendedEncodingOperations(): Operation[] {
  const operations: Operation[] = EXTENDED_ENCODING_OPERATION_CONFIGS.map(config => new LazyEncodingOperation(config));
  operations.push(new BinaryEncodeOperation(), new BinaryDecodeOperation());
  return operations;
}
