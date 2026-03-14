import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  canUseNativeBarcodeDetector,
  detectQrCodeFromBlob,
  startNativeCameraQrScan,
} from './barcode-detector';

type GlobalWithBarcode = typeof globalThis & {
  BarcodeDetector?: new (options?: { formats?: string[] }) => {
    detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
  };
  createImageBitmap?: (blob: Blob) => Promise<{ close?: () => void }>;
};

describe('barcode-detector', () => {
  const runtime = globalThis as GlobalWithBarcode;
  const originalBarcodeDetector = runtime.BarcodeDetector;
  const originalCreateImageBitmap = runtime.createImageBitmap;
  const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
  const originalCancelAnimationFrame = globalThis.cancelAnimationFrame;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    runtime.BarcodeDetector = originalBarcodeDetector;
    runtime.createImageBitmap = originalCreateImageBitmap;
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    globalThis.cancelAnimationFrame = originalCancelAnimationFrame;
  });

  it('reports native barcode support only when detector and image bitmap are available', () => {
    runtime.BarcodeDetector = undefined;
    runtime.createImageBitmap = undefined;
    expect(canUseNativeBarcodeDetector()).toBe(false);

    runtime.BarcodeDetector = vi.fn() as unknown as GlobalWithBarcode['BarcodeDetector'];
    runtime.createImageBitmap = vi.fn(async () => ({ close: vi.fn() }));
    expect(canUseNativeBarcodeDetector()).toBe(true);
  });

  it('detects QR code text from blob and closes the image bitmap', async () => {
    const close = vi.fn();
    const detect = vi.fn().mockResolvedValue([
      { rawValue: '' },
      { rawValue: 'toolsbox://qr-result' },
    ]);
    class MockBarcodeDetector {
      detect = detect;
    }

    runtime.createImageBitmap = vi.fn(async () => ({ close }));
    runtime.BarcodeDetector = MockBarcodeDetector as unknown as GlobalWithBarcode['BarcodeDetector'];

    const result = await detectQrCodeFromBlob(new Blob(['demo'], { type: 'image/png' }));

    expect(result).toBe('toolsbox://qr-result');
    expect(detect).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('starts a native camera scan session and stops tracks on cleanup', async () => {
    const detect = vi.fn().mockResolvedValue([{ rawValue: 'camera-native-result' }]);
    const stopTrack = vi.fn();
    const play = vi.fn(async () => undefined);
    const pause = vi.fn();
    const rafCallbacks: FrameRequestCallback[] = [];
    class MockBarcodeDetector {
      detect = detect;
    }

    runtime.BarcodeDetector = MockBarcodeDetector as unknown as GlobalWithBarcode['BarcodeDetector'];
    globalThis.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
      rafCallbacks.push(callback);
      return rafCallbacks.length;
    });
    globalThis.cancelAnimationFrame = vi.fn();

    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn(async () => ({
          getTracks: () => [{ stop: stopTrack }],
        })),
      } satisfies Partial<MediaDevices>,
    });

    const video = document.createElement('video');
    Object.defineProperty(video, 'play', { value: play, configurable: true });
    Object.defineProperty(video, 'pause', { value: pause, configurable: true });

    const onDetected = vi.fn();
    const session = await startNativeCameraQrScan(video, onDetected);

    expect(session).not.toBeNull();
    expect(play).toHaveBeenCalledTimes(1);

    rafCallbacks.shift()?.(0);
    await Promise.resolve();

    expect(onDetected).toHaveBeenCalledWith('camera-native-result');

    await session?.stop();

    expect(pause).toHaveBeenCalledTimes(1);
    expect(stopTrack).toHaveBeenCalledTimes(1);
    expect(globalThis.cancelAnimationFrame).toHaveBeenCalled();
  });
});
