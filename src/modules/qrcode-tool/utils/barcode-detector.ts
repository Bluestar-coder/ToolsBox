type NativeBarcode = {
  rawValue?: string;
};

type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => {
  detect: (source: ImageBitmapSource) => Promise<NativeBarcode[]>;
};

type BrowserWithBarcodeDetector = typeof globalThis & {
  BarcodeDetector?: BarcodeDetectorCtor;
};

type NativeCameraSession = {
  stop: () => Promise<void>;
};

function canUseTauriQrDecode(): boolean {
  try {
    const tauriGlobal = globalThis as typeof globalThis & { __TAURI_INTERNALS__?: unknown };
    return typeof window !== 'undefined' && !!tauriGlobal.__TAURI_INTERNALS__;
  } catch {
    return false;
  }
}

function getBarcodeDetectorCtor(): BarcodeDetectorCtor | null {
  const browser = globalThis as BrowserWithBarcodeDetector;
  return browser.BarcodeDetector ?? null;
}

export function canUseNativeBarcodeDetector(): boolean {
  return !!getBarcodeDetectorCtor() && typeof createImageBitmap === 'function';
}

function getQrCodeValue(results: NativeBarcode[]): string | null {
  const match = results.find((result) => typeof result.rawValue === 'string' && result.rawValue.trim() !== '');
  return match?.rawValue ?? null;
}

async function detectQrCodeWithTauri(blob: Blob): Promise<string | null> {
  if (!canUseTauriQrDecode()) {
    return null;
  }

  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const buffer = await blob.arrayBuffer();
    const bytes = Array.from(new Uint8Array(buffer));
    const result = await invoke<string>('decode_qr_image', { bytes });
    return result.trim() ? result : null;
  } catch {
    return null;
  }
}

export async function detectQrCodeFromBlob(blob: Blob): Promise<string | null> {
  const BarcodeDetector = getBarcodeDetectorCtor();
  if (!BarcodeDetector || typeof createImageBitmap !== 'function') {
    return detectQrCodeWithTauri(blob);
  }

  const imageBitmap = await createImageBitmap(blob);

  try {
    const detector = new BarcodeDetector({ formats: ['qr_code'] });
    const results = await detector.detect(imageBitmap);
    const value = getQrCodeValue(results);
    if (value) {
      return value;
    }
    return detectQrCodeWithTauri(blob);
  } finally {
    if (typeof imageBitmap.close === 'function') {
      imageBitmap.close();
    }
  }
}

export async function startNativeCameraQrScan(
  videoElement: HTMLVideoElement,
  onDetected: (value: string) => void
): Promise<NativeCameraSession | null> {
  const BarcodeDetector = getBarcodeDetectorCtor();
  if (!BarcodeDetector || typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return null;
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: 'environment',
    },
  });

  videoElement.srcObject = stream;
  videoElement.playsInline = true;
  videoElement.muted = true;
  await videoElement.play();

  const detector = new BarcodeDetector({ formats: ['qr_code'] });
  let active = true;
  let rafId: number | null = null;

  const scan = async () => {
    if (!active) {
      return;
    }

    try {
      const results = await detector.detect(videoElement);
      const value = getQrCodeValue(results);
      if (value) {
        onDetected(value);
        return;
      }
    } catch {
      // Ignore transient detection errors and keep scanning.
    }

    rafId = requestAnimationFrame(() => {
      void scan();
    });
  };

  rafId = requestAnimationFrame(() => {
    void scan();
  });

  return {
    stop: async () => {
      active = false;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }

      videoElement.pause();
      videoElement.srcObject = null;
      stream.getTracks().forEach((track) => track.stop());
    },
  };
}
