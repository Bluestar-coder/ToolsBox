import { act, render, screen, userEvent, waitFor } from '@/test/utils';
import { message } from 'antd';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const barcodeMocks = vi.hoisted(() => ({
  canUseNativeBarcodeDetector: vi.fn(),
  detectQrCodeFromBlob: vi.fn(),
  startNativeCameraQrScan: vi.fn(),
}));

const fallbackMocks = vi.hoisted(() => ({
  createJsQrScanner: vi.fn(),
  scanQrCodeFileWithJsQr: vi.fn(),
}));

vi.mock('../../utils/barcode-detector', () => ({
  canUseNativeBarcodeDetector: barcodeMocks.canUseNativeBarcodeDetector,
  detectQrCodeFromBlob: barcodeMocks.detectQrCodeFromBlob,
  startNativeCameraQrScan: barcodeMocks.startNativeCameraQrScan,
}));

vi.mock('../../utils/jsqr-fallback', () => ({
  createJsQrScanner: fallbackMocks.createJsQrScanner,
  scanQrCodeFileWithJsQr: fallbackMocks.scanQrCodeFileWithJsQr,
}));

vi.mock('../../../../utils/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
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
    Alert: ({
      title,
      children,
    }: {
      title?: React.ReactNode;
      children?: React.ReactNode;
    }) => <div>{title ?? children}</div>,
    Upload: ({
      beforeUpload,
      children,
    }: {
      beforeUpload?: (file: File) => boolean | Promise<boolean>;
      children?: React.ReactNode;
    }) => (
      <label>
        <span>{children}</span>
        <input
          aria-label="upload-file"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void beforeUpload?.(file);
            }
          }}
          type="file"
        />
      </label>
    ),
  };
});

import ScanTab from './ScanTab';

function createPasteEvent(items: Array<{ type: string; getAsFile: () => File | null }>) {
  const event = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent;
  Object.defineProperty(event, 'clipboardData', {
    configurable: true,
    value: { items },
  });
  return event;
}

describe('ScanTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    barcodeMocks.canUseNativeBarcodeDetector.mockReturnValue(false);
    barcodeMocks.detectQrCodeFromBlob.mockResolvedValue(null);
    barcodeMocks.startNativeCameraQrScan.mockResolvedValue(null);
    fallbackMocks.scanQrCodeFileWithJsQr.mockResolvedValue('fallback-scan-result');
    fallbackMocks.createJsQrScanner.mockReturnValue({
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn().mockResolvedValue(undefined),
    });

    vi.stubGlobal('navigator', {
      clipboard: {
        read: vi.fn().mockResolvedValue([]),
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('uploads an image, falls back to jsqr scanning, and copies the result', async () => {
    render(<ScanTab />);

    const fileInput = screen.getByLabelText('upload-file');
    const file = new File(['qr-image'], 'qr.png', { type: 'image/png' });

    await userEvent.upload(fileInput, file);

    await waitFor(() => {
      expect(fallbackMocks.scanQrCodeFileWithJsQr).toHaveBeenCalledWith(file);
      expect(screen.getByPlaceholderText(/识别结果将显示在这里/i)).toHaveValue('fallback-scan-result');
      expect(message.success).toHaveBeenCalledWith('识别成功');
    });

    await userEvent.click(screen.getByRole('button', { name: /复制/i }));
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('fallback-scan-result');
      expect(message.success).toHaveBeenCalledWith('已复制到剪贴板');
    });
  });

  it('reads images from the clipboard button and warns when no image exists', async () => {
    barcodeMocks.canUseNativeBarcodeDetector.mockReturnValue(true);
    barcodeMocks.detectQrCodeFromBlob.mockResolvedValue('native-clipboard-result');
    vi.mocked(navigator.clipboard.read)
      .mockResolvedValueOnce([
        {
          types: ['image/png'],
          getType: vi.fn().mockResolvedValue(new Blob(['clipboard-image'], { type: 'image/png' })),
        },
      ])
      .mockResolvedValueOnce([
        {
          types: ['text/plain'],
          getType: vi.fn(),
        },
      ]);

    render(<ScanTab />);

    await userEvent.click(screen.getByRole('button', { name: /粘贴图片/i }));
    await waitFor(() => {
      expect(barcodeMocks.detectQrCodeFromBlob).toHaveBeenCalled();
      expect(screen.getByPlaceholderText(/识别结果将显示在这里/i)).toHaveValue('native-clipboard-result');
      expect(message.success).toHaveBeenCalledWith('识别成功');
    });

    await userEvent.click(screen.getByRole('button', { name: /粘贴图片/i }));
    expect(message.warning).toHaveBeenCalledWith('剪贴板中没有图片');
  });

  it('handles document paste success and scan failure branches', async () => {
    render(<ScanTab />);

    const pastedFile = new File(['inline-image'], 'inline.png', { type: 'image/png' });
    act(() => {
      document.dispatchEvent(createPasteEvent([
        {
          type: 'image/png',
          getAsFile: () => pastedFile,
        },
      ]));
    });

    await waitFor(() => {
      expect(fallbackMocks.scanQrCodeFileWithJsQr).toHaveBeenCalledWith(pastedFile);
      expect(screen.getByPlaceholderText(/识别结果将显示在这里/i)).toHaveValue('fallback-scan-result');
      expect(message.success).toHaveBeenCalledWith('识别成功');
    });

    fallbackMocks.scanQrCodeFileWithJsQr.mockRejectedValueOnce(new Error('bad qr'));

    act(() => {
      document.dispatchEvent(createPasteEvent([
        {
          type: 'image/png',
          getAsFile: () => pastedFile,
        },
      ]));
    });

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('识别失败，请确保图片包含有效的二维码');
    });
  });

  it('starts and stops a native camera scan session', async () => {
    const stop = vi.fn().mockResolvedValue(undefined);
    barcodeMocks.canUseNativeBarcodeDetector.mockReturnValue(true);
    barcodeMocks.startNativeCameraQrScan.mockResolvedValue({ stop });

    render(<ScanTab />);

    await userEvent.click(screen.getByRole('button', { name: /开启摄像头/i }));

    await screen.findByRole('button', { name: /关闭摄像头/i });

    await userEvent.click(screen.getByRole('button', { name: /关闭摄像头/i }));
    await waitFor(() => {
      expect(stop).toHaveBeenCalled();
    });
  });

  it('shows a camera error when the fallback scanner fails to start', async () => {
    fallbackMocks.createJsQrScanner.mockReturnValue({
      start: vi.fn().mockRejectedValue(new Error('camera denied')),
      stop: vi.fn().mockResolvedValue(undefined),
    });

    render(<ScanTab />);

    await userEvent.click(screen.getByRole('button', { name: /开启摄像头/i }));

    await waitFor(() => {
      expect(screen.getByText(/无法访问摄像头，请检查权限设置/i)).toBeInTheDocument();
      expect(message.error).not.toHaveBeenCalledWith('识别失败，请确保图片包含有效的二维码');
    });
  });
});
