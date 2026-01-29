import { describe, it, expect } from 'vitest';
import { decodeJWT, verifyJWTWithSecret } from './jwt';

describe('JWT 工具函数测试', () => {
  it('decodeJWT 应该解析无 padding 的 base64url', () => {
    const token = [
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
      'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ',
      'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
    ].join('.');

    const decoded = decodeJWT(token);
    expect(decoded.header.alg).toBe('HS256');
    expect(decoded.payload.sub).toBe('1234567890');
  });

  it('verifyJWTWithSecret 对无效token返回isValid=false', async () => {
    const result = await verifyJWTWithSecret('invalid', 'secret');
    expect(result.isValid).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
