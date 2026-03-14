import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { message } from 'antd';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFormatSQL, mockMinifySQL } = vi.hoisted(() => ({
  mockFormatSQL: vi.fn(async (input: string) => `SELECT *\nFROM users\n-- ${input}`),
  mockMinifySQL: vi.fn((input: string) => `min:${input}`),
}));

vi.mock('../CodeEditor', () => ({
  default: ({
    value,
    onChange,
    readOnly,
    placeholder,
  }: {
    value: string;
    onChange?: (value: string) => void;
    readOnly?: boolean;
    placeholder?: string;
  }) => (
    <textarea
      data-testid={readOnly ? 'sql-output' : 'sql-input'}
      value={value}
      placeholder={placeholder}
      readOnly={readOnly}
      onChange={(event) => onChange?.(event.target.value)}
    />
  ),
}));

vi.mock('../../utils/sql-formatters', () => ({
  formatSQL: mockFormatSQL,
  minifySQL: mockMinifySQL,
}));

import SqlTab from './SqlTab';

describe('SqlTab', () => {
  beforeEach(() => {
    vi.spyOn(message, 'warning').mockImplementation(() => ({}) as never);
    vi.spyOn(message, 'success').mockImplementation(() => ({}) as never);
    vi.spyOn(message, 'info').mockImplementation(() => ({}) as never);
    vi.spyOn(message, 'error').mockImplementation(() => ({}) as never);
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
    mockFormatSQL.mockClear();
    mockMinifySQL.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('formats sql and shows statement analysis and table tags', async () => {
    render(<SqlTab />);

    fireEvent.change(screen.getByTestId('sql-input'), {
      target: { value: 'select * from users where id=1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /格式化/ }));

    await waitFor(() => {
      expect(screen.getByTestId('sql-output')).toHaveValue('SELECT *\nFROM users\n-- select * from users where id=1');
    });

    expect(screen.getByText('语句分析')).toBeInTheDocument();
    expect(screen.getByText('涉及的表')).toBeInTheDocument();
    expect(screen.getByText('users')).toBeInTheDocument();
  });

  it('runs text transforms, minifies, copies and clears', async () => {
    render(<SqlTab />);

    fireEvent.change(screen.getByTestId('sql-input'), {
      target: { value: 'select * from users -- note' },
    });
    fireEvent.click(screen.getByRole('button', { name: /大写/ }));
    expect((screen.getByTestId('sql-output') as HTMLTextAreaElement).value).toContain('SELECT');

    fireEvent.click(screen.getByRole('button', { name: /小\s*写/ }));
    expect((screen.getByTestId('sql-output') as HTMLTextAreaElement).value).toContain('select');

    fireEvent.click(screen.getByRole('button', { name: /去注释/ }));
    expect((screen.getByTestId('sql-output') as HTMLTextAreaElement).value).not.toContain('-- note');

    fireEvent.click(screen.getByRole('button', { name: /压缩/ }));
    await waitFor(() => {
      expect(screen.getByTestId('sql-output')).toHaveValue('min:select * from users -- note');
    });

    fireEvent.click(screen.getByRole('button', { name: /复制/ }));
    await waitFor(() => {
      expect(message.success).toHaveBeenCalledWith('已复制到剪贴板');
    });

    fireEvent.click(screen.getByRole('button', { name: /清空/ }));
    expect(screen.getByTestId('sql-input')).toHaveValue('');
    expect(screen.getByTestId('sql-output')).toHaveValue('');
  });
});
