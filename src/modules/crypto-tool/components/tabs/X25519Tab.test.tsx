import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent } from '@/test/utils';
import X25519Tab from './X25519Tab';

const asymmetricMocks = vi.hoisted(() => ({
  generateX25519KeyPair: vi.fn(() => ({
    privateKey: 'priv-hex',
    publicKey: 'pub-hex',
  })),
  x25519GetSharedSecret: vi.fn(() => 'shared-secret-hex'),
}));

vi.mock('../../utils/asymmetric', () => ({
  generateX25519KeyPair: asymmetricMocks.generateX25519KeyPair,
  x25519GetSharedSecret: asymmetricMocks.x25519GetSharedSecret,
}));

describe('X25519Tab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates a key pair into the readonly fields', async () => {
    render(<X25519Tab />);

    await userEvent.click(screen.getByRole('button', { name: /生成密钥对/i }));

    expect(asymmetricMocks.generateX25519KeyPair).toHaveBeenCalledTimes(1);
    expect(await screen.findByDisplayValue('pub-hex')).toBeInTheDocument();
    expect(screen.getByDisplayValue('priv-hex')).toBeInTheDocument();
  });

  it('computes the shared secret from private and peer public keys', async () => {
    render(<X25519Tab />);

    await userEvent.click(screen.getByRole('button', { name: /生成密钥对/i }));
    await userEvent.type(screen.getByPlaceholderText(/输入对方的公钥/i), 'peer-pub-hex');
    await userEvent.click(screen.getByRole('button', { name: /计算共享密钥/i }));

    expect(asymmetricMocks.x25519GetSharedSecret).toHaveBeenCalledWith('priv-hex', 'peer-pub-hex');
    expect(await screen.findByDisplayValue('shared-secret-hex')).toBeInTheDocument();
  });

  it('clears generated and peer keys', async () => {
    render(<X25519Tab />);

    await userEvent.click(screen.getByRole('button', { name: /生成密钥对/i }));
    await userEvent.type(screen.getByPlaceholderText(/输入对方的公钥/i), 'peer-pub-hex');
    await userEvent.click(screen.getByRole('button', { name: /清\s*空/i }));

    expect(screen.getByPlaceholderText(/生成后显示公钥/i)).toHaveValue('');
    expect(screen.getByPlaceholderText(/生成后显示私钥/i)).toHaveValue('');
    expect(screen.getByPlaceholderText(/输入对方的公钥/i)).toHaveValue('');
  });
});
