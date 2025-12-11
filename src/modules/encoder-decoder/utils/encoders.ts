import { encode, decode } from 'html-entities';

// 编码/解码类型定义
export type EncoderType = 'base64' | 'base16' | 'base32' | 'base32hex' | 'base36' | 'base64url' | 'base58' | 'base62' | 'base85' | 'base91' | 'url' | 'html' | 'json' | 'unicode';

// Base64家族编码类型
export type BaseFamilyType = 'base16' | 'base32' | 'base32hex' | 'base36' | 'base64' | 'base64url' | 'base58' | 'base62' | 'base85' | 'base91';

// 编码/解码操作类型
export type OperationType = 'encode' | 'decode';

// 编码/解码结果类型
export interface EncodeDecodeResult {
  success: boolean;
  result: string;
  error?: string;
}

/**
 * Base64 编码 - 高性能版
 * @param input 输入字符串
 * @returns 编码结果
 */
export const base64Encode = (input: string): EncodeDecodeResult => {
  try {
    // 直接使用内置的btoa函数，它是经过优化的原生实现
    // 对于包含非ASCII字符的字符串，使用TextEncoder先转换为字节数组
    const encoder = new TextEncoder();
    const bytes = encoder.encode(input);
    // 使用String.fromCharCode.apply优化大量字符的转换
    const binaryString = String.fromCharCode.apply(null, bytes as unknown as number[]);
    const result = btoa(binaryString);
    return { success: true, result };
  } catch (error) {
    return { success: false, result: '', error: error instanceof Error ? error.message : 'Base64编码错误' };
  }
};

/**
 * Base64 解码 - 高性能版
 * @param input 输入字符串
 * @returns 解码结果
 */
export const base64Decode = (input: string): EncodeDecodeResult => {
  try {
    // 直接使用内置的atob函数，它是经过优化的原生实现
    const binaryString = atob(input);
    // 使用Uint8Array.from优化字节数组的创建
    const bytes = Uint8Array.from(binaryString, c => c.charCodeAt(0));
    // 使用TextDecoder优化字节数组到字符串的转换
    const decoder = new TextDecoder();
    const result = decoder.decode(bytes);
    return { success: true, result };
  } catch (error) {
    return { success: false, result: '', error: error instanceof Error ? error.message : 'Base64解码错误' };
  }
};

/**
 * Base16 编码 - 高性能版
 * @param input 输入字符串
 * @returns 编码结果
 */
export const base16Encode = (input: string): EncodeDecodeResult => {
  try {
    // 使用TextEncoder获取字节数组，然后转换为十六进制字符串
    const encoder = new TextEncoder();
    const bytes = encoder.encode(input);
    
    // 预分配结果数组，避免多次字符串拼接
    const resultArray = new Array(bytes.length * 2);
    // 十六进制字符映射表
    const hexChars = '0123456789ABCDEF';
    
    // 直接操作数组，避免字符串拼接
    for (let i = 0; i < bytes.length; i++) {
      const byte = bytes[i];
      resultArray[i * 2] = hexChars[byte >> 4]; // 高4位
      resultArray[i * 2 + 1] = hexChars[byte & 0x0F]; // 低4位
    }
    
    const result = resultArray.join('');
    return { success: true, result };
  } catch (error) {
    return { success: false, result: '', error: error instanceof Error ? error.message : 'Base16编码错误' };
  }
};

/**
 * Base16 解码 - 高性能版
 * @param input 输入字符串
 * @returns 解码结果
 */
export const base16Decode = (input: string): EncodeDecodeResult => {
  try {
    if (input.length % 2 !== 0) {
      throw new Error('Base16 input must have even length');
    }
    
    // 预分配字节数组以提高性能
    const bytes = new Uint8Array(input.length / 2);
    
    // 直接操作字节数组，避免字符串拼接和多次查找
    for (let i = 0; i < input.length; i += 2) {
      const high = parseInt(input[i], 16);
      const low = parseInt(input[i + 1], 16);
      // 检查是否是有效的十六进制字符
      if (isNaN(high) || isNaN(low)) {
        throw new Error('Invalid Base16 character');
      }
      bytes[i / 2] = (high << 4) | low;
    }
    
    // 使用TextDecoder一次性解码字节数组
    const decoder = new TextDecoder();
    const result = decoder.decode(bytes);
    
    return { success: true, result };
  } catch (error) {
    return { success: false, result: '', error: error instanceof Error ? error.message : 'Base16解码错误' };
  }
};

