import { fireEvent, render, screen } from '@testing-library/react';
import { message } from 'antd';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TimezoneTab from './TimezoneTab';

describe('TimezoneTab', () => {
  beforeEach(() => {
    vi.spyOn(message, 'error').mockImplementation(() => ({}) as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows validation error for invalid input', () => {
    render(<TimezoneTab />);

    fireEvent.change(screen.getByPlaceholderText(/输入时间/), {
      target: { value: 'not-a-time' },
    });
    fireEvent.click(screen.getByRole('button', { name: /转换时区/ }));

    expect(message.error).toHaveBeenCalledWith('请输入有效的时间');
  });

  it('converts timestamp input into a formatted result', () => {
    render(<TimezoneTab />);

    fireEvent.change(screen.getByPlaceholderText(/输入时间/), {
      target: { value: '1700000000' },
    });
    fireEvent.click(screen.getByRole('button', { name: /转换时区/ }));

    expect((screen.getAllByRole('textbox')[1] as HTMLInputElement).value).not.toBe('');
  });
});
