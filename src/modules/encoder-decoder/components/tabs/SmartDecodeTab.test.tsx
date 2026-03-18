import { beforeEach, describe, it, expect, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { render, screen, userEvent, waitFor } from '@/test/utils';
import { message } from 'antd';
import SmartDecodeTab from './SmartDecodeTab';

describe('SmartDecodeTab', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(message, 'warning').mockImplementation(() => ({ then: vi.fn() }) as never);
    vi.spyOn(message, 'info').mockImplementation(() => ({ then: vi.fn() }) as never);
    vi.spyOn(message, 'success').mockImplementation(() => ({ then: vi.fn() }) as never);
    vi.spyOn(message, 'error').mockImplementation(() => ({ then: vi.fn() }) as never);
    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('smart decodes base64 input and shows match details', async () => {
    render(<SmartDecodeTab />);

    fireEvent.change(screen.getByPlaceholderText(/粘贴包含各种编码的文本/i), {
      target: { value: 'SGVsbG8=' },
    });
    await userEvent.click(screen.getByRole('button', { name: /智能解码/i }));

    await waitFor(() => {
      expect(screen.getByDisplayValue('Hello')).toBeInTheDocument();
    });
    expect(screen.getByText(/解码详情/i)).toBeInTheDocument();
    expect(screen.getAllByText('Base64')).toHaveLength(2);
  });

  it('warns on empty input, reports plain text, and clears content', async () => {
    render(<SmartDecodeTab />);

    await userEvent.click(screen.getByRole('button', { name: /智能解码/i }));
    expect(message.warning).toHaveBeenCalled();

    fireEvent.change(screen.getByPlaceholderText(/粘贴包含各种编码的文本/i), {
      target: { value: 'plain text' },
    });
    await userEvent.click(screen.getByRole('button', { name: /智能解码/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/解码结果将显示在这里/i)).toHaveValue('plain text');
    });
    expect(message.info).toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: /清空/i }));
    expect(screen.getByPlaceholderText(/粘贴包含各种编码的文本/i)).toHaveValue('');
    expect(screen.getByPlaceholderText(/解码结果将显示在这里/i)).toHaveValue('');
  });
});
