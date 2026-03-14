import { fireEvent, render, screen, userEvent, waitFor } from '@/test/utils';
import { message } from 'antd';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const qrcodeMocks = vi.hoisted(() => ({
  generateQRCodeDataURL: vi.fn(),
  downloadQRCode: vi.fn(),
}));

vi.mock('../../utils/qrcode', () => ({
  generateQRCodeDataURL: qrcodeMocks.generateQRCodeDataURL,
  downloadQRCode: qrcodeMocks.downloadQRCode,
  errorCorrectionLevels: [
    { value: 'L', label: 'L', description: 'low' },
    { value: 'M', label: 'M', description: 'medium' },
    { value: 'Q', label: 'Q', description: 'quartile' },
    { value: 'H', label: 'H', description: 'high' },
  ],
}));

vi.mock('../../../../utils/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  const mockedMessage = {
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  };

  return {
    ...actual,
    message: mockedMessage,
    Card: ({
      title,
      extra,
      children,
    }: {
      title?: React.ReactNode;
      extra?: React.ReactNode;
      children?: React.ReactNode;
    }) => (
      <section>
        {title ? <h3>{title}</h3> : null}
        {extra ? <div>{extra}</div> : null}
        {children}
      </section>
    ),
    Row: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    Col: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    Space: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    Tooltip: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    Slider: ({
      value,
      min,
      max,
      onChange,
    }: {
      value?: number;
      min?: number;
      max?: number;
      onChange?: (value: number) => void;
    }) => (
      <input
        aria-label="slider"
        max={max}
        min={min}
        onChange={(event) => onChange?.(Number(event.target.value))}
        type="range"
        value={value}
      />
    ),
    Select: ({
      value,
      onChange,
      options,
    }: {
      value?: string;
      onChange?: (value: string) => void;
      options?: Array<{ value: string }>;
    }) => (
      <select
        aria-label="error-correction"
        onChange={(event) => onChange?.(event.target.value)}
        value={value}
      >
        {(options ?? []).map((option) => (
          <option key={option.value} value={option.value}>
            {option.value}
          </option>
        ))}
      </select>
    ),
    ColorPicker: ({
      value,
      onChange,
    }: {
      value?: string;
      onChange?: (color: { toHexString: () => string }) => void;
    }) => (
      <input
        aria-label="color-picker"
        onChange={(event) => onChange?.({ toHexString: () => event.target.value })}
        type="text"
        value={value}
      />
    ),
  };
});

import GenerateTab from './GenerateTab';

describe('GenerateTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    qrcodeMocks.generateQRCodeDataURL.mockResolvedValue('data:image/png;base64,generated');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      blob: vi.fn().mockResolvedValue(new Blob(['png'], { type: 'image/png' })),
    }));
    class MockClipboardItem {
      data: unknown;

      constructor(data: unknown) {
        this.data = data;
      }
    }
    vi.stubGlobal('ClipboardItem', MockClipboardItem);
    vi.stubGlobal('navigator', {
      clipboard: {
        write: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('auto generates preview and re-generates with updated options', async () => {
    render(<GenerateTab />);

    fireEvent.change(
      screen.getByPlaceholderText(/输入要生成二维码的文本、网址等内容/i),
      { target: { value: 'https://example.com' } }
    );

    await waitFor(() => {
      expect(qrcodeMocks.generateQRCodeDataURL).toHaveBeenCalledWith(
        'https://example.com',
        expect.objectContaining({
          width: 256,
          margin: 2,
          errorCorrectionLevel: 'M',
          color: { dark: '#000000', light: '#ffffff' },
        })
      );
    });
    expect(screen.getByRole('img', { name: /qr code/i })).toHaveAttribute(
      'src',
      'data:image/png;base64,generated'
    );

    const sliders = screen.getAllByRole('slider');
    fireEvent.change(sliders[0], { target: { value: '320' } });
    fireEvent.change(screen.getByLabelText('error-correction'), { target: { value: 'H' } });

    await waitFor(() => {
      expect(qrcodeMocks.generateQRCodeDataURL).toHaveBeenLastCalledWith(
        'https://example.com',
        expect.objectContaining({
          width: 320,
          errorCorrectionLevel: 'H',
        })
      );
    });

    fireEvent.change(
      screen.getByPlaceholderText(/输入要生成二维码的文本、网址等内容/i),
      { target: { value: '' } }
    );

    await waitFor(() => {
      expect(screen.getByText(/输入内容后自动生成预览/i)).toBeInTheDocument();
    });
  });

  it('downloads and copies generated QR images', async () => {
    render(<GenerateTab />);

    fireEvent.change(
      screen.getByPlaceholderText(/输入要生成二维码的文本、网址等内容/i),
      { target: { value: 'payload' } }
    );

    await screen.findByRole('img', { name: /qr code/i });

    await userEvent.click(screen.getByRole('button', { name: /下载/i }));
    expect(qrcodeMocks.downloadQRCode).toHaveBeenCalledWith(
      'data:image/png;base64,generated',
      expect.stringMatching(/^qrcode-\d+\.png$/)
    );
    expect(message.success).toHaveBeenCalledWith('成功');

    await userEvent.click(screen.getByRole('button', { name: /复制/i }));
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith('data:image/png;base64,generated');
      expect(navigator.clipboard.write).toHaveBeenCalledTimes(1);
      expect(message.success).toHaveBeenCalledWith('已复制到剪贴板');
    });
  });

  it('shows message errors when generation or copy fails', async () => {
    qrcodeMocks.generateQRCodeDataURL.mockRejectedValueOnce(new Error('boom'));

    render(<GenerateTab />);

    fireEvent.change(
      screen.getByPlaceholderText(/输入要生成二维码的文本、网址等内容/i),
      { target: { value: 'broken' } }
    );

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('生成二维码失败');
    });

    qrcodeMocks.generateQRCodeDataURL.mockResolvedValueOnce('data:image/png;base64,recovered');
    fireEvent.change(
      screen.getByPlaceholderText(/输入要生成二维码的文本、网址等内容/i),
      { target: { value: 'recovered' } }
    );

    await screen.findByRole('img', { name: /qr code/i });

    vi.mocked(globalThis.fetch).mockRejectedValueOnce(new Error('copy failed'));

    await userEvent.click(screen.getByRole('button', { name: /复制/i }));
    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('复制失败');
    });
  });
});