/**
 * Base32 编码 - RFC 4648 标准实现
 * 
 * 编码原理：
 * 1. 将输入的每个字节（8位）转换为二进制
 * 2. 将二进制流按5位分组
 * 3. 每组5位转换为0-31的十进制数
 * 4. 使用Base32字母表（A-Z, 2-7）映射到对应的字符
 * 5. 不足5位的部分补0，并添加适当数量的=作为填充
 * 6. 确保输出长度为8的倍数
 * 
 * @param input 输入字符串
 * @returns 编码结果
 */
export const base32Encode = (input: string): EncodeDecodeResult => {
  try {
    // Base32字母表，RFC 4648标准
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    
    // 位缓冲区，用于存储待处理的位
    let buffer = 0;
    // 缓冲区中剩余的位数
    let bitsLeft = 0;
    // 最终编码结果
    let result = '';

    // 遍历输入字符串的每个字符
    for (let i = 0; i < input.length; i++) {
      // 将当前字符的ASCII码添加到缓冲区（左移8位腾出空间）
      buffer = (buffer << 8) | input.charCodeAt(i);
      // 缓冲区中增加8位
      bitsLeft += 8;

      // 当缓冲区中至少有5位时，提取5位进行编码
      while (bitsLeft >= 5) {
        // 计算当前要提取的5位在缓冲区中的位置，并获取这5位的值（0-31）
        const index = (buffer >>> (bitsLeft - 5)) & 0x1F; // 0x1F = 31，确保只取5位
        // 根据索引从字母表中获取对应的字符
        result += alphabet[index];
        // 缓冲区中减少5位
        bitsLeft -= 5;
      }
    }

    // 处理剩余的位数（如果有的话）
    if (bitsLeft > 0) {
      // 左移补0，确保剩余位长度为5位
      const index = (buffer << (5 - bitsLeft)) & 0x1F;
      // 添加对应的字符
      result += alphabet[index];
      // 添加填充字符=，数量为(5 - bitsLeft) % 5
      result += '='.repeat((5 - bitsLeft) % 5);
    }

    // 确保结果长度是8的倍数，不足的部分用=填充
    result += '='.repeat((8 - result.length % 8) % 8);

    return { success: true, result };
  } catch (error) {
    return { success: false, result: '', error: error instanceof Error ? error.message : 'Base32编码错误' };
  }
};

/**
 * Base32 解码 - RFC 4648 标准实现
 * 
 * 解码原理：
 * 1. 移除输入中的填充字符=
 * 2. 将每个Base32字符转换为对应的0-31十进制值
 * 3. 将这些值按5位分组拼接成二进制流
 * 4. 每8位一组转换为对应的字节
 * 5. 将字节数组转换为字符串
 * 
 * @param input 输入字符串
 * @returns 解码结果
 */
export const base32Decode = (input: string): EncodeDecodeResult => {
  try {
    // Base32字母表，RFC 4648标准
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    
    // 将输入转换为大写并移除填充字符=
    const inputUpper = input.toUpperCase().replace(/=/g, '');
    
    // 位缓冲区，用于存储待处理的位
    let buffer = 0;
    // 缓冲区中剩余的位数
    let bitsLeft = 0;
    // 最终解码结果
    let result = '';

    // 遍历输入的每个字符
    for (let i = 0; i < inputUpper.length; i++) {
      const char = inputUpper[i];
      // 查找字符在字母表中的索引
      const index = alphabet.indexOf(char);
      
      // 验证字符是否有效
      if (index === -1) {
        throw new Error(`Invalid Base32 character: ${char}`);
      }

      // 将当前字符的索引添加到缓冲区（左移5位腾出空间）
      buffer = (buffer << 5) | index;
      // 缓冲区中增加5位
      bitsLeft += 5;

      // 当缓冲区中至少有8位时，提取8位转换为字符
      while (bitsLeft >= 8) {
        // 计算当前要提取的8位在缓冲区中的位置，并获取这8位的值（0-255）
        const charCode = (buffer >>> (bitsLeft - 8)) & 0xFF; // 0xFF = 255，确保只取8位
        // 将字符码转换为对应的字符
        result += String.fromCharCode(charCode);
        // 缓冲区中减少8位
        bitsLeft -= 8;
      }
    }

    return { success: true, result };
  } catch (error) {
    return { success: false, result: '', error: error instanceof Error ? error.message : 'Base32解码错误' };
  }
};

