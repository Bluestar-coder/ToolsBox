import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { message } from 'antd';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CodeGenTab from './CodeGenTab';

describe('CodeGenTab', () => {
  beforeEach(() => {
    vi.spyOn(message, 'error').mockImplementation(() => ({}) as never);
    vi.spyOn(message, 'success').mockImplementation(() => ({}) as never);
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('generates language specific code from valid time input', () => {
    render(<CodeGenTab />);

    fireEvent.change(screen.getByPlaceholderText(/输入时间戳或时间字符串/), {
      target: { value: '1699999999' },
    });
    fireEvent.click(screen.getByRole('button', { name: /生成代码/ }));

    expect((screen.getAllByRole('textbox').at(-1) as HTMLTextAreaElement).value).toContain('const date = new Date(');
  });

  it('copies generated code and validates invalid input', async () => {
    render(<CodeGenTab />);

    fireEvent.click(screen.getByRole('button', { name: /生成代码/ }));
    expect(message.error).toHaveBeenCalledWith('请输入有效的时间');

    fireEvent.change(screen.getByPlaceholderText(/输入时间戳或时间字符串/), {
      target: { value: '1699999999' },
    });
    fireEvent.click(screen.getByRole('button', { name: /生成代码/ }));
    fireEvent.click(screen.getAllByRole('textbox').at(-1) as HTMLTextAreaElement);

    await waitFor(() => {
      expect(message.success).toHaveBeenCalledWith('已复制');
    });
  });
});
