import { describe, it, expect } from 'vitest';
import { render, screen, userEvent } from '@/test/utils';
import QRCodeTool from './QRCodeTool';

describe('QRCodeTool', () => {
  it('renders and switches qr code tabs', async () => {
    render(<QRCodeTool initialTab="generate" />);

    expect(await screen.findByText(/生成选项/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: /识别二维码/i }));
    expect(await screen.findByText(/识别方式/i)).toBeInTheDocument();
  });
});
