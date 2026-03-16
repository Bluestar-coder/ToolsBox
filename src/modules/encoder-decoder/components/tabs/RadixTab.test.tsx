import { describe, it, expect, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import type { ChangeEvent, ReactNode } from 'react';
import { render, screen, userEvent, waitFor } from '@/test/utils';
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
});
