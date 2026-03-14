import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, userEvent, waitFor } from '@/test/utils';
import JsonTab from './JsonTab';

describe('JsonTab', () => {
  it('formats and minifies json input', async () => {
    render(<JsonTab />);

    const input = screen.getAllByRole('textbox')[0];
    fireEvent.change(input, { target: { value: '{ "a": 1, "b": { "c": 2 } }' } });

    await userEvent.click(screen.getByRole('button', { name: /格式化/i }));
    await waitFor(() => {
      expect(screen.getByText('总键数')).toBeInTheDocument();
      expect(screen.queryByText('请先格式化 JSON')).not.toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /压缩/i }));
    await waitFor(() => {
      const values = Array.from(document.querySelectorAll('textarea')).map(
        (element) => (element as HTMLTextAreaElement).value
      );
      expect(values).toContain('{"a":1,"b":{"c":2}}');
    });
  });

  it('supports path query and compare mode after formatting', async () => {
    render(<JsonTab />);

    const input = screen.getAllByRole('textbox')[0];
    fireEvent.change(input, { target: { value: '{ "a": 1, "b": { "c": 2 } }' } });

    await userEvent.click(screen.getByRole('button', { name: /格式化/i }));

    fireEvent.change(screen.getByPlaceholderText(/JSONPath 查询/), {
      target: { value: '$.b.c' },
    });
    await userEvent.click(screen.getByRole('button', { name: /查\s*询/ }));

    await waitFor(() => {
      const values = Array.from(document.querySelectorAll('textarea')).map(
        (element) => (element as HTMLTextAreaElement).value
      );
      expect(values.some((value) => value.includes('2'))).toBe(true);
    });

    await userEvent.click(screen.getByRole('tab', { name: /JSON 比较/i }));
    const compareInput = screen.getByPlaceholderText(/输入要比较的第二个 JSON/i);
    fireEvent.change(compareInput, { target: { value: '{ "a": 1, "b": { "c": 3 } }' } });
    await userEvent.click(screen.getByRole('button', { name: /比较差异/i }));

    await waitFor(() => {
      expect(screen.getByDisplayValue(/root\.b\.c: 2 → 3/)).toBeInTheDocument();
    });
  });

  it('shows syntax errors for invalid json', async () => {
    render(<JsonTab />);

    const input = screen.getAllByRole('textbox')[0];
    fireEvent.change(input, { target: { value: '{invalid json}' } });
    fireEvent.click(screen.getByRole('button', { name: /检查/i }));
    expect(screen.getByText(/JSON 语法错误/i)).toBeInTheDocument();
  });

  it('supports escape, unescape and clear actions', async () => {
    render(<JsonTab />);

    const input = screen.getAllByRole('textbox')[0];

    fireEvent.change(input, { target: { value: '{"name":"A"}' } });
    fireEvent.click(screen.getByRole('button', { name: /加转义/i }));
    await waitFor(() => {
      const values = Array.from(document.querySelectorAll('textarea')).map(
        (element) => (element as HTMLTextAreaElement).value
      );
      expect(values).toContain('"{\\"name\\":\\"A\\"}"');
    });

    fireEvent.change(input, { target: { value: '"{\\"name\\":\\"A\\"}"' } });
    fireEvent.click(screen.getByRole('button', { name: /去转义/i }));
    await waitFor(() => {
      const values = Array.from(document.querySelectorAll('textarea')).map(
        (element) => (element as HTMLTextAreaElement).value
      );
      expect(values).toContain('{"name":"A"}');
    });

    fireEvent.click(screen.getByRole('button', { name: /清空/i }));
    expect((screen.getAllByRole('textbox')[0] as HTMLTextAreaElement).value).toBe('');
    expect((screen.getByPlaceholderText(/JSONPath 查询/) as HTMLInputElement).value).toBe('');
  });
});
