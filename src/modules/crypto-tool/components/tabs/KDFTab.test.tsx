import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent, waitFor } from '@/test/utils';
import { message } from 'antd';
import KDFTab from './KDFTab';

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
        id,
        'aria-label': ariaLabel,
      }: {
        value?: string;
        onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
        placeholder?: string;
        id?: string;
        'aria-label'?: string;
      }) => (
        <input id={id} aria-label={ariaLabel} value={value} onChange={onChange} placeholder={placeholder} />
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
    InputNumber: ({
      value,
      onChange,
    }: {
      value?: number;
      onChange?: (value: number) => void;
    }) => (
      <input
        type="number"
        value={value}
        onChange={(event) => onChange?.(Number(event.target.value))}
      />
    ),
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
        aria-label={placeholder ?? 'kdf-select'}
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
    Tabs: ({
      activeKey,
      onChange,
      items,
    }: {
      activeKey: string;
      onChange: (key: string) => void;
      items: Array<{ key: string; label: string; children: React.ReactNode }>;
    }) => (
      <div>
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
        <div>{items.find((item) => item.key === activeKey)?.children}</div>
      </div>
    ),
  };
});

const kdfMocks = vi.hoisted(() => ({
  pbkdf2Derive: vi.fn(() => 'pbkdf2-derived'),
  hmacGenerate: vi.fn(() => 'hmac-result'),
  hmacVerify: vi.fn(() => true),
  generateSalt: vi.fn(() => 'salt-hex'),
  hkdfDerive: vi.fn(async () => 'hkdf-result'),
}));

vi.mock('../../utils/kdf', () => ({
  pbkdf2Derive: kdfMocks.pbkdf2Derive,
  hmacGenerate: kdfMocks.hmacGenerate,
  hmacVerify: kdfMocks.hmacVerify,
  generateSalt: kdfMocks.generateSalt,
  hkdfDerive: kdfMocks.hkdfDerive,
}));

describe('KDFTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('derives a PBKDF2 key and supports salt generation', async () => {
    render(<KDFTab />);

    await userEvent.click(screen.getByRole('button', { name: /生成盐/i }));
    expect(kdfMocks.generateSalt).toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText('密码'), 'secret');
    await userEvent.click(screen.getByRole('button', { name: /派生密钥/i }));

    expect(kdfMocks.pbkdf2Derive).toHaveBeenCalledWith('secret', 'salt-hex', 10000, 256, 'SHA256');
    expect(screen.getByDisplayValue('pbkdf2-derived')).toBeInTheDocument();
    expect(message.success).toHaveBeenCalledWith('密钥派生成功');
  });

  it('generates and verifies HMAC', async () => {
    render(<KDFTab />);

    await userEvent.click(screen.getByRole('tab', { name: 'HMAC' }));
    await userEvent.type(screen.getByPlaceholderText(/输入消息/i), 'payload');
    await userEvent.type(screen.getByLabelText('密钥'), 'secret');

    await userEvent.click(screen.getByRole('button', { name: /生成 HMAC/i }));
    expect(kdfMocks.hmacGenerate).toHaveBeenCalledWith('payload', 'secret', 'SHA256');
    expect(screen.getByDisplayValue('hmac-result')).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText(/输入待验证的 HMAC/i), 'hmac-result');
    await userEvent.click(screen.getByRole('button', { name: /验证 HMAC/i }));
    expect(kdfMocks.hmacVerify).toHaveBeenCalledWith('payload', 'secret', 'hmac-result', 'SHA256');
    expect(message.success).toHaveBeenCalledWith('HMAC 验证通过');
  });

  it('derives HKDF output and validates required input', async () => {
    render(<KDFTab />);

    await userEvent.click(screen.getByRole('tab', { name: 'HKDF' }));
    await userEvent.click(screen.getByRole('button', { name: /派生密钥/i }));
    expect(message.warning).toHaveBeenCalledWith('请输入输入密钥材料');

    await userEvent.type(screen.getByLabelText('IKM'), 'ikm');
    await userEvent.type(screen.getByLabelText('Salt'), 'salt');
    await userEvent.type(screen.getByLabelText('Info'), 'context');
    await userEvent.click(screen.getByRole('button', { name: /派生密钥/i }));

    await waitFor(() => {
      expect(kdfMocks.hkdfDerive).toHaveBeenCalledWith('ikm', 'salt', 'context', 32);
    });
    expect(screen.getByDisplayValue('hkdf-result')).toBeInTheDocument();
    expect(message.success).toHaveBeenCalledWith('HKDF 派生成功');
  });
});