/**
 * Base36 编码 - 高性能版
 * @param input 输入字符串
 * @returns 编码结果
 */
export const base36Encode = (input: string): EncodeDecodeResult => {
  try {
    // 预分配结果数组，避免多次字符串拼接
    const resultArray = new Array(input.length);
    
    // 直接操作数组，避免字符串拼接
    for (let i = 0; i < input.length; i++) {
      const charCode = input.charCodeAt(i);
      resultArray[i] = charCode.toString(36);
    }
    
    const result = resultArray.join('').toUpperCase();
    return { success: true, result };
  } catch (error) {
    return { success: false, result: '', error: error instanceof Error ? error.message : 'Base36编码错误' };
  }
};

/**
 * Base36 解码 - 高性能版
 * @param input 输入字符串
 * @returns 解码结果
 */
export const base36Decode = (input: string): EncodeDecodeResult => {
  try {
    let result = '';
    let temp = '';
    
    // 直接遍历字符串，避免不必要的异常处理
    for (let i = 0; i < input.length; i++) {
      temp += input[i];
      const charCode = parseInt(temp, 36);
      
      if (isNaN(charCode)) {
        throw new Error('Invalid Base36 character');
      }
      
      if (charCode <= 255) {
        result += String.fromCharCode(charCode);
        temp = '';
      }
    }
    
    // 如果还有剩余的字符，说明输入无效
    if (temp.length > 0) {
      throw new Error('Invalid Base36 input');
    }
    
    return { success: true, result };
  } catch (error) {
    return { success: false, result: '', error: error instanceof Error ? error.message : 'Base36解码错误' };
  }
};

/**
 * Base32Hex 编码 (RFC 4648 扩展十六进制字母表)
 */
export const base32HexEncode = (input: string): EncodeDecodeResult => {
  try {
    const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUV';
    let buffer = 0;
    let bitsLeft = 0;
    let result = '';

    for (let i = 0; i < input.length; i++) {
      buffer = (buffer << 8) | input.charCodeAt(i);
      bitsLeft += 8;
      while (bitsLeft >= 5) {
        const index = (buffer >>> (bitsLeft - 5)) & 0x1f;
        result += alphabet[index];
        bitsLeft -= 5;
      }
    }
    if (bitsLeft > 0) {
      const index = (buffer << (5 - bitsLeft)) & 0x1f;
      result += alphabet[index];
    }
    // 填充到8的倍数
    while (result.length % 8 !== 0) result += '=';
    return { success: true, result };
  } catch (error) {
    return { success: false, result: '', error: error instanceof Error ? error.message : 'Base32Hex编码错误' };
  }
};

/**
 * Base32Hex 解码
 */
export const base32HexDecode = (input: string): EncodeDecodeResult => {
  try {
    const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUV';
    const inputUpper = input.toUpperCase().replace(/=/g, '');
    let buffer = 0;
    let bitsLeft = 0;
    let result = '';

    for (let i = 0; i < inputUpper.length; i++) {
      const index = alphabet.indexOf(inputUpper[i]);
      if (index === -1) throw new Error(`Invalid Base32Hex character: ${inputUpper[i]}`);
      buffer = (buffer << 5) | index;
      bitsLeft += 5;
      while (bitsLeft >= 8) {
        result += String.fromCharCode((buffer >>> (bitsLeft - 8)) & 0xff);
        bitsLeft -= 8;
      }
    }
    return { success: true, result };
  } catch (error) {
    return { success: false, result: '', error: error instanceof Error ? error.message : 'Base32Hex解码错误' };
  }
};

/**
 * Base62 编码
 */
