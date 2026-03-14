import { describe, it, expect } from 'vitest';
import { render, screen, userEvent } from '@/test/utils';
import RegexTool from './RegexTool';

describe('RegexTool', () => {
  it('renders and switches regex tabs', async () => {
    render(<RegexTool initialTab="test" />);

    expect(await screen.findByText(/常用模板/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: /替换/i }));
    expect(await screen.findByText(/替换为/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: /分割/i }));
    expect(await screen.findByText(/分割结果/i)).toBeInTheDocument();
  });
});
