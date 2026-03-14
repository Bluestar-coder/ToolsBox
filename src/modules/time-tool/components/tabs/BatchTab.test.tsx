import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import BatchTab from './BatchTab';

describe('BatchTab', () => {
  it('converts multiple lines and reports invalid values', () => {
    render(<BatchTab />);

    fireEvent.change(screen.getByPlaceholderText(/输入多个时间值/), {
      target: { value: '1699999999\noops' },
    });

    fireEvent.click(screen.getByRole('button', { name: /批量转换/ }));

    const output = screen.getByPlaceholderText('转换结果将显示在这里') as HTMLTextAreaElement;
    expect(output.value).toContain('1699999999 → ');
    expect(output.value).toContain('(1699999999)');
    expect(output.value).toContain('oops → 无法解析');
  });

  it('clears both input and output', () => {
    render(<BatchTab />);

    fireEvent.change(screen.getByPlaceholderText(/输入多个时间值/), {
      target: { value: '1699999999' },
    });
    fireEvent.click(screen.getByRole('button', { name: /批量转换/ }));
    fireEvent.click(screen.getByRole('button', { name: /清\s*空/ }));

    expect((screen.getByPlaceholderText(/输入多个时间值/) as HTMLTextAreaElement).value).toBe('');
    expect((screen.getByPlaceholderText('转换结果将显示在这里') as HTMLTextAreaElement).value).toBe('');
  });
});