export const base62Encode = (input: string): EncodeDecodeResult => {
  try {
    const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let value = BigInt(0);
    for (let i = 0; i < input.length; i++) {
      value = (value << BigInt(8)) | BigInt(input.charCodeAt(i));
    }
    if (value === BigInt(0)) return { success: true, result: alphabet[0] };
    let result = '';
    while (value > BigInt(0)) {
      result = alphabet[Number(value % BigInt(62))] + result;
      value = value / BigInt(62);
    }
    // 处理前导零
    for (let i = 0; i < input.length && input[i] === '\x00'; i++) {
      result = alphabet[0] + result;
    }
    return { success: true, result };
  } catch (error) {
    return { success: false, result: '', error: error instanceof Error ? error.message : 'Base62编码错误' };
  }
};

/**
 * Base62 解码
 */
export const base62Decode = (input: string): EncodeDecodeResult => {
  try {
    const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let value = BigInt(0);
    for (let i = 0; i < input.length; i++) {
      const index = alphabet.indexOf(input[i]);
      if (index === -1) throw new Error(`Invalid Base62 character: ${input[i]}`);
      value = value * BigInt(62) + BigInt(index);
    }
    let result = '';
    while (value > BigInt(0)) {
      result = String.fromCharCode(Number(value & BigInt(0xff))) + result;
      value = value >> BigInt(8);
    }
    // 处理前导零
    for (let i = 0; i < input.length && input[i] === alphabet[0]; i++) {
      result = '\x00' + result;
    }
    return { success: true, result };
  } catch (error) {
    return { success: false, result: '', error: error instanceof Error ? error.message : 'Base62解码错误' };
  }
};

/**
 * Base85 (ASCII85) 编码
 */
export const base85Encode = (input: string): EncodeDecodeResult => {
  try {
    const bytes = new TextEncoder().encode(input);
    let result = '<~';
    
    for (let i = 0; i < bytes.length; i += 4) {
      let value = 0;
      const chunk = Math.min(4, bytes.length - i);
      for (let j = 0; j < 4; j++) {
        value = value * 256 + (j < chunk ? bytes[i + j] : 0);
      }
      
      if (value === 0 && chunk === 4) {
        result += 'z';
      } else {
        const encoded = [];
        for (let j = 0; j < 5; j++) {
          encoded.unshift(String.fromCharCode((value % 85) + 33));
          value = Math.floor(value / 85);
        }
        result += encoded.slice(0, chunk + 1).join('');
      }
    }
    result += '~>';
    return { success: true, result };
  } catch (error) {
    return { success: false, result: '', error: error instanceof Error ? error.message : 'Base85编码错误' };
  }
};

/**
 * Base85 (ASCII85) 解码
 */
export const base85Decode = (input: string): EncodeDecodeResult => {
  try {
    let data = input.trim();
    if (data.startsWith('<~')) data = data.slice(2);
    if (data.endsWith('~>')) data = data.slice(0, -2);
    data = data.replace(/z/g, '!!!!!');
    
    const bytes: number[] = [];
    for (let i = 0; i < data.length; i += 5) {
      const chunk = data.slice(i, i + 5).padEnd(5, 'u');
      let value = 0;
      for (let j = 0; j < 5; j++) {
        value = value * 85 + (chunk.charCodeAt(j) - 33);
      }
      const chunkLen = Math.min(5, data.length - i);
      for (let j = 0; j < chunkLen - 1; j++) {
        bytes.push((value >> (24 - j * 8)) & 0xff);
      }
    }
    return { success: true, result: new TextDecoder().decode(new Uint8Array(bytes)) };
  } catch (error) {
    return { success: false, result: '', error: error instanceof Error ? error.message : 'Base85解码错误' };
  }
};

/**
 * Base91 编码
 */
