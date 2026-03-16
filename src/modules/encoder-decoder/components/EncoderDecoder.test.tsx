import { describe, it, expect } from 'vitest';
import { render, screen, userEvent } from '@/test/utils';
import { EncodingProvider } from '@/context/EncodingContext';
import EncoderDecoder from './EncoderDecoder';

describe('EncoderDecoder', () => {
  it('renders and switches encoder categories', async () => {
    render(
      <EncodingProvider>
        <EncoderDecoder />
      </EncodingProvider>
    );

    expect(await screen.findByText(/解码选项/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: /Base/i }));
    expect(await screen.findByText('Base64')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: /进制转换/i }));
    expect(await screen.findByPlaceholderText(/请输入要转换的数值/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: /图片转换/i }));
    expect(await screen.findByText(/上传图片/i)).toBeInTheDocument();
  });
});
