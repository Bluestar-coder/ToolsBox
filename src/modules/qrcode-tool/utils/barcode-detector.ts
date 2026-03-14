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

export async function detectQrCodeFromBlob(blob: Blob): Promise<string | null> {
  const BarcodeDetector = getBarcodeDetectorCtor();
  if (!BarcodeDetector || typeof createImageBitmap !== 'function') {
    return null;
  }

  const imageBitmap = await createImageBitmap(blob);

  try {
    const detector = new BarcodeDetector({ formats: ['qr_code'] });
    const results = await detector.detect(imageBitmap);
    return getQrCodeValue(results);
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