export const base91Encode = (input: string): EncodeDecodeResult => {
  try {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,./:;<=>?@[]^_`{|}~"';
    const bytes = new TextEncoder().encode(input);
    let result = '';
    let b = 0;
    let n = 0;
    
    for (let i = 0; i < bytes.length; i++) {
      b |= bytes[i] << n;
      n += 8;
      if (n > 13) {
        let v = b & 8191;
        if (v > 88) {
          b >>= 13;
          n -= 13;
        } else {
          v = b & 16383;
          b >>= 14;
          n -= 14;
        }
        result += alphabet[v % 91] + alphabet[Math.floor(v / 91)];
      }
    }
    if (n) {
      result += alphabet[b % 91];
      if (n > 7 || b > 90) result += alphabet[Math.floor(b / 91)];
    }
    return { success: true, result };
  } catch (error) {
    return { success: false, result: '', error: error instanceof Error ? error.message : 'Base91编码错误' };
  }
};

/**
 * Base91 解码
 */
export const base91Decode = (input: string): EncodeDecodeResult => {
  try {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,./:;<=>?@[]^_`{|}~"';
    const bytes: number[] = [];
    let b = 0;
    let n = 0;
    let v = -1;
    
    for (let i = 0; i < input.length; i++) {
      const p = alphabet.indexOf(input[i]);
      if (p === -1) continue;
      if (v < 0) {
        v = p;
      } else {
        v += p * 91;
        b |= v << n;
        n += (v & 8191) > 88 ? 13 : 14;
        do {
          bytes.push(b & 0xff);
          b >>= 8;
          n -= 8;
        } while (n > 7);
        v = -1;
      }
    }
    if (v > -1) bytes.push((b | v << n) & 0xff);
    return { success: true, result: new TextDecoder().decode(new Uint8Array(bytes)) };
  } catch (error) {
    return { success: false, result: '', error: error instanceof Error ? error.message : 'Base91解码错误' };
  }
};

/**
 * Base64URL 编码 - 高性能版
 * @param input 输入字符串
 * @returns 编码结果
 */
export const base64UrlEncode = (input: string): EncodeDecodeResult => {
  try {
    // 使用更现代的实现方式，避免使用已弃用的unescape函数
    const encoder = new TextEncoder();
    const bytes = encoder.encode(input);
    const binaryString = String.fromCharCode.apply(null, bytes as unknown as number[]);
    
    // 先进行Base64编码，然后替换URL不安全的字符
    let base64Url = btoa(binaryString)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    return { success: true, result: base64Url };
  } catch (error) {
    return { success: false, result: '', error: error instanceof Error ? error.message : 'Base64URL编码错误' };
  }
};

/**
 * Base64URL 解码 - 高性能版
 * @param input 输入字符串
 * @returns 解码结果
 */
export const base64UrlDecode = (input: string): EncodeDecodeResult => {
  try {
    // 将URL安全字符转换回标准Base64
    let base64 = input
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    // 添加缺失的填充
    const padding = 4 - (base64.length % 4);
    if (padding !== 4) {
      base64 += '='.repeat(padding);
    }
    
    // 使用更现代的实现方式，避免使用已弃用的escape函数
    const binaryString = atob(base64);
    const bytes = Uint8Array.from(binaryString, c => c.charCodeAt(0));
    const decoder = new TextDecoder();
    const result = decoder.decode(bytes);
    
    return { success: true, result };
  } catch (error) {
    return { success: false, result: '', error: error instanceof Error ? error.message : 'Base64URL解码错误' };
  }
};

/**
 * Base58 编码
 * @param input 输入字符串
 * @returns 编码结果
 */
export const base58Encode = (input: string): EncodeDecodeResult => {
  try {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let value = BigInt(0);
    
    // 将输入字符串转换为BigInt
    for (let i = 0; i < input.length; i++) {
      value = (value << BigInt(8)) | BigInt(input.charCodeAt(i));
    }
    
    let result = '';
    while (value > BigInt(0)) {
      const remainder = value % BigInt(58);
      result = alphabet[Number(remainder)] + result;
      value = value / BigInt(58);
    }
    
    // 处理前导零
    for (let i = 0; i < input.length && input[i] === '\x00'; i++) {
      result = alphabet[0] + result;
    }
    
    return { success: true, result };
  } catch (error) {
    return { success: false, result: '', error: error instanceof Error ? error.message : 'Base58编码错误' };
  }
};

/**
 * Base58 解码
 * @param input 输入字符串
 * @returns 解码结果
 */
