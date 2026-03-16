import { describe, it, expect } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { render, screen, userEvent, waitFor } from '@/test/utils';
import ImageTab from './ImageTab';

const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4//8/AwAI/AL+X8qDbgAAAABJRU5ErkJggg==';

describe('ImageTab', () => {
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
});
