import { describe, it, expect } from 'vitest';
import { render, screen, userEvent } from '@/test/utils';
import HashTab from './HashTab';

describe('HashTab', () => {
  it('calculates hashes for input text', async () => {
    render(<HashTab />);

    await userEvent.type(screen.getByPlaceholderText(/请输入要计算哈希的内容/i), 'hello');
    await userEvent.click(screen.getByRole('button', { name: /计算哈希/i }));

    expect(await screen.findByDisplayValue('5d41402abc4b2a76b9719d911017c592')).toBeInTheDocument();
  });

  it('clears the pending hash input', async () => {
    render(<HashTab />);

    const input = screen.getByPlaceholderText(/请输入要计算哈希的内容/i);

    await userEvent.type(input, 'toolsbox');
    await userEvent.click(screen.getByRole('button', { name: /清\s*空/i }));

    expect(input).toHaveValue('');
  });
});