export const base58Decode = (input: string): EncodeDecodeResult => {
  try {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let value = BigInt(0);
    
    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      const index = alphabet.indexOf(char);
      if (index === -1) {
        throw new Error(`Invalid Base58 character: ${char}`);
      }
      value = value * BigInt(58) + BigInt(index);
    }
    
    let result = '';
    while (value > BigInt(0)) {
      const charCode = Number(value & BigInt(0xFF));
      result = String.fromCharCode(charCode) + result;
      value = value >> BigInt(8);
    }
    
    // 处理前导零
    for (let i = 0; i < input.length && input[i] === alphabet[0]; i++) {
      result = '\x00' + result;
    }
    
    return { success: true, result };
  } catch (error) {
    return { success: false, result: '', error: error instanceof Error ? error.message : 'Base58解码错误' };
  }
};

/**
 * URL 编码 (符合 RFC 3986 标准) - 优化版
 * @param input 输入字符串
 * @returns 编码结果
 */
export const urlEncode = (input: string): EncodeDecodeResult => {
  try {
    // encodeURIComponent 已经是高效的实现，直接使用即可
    const result = encodeURIComponent(input);
    return { success: true, result };
  } catch (error) {
    return { success: false, result: '', error: error instanceof Error ? error.message : 'URL编码错误' };
  }
};

/**
 * URL 解码 (符合 RFC 3986 标准) - 优化版
 * @param input 输入字符串
 * @returns 解码结果
 */
export const urlDecode = (input: string): EncodeDecodeResult => {
  try {
    // 使用正则表达式替换 + 为空格，然后使用 decodeURIComponent 解码
    // 使用 replaceAll 替代 replace 以处理所有匹配项
    const result = decodeURIComponent(input.replaceAll('+', ' '));
    return { success: true, result };
  } catch (error) {
    return { success: false, result: '', error: error instanceof Error ? error.message : 'URL解码错误' };
  }
};

/**
 * URL 编码 (application/x-www-form-urlencoded 格式)
 * @param input 输入字符串
 * @returns 编码结果
 */
export const urlFormEncode = (input: string): EncodeDecodeResult => {
  try {
    // 先使用 encodeURIComponent，然后将空格替换为 + 号
    const result = encodeURIComponent(input).replace(/%20/g, '+');
    return { success: true, result };
  } catch (error) {
    return { success: false, result: '', error: error instanceof Error ? error.message : 'URL表单编码错误' };
  }
};

/**
 * HTML 实体编码
 * @param input 输入字符串
 * @returns 编码结果
 */
export const htmlEncode = (input: string): EncodeDecodeResult => {
  try {
    const result = encode(input);
    return { success: true, result };
  } catch (error) {
    return { success: false, result: '', error: error instanceof Error ? error.message : 'HTML实体编码错误' };
  }
};

/**
 * HTML 实体解码
 * @param input 输入字符串
 * @returns 解码结果
 */
export const htmlDecode = (input: string): EncodeDecodeResult => {
  try {
    const result = decode(input);
    return { success: true, result };
  } catch (error) {
    return { success: false, result: '', error: error instanceof Error ? error.message : 'HTML实体解码错误' };
  }
};

/**
 * JSON 编码
 * @param input 输入字符串
 * @returns 编码结果
 */
export const jsonEncode = (input: string): EncodeDecodeResult => {
  try {
    // 尝试解析输入，确保它是有效的 JSON
    const parsed = JSON.parse(input);
    const result = JSON.stringify(parsed, null, 2);
    return { success: true, result };
  } catch (error) {
    return { success: false, result: '', error: error instanceof Error ? error.message : 'JSON编码错误' };
  }
};

/**
 * JSON 解码
 * @param input 输入字符串
 * @returns 解码结果
 */
export const jsonDecode = (input: string): EncodeDecodeResult => {
  try {
    const parsed = JSON.parse(input);
    const result = JSON.stringify(parsed, null, 2);
    return { success: true, result };
  } catch (error) {
    return { success: false, result: '', error: error instanceof Error ? error.message : 'JSON解码错误' };
  }
};

/**
 * Unicode 编码 (\\uXXXX 格式)
 * @param input 输入字符串
 * @returns 编码结果
 */
export const unicodeEncode = (input: string): EncodeDecodeResult => {
  try {
    const result = input.split('').map(char => {
      const code = char.charCodeAt(0);
      return code > 127 ? `\\u${code.toString(16).padStart(4, '0')}` : char;
    }).join('');
    return { success: true, result };
  } catch (error) {
    return { success: false, result: '', error: error instanceof Error ? error.message : 'Unicode编码错误' };
  }
};

