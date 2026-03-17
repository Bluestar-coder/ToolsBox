import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent, waitFor } from '@/test/utils';
import { message } from 'antd';
import X25519Tab from './X25519Tab';

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  const message = {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  };

  return {
    ...actual,
    message,
    Alert: ({ title }: { title?: React.ReactNode }) => <div>{title}</div>,
    Card: ({ children, title }: { children?: React.ReactNode; title?: React.ReactNode }) => (
      <section>
        {title ? <h3>{title}</h3> : null}
        {children}
      </section>
    ),
    Input: Object.assign(
      ({
        value,
        onChange,
        placeholder,
      }: {
        value?: string;
        onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
        placeholder?: string;
      }) => <input value={value} onChange={onChange} placeholder={placeholder} />,
      {
        TextArea: ({
          value,
          onChange,
          placeholder,
          readOnly,
        }: {
          value?: string;
          onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
          placeholder?: string;
          readOnly?: boolean;
        }) => <textarea value={value} onChange={onChange} placeholder={placeholder} readOnly={readOnly} />,
      }
    ),
    Button: ({
      children,
      onClick,
      disabled,
    }: {
      children?: React.ReactNode;
      onClick?: () => void;
      disabled?: boolean;
    }) => (
      <button type="button" onClick={onClick} disabled={disabled}>
        {children}
      </button>
    ),
    Space: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    Typography: {
      Text: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
    },
  };
});

const asymmetricMocks = vi.hoisted(() => ({
  generateX25519KeyPair: vi.fn(() => ({
    privateKey: 'priv-hex',
    publicKey: 'pub-hex',
  })),
  x25519GetSharedSecret: vi.fn(() => 'shared-secret-hex'),
}));

vi.mock('../../utils/asymmetric-edwards', () => ({
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
    expect(screen.getByDisplayValue('pub-hex')).toBeInTheDocument();
    expect(screen.getByDisplayValue('priv-hex')).toBeInTheDocument();
    expect(message.success).toHaveBeenCalledWith('密钥对生成成功');
  });

  it('computes the shared secret from private and peer public keys', async () => {
    render(<X25519Tab />);

    await userEvent.click(screen.getByRole('button', { name: /生成密钥对/i }));
    await userEvent.type(screen.getByPlaceholderText(/输入对方的公钥/i), 'peer-pub-hex');
    await userEvent.click(screen.getByRole('button', { name: /计算共享密钥/i }));

    expect(asymmetricMocks.x25519GetSharedSecret).toHaveBeenCalledWith('priv-hex', 'peer-pub-hex');
    expect(screen.getByDisplayValue('shared-secret-hex')).toBeInTheDocument();
    await waitFor(() => {
      expect(message.success).toHaveBeenCalledWith('共享密钥计算成功');
    });
  });

  it('warns when values are missing and clears generated fields', async () => {
    render(<X25519Tab />);

    await userEvent.click(screen.getByRole('button', { name: /计算共享密钥/i }));
    expect(message.warning).toHaveBeenCalledWith('请输入我的私钥和对方公钥');

    await userEvent.click(screen.getByRole('button', { name: /生成密钥对/i }));
    await userEvent.type(screen.getByPlaceholderText(/输入对方的公钥/i), 'peer-pub-hex');
    await userEvent.click(screen.getByRole('button', { name: /清\s*空/i }));

    expect(screen.getByPlaceholderText(/生成后显示公钥/i)).toHaveValue('');
    expect(screen.getByPlaceholderText(/生成后显示私钥/i)).toHaveValue('');
    expect(screen.getByPlaceholderText(/输入对方的公钥/i)).toHaveValue('');
    expect(screen.getByPlaceholderText(/计算后显示共享密钥/i)).toHaveValue('');
  });
});
