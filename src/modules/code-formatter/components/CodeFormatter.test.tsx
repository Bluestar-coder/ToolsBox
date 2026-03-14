import { describe, it, expect } from 'vitest';
import { render, screen, userEvent } from '@/test/utils';
import CodeFormatter from './CodeFormatter';

describe('CodeFormatter', () => {
  it('renders and switches formatter tabs', async () => {
    render(<CodeFormatter initialTab="json" />);

    expect(await screen.findByText(/输入 JSON/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: /SQL/i }));
    expect(await screen.findByText(/输入 SQL/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: /HTTP/i }));
    expect(await screen.findByText(/输入 HTTP 报文/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: /其他语言/i }));
    expect(await screen.findByText(/输入代码/i)).toBeInTheDocument();
  });
});
