import { beforeEach, describe, expect, it, vi } from 'vitest';

const joseMocks = vi.hoisted(() => {
  let keyId = 0;

  class MockSignJWT {
    private payload: Record<string, unknown>;

    private header: Record<string, unknown> = {};

    private shouldSetIssuedAt = false;

    private expiresAt: string | undefined;

    constructor(payload: Record<string, unknown>) {
      this.payload = payload;
    }

    setProtectedHeader(header: Record<string, unknown>) {
      this.header = header;
      return this;
    }

    setIssuedAt() {
      this.shouldSetIssuedAt = true;
      return this;
    }

    setExpirationTime(expiresAt: string) {
      this.expiresAt = expiresAt;
      return this;
    }

    async sign(key: Uint8Array | { pem: string }) {
      const payload = { ...this.payload };

      if (this.shouldSetIssuedAt && payload.iat === undefined) {
        payload.iat = 1700000000;
      }

      if (this.expiresAt) {
        payload.exp = 1700003600;
      }

      const normalizedKey = typeof key === 'object' && key !== null && 'pem' in key
        ? key.pem
        : new TextDecoder().decode(key as Uint8Array);
      const headerPart = Buffer.from(JSON.stringify(this.header)).toString('base64url');
      const payloadPart = Buffer.from(JSON.stringify(payload)).toString('base64url');
      const signaturePart = Buffer.from(normalizedKey).toString('base64url');
      return `${headerPart}.${payloadPart}.${signaturePart}`;
    }
  }

  return {
    reset: () => {
      keyId = 0;
    },
    jwtVerify: vi.fn(async (token: string, key: Uint8Array | { kind: string; pem: string }) => {
      const [, payloadPart, signaturePart] = token.split('.');
      const isPemKey = typeof key === 'object' && key !== null && 'pem' in key;
      const suppliedKey = isPemKey ? key.pem : new TextDecoder().decode(key as Uint8Array);
      const expectedKey = isPemKey ? suppliedKey.replace('PUBLIC:', 'PRIVATE:') : suppliedKey;
      const expectedSignature = Buffer.from(expectedKey).toString('base64url');

      if (signaturePart !== expectedSignature) {
        throw new Error('invalid signature');
      }

      return {
        payload: JSON.parse(Buffer.from(payloadPart, 'base64url').toString()),
      };
    }),
    importSPKI: vi.fn(async (pem: string, alg: string) => ({ kind: 'public', pem, alg })),
    importPKCS8: vi.fn(async (pem: string, alg: string) => ({ kind: 'private', pem, alg })),
    generateKeyPair: vi.fn(async (alg: string, options?: { extractable?: boolean }) => {
      keyId += 1;
      return {
        publicKey: { kind: 'public', alg, extractable: true, id: keyId },
        privateKey: { kind: 'private', alg, extractable: options?.extractable ?? false, id: keyId },
      };
    }),
    exportSPKI: vi.fn(async (key: { alg: string; id: number }) => `PUBLIC:${key.alg}:${key.id}`),
    exportPKCS8: vi.fn(async (key: { alg: string; id: number; extractable: boolean }) => {
      if (!key.extractable) {
        throw new TypeError('CryptoKey is not extractable');
      }
      return `PRIVATE:${key.alg}:${key.id}`;
    }),
    SignJWT: MockSignJWT,
  };
});

vi.mock('jose', () => joseMocks);

import {
  decodeJWT,
  formatTimestamp,
  generateECKeyPair,
  generateJWTWithPrivateKey,
  generateJWTWithSecret,
  generateRSAKeyPair,
  isExpired,
  verifyJWTWithPublicKey,
  verifyJWTWithSecret,
} from './jwt';

describe('JWT 工具函数测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    joseMocks.reset();
  });

  it('decodeJWT 应该解析无 padding 的 base64url', () => {
    const token = [
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
      'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ',
      'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
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

  it('can generate and verify a symmetric jwt with secret', async () => {
    const token = await generateJWTWithSecret({ sub: 'abc' }, 'secret-key', 'HS256', '1h');
    const result = await verifyJWTWithSecret(token, 'secret-key');

    expect(result.isValid).toBe(true);
    expect(result.header.alg).toBe('HS256');
    expect(result.payload.sub).toBe('abc');
    expect(result.payload.exp).toBe(1700003600);
  });

  it('returns invalid when verifying a symmetric jwt with the wrong secret', async () => {
    const token = await generateJWTWithSecret({ sub: 'abc' }, 'secret-a', 'HS256');
    const result = await verifyJWTWithSecret(token, 'secret-b');

    expect(result.isValid).toBe(false);
    expect(result.error).toBe('invalid signature');
    expect(result.payload.sub).toBe('abc');
  });

  it('can generate and verify an rsa jwt', async () => {
    const keyPair = await generateRSAKeyPair();
    const token = await generateJWTWithPrivateKey({ sub: 'rsa-user' }, keyPair.privateKey, 'RS256', '1h');
    const result = await verifyJWTWithPublicKey(token, keyPair.publicKey);

    expect(joseMocks.generateKeyPair).toHaveBeenCalledWith('RS256', { extractable: true });
    expect(result.isValid).toBe(true);
    expect(result.header.alg).toBe('RS256');
    expect(result.payload.sub).toBe('rsa-user');
  });

  it('can generate and verify an ec jwt and rejects the wrong public key', async () => {
    const keyPair = await generateECKeyPair('ES256');
    const otherPair = await generateECKeyPair('ES256');
    const token = await generateJWTWithPrivateKey(
      { sub: 'ec-user', iat: 1700000000 },
      keyPair.privateKey,
      'ES256'
    );

    const validResult = await verifyJWTWithPublicKey(token, keyPair.publicKey);
    const invalidResult = await verifyJWTWithPublicKey(token, otherPair.publicKey);

    expect(joseMocks.generateKeyPair).toHaveBeenLastCalledWith('ES256', { extractable: true });
    expect(validResult.isValid).toBe(true);
    expect(validResult.header.alg).toBe('ES256');
    expect(validResult.payload.sub).toBe('ec-user');
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.error).toBe('invalid signature');
  });

  it('formats timestamps and checks expiration boundaries', () => {
    expect(formatTimestamp()).toBe('-');
    expect(formatTimestamp(1700000000)).not.toBe('-');
    expect(isExpired()).toBe(false);
    expect(isExpired(Math.floor(Date.now() / 1000) - 60)).toBe(true);
    expect(isExpired(Math.floor(Date.now() / 1000) + 60)).toBe(false);
  });

  it('verifyJWTWithPublicKey returns invalid for malformed tokens', async () => {
    const result = await verifyJWTWithPublicKey('invalid', '-----BEGIN PUBLIC KEY-----fake-----END PUBLIC KEY-----');
    expect(result.isValid).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
