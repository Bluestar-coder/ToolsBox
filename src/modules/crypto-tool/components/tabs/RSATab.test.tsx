import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent, waitFor } from '@/test/utils';
import { message } from 'antd';
import RSATab from './RSATab';

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
      }) => (
        <input
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
      ),
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
        }) => (
          <textarea
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            readOnly={readOnly}
          />
        ),
      }
    ),
    Select: ({
      value,
      onChange,
      options,
    }: {
      value: number;
      onChange: (value: number) => void;
      options: Array<{ value: number; label: string }>;
    }) => (
      <select
        aria-label="rsa-key-size"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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
    Tabs: ({
      activeKey,
      onChange,
      items,
    }: {
      activeKey: string;
      onChange: (key: string) => void;
      items: Array<{ key: string; label: string }>;
    }) => (
      <div role="tablist">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={activeKey === item.key}
            onClick={() => onChange(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>
    ),
  };
});

const rsaMocks = vi.hoisted(() => ({
  generateRSAKeyPair: vi.fn(async () => ({ publicKey: 'enc-pub', privateKey: 'enc-priv' })),
  generateRSASignKeyPair: vi.fn(async () => ({ publicKey: 'sign-pub', privateKey: 'sign-priv' })),
  rsaEncryptAuto: vi.fn(async () => 'encrypted-payload'),
  rsaDecryptAuto: vi.fn(async () => 'decrypted-payload'),
  rsaSign: vi.fn(async () => 'signed-payload'),
  rsaVerify: vi.fn(async () => true),
}));

vi.mock('../../utils/asymmetric', () => ({
  generateRSAKeyPair: rsaMocks.generateRSAKeyPair,
  generateRSASignKeyPair: rsaMocks.generateRSASignKeyPair,
  rsaEncryptAuto: rsaMocks.rsaEncryptAuto,
  rsaDecryptAuto: rsaMocks.rsaDecryptAuto,
  rsaSign: rsaMocks.rsaSign,
  rsaVerify: rsaMocks.rsaVerify,
}));

describe('RSATab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('generates encryption key pair with selected key size', async () => {
    render(<RSATab />);

    await userEvent.selectOptions(screen.getByLabelText('rsa-key-size'), '4096');
    await userEvent.click(screen.getByRole('button', { name: /生成密钥对/i }));

    expect(rsaMocks.generateRSAKeyPair).toHaveBeenCalledWith(4096);
    expect(await screen.findByDisplayValue('enc-pub')).toBeInTheDocument();
    expect(screen.getByDisplayValue('enc-priv')).toBeInTheDocument();
  });

  it('encrypts, decrypts, copies output and clears content in encrypt mode', async () => {
    render(<RSATab />);

    await userEvent.type(screen.getByPlaceholderText(/请输入要加密\/解密的内容/i), 'hello world');
    await userEvent.type(screen.getByPlaceholderText(/PEM 格式公钥/i), 'enc-pub');
    await userEvent.type(screen.getByPlaceholderText(/PEM 格式私钥/i), 'enc-priv');

    await userEvent.click(screen.getByRole('button', { name: /加\s*密/i }));
    expect(rsaMocks.rsaEncryptAuto).toHaveBeenCalledWith('hello world', 'enc-pub');
    expect(await screen.findByDisplayValue('encrypted-payload')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /^复制$/i }));
    await waitFor(() => {
      expect(message.success).toHaveBeenCalledWith('已复制到剪贴板');
    });

    await userEvent.clear(screen.getByPlaceholderText(/请输入要加密\/解密的内容/i));
    await userEvent.type(screen.getByPlaceholderText(/请输入要加密\/解密的内容/i), 'ciphertext');
    await userEvent.click(screen.getByRole('button', { name: /解\s*密/i }));
    expect(rsaMocks.rsaDecryptAuto).toHaveBeenCalledWith('ciphertext', 'enc-priv');
    expect(await screen.findByDisplayValue('decrypted-payload')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /清空/i }));
    expect(screen.getByPlaceholderText(/请输入要加密\/解密的内容/i)).toHaveValue('');
  });

  it('signs and verifies in sign mode and clears state when mode changes', async () => {
    render(<RSATab />);

    await userEvent.click(screen.getByRole('tab', { name: /签名\/验签/i }));
    await userEvent.type(screen.getByPlaceholderText(/请输入要签名\/验签的内容/i), 'payload');
    await userEvent.type(screen.getByPlaceholderText(/PEM 格式私钥/i), 'sign-priv');
    await userEvent.type(screen.getByPlaceholderText(/PEM 格式公钥/i), 'sign-pub');

    await userEvent.click(screen.getByRole('button', { name: /^签名$/i }));
    expect(rsaMocks.rsaSign).toHaveBeenCalledWith('payload', 'sign-priv');
    expect(await screen.findByDisplayValue('signed-payload')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /^验签$/i }));
    expect(rsaMocks.rsaVerify).toHaveBeenCalledWith('payload', 'signed-payload', 'sign-pub');
    await waitFor(() => {
      expect(message.success).toHaveBeenCalledWith('RSA 签名验证通过 ✓');
    });

    await userEvent.click(screen.getByRole('tab', { name: /加密\/解密/i }));
    expect(screen.getByPlaceholderText(/请输入要加密\/解密的内容/i)).toHaveValue('');
    expect(screen.getByPlaceholderText(/PEM 格式公钥/i)).toHaveValue('');
    expect(screen.getByPlaceholderText(/PEM 格式私钥/i)).toHaveValue('');
  });

  it('shows warnings when required fields are missing', async () => {
    render(<RSATab />);

    await userEvent.click(screen.getByRole('button', { name: /加\s*密/i }));
    expect(message.warning).toHaveBeenCalledWith('请输入要加密的内容');

    await userEvent.click(screen.getByRole('tab', { name: /签名\/验签/i }));
    await userEvent.type(screen.getByPlaceholderText(/请输入要签名\/验签的内容/i), 'payload');
    await userEvent.click(screen.getByRole('button', { name: /^验签$/i }));
    expect(message.warning).toHaveBeenCalledWith('请在结果框输入签名');
  });
});
