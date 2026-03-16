import { describe, it, expect } from 'vitest';
import { render, screen, userEvent } from '@/test/utils';
import HttpDebugTool from './HttpDebugTool';

describe('HttpDebugTool', () => {
  it('renders and switches between http and websocket tabs', async () => {
    render(<HttpDebugTool />);

    expect(
      await screen.findByPlaceholderText(/输入请求 URL，如 https:\/\/api\.example\.com\/path/i)
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: /WebSocket/i }));

    expect(
      await screen.findByPlaceholderText(/输入 WebSocket URL，如 ws:\/\/localhost:8080\/ws/i)
    ).toBeInTheDocument();
  });
});
