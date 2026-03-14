import { describe, it, expect } from 'vitest';
import { render, screen, userEvent } from '@/test/utils';
import CryptoTool from './CryptoTool';

describe('CryptoTool', () => {
  it('renders and switches key crypto views', async () => {
    render(<CryptoTool initialType="jwt" />);

    expect(await screen.findByText(/验证选项/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: /#️⃣ 哈希算法/i }));
    await userEvent.click(screen.getByRole('tab', { name: /^MD5\/SHA$/i }));
    expect(await screen.findByPlaceholderText(/请输入要计算哈希的内容/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: /🔑 非对称加密/i }));
    await userEvent.click(screen.getByRole('tab', { name: /X25519/i }));
    expect(await screen.findByPlaceholderText(/计算后显示共享密钥/i)).toBeInTheDocument();
  });
});
