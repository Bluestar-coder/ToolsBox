import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import HttpDebugPage from './HttpDebugPage';

describe('HttpDebugPage', () => {
  it('renders http debug page content', async () => {
    render(<HttpDebugPage />);

    expect(
      await screen.findByPlaceholderText(/输入请求 URL，如 https:\/\/api\.example\.com\/path/i)
    ).toBeInTheDocument();
  });
});
