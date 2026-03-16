import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent, waitFor } from '@/test/utils';
import { message } from 'antd';
import ECDSATab from './ECDSATab';

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
      'aria-label': ariaLabel,
    }: {
      value: string;
      onChange: (value: string) => void;
      options: Array<{ value: string; label: string }>;
      disabled?: boolean;
      'aria-label'?: string;
    }) => (
      <select
        aria-label={ariaLabel ?? 'ecdsa-select'}
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

const ecdsaMocks = vi.hoisted(() => ({
  generateECDSAKeyPair: vi.fn(() => ({ publicKey: 'ecdsa-pub', privateKey: 'ecdsa-priv' })),
  ecdsaSign: vi.fn(() => 'ecdsa-signature'),
  ecdsaVerify: vi.fn(() => true),
  ecdsaSignBytes: vi.fn(() => 'ecdsa-signature-bytes'),
  ecdsaVerifyBytes: vi.fn(() => true),
  hashMessageToUint8Array: vi.fn(() => new Uint8Array([9, 9, 9])),
}));

vi.mock('../../utils/asymmetric-ec', () => ({
  generateECDSAKeyPair: ecdsaMocks.generateECDSAKeyPair,
  ecdsaSign: ecdsaMocks.ecdsaSign,
  ecdsaVerify: ecdsaMocks.ecdsaVerify,
  ecdsaSignBytes: ecdsaMocks.ecdsaSignBytes,
  ecdsaVerifyBytes: ecdsaMocks.ecdsaVerifyBytes,
}));

vi.mock('../../utils/hash-helpers', () => ({
  hashMessageToUint8Array: ecdsaMocks.hashMessageToUint8Array,
}));

describe('ECDSATab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('generates a key pair for the selected curve and signs/verifies in normal mode', async () => {
    render(<ECDSATab />);

    await userEvent.selectOptions(screen.getAllByLabelText('ecdsa-select')[0], 'p256');
    await userEvent.click(screen.getByRole('button', { name: /生成密钥对/i }));

    expect(ecdsaMocks.generateECDSAKeyPair).toHaveBeenCalledWith('p256');
    expect(screen.getByDisplayValue('ecdsa-pub')).toBeInTheDocument();
    expect(screen.getByDisplayValue('ecdsa-priv')).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText(/请输入要签名\/验签的内容/i), 'payload');
    await userEvent.click(screen.getByRole('button', { name: /^签名$/i }));
    expect(ecdsaMocks.ecdsaSign).toHaveBeenCalledWith('payload', 'ecdsa-priv', 'p256');
    expect(screen.getByDisplayValue('ecdsa-signature')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /^验签$/i }));
    expect(ecdsaMocks.ecdsaVerify).toHaveBeenCalledWith('payload', 'ecdsa-signature', 'ecdsa-pub', 'p256');
    await waitFor(() => {
      expect(message.success).toHaveBeenCalledWith('ECDSA 签名验证通过 ✓');
    });
  });

  it('uses prehash branch and auto-adjusts hash algorithm for p384', async () => {
    render(<ECDSATab />);

    await userEvent.click(screen.getByRole('switch'));
    await userEvent.selectOptions(screen.getAllByLabelText('ecdsa-select')[0], 'p384');
    await userEvent.click(screen.getByRole('button', { name: /生成密钥对/i }));
    await userEvent.type(screen.getByPlaceholderText(/请输入要签名\/验签的内容/i), 'payload');

    expect(screen.getAllByLabelText('ecdsa-select')[0]).toHaveValue('p384');

    await userEvent.click(screen.getByRole('button', { name: /^签名$/i }));
    expect(ecdsaMocks.hashMessageToUint8Array).toHaveBeenCalledWith('payload', 'SHA384');
    expect(ecdsaMocks.ecdsaSignBytes).toHaveBeenCalledWith(expect.any(Uint8Array), 'ecdsa-priv', 'p384');
    expect(screen.getByDisplayValue('ecdsa-signature-bytes')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /^验签$/i }));
    expect(ecdsaMocks.ecdsaVerifyBytes).toHaveBeenCalledWith(expect.any(Uint8Array), 'ecdsa-signature-bytes', 'ecdsa-pub', 'p384');
  });

  it('copies output and clears content', async () => {
    render(<ECDSATab />);

    await userEvent.click(screen.getByRole('button', { name: /生成密钥对/i }));
    await userEvent.type(screen.getByPlaceholderText(/请输入要签名\/验签的内容/i), 'payload');
    await userEvent.click(screen.getByRole('button', { name: /^签名$/i }));

    await userEvent.click(screen.getByRole('button', { name: /^复制$/i }));
    await waitFor(() => {
      expect(message.success).toHaveBeenCalledWith('已复制到剪贴板');
    });

    await userEvent.click(screen.getByRole('button', { name: /清空/i }));
    expect(screen.getByPlaceholderText(/请输入要签名\/验签的内容/i)).toHaveValue('');
  });

  it('shows warnings when required fields are missing', async () => {
    render(<ECDSATab />);

    await userEvent.click(screen.getByRole('button', { name: /^签名$/i }));
    expect(message.warning).toHaveBeenCalledWith('请输入要签名的内容');

    await userEvent.type(screen.getByPlaceholderText(/请输入要签名\/验签的内容/i), 'payload');
    await userEvent.click(screen.getByRole('button', { name: /^验签$/i }));
    expect(message.warning).toHaveBeenCalledWith('请在结果框输入签名');
  });
});
