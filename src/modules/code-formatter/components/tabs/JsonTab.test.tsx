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
});