/**
 * Unicode 解码 (\\uXXXX 格式)
 * @param input 输入字符串
 * @returns 解码结果
 */
export const unicodeDecode = (input: string): EncodeDecodeResult => {
  try {
    const result = input.replace(/\\u([0-9a-fA-F]{4})/g, (_, code) => {
      return String.fromCharCode(parseInt(code, 16));
    });
    return { success: true, result };
  } catch (error) {
    return { success: false, result: '', error: error instanceof Error ? error.message : 'Unicode解码错误' };
  }
};

/**
 * UTF-8 编码
 * @param input 输入字符串
 * @returns 编码结果
 */
export const utf8Encode = (input: string): EncodeDecodeResult => {
  try {
    let result = '';
    for (let i = 0; i < input.length; i++) {
      const charCode = input.charCodeAt(i);
      if (charCode < 128) {
        // 单字节字符
        result += charCode.toString(16).padStart(2, '0');
      } else if (charCode < 2048) {
        // 双字节字符
        result += ((charCode >> 6) | 192).toString(16);
        result += ((charCode & 63) | 128).toString(16);
      } else if (charCode < 65536) {
        // 三字节字符
        result += ((charCode >> 12) | 224).toString(16);
        result += (((charCode >> 6) & 63) | 128).toString(16);
        result += ((charCode & 63) | 128).toString(16);
      } else {
        // 四字节字符
        result += ((charCode >> 18) | 240).toString(16);
        result += (((charCode >> 12) & 63) | 128).toString(16);
        result += (((charCode >> 6) & 63) | 128).toString(16);
        result += ((charCode & 63) | 128).toString(16);
      }
    }
    return { success: true, result };
  } catch (error) {
    return { success: false, result: '', error: error instanceof Error ? error.message : 'UTF-8编码错误' };
  }
};

/**
 * UTF-8 解码
 * @param input 输入字符串（十六进制格式）
 * @returns 解码结果
 */
export const utf8Decode = (input: string): EncodeDecodeResult => {
  try {
    let result = '';
    let i = 0;
    while (i < input.length) {
      const byte1 = parseInt(input.substr(i, 2), 16);
      i += 2;
      
      if (byte1 < 128) {
        // 单字节字符
        result += String.fromCharCode(byte1);
      } else if (byte1 < 224) {
        // 双字节字符
        const byte2 = parseInt(input.substr(i, 2), 16);
        i += 2;
        const charCode = ((byte1 & 31) << 6) | (byte2 & 63);
        result += String.fromCharCode(charCode);
      } else if (byte1 < 240) {
        // 三字节字符
        const byte2 = parseInt(input.substr(i, 2), 16);
        const byte3 = parseInt(input.substr(i + 2, 2), 16);
        i += 4;
        const charCode = ((byte1 & 15) << 12) | ((byte2 & 63) << 6) | (byte3 & 63);
        result += String.fromCharCode(charCode);
      } else {
        // 四字节字符
        const byte2 = parseInt(input.substr(i, 2), 16);
        const byte3 = parseInt(input.substr(i + 2, 2), 16);
        const byte4 = parseInt(input.substr(i + 4, 2), 16);
        i += 6;
        const codePoint = ((byte1 & 7) << 18) | ((byte2 & 63) << 12) | ((byte3 & 63) << 6) | (byte4 & 63);
        // 处理代理对
        if (codePoint <= 0xFFFF) {
          result += String.fromCharCode(codePoint);
        } else {
          const highSurrogate = Math.floor((codePoint - 0x10000) / 0x400) + 0xD800;
          const lowSurrogate = ((codePoint - 0x10000) % 0x400) + 0xDC00;
          result += String.fromCharCode(highSurrogate, lowSurrogate);
        }
      }
    }
    return { success: true, result };
  } catch (error) {
    return { success: false, result: '', error: error instanceof Error ? error.message : 'UTF-8解码错误' };
  }
};

/**
 * UTF-16 编码
 * @param input 输入字符串
 * @param bigEndian 是否使用大端序
 * @returns 编码结果
 */
