import { beforeEach, describe, it, expect, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { render, screen, userEvent, waitFor } from '@/test/utils';
import { message } from 'antd';
import ImageTab from './ImageTab';

const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4//8/AwAI/AL+X8qDbgAAAABJRU5ErkJggg==';

describe('ImageTab', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(message, 'warning').mockImplementation(() => ({ then: vi.fn() }) as never);
    vi.spyOn(message, 'success').mockImplementation(() => ({ then: vi.fn() }) as never);
    vi.spyOn(message, 'error').mockImplementation(() => ({ then: vi.fn() }) as never);
  });

  it('converts base64 input into an image preview', async () => {
    render(<ImageTab />);

    await userEvent.click(screen.getByRole('tab', { name: /Base64转图片/i }));
    fireEvent.change(screen.getByPlaceholderText(/粘贴Base64字符串/i), {
      target: { value: PNG_BASE64 },
    });
    await userEvent.click(screen.getByRole('button', { name: /转换为图片/i }));

    await waitFor(() => {
      const preview = screen.getByAltText('preview') as HTMLImageElement;
      expect(preview).toBeInTheDocument();
      expect(preview.src).toContain(`data:image/png;base64,${PNG_BASE64}`);
    });
  });

  it('warns when converting or downloading without a preview and clears generated content', async () => {
    render(<ImageTab />);

    await userEvent.click(screen.getByRole('tab', { name: /Base64转图片/i }));
    await userEvent.click(screen.getByRole('button', { name: /转换为图片/i }));
    expect(message.warning).toHaveBeenCalledWith('请输入Base64字符串');

    fireEvent.change(screen.getByPlaceholderText(/粘贴Base64字符串/i), {
      target: { value: PNG_BASE64 },
    });
    await userEvent.click(screen.getByRole('button', { name: /转换为图片/i }));
    expect(await screen.findByAltText('preview')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /清\s*空/i }));
    expect(screen.queryByAltText('preview')).not.toBeInTheDocument();
  });
});
