/**
 * 操作注册文件
 * 将所有操作注册到操作注册表中
 */

import { operationRegistry } from '../registry';
import { Base64DecodeOperation, Base64EncodeOperation } from './base64';
import { URLDecodeOperation, URLEncodeOperation } from './url';

/**
 * 注册所有操作
 */
export function registerAllOperations(): void {
  // 注册编码/解码操作
  operationRegistry.register(new Base64DecodeOperation());
  operationRegistry.register(new Base64EncodeOperation());
  operationRegistry.register(new URLDecodeOperation());
  operationRegistry.register(new URLEncodeOperation());
  
  // TODO: 添加更多操作
  // operationRegistry.register(new JSONFormatOperation());
  // operationRegistry.register(new HexDecodeOperation());
  // operationRegistry.register(new AESEncryptOperation());
  // operationRegistry.register(new AESDecryptOperation());
  // operationRegistry.register(new MD5HashOperation());
  // operationRegistry.register(new SHA256HashOperation());
  // ...
}