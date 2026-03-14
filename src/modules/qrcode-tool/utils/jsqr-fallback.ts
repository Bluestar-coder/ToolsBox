import jsQR from 'jsqr';

export type JsQrScannerInstance = {
  start: (onDetected: (decodedText: string) => void, onError?: (error: Error) => void) => Promise<void>;
  stop: () => Promise<void>;
};

type CanvasLike = OffscreenCanvas | HTMLCanvasElement;

function createCanvas(width: number, height: number): CanvasLike {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function getContext(canvas: CanvasLike): OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D {
  if (typeof HTMLCanvasElement !== 'undefined' && canvas instanceof HTMLCanvasElement) {
    const context = canvas.getContext('2d', { willReadFrequently: true });

    if (!context) {
      throw new Error('Unable to create canvas context');
    }

    return context;
  }

  const context = (canvas as OffscreenCanvas).getContext('2d');

  if (!context) {
    throw new Error('Unable to create canvas context');
  }

  return context as OffscreenCanvasRenderingContext2D;
}

async function imageBitmapToImageData(bitmap: ImageBitmap): Promise<ImageData> {
  const canvas = createCanvas(bitmap.width, bitmap.height);
  const context = getContext(canvas);
  context.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height);
  return context.getImageData(0, 0, bitmap.width, bitmap.height);
}

async function blobToImageElement(blob: Blob): Promise<HTMLImageElement> {
  const objectUrl = URL.createObjectURL(blob);

  try {
    return await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Unable to load QR image'));
      image.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function blobToImageData(blob: Blob): Promise<ImageData> {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(blob);

    try {
      return await imageBitmapToImageData(bitmap);
    } finally {
      if (typeof bitmap.close === 'function') {
        bitmap.close();
      }
    }
  }

  const image = await blobToImageElement(blob);
  const canvas = createCanvas(image.naturalWidth || image.width, image.naturalHeight || image.height);
  const context = getContext(canvas);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return context.getImageData(0, 0, canvas.width, canvas.height);
}

function decodeImageData(imageData: ImageData): string | null {
  const result = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: 'attemptBoth',
  });

  return result?.data ?? null;
}

export async function scanQrCodeFileWithJsQr(file: Blob): Promise<string> {
  const imageData = await blobToImageData(file);
  const decoded = decodeImageData(imageData);

  if (!decoded) {
    throw new Error('QR code not found');
  }

  return decoded;
}

export function createJsQrScanner(videoElement: HTMLVideoElement): JsQrScannerInstance {
  let stream: MediaStream | null = null;
  let rafId: number | null = null;
  let active = false;
  let canvas: CanvasLike | null = null;

  const stop = async () => {
    active = false;

    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    videoElement.pause();
    videoElement.srcObject = null;
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
  };

  const scanFrame = (
    onDetected: (decodedText: string) => void,
    onError?: (error: Error) => void
  ) => {
    if (!active) {
      return;
    }

    try {
      if (videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
        if (!canvas || canvas.width !== videoElement.videoWidth || canvas.height !== videoElement.videoHeight) {
          canvas = createCanvas(videoElement.videoWidth, videoElement.videoHeight);
        }

        const context = getContext(canvas);
        context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const decoded = decodeImageData(context.getImageData(0, 0, canvas.width, canvas.height));

        if (decoded) {
          onDetected(decoded);
          return;
        }
      }
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('QR scan failed'));
    }

    rafId = requestAnimationFrame(() => {
      scanFrame(onDetected, onError);
    });
  };

  return {
    start: async (onDetected, onError) => {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
        },
      });

      videoElement.srcObject = stream;
      videoElement.playsInline = true;
      videoElement.muted = true;
      await videoElement.play();

      active = true;
      rafId = requestAnimationFrame(() => {
        scanFrame(onDetected, onError);
      });
    },
    stop,
  };
}
