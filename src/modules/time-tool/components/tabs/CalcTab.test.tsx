import { fireEvent, render, screen } from '@testing-library/react';
import { message } from 'antd';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CalcTab from './CalcTab';

describe('CalcTab', () => {
  beforeEach(() => {
    vi.spyOn(message, 'error').mockImplementation(() => ({}) as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calculates time difference for valid inputs', () => {
    render(<CalcTab />);

    const inputs = screen.getAllByPlaceholderText(/时间/);
    fireEvent.change(inputs[0], { target: { value: '2024-01-01 00:00:00' } });
    fireEvent.change(inputs[1], { target: { value: '2024-01-02 01:02:03' } });

    fireEvent.click(screen.getByRole('button', { name: /计算时间差/ }));

    expect((screen.getAllByPlaceholderText('计算结果')[0] as HTMLTextAreaElement).value).toContain('相差: 1天 1小时 2分钟 3秒');
  });

  it('calculates add/subtract operations and validates invalid inputs', () => {
    render(<CalcTab />);

    fireEvent.click(screen.getByRole('button', { name: /计算结果/ }));
    expect(message.error).toHaveBeenCalledWith('请输入有效的基准时间');

    fireEvent.change(screen.getByPlaceholderText(/基准时间/), {
      target: { value: '2024-01-01 00:00:00' },
    });
    fireEvent.change(screen.getByRole('spinbutton'), {
      target: { value: '2' },
    });
    fireEvent.click(screen.getByRole('button', { name: /计算结果/ }));

    expect((screen.getAllByPlaceholderText('计算结果')[1] as HTMLInputElement).value).toBe('2024-01-03 00:00:00');
  });
});
