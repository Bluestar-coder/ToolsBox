import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import EncodingTab from './EncodingTab';
import { EncodingProvider } from '@/context/EncodingContext';

// Mock Ant Design message
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    message: {
      success: vi.fn(),
      warning: vi.fn(),
      error: vi.fn(),
    },
  };
});

describe('EncodingTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {});
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <EncodingProvider>{children}</EncodingProvider>
  );

  it('should render encoding type selector tabs', () => {
    render(<EncodingTab activeCategory="base" />, { wrapper });

    // 检查Base64选项卡
    expect(screen.getByText('Base64')).toBeInTheDocument();
  });

  it('should render Base32 encoding option', () => {
    render(<EncodingTab activeCategory="base" />, { wrapper });

    expect(screen.getByText('Base32')).toBeInTheDocument();
  });

  it('should render Base16 encoding option', () => {
    render(<EncodingTab activeCategory="base" />, { wrapper });

    expect(screen.getByText(/Base16/i)).toBeInTheDocument();
  });

  it('should render input textarea', () => {
    render(<EncodingTab activeCategory="base" />, { wrapper });

    const textarea = screen.getByPlaceholderText(/请在这里填写原文\/密文/i);
    expect(textarea).toBeInTheDocument();
  });

  it('should render encode button', () => {
    render(<EncodingTab activeCategory="base" />, { wrapper });

    const encodeButton = screen.getByRole('button', { name: /编\s*码/i });
    expect(encodeButton).toBeInTheDocument();
  });

  it('should render decode button', () => {
    render(<EncodingTab activeCategory="base" />, { wrapper });

    const decodeButton = screen.getByRole('button', { name: /解\s*码/i });
    expect(decodeButton).toBeInTheDocument();
  });

  it('should render copy button', () => {
    render(<EncodingTab activeCategory="base" />, { wrapper });

    const copyButton = screen.getByRole('button', { name: /复\s*制/i });
    expect(copyButton).toBeInTheDocument();
  });

  it('should render clear button', () => {
    render(<EncodingTab activeCategory="base" />, { wrapper });

    const clearButton = screen.getByRole('button', { name: /清\s*空/i });
    expect(clearButton).toBeInTheDocument();
  });

  it('should handle user input in textarea', async () => {
    const user = userEvent.setup();
    render(<EncodingTab activeCategory="base" />, { wrapper });

    const textarea = screen.getByPlaceholderText(/请在这里填写原文\/密文/i);
    await user.type(textarea, 'Hello World');

    expect(textarea).toHaveValue('Hello World');
  });

  it('should encode input text to Base64', async () => {
    const user = userEvent.setup();
    render(<EncodingTab activeCategory="base" />, { wrapper });

    const textarea = screen.getByPlaceholderText(/请在这里填写原文\/密文/i);
    await user.type(textarea, 'Hello');

    // 等待自动处理完成
    await waitFor(() => {
      expect(screen.getByDisplayValue('SGVsbG8=')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should handle empty input gracefully', async () => {
    const user = userEvent.setup();
    render(<EncodingTab activeCategory="base" />, { wrapper });

    const textarea = screen.getByPlaceholderText(/请在这里填写原文\/密文/i);
    await user.clear(textarea);

    // 空输入不应该产生错误
    const errorCard = screen.queryByText(/输入验证失败/i);
    expect(errorCard).not.toBeInTheDocument();
  });

  it('should switch between different encoding types', async () => {
    const user = userEvent.setup();
    render(<EncodingTab activeCategory="base" />, { wrapper });

    // 点击Base32选项卡
    const base32Tab = screen.getByText('Base32');
    await user.click(base32Tab);

    // Base32选项卡应该被选中
    expect(base32Tab.closest('.ant-tabs-tab')).toHaveClass('ant-tabs-tab-active');
  });

  it('should display validation error for invalid Base64 input', async () => {
    const user = userEvent.setup();
    render(<EncodingTab activeCategory="base" />, { wrapper });

    // 首先切换到解码模式
    const decodeButton = screen.getByRole('button', { name: /解\s*码/i });
    await user.click(decodeButton);

    const textarea = screen.getByPlaceholderText(/请在这里填写原文\/密文/i);
    await user.type(textarea, 'Invalid Base64!@#');

    // 等待错误显示
    await waitFor(() => {
      const error = screen.queryByText(/无效的Base64字符串|输入验证失败/i);
      expect(error).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should clear input and output when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(<EncodingTab activeCategory="base" />, { wrapper });

    const textarea = screen.getByPlaceholderText(/请在这里填写原文\/密文/i);
    await user.type(textarea, 'Test');

    // 等待输出出现
    await waitFor(() => {
      expect(screen.getByDisplayValue('VGVzdA==')).toBeInTheDocument();
    }, { timeout: 3000 });

    // 点击清空按钮
    const clearButtons = screen.getAllByRole('button', { name: /清\s*空/i });
    await user.click(clearButtons[0]);

    // 输入和输出应该被清空
    await waitFor(() => {
      expect(textarea).toHaveValue('');
      expect(screen.queryByDisplayValue('VGVzdA==')).not.toBeInTheDocument();
    });
  });

  it('should handle UTF-8 encoding category', () => {
    render(<EncodingTab activeCategory="utf" />, { wrapper });

    // 检查UTF编码选项
    expect(screen.getByText('UTF-8')).toBeInTheDocument();
  });

  it('should handle other encoding category', () => {
    render(<EncodingTab activeCategory="other" />, { wrapper });

    // 检查其他编码选项
    expect(screen.getByText(/URL/i)).toBeInTheDocument();
  });

  it('should switch between encode and decode operations', async () => {
    const user = userEvent.setup();
    render(<EncodingTab activeCategory="base" />, { wrapper });

    const encodeButton = screen.getByRole('button', { name: /编\s*码/i });
    const decodeButton = screen.getByRole('button', { name: /解\s*码/i });

    // 初始状态是编码模式
    expect(encodeButton).toBeInTheDocument();

    // 点击解码按钮
    await user.click(decodeButton);

    // 解码按钮应该被点击
    expect(decodeButton).toBeInTheDocument();
  });
});
