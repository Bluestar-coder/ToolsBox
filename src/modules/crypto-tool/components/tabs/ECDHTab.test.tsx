import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent } from '@/test/utils';
import { message } from 'antd';
import ECDHTab from './ECDHTab';

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
    Select: ({
      value,
      onChange,
      options,
    }: {
      value: string;
      onChange: (value: string) => void;
      options: Array<{ value: string; label: string }>;
    }) => (
      <select
        aria-label="ecdh-curve"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    ),
  };
});

const ecdhMocks = vi.hoisted(() => ({
  generateECDHKeyPair: vi.fn(() => ({ privateKey: 'ecdh-priv', publicKey: 'ecdh-pub' })),
  ecdhGetSharedSecret: vi.fn(() => 'ecdh-shared'),
}));

vi.mock('../../utils/asymmetric', () => ({
  generateECDHKeyPair: ecdhMocks.generateECDHKeyPair,
  ecdhGetSharedSecret: ecdhMocks.ecdhGetSharedSecret,
}));

describe('ECDHTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates key pair for selected curve and computes shared secret', async () => {
    render(<ECDHTab />);

    await userEvent.selectOptions(screen.getByLabelText('ecdh-curve'), 'p384');
    await userEvent.click(screen.getByRole('button', { name: /生成密钥对/i }));

    expect(ecdhMocks.generateECDHKeyPair).toHaveBeenCalledWith('p384');
    expect(screen.getByDisplayValue('ecdh-pub')).toBeInTheDocument();
    expect(screen.getByDisplayValue('ecdh-priv')).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText(/输入对方的公钥/i), 'peer-pub');
    await userEvent.click(screen.getByRole('button', { name: /计算共享密钥/i }));

    expect(ecdhMocks.ecdhGetSharedSecret).toHaveBeenCalledWith('ecdh-priv', 'peer-pub', 'p384');
    expect(screen.getByDisplayValue('ecdh-shared')).toBeInTheDocument();
    expect(message.success).toHaveBeenCalledWith('共享密钥计算成功');
  });

  it('warns on missing values and clears all fields', async () => {
    render(<ECDHTab />);

    await userEvent.click(screen.getByRole('button', { name: /计算共享密钥/i }));
    expect(message.warning).toHaveBeenCalledWith('请输入我的私钥和对方公钥');

    await userEvent.click(screen.getByRole('button', { name: /生成密钥对/i }));
    await userEvent.type(screen.getByPlaceholderText(/输入对方的公钥/i), 'peer-pub');
    await userEvent.click(screen.getByRole('button', { name: /清空/i }));

    expect(screen.getByPlaceholderText(/生成后显示公钥/i)).toHaveValue('');
    expect(screen.getByPlaceholderText(/生成后显示私钥/i)).toHaveValue('');
    expect(screen.getByPlaceholderText(/输入对方的公钥/i)).toHaveValue('');
    expect(screen.getByPlaceholderText(/计算后显示共享密钥/i)).toHaveValue('');
  });
});
