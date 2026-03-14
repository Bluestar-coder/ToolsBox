import { describe, it, expect } from 'vitest';
import { render, screen, userEvent } from '@/test/utils';
import DiffTool from './DiffTool';

describe('DiffTool', () => {
  it('renders diff result from user input', async () => {
    render(<DiffTool />);

    await userEvent.type(screen.getByPlaceholderText(/原始内容/i), 'alpha{enter}beta');
    await userEvent.type(screen.getByPlaceholderText(/修改后的内容/i), 'alpha{enter}gamma');

    expect(await screen.findByText(/对比结果/i)).toBeInTheDocument();
    expect(screen.getByText(/\+1/)).toBeInTheDocument();
    expect(screen.getByText(/-1/)).toBeInTheDocument();
  });

  it('swaps and clears text inputs', async () => {
    render(<DiffTool />);

    const originalInput = screen.getByPlaceholderText(/原始内容/i);
    const modifiedInput = screen.getByPlaceholderText(/修改后的内容/i);

    await userEvent.type(originalInput, 'left');
    await userEvent.type(modifiedInput, 'right');
    await userEvent.click(screen.getByRole('button', { name: /交换/i }));

    expect(screen.getByDisplayValue('right')).toBeInTheDocument();
    expect(screen.getByDisplayValue('left')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /清空/i }));
    expect(originalInput).toHaveValue('');
    expect(modifiedInput).toHaveValue('');
  });
});
