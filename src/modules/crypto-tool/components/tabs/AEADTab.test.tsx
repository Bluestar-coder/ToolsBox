import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent, waitFor } from '@/test/utils';
import { message } from 'antd';
import AEADTab from './AEADTab';

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
    Select: ({
      value,
      onChange,
      options,
      placeholder,
    }: {
      value?: string | number;
      onChange?: (value: string) => void;
      options?: Array<{ value: string | number; label: string }>;
      placeholder?: string;
    }) => (
      <select
        aria-label={placeholder ?? 'aead-select'}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
      >
        {(options ?? []).map((option) => (
          <option key={String(option.value)} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    ),
  };
});

const aeadMocks = vi.hoisted(() => ({
  nobleAesGcmEncrypt: vi.fn(() => ({ ciphertext: 'cipher-hex', tag: 'tag-hex' })),
  nobleAesGcmDecrypt: vi.fn(() => 'plain-text'),
  aesSivEncrypt: vi.fn(() => ({ ciphertext: 'siv-cipher', tag: 'siv-tag' })),
  aesSivDecrypt: vi.fn(() => 'siv-plain'),
  chacha20Encrypt: vi.fn(() => ({ ciphertext: 'cha-cipher', tag: 'cha-tag' })),
  chacha20Decrypt: vi.fn(() => 'cha-plain'),
  generateRandomBytes: vi.fn((length: number) => new Uint8Array(length).fill(0xaa)),
  uint8ArrayToHex: vi.fn((bytes: Uint8Array) => Array.from(bytes).map(() => 'aa').join('')),
  parseKeyToUint8Array: vi.fn((input: string) => {
    switch (input) {
      case 'key16':
        return new Uint8Array(16);
      case 'key32':
        return new Uint8Array(32);
      case 'badkey':
        return new Uint8Array(10);
      case 'iv12':
        return new Uint8Array(12);
      case 'badiv':
        return new Uint8Array(8);
      default:
        return new Uint8Array(16);
    }
  }),
}));

vi.mock('../../utils/aead', () => ({
  nobleAesGcmEncrypt: aeadMocks.nobleAesGcmEncrypt,
  nobleAesGcmDecrypt: aeadMocks.nobleAesGcmDecrypt,
  aesSivEncrypt: aeadMocks.aesSivEncrypt,
  aesSivDecrypt: aeadMocks.aesSivDecrypt,
  chacha20Encrypt: aeadMocks.chacha20Encrypt,
  chacha20Decrypt: aeadMocks.chacha20Decrypt,
}));

vi.mock('../../utils/helpers', () => ({
  generateRandomBytes: aeadMocks.generateRandomBytes,
  uint8ArrayToHex: aeadMocks.uint8ArrayToHex,
  parseKeyToUint8Array: aeadMocks.parseKeyToUint8Array,
}));

describe('AEADTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('encrypts and decrypts in aes-gcm mode and copies ciphertext', async () => {
    render(<AEADTab activeTab="aes-gcm" />);

    await userEvent.type(screen.getByPlaceholderText(/请在这里填写原文\/密文/i), 'payload');
    await userEvent.type(screen.getByPlaceholderText(/16或32字节/i), 'key16');
    await userEvent.type(screen.getByPlaceholderText(/推荐12字节/i), 'iv12');

    await userEvent.click(screen.getByRole('button', { name: /加密/i }));
    expect(aeadMocks.nobleAesGcmEncrypt).toHaveBeenCalled();
    expect(screen.getByDisplayValue('cipher-hex')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/解密时需要输入加密生成的Tag/i)).toHaveValue('tag-hex');

    await userEvent.click(screen.getByRole('button', { name: /复制密文/i }));
    await waitFor(() => {
      expect(message.success).toHaveBeenCalledWith('已复制到剪贴板');
    });

    await userEvent.clear(screen.getByPlaceholderText(/请在这里填写原文\/密文/i));
    await userEvent.type(screen.getByPlaceholderText(/请在这里填写原文\/密文/i), 'cipher-hex');
    await userEvent.click(screen.getByRole('button', { name: /解密/i }));
    expect(aeadMocks.nobleAesGcmDecrypt).toHaveBeenCalledWith('cipher-hex', 'tag-hex', expect.any(Uint8Array), expect.any(Uint8Array));
  });

  it('uses aes-siv branch and clears all fields', async () => {
    render(<AEADTab activeTab="aes-siv" />);

    await userEvent.type(screen.getByPlaceholderText(/请在这里填写原文\/密文/i), 'payload');
    await userEvent.type(screen.getByPlaceholderText(/16或32字节/i), 'key16');
    await userEvent.type(screen.getByPlaceholderText(/推荐12字节/i), 'iv12');

    await userEvent.click(screen.getByRole('button', { name: /加密/i }));
    expect(aeadMocks.aesSivEncrypt).toHaveBeenCalled();
    expect(screen.getByDisplayValue('siv-cipher')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /清空/i }));
    expect(screen.getByPlaceholderText(/请在这里填写原文\/密文/i)).toHaveValue('');
    expect(screen.getByPlaceholderText(/16或32字节/i)).toHaveValue('');
    expect(screen.getByPlaceholderText(/推荐12字节/i)).toHaveValue('');
  });

  it('validates chacha20 key and nonce lengths', async () => {
    render(<AEADTab activeTab="chacha20" />);

    await userEvent.type(screen.getByPlaceholderText(/请在这里填写原文\/密文/i), 'payload');
    await userEvent.type(screen.getByPlaceholderText(/16或32字节/i), 'badkey');
    await userEvent.type(screen.getByPlaceholderText(/推荐12字节/i), 'badiv');

    await userEvent.click(screen.getByRole('button', { name: /加密/i }));
    expect(message.error).toHaveBeenCalledWith('ChaCha20-Poly1305 密钥必须是 32 字节');
  });
});
