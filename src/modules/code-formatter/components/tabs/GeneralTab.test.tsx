import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { message } from 'antd';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFormatGeneralCode, mockMinifyGeneralCode, mockCheckSyntax } = vi.hoisted(() => ({
  mockFormatGeneralCode: vi.fn(async (input: string) => `formatted:${input}`),
  mockMinifyGeneralCode: vi.fn(async (input: string) => `min:${input}`),
  mockCheckSyntax: vi.fn(() => ({ valid: true, warnings: [], errors: [] })),
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
      data-testid={readOnly ? 'formatter-output' : 'formatter-input'}
      value={value}
      placeholder={placeholder}
      readOnly={readOnly}
      onChange={(event) => onChange?.(event.target.value)}
    />
  ),
}));

vi.mock('../../utils/general-formatters', () => ({
  formatGeneralCode: mockFormatGeneralCode,
  minifyGeneralCode: mockMinifyGeneralCode,
}));

vi.mock('../../utils/syntax-checker', () => ({
  checkSyntax: mockCheckSyntax,
}));

import GeneralTab from './GeneralTab';

describe('GeneralTab', () => {
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
    mockFormatGeneralCode.mockClear();
    mockMinifyGeneralCode.mockClear();
    mockCheckSyntax.mockReset();
    mockCheckSyntax.mockReturnValue({ valid: true, warnings: [], errors: [] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('formats code and copies the output', async () => {
    render(<GeneralTab />);

    fireEvent.change(screen.getByTestId('formatter-input'), {
      target: { value: 'const x=1;' },
    });
    fireEvent.click(screen.getByRole('button', { name: /格式化/ }));

    await waitFor(() => {
      expect(screen.getByTestId('formatter-output')).toHaveValue('formatted:const x=1;');
    });
    fireEvent.click(screen.getByRole('button', { name: /复制/ }));

    await waitFor(() => {
      expect(message.success).toHaveBeenCalledWith('已复制到剪贴板');
    });
  });

  it('minifies code and reports syntax problems', async () => {
    mockCheckSyntax.mockReturnValueOnce({
      valid: false,
      warnings: [],
      errors: [{ line: 1, column: 1, message: 'Unexpected token', severity: 'error' }],
    });

    render(<GeneralTab />);

    fireEvent.change(screen.getByTestId('formatter-input'), {
      target: { value: 'broken(' },
    });
    fireEvent.click(screen.getByRole('button', { name: /格式化/ }));

    await waitFor(() => {
      expect(message.warning).toHaveBeenCalledWith('检测到语法问题，已尽力处理，结果可能不完整');
    });
    fireEvent.click(screen.getByRole('button', { name: /压缩/ }));

    await waitFor(() => {
      expect(screen.getByTestId('formatter-output')).toHaveValue('min:broken(');
    });
    fireEvent.click(screen.getByRole('button', { name: /清空/ }));

    expect(screen.getByTestId('formatter-input')).toHaveValue('');
    expect(screen.getByTestId('formatter-output')).toHaveValue('');
  });
});
