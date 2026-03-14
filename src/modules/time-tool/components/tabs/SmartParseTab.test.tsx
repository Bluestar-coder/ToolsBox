import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { message } from 'antd';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SmartParseTab from './SmartParseTab';

describe('SmartParseTab', () => {
  beforeEach(() => {
    vi.spyOn(message, 'success').mockImplementation(() => ({}) as never);
    vi.spyOn(message, 'error').mockImplementation(() => ({}) as never);
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

  it('parses quick action input and clears results', () => {
    render(<SmartParseTab />);

    fireEvent.click(screen.getByRole('button', { name: '当前时间' }));
    fireEvent.click(screen.getByRole('button', { name: /解析/ }));

    const output = screen.getByPlaceholderText('解析结果将显示在这里') as HTMLTextAreaElement;
    expect(output.value).toContain('Unix时间戳(秒):');
    expect(output.value).toContain('ISO 8601:');

    fireEvent.click(screen.getByRole('button', { name: /清\s*空/ }));
    expect((screen.getByPlaceholderText(/试试输入/) as HTMLTextAreaElement).value).toBe('');
    expect(output.value).toBe('');
  });

  it('copies parse result and reports copy success', async () => {
    render(<SmartParseTab />);

    fireEvent.change(screen.getByPlaceholderText(/试试输入/), {
      target: { value: '1699999999' },
    });
    fireEvent.click(screen.getByRole('button', { name: /解析/ }));
    fireEvent.click(screen.getByRole('button', { name: /复制结果/ }));

    await waitFor(() => {
      expect(message.success).toHaveBeenCalledWith('已复制');
    });
  });
});
