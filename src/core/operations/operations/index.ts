/**
 * 操作注册文件
 * 将所有操作注册到操作注册表中
 */

import { operationRegistry } from '../registry';
import { Base64DecodeOperation, Base64EncodeOperation } from './base64';
import { createContextOperations } from './context-operations';
import { createExtendedEncodingOperations } from './extended-encoding';
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

  // 注册扩展编码/解码操作
  createExtendedEncodingOperations().forEach(operation => {
    operationRegistry.register(operation);
  });

  // 注册上下文解析操作（时间/JWT/IP/MAC/UUID）
  createContextOperations().forEach(operation => {
    operationRegistry.register(operation);
  });
}