export const utf16Encode = (input: string, bigEndian: boolean = false): EncodeDecodeResult => {
  try {
    let result = '';
    for (let i = 0; i < input.length; i++) {
      const charCode = input.charCodeAt(i);
      if (bigEndian) {
        // 大端序：高位字节在前
        result += charCode.toString(16).padStart(4, '0');
      } else {
        // 小端序：低位字节在前
        const lowByte = (charCode & 0xFF).toString(16).padStart(2, '0');
        const highByte = ((charCode >> 8) & 0xFF).toString(16).padStart(2, '0');
        result += lowByte + highByte;
      }
    }
    return { success: true, result };
  } catch (error) {
    return { success: false, result: '', error: error instanceof Error ? error.message : 'UTF-16编码错误' };
  }
};

/**
 * UTF-16 解码
 * @param input 输入字符串（十六进制格式）
 * @param bigEndian 是否使用大端序
 * @returns 解码结果
 */
export const utf16Decode = (input: string, bigEndian: boolean = false): EncodeDecodeResult => {
  try {
    let result = '';
    for (let i = 0; i < input.length; i += 4) {
      let charCode: number;
      if (bigEndian) {
        // 大端序：高位字节在前
        charCode = parseInt(input.substr(i, 4), 16);
      } else {
        // 小端序：低位字节在前
        const lowByte = parseInt(input.substr(i, 2), 16);
        const highByte = parseInt(input.substr(i + 2, 2), 16);
        charCode = (highByte << 8) | lowByte;
      }
      result += String.fromCharCode(charCode);
    }
    return { success: true, result };
  } catch (error) {
    return { success: false, result: '', error: error instanceof Error ? error.message : 'UTF-16解码错误' };
  }
};

/**
 * 执行编码/解码操作
 * @param input 输入字符串
 * @param type 编码类型
 * @param operation 操作类型
 * @returns 编码/解码结果
 */
export const executeEncodeDecode = (input: string, type: EncoderType, operation: OperationType): EncodeDecodeResult => {
  if (!input.trim()) {
    return { success: true, result: '' };
  }

  switch (type) {
    // Base家族编码/解码
    case 'base16':
      return operation === 'encode' ? base16Encode(input) : base16Decode(input);
    case 'base32':
      return operation === 'encode' ? base32Encode(input) : base32Decode(input);
    case 'base32hex':
      return operation === 'encode' ? base32HexEncode(input) : base32HexDecode(input);
    case 'base36':
      return operation === 'encode' ? base36Encode(input) : base36Decode(input);
    case 'base58':
      return operation === 'encode' ? base58Encode(input) : base58Decode(input);
    case 'base62':
      return operation === 'encode' ? base62Encode(input) : base62Decode(input);
    case 'base64':
      return operation === 'encode' ? base64Encode(input) : base64Decode(input);
    case 'base64url':
      return operation === 'encode' ? base64UrlEncode(input) : base64UrlDecode(input);
    case 'base85':
      return operation === 'encode' ? base85Encode(input) : base85Decode(input);
    case 'base91':
      return operation === 'encode' ? base91Encode(input) : base91Decode(input);
    // 其他编码/解码
    case 'url':
      return operation === 'encode' ? urlEncode(input) : urlDecode(input);
    case 'html':
      return operation === 'encode' ? htmlEncode(input) : htmlDecode(input);
    case 'json':
      return operation === 'encode' ? jsonEncode(input) : jsonDecode(input);
    case 'unicode':
      return operation === 'encode' ? unicodeEncode(input) : unicodeDecode(input);
    default:
      return { success: false, result: '', error: '不支持的编码类型' };
  }
};

/**
 * 获取编码/解码类型的显示名称
 * @param type 编码类型
 * @returns 显示名称
 */
export const getEncoderDisplayName = (type: EncoderType): string => {
  const displayNames: Record<EncoderType, string> = {
    base16: 'Base16 (Hex)',
    base32: 'Base32',
    base32hex: 'Base32Hex',
    base36: 'Base36',
    base58: 'Base58',
    base62: 'Base62',
    base64: 'Base64',
    base64url: 'Base64URL',
    base85: 'Base85 (ASCII85)',
    base91: 'Base91',
    url: 'URL',
    html: 'HTML实体',
    json: 'JSON',
    unicode: 'Unicode'
  };
  return displayNames[type] || type;
};
