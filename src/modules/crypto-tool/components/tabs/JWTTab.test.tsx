import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, userEvent } from '@/test/utils';
import JWTTab from './JWTTab';

const jwtMocks = vi.hoisted(() => ({
  decodeJWT: vi.fn(() => ({
    header: { alg: 'HS256', typ: 'JWT' },
    payload: { sub: '123', iat: 1700000000 },
    signature: 'sig',
  })),
  verifyJWTWithSecret: vi.fn(async () => ({
    header: { alg: 'HS256', typ: 'JWT' },
    payload: { sub: '123', iat: 1700000000 },
    signature: 'sig',
    isValid: true,
  })),
  verifyJWTWithPublicKey: vi.fn(),
  generateJWTWithSecret: vi.fn(async () => 'generated.jwt.token'),
  generateJWTWithPrivateKey: vi.fn(async () => 'generated.private.jwt'),
  generateRSAKeyPair: vi.fn(async () => ({ publicKey: 'pub', privateKey: 'priv' })),
  generateECKeyPair: vi.fn(async () => ({ publicKey: 'ec-pub', privateKey: 'ec-priv' })),
}));

vi.mock('../../utils/jwt', () => ({
  decodeJWT: jwtMocks.decodeJWT,
  verifyJWTWithSecret: jwtMocks.verifyJWTWithSecret,
  verifyJWTWithPublicKey: jwtMocks.verifyJWTWithPublicKey,
  generateJWTWithSecret: jwtMocks.generateJWTWithSecret,
  generateJWTWithPrivateKey: jwtMocks.generateJWTWithPrivateKey,
  generateRSAKeyPair: jwtMocks.generateRSAKeyPair,
  generateECKeyPair: jwtMocks.generateECKeyPair,
  jwtAlgorithms: [
    { value: 'HS256', label: 'HS256 (HMAC SHA-256)', type: 'symmetric' },
    { value: 'RS256', label: 'RS256 (RSA SHA-256)', type: 'asymmetric' },
    { value: 'ES256', label: 'ES256 (ECDSA P-256)', type: 'asymmetric' },
  ],
  formatTimestamp: vi.fn((value: number) => `ts:${value}`),
  isExpired: vi.fn(() => false),
  payloadFieldDescriptions: {
    iat: '签发时间',
    exp: '过期时间',
    nbf: '生效时间',
  },
}));

describe('JWTTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('decodes token in decode mode', async () => {
    render(<JWTTab />);

    await userEvent.type(screen.getByPlaceholderText(/粘贴 JWT Token/i), 'mock.jwt.token');
    await userEvent.click(screen.getByRole('button', { name: /解析 JWT/i }));

    expect(await screen.findByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Payload')).toBeInTheDocument();
    expect(jwtMocks.decodeJWT).toHaveBeenCalledWith('mock.jwt.token');
  });

  it('verifies token with secret when signature check is enabled', async () => {
    render(<JWTTab />);

    await userEvent.type(screen.getByPlaceholderText(/粘贴 JWT Token/i), 'mock.jwt.token');
    await userEvent.click(screen.getByRole('switch'));
    await userEvent.type(screen.getByPlaceholderText(/输入密钥/i), 'secret-key');
    await userEvent.click(screen.getByRole('button', { name: /解析并验证/i }));

    expect(await screen.findByText(/签名验证通过/i)).toBeInTheDocument();
    expect(jwtMocks.verifyJWTWithSecret).toHaveBeenCalledWith('mock.jwt.token', 'secret-key');
  });

  it('verifies token with public key for asymmetric algorithms', async () => {
    jwtMocks.decodeJWT.mockReturnValueOnce({
      header: { alg: 'RS256', typ: 'JWT' },
      payload: { sub: '123' },
      signature: 'sig',
    });
    jwtMocks.verifyJWTWithPublicKey.mockResolvedValueOnce({
      header: { alg: 'RS256', typ: 'JWT' },
      payload: { sub: '123' },
      signature: 'sig',
      isValid: true,
    });

    render(<JWTTab />);

    await userEvent.type(screen.getByPlaceholderText(/粘贴 JWT Token/i), 'mock.jwt.token');
    await userEvent.click(screen.getByRole('switch'));
    await userEvent.type(screen.getByPlaceholderText(/输入公钥/i), 'public-key');
    await userEvent.click(screen.getByRole('button', { name: /解析并验证/i }));

    expect(await screen.findByText(/签名验证通过/i)).toBeInTheDocument();
    expect(jwtMocks.verifyJWTWithPublicKey).toHaveBeenCalledWith('mock.jwt.token', 'public-key');
  });

  it('generates token in generate mode', async () => {
    render(<JWTTab />);

    await userEvent.click(screen.getByRole('tab', { name: /^生成$/i }));
    await userEvent.click(screen.getByRole('button', { name: /生成 JWT/i }));

    expect(await screen.findByDisplayValue('generated.jwt.token')).toBeInTheDocument();
    expect(jwtMocks.generateJWTWithSecret).toHaveBeenCalled();
  });

  it('generates an asymmetric key pair when switched to RS256', async () => {
    render(<JWTTab />);

    await userEvent.click(screen.getByRole('tab', { name: /^生成$/i }));
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(await screen.findByText(/RS256 \(RSA SHA-256\)/i));
    await userEvent.click(screen.getByRole('button', { name: /生成密钥对/i }));

    expect(jwtMocks.generateRSAKeyPair).toHaveBeenCalled();
    expect(await screen.findByDisplayValue('priv')).toBeInTheDocument();
    expect(screen.getByDisplayValue('pub')).toBeInTheDocument();
  });
});
