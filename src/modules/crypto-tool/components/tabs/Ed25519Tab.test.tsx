import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent, waitFor } from '@/test/utils';
import { message } from 'antd';
import Ed25519Tab from './Ed25519Tab';

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
    Switch: ({
      checked,
      onChange,
    }: {
      checked?: boolean;
      onChange?: (checked: boolean) => void;
    }) => (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange?.(!checked)}
      />
    ),
    Select: ({
      value,
      onChange,
      options,
      disabled,
    }: {
      value: string;
      onChange: (value: string) => void;
      options: Array<{ value: string; label: string }>;
      disabled?: boolean;
    }) => (
      <select
        aria-label="ed25519-hash"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
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

const ed25519Mocks = vi.hoisted(() => ({
  generateEd25519KeyPair: vi.fn(() => ({ publicKey: 'ed-pub', privateKey: 'ed-priv' })),
  ed25519Sign: vi.fn(() => 'ed-signature'),
  ed25519Verify: vi.fn(() => true),
  ed25519SignBytes: vi.fn(() => 'ed-signature-bytes'),
  ed25519VerifyBytes: vi.fn(() => true),
  hashMessageToUint8Array: vi.fn(() => new Uint8Array([1, 2, 3])),
}));

vi.mock('../../utils/asymmetric-edwards', () => ({
  generateEd25519KeyPair: ed25519Mocks.generateEd25519KeyPair,
  ed25519Sign: ed25519Mocks.ed25519Sign,
  ed25519Verify: ed25519Mocks.ed25519Verify,
  ed25519SignBytes: ed25519Mocks.ed25519SignBytes,
  ed25519VerifyBytes: ed25519Mocks.ed25519VerifyBytes,
}));

vi.mock('../../utils/helpers', () => ({
  hashMessageToUint8Array: ed25519Mocks.hashMessageToUint8Array,
}));

describe('Ed25519Tab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('generates key pair, signs, copies and clears in normal mode', async () => {
    render(<Ed25519Tab />);

    await userEvent.click(screen.getByRole('button', { name: /生成密钥对/i }));
    expect(ed25519Mocks.generateEd25519KeyPair).toHaveBeenCalled();
    expect(screen.getByDisplayValue('ed-pub')).toBeInTheDocument();
    expect(screen.getByDisplayValue('ed-priv')).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText(/请输入要签名\/验签的内容/i), 'payload');
    await userEvent.click(screen.getByRole('button', { name: /^签名$/i }));
    expect(ed25519Mocks.ed25519Sign).toHaveBeenCalledWith('payload', 'ed-priv');
    expect(screen.getByDisplayValue('ed-signature')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /^复制$/i }));
    await waitFor(() => {
      expect(message.success).toHaveBeenCalledWith('已复制到剪贴板');
    });

    await userEvent.click(screen.getByRole('button', { name: /清空/i }));
    expect(screen.getByPlaceholderText(/请输入要签名\/验签的内容/i)).toHaveValue('');
  });

  it('uses prehash sign and verify branches when enabled', async () => {
    render(<Ed25519Tab />);

    await userEvent.click(screen.getByRole('button', { name: /生成密钥对/i }));
    await userEvent.click(screen.getByRole('switch'));
    await userEvent.selectOptions(screen.getByLabelText('ed25519-hash'), 'SHA512');
    await userEvent.type(screen.getByPlaceholderText(/请输入要签名\/验签的内容/i), 'payload');

    await userEvent.click(screen.getByRole('button', { name: /^签名$/i }));
    expect(ed25519Mocks.hashMessageToUint8Array).toHaveBeenCalledWith('payload', 'SHA512');
    expect(ed25519Mocks.ed25519SignBytes).toHaveBeenCalled();
    expect(screen.getByDisplayValue('ed-signature-bytes')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /^验签$/i }));
    expect(ed25519Mocks.ed25519VerifyBytes).toHaveBeenCalled();
    await waitFor(() => {
      expect(message.success).toHaveBeenCalledWith('Ed25519 签名验证通过 ✓');
    });
  });

  it('shows warnings when required fields are missing', async () => {
    render(<Ed25519Tab />);

    await userEvent.click(screen.getByRole('button', { name: /^签名$/i }));
    expect(message.warning).toHaveBeenCalledWith('请输入要签名的内容');

    await userEvent.type(screen.getByPlaceholderText(/请输入要签名\/验签的内容/i), 'payload');
    await userEvent.click(screen.getByRole('button', { name: /^验签$/i }));
    expect(message.warning).toHaveBeenCalledWith('请在结果框输入签名');
  });
});
