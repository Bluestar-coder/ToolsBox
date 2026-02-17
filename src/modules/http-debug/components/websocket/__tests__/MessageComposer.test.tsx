import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import MessageComposer from '../MessageComposer';

const defaultProps = {
  onSend: vi.fn(),
  disabled: false,
};

describe('MessageComposer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render text mode by default with textarea and send button', () => {
    render(<MessageComposer {...defaultProps} />);

    expect(screen.getByText('文本')).toBeInTheDocument();
    expect(screen.getByText('二进制 (Hex)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/输入消息内容/)).toBeInTheDocument();
    expect(screen.getByText('发送')).toBeInTheDocument();
  });

  it('should disable send button when message is empty', () => {
    render(<MessageComposer {...defaultProps} />);

    const sendBtn = screen.getByText('发送').closest('button');
    expect(sendBtn).toBeDisabled();
  });

  it('should disable send button when disabled prop is true', () => {
    render(<MessageComposer {...defaultProps} disabled />);

    const sendBtn = screen.getByText('发送').closest('button');
    expect(sendBtn).toBeDisabled();
  });

  it('should disable textarea when disabled prop is true', () => {
    render(<MessageComposer {...defaultProps} disabled />);

    const textarea = screen.getByPlaceholderText(/输入消息内容/);
    expect(textarea).toBeDisabled();
  });

  it('should disable message type radio when disabled', () => {
    render(<MessageComposer {...defaultProps} disabled />);

    const textRadio = screen.getByText('文本').closest('label');
    expect(textRadio).toHaveClass('ant-radio-button-wrapper-disabled');
  });

  it('should enable send button when text message is entered', async () => {
    const user = userEvent.setup();
    render(<MessageComposer {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/输入消息内容/);
    await user.type(textarea, 'hello');

    const sendBtn = screen.getByText('发送').closest('button');
    expect(sendBtn).not.toBeDisabled();
  });

  it('should send text message and clear input on click', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<MessageComposer {...defaultProps} onSend={onSend} />);

    const textarea = screen.getByPlaceholderText(/输入消息内容/);
    await user.type(textarea, 'hello world');
    await user.click(screen.getByText('发送'));

    expect(onSend).toHaveBeenCalledWith('hello world');
    expect(textarea).toHaveValue('');
  });

  it('should switch to binary mode and show hex placeholder', async () => {
    const user = userEvent.setup();
    render(<MessageComposer {...defaultProps} />);

    await user.click(screen.getByText('二进制 (Hex)'));

    expect(screen.getByPlaceholderText(/十六进制字符串/)).toBeInTheDocument();
  });

  it('should clear message when switching message type', async () => {
    const user = userEvent.setup();
    render(<MessageComposer {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/输入消息内容/);
    await user.type(textarea, 'some text');
    await user.click(screen.getByText('二进制 (Hex)'));

    const hexInput = screen.getByPlaceholderText(/十六进制字符串/);
    expect(hexInput).toHaveValue('');
  });

  it('should show validation error for invalid hex in binary mode', async () => {
    const user = userEvent.setup();
    render(<MessageComposer {...defaultProps} />);

    await user.click(screen.getByText('二进制 (Hex)'));
    const hexInput = screen.getByPlaceholderText(/十六进制字符串/);
    await user.type(hexInput, 'xyz');

    expect(screen.getByText(/有效的十六进制字符串/)).toBeInTheDocument();
  });

  it('should disable send button for invalid hex in binary mode', async () => {
    const user = userEvent.setup();
    render(<MessageComposer {...defaultProps} />);

    await user.click(screen.getByText('二进制 (Hex)'));
    const hexInput = screen.getByPlaceholderText(/十六进制字符串/);
    await user.type(hexInput, 'zz');

    const sendBtn = screen.getByText('发送').closest('button');
    expect(sendBtn).toBeDisabled();
  });

  it('should send ArrayBuffer for valid hex in binary mode', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<MessageComposer {...defaultProps} onSend={onSend} />);

    await user.click(screen.getByText('二进制 (Hex)'));
    const hexInput = screen.getByPlaceholderText(/十六进制字符串/);
    await user.type(hexInput, '48656c6c6f');
    await user.click(screen.getByText('发送'));

    expect(onSend).toHaveBeenCalledTimes(1);
    const arg = onSend.mock.calls[0][0];
    expect(arg).toBeInstanceOf(ArrayBuffer);
    // "Hello" = 48 65 6c 6c 6f
    expect(new Uint8Array(arg)).toEqual(new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]));
  });

  it('should clear hex input after sending binary message', async () => {
    const user = userEvent.setup();
    render(<MessageComposer {...defaultProps} />);

    await user.click(screen.getByText('二进制 (Hex)'));
    const hexInput = screen.getByPlaceholderText(/十六进制字符串/);
    await user.type(hexInput, 'aabb');
    await user.click(screen.getByText('发送'));

    expect(hexInput).toHaveValue('');
  });

  it('should enable send for valid hex with uppercase letters', async () => {
    const user = userEvent.setup();
    render(<MessageComposer {...defaultProps} />);

    await user.click(screen.getByText('二进制 (Hex)'));
    const hexInput = screen.getByPlaceholderText(/十六进制字符串/);
    await user.type(hexInput, 'AABB');

    const sendBtn = screen.getByText('发送').closest('button');
    expect(sendBtn).not.toBeDisabled();
  });

  it('should disable send for odd-length hex string', async () => {
    const user = userEvent.setup();
    render(<MessageComposer {...defaultProps} />);

    await user.click(screen.getByText('二进制 (Hex)'));
    const hexInput = screen.getByPlaceholderText(/十六进制字符串/);
    await user.type(hexInput, 'abc');

    const sendBtn = screen.getByText('发送').closest('button');
    expect(sendBtn).toBeDisabled();
  });
});
