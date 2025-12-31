import QRCode from 'qrcode';

export interface QRCodeOptions {
  width: number;
  margin: number;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  color: {
    dark: string;
    light: string;
  };
}

export const defaultQRCodeOptions: QRCodeOptions = {
  width: 256,
  margin: 2,
  errorCorrectionLevel: 'M',
  color: {
    dark: '#000000',
    light: '#ffffff',
  },
};

/**
 * 生成二维码 DataURL
 */
export async function generateQRCodeDataURL(
  text: string,
  options: Partial<QRCodeOptions> = {}
): Promise<string> {
  const opts = { ...defaultQRCodeOptions, ...options };
  return QRCode.toDataURL(text, {
    width: opts.width,
    margin: opts.margin,
    errorCorrectionLevel: opts.errorCorrectionLevel,
    color: opts.color,
  });
}

/**
 * 生成二维码 Canvas
 */
export async function generateQRCodeCanvas(
  canvas: HTMLCanvasElement,
  text: string,
  options: Partial<QRCodeOptions> = {}
): Promise<void> {
  const opts = { ...defaultQRCodeOptions, ...options };
  await QRCode.toCanvas(canvas, text, {
    width: opts.width,
    margin: opts.margin,
    errorCorrectionLevel: opts.errorCorrectionLevel,
    color: opts.color,
  });
}

/**
 * 生成二维码 SVG 字符串
 */
export async function generateQRCodeSVG(
  text: string,
  options: Partial<QRCodeOptions> = {}
): Promise<string> {
  const opts = { ...defaultQRCodeOptions, ...options };
  return QRCode.toString(text, {
    type: 'svg',
    width: opts.width,
    margin: opts.margin,
    errorCorrectionLevel: opts.errorCorrectionLevel,
    color: opts.color,
  });
}

/**
 * 下载二维码图片
 */
export function downloadQRCode(dataURL: string, filename: string = 'qrcode.png'): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 错误纠正级别选项
 */
export const errorCorrectionLevels = [
  { value: 'L', label: 'L (7%)', description: '低 - 约7%的数据可恢复' },
  { value: 'M', label: 'M (15%)', description: '中 - 约15%的数据可恢复' },
  { value: 'Q', label: 'Q (25%)', description: '较高 - 约25%的数据可恢复' },
  { value: 'H', label: 'H (30%)', description: '高 - 约30%的数据可恢复' },
] as const;
