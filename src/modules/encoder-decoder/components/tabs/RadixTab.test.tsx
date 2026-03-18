import { beforeEach, describe, it, expect, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import type { ChangeEvent, ReactNode } from 'react';
import { render, screen, userEvent, waitFor } from '@/test/utils';
import { message } from 'antd';
import RadixTab from './RadixTab';

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();

  return {
    ...actual,
    message: {
      success: vi.fn(),
      warning: vi.fn(),
      error: vi.fn(),
    },
    Card: ({ children }: { children?: ReactNode }) => <section>{children}</section>,
    Space: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
    Button: ({
      children,
      onClick,
    }: {
      children?: ReactNode;
      onClick?: () => void;
    }) => (
      <button type="button" onClick={onClick}>
        {children}
      </button>
    ),
    Tabs: ({
      activeKey,
      onChange,
      items,
    }: {
      activeKey?: string;
      onChange?: (value: string) => void;
      items?: Array<{ key: string; label: ReactNode }>;
    }) => (
      <div role="tablist">
        {(items ?? []).map((item) => (
          <button
            key={item.key}
            role="tab"
            aria-selected={item.key === activeKey}
            onClick={() => onChange?.(item.key)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>
    ),
    Input: Object.assign(
      ({
        value,
        onChange,
        readOnly,
        placeholder,
      }: {
        value?: string;
        onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
        readOnly?: boolean;
        placeholder?: string;
      }) => (
        <input
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          placeholder={placeholder}
        />
      ),
      {
        TextArea: ({
          value,
          onChange,
          placeholder,
        }: {
          value?: string;
          onChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void;
          placeholder?: string;
        }) => <textarea value={value} onChange={onChange} placeholder={placeholder} />,
      }
    ),
    InputNumber: ({
      value,
      onChange,
    }: {
      value?: number;
      onChange?: (value: number | null) => void;
    }) => (
      <input
        type="number"
        value={value}
        onChange={(event) => onChange?.(Number(event.target.value))}
      />
    ),
  };
});

describe('RadixTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('converts decimal input into multiple radix outputs and clears content', async () => {
    const { container } = render(<RadixTab />);

    fireEvent.change(screen.getByPlaceholderText(/请输入要转换的数值/i), {
      target: { value: '255' },
    });
    await userEvent.click(screen.getByRole('button', { name: /转\s*换/i }));

    await waitFor(() => {
      const outputs = Array.from(
        container.querySelectorAll('input[readonly]')
      ).map((input) => (input as HTMLInputElement).value);

      expect(outputs).toEqual(
        expect.arrayContaining(['11111111', '377', '255', 'FF'])
      );
    });

    await userEvent.click(screen.getByRole('button', { name: /清空/i }));
    expect(screen.getByPlaceholderText(/请输入要转换的数值/i)).toHaveValue('');
  });

  it('warns on empty input and reports invalid values', async () => {
    render(<RadixTab />);

    await userEvent.click(screen.getByRole('button', { name: /转\s*换/i }));
    expect(message.warning).toHaveBeenCalledWith('请输入要转换的数值');

    fireEvent.change(screen.getByPlaceholderText(/请输入要转换的数值/i), {
      target: { value: 'ZZ' },
    });
    await userEvent.click(screen.getByRole('button', { name: /转\s*换/i }));
    expect(message.error).toHaveBeenCalledWith('转换失败，请检查输入是否符合所选进制');
  });

  it('supports custom radix mode and copies converted output', async () => {
    const { container } = render(<RadixTab />);

    await userEvent.click(screen.getByRole('tab', { name: /自定义/i }));
    const numberInput = container.querySelector('input[type="number"]') as HTMLInputElement;
    fireEvent.change(numberInput, { target: { value: '3' } });
    fireEvent.change(screen.getByPlaceholderText(/请输入要转换的数值/i), {
      target: { value: '102' },
    });
    await userEvent.click(screen.getByRole('button', { name: /转\s*换/i }));

    await waitFor(() => {
      const outputs = Array.from(
        container.querySelectorAll('input[readonly]')
      ).map((input) => (input as HTMLInputElement).value);

      expect(outputs).toEqual(
        expect.arrayContaining(['1011', '13', '11', 'B', '102'])
      );
    });

    const copyButtons = screen.getAllByRole('button', { name: /复制/i });
    await userEvent.click(copyButtons[0]);
    expect(message.success).toHaveBeenCalledWith('已复制到剪贴板');
  });
});
