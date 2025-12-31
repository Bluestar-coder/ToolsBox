import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateQRCodeDataURL,
  generateQRCodeCanvas,
  generateQRCodeSVG,
  downloadQRCode,
  defaultQRCodeOptions,
  errorCorrectionLevels,
} from './qrcode';

// Mock QRCode library
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn(),
    toCanvas: vi.fn(),
    toString: vi.fn(),
  },
}));

import QRCode from 'qrcode';

describe('QR Code Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('defaultQRCodeOptions', () => {
    it('should have correct default options', () => {
      expect(defaultQRCodeOptions.width).toBe(256);
      expect(defaultQRCodeOptions.margin).toBe(2);
      expect(defaultQRCodeOptions.errorCorrectionLevel).toBe('M');
      expect(defaultQRCodeOptions.color.dark).toBe('#000000');
      expect(defaultQRCodeOptions.color.light).toBe('#ffffff');
    });
  });

  describe('errorCorrectionLevels', () => {
    it('should have 4 error correction levels', () => {
      expect(errorCorrectionLevels).toHaveLength(4);
    });

    it('should have L level with correct info', () => {
      const levelL = errorCorrectionLevels[0];
      expect(levelL.value).toBe('L');
      expect(levelL.label).toBe('L (7%)');
      expect(levelL.description).toContain('7%');
    });

    it('should have M level with correct info', () => {
      const levelM = errorCorrectionLevels[1];
      expect(levelM.value).toBe('M');
      expect(levelM.label).toBe('M (15%)');
      expect(levelM.description).toContain('15%');
    });

    it('should have Q level with correct info', () => {
      const levelQ = errorCorrectionLevels[2];
      expect(levelQ.value).toBe('Q');
      expect(levelQ.label).toBe('Q (25%)');
      expect(levelQ.description).toContain('25%');
    });

    it('should have H level with correct info', () => {
      const levelH = errorCorrectionLevels[3];
      expect(levelH.value).toBe('H');
      expect(levelH.label).toBe('H (30%)');
      expect(levelH.description).toContain('30%');
    });
  });

  describe('generateQRCodeDataURL', () => {
    it('should generate QR code data URL with default options', async () => {
      const mockDataURL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      vi.mocked(QRCode.toDataURL).mockResolvedValue(mockDataURL);

      const result = await generateQRCodeDataURL('https://example.com');

      expect(QRCode.toDataURL).toHaveBeenCalledWith(
        'https://example.com',
        expect.objectContaining({
          width: 256,
          margin: 2,
          errorCorrectionLevel: 'M',
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        })
      );
      expect(result).toBe(mockDataURL);
    });

    it('should generate QR code with custom width', async () => {
      const mockDataURL = 'data:image/png;base64,test';
      vi.mocked(QRCode.toDataURL).mockResolvedValue(mockDataURL);

      await generateQRCodeDataURL('test', { width: 512 });

      expect(QRCode.toDataURL).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({
          width: 512,
        })
      );
    });

    it('should generate QR code with custom margin', async () => {
      const mockDataURL = 'data:image/png;base64,test';
      vi.mocked(QRCode.toDataURL).mockResolvedValue(mockDataURL);

      await generateQRCodeDataURL('test', { margin: 4 });

      expect(QRCode.toDataURL).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({
          margin: 4,
        })
      );
    });

    it('should generate QR code with custom error correction level', async () => {
      const mockDataURL = 'data:image/png;base64,test';
      vi.mocked(QRCode.toDataURL).mockResolvedValue(mockDataURL);

      await generateQRCodeDataURL('test', { errorCorrectionLevel: 'H' });

      expect(QRCode.toDataURL).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({
          errorCorrectionLevel: 'H',
        })
      );
    });

    it('should generate QR code with custom colors', async () => {
      const mockDataURL = 'data:image/png;base64,test';
      vi.mocked(QRCode.toDataURL).mockResolvedValue(mockDataURL);

      await generateQRCodeDataURL('test', {
        color: { dark: '#ff0000', light: '#00ff00' },
      });

      expect(QRCode.toDataURL).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({
          color: {
            dark: '#ff0000',
            light: '#00ff00',
          },
        })
      );
    });

    it('should handle empty string', async () => {
      const mockDataURL = 'data:image/png;base64,test';
      vi.mocked(QRCode.toDataURL).mockResolvedValue(mockDataURL);

      const result = await generateQRCodeDataURL('');

      expect(result).toBe(mockDataURL);
    });

    it('should handle special characters', async () => {
      const mockDataURL = 'data:image/png;base64,test';
      vi.mocked(QRCode.toDataURL).mockResolvedValue(mockDataURL);

      await generateQRCodeDataURL('测试中文!@#$%');

      expect(QRCode.toDataURL).toHaveBeenCalledWith('测试中文!@#$%', expect.any(Object));
    });

    it('should handle long URLs', async () => {
      const mockDataURL = 'data:image/png;base64,test';
      vi.mocked(QRCode.toDataURL).mockResolvedValue(mockDataURL);

      const longURL = 'https://example.com/' + 'a'.repeat(1000);
      await generateQRCodeDataURL(longURL);

      expect(QRCode.toDataURL).toHaveBeenCalled();
    });
  });

  describe('generateQRCodeCanvas', () => {
    it('should generate QR code on canvas with default options', async () => {
      const mockCanvas = document.createElement('canvas');
      vi.mocked(QRCode.toCanvas).mockResolvedValue(undefined);

      await generateQRCodeCanvas(mockCanvas, 'https://example.com');

      expect(QRCode.toCanvas).toHaveBeenCalledWith(
        mockCanvas,
        'https://example.com',
        expect.objectContaining({
          width: 256,
          margin: 2,
          errorCorrectionLevel: 'M',
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        })
      );
    });

    it('should generate QR code with custom width', async () => {
      const mockCanvas = document.createElement('canvas');
      vi.mocked(QRCode.toCanvas).mockResolvedValue(undefined);

      await generateQRCodeCanvas(mockCanvas, 'test', { width: 512 });

      expect(QRCode.toCanvas).toHaveBeenCalledWith(
        mockCanvas,
        'test',
        expect.objectContaining({
          width: 512,
        })
      );
    });

    it('should handle canvas element correctly', async () => {
      const mockCanvas = document.createElement('canvas');
      vi.mocked(QRCode.toCanvas).mockResolvedValue(undefined);

      await generateQRCodeCanvas(mockCanvas, 'test');

      expect(QRCode.toCanvas).toHaveBeenCalledWith(mockCanvas, 'test', expect.any(Object));
    });
  });

  describe('generateQRCodeSVG', () => {
    it('should generate QR code SVG string with default options', async () => {
      const mockSVG = '<svg>test</svg>';
      vi.mocked(QRCode.toString).mockResolvedValue(mockSVG);

      const result = await generateQRCodeSVG('https://example.com');

      expect(QRCode.toString).toHaveBeenCalledWith(
        'https://example.com',
        expect.objectContaining({
          type: 'svg',
          width: 256,
          margin: 2,
          errorCorrectionLevel: 'M',
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        })
      );
      expect(result).toBe(mockSVG);
    });

    it('should generate SVG with custom options', async () => {
      const mockSVG = '<svg>custom</svg>';
      vi.mocked(QRCode.toString).mockResolvedValue(mockSVG);

      await generateQRCodeSVG('test', { width: 512, margin: 4 });

      expect(QRCode.toString).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({
          type: 'svg',
          width: 512,
          margin: 4,
        })
      );
    });

    it('should return valid SVG string', async () => {
      const mockSVG = '<svg xmlns="http://www.w3.org/2000/svg">test</svg>';
      vi.mocked(QRCode.toString).mockResolvedValue(mockSVG);

      const result = await generateQRCodeSVG('test');

      expect(result).toBe(mockSVG);
      expect(result.startsWith('<svg')).toBe(true);
    });
  });

  describe('downloadQRCode', () => {
    beforeEach(() => {
      // Setup document and link element
      const link = document.createElement('a');
      link.download = '';
      link.href = '';
      document.body.appendChild(link);

      vi.spyOn(document, 'createElement').mockReturnValue(link);
    });

    afterEach(() => {
      // Cleanup
      const links = document.querySelectorAll('a');
      links.forEach(l => l.remove());
    });

    it('should download QR code with default filename', () => {
      const dataURL = 'data:image/png;base64,test';
      const link = document.querySelector('a') as HTMLAnchorElement;

      downloadQRCode(dataURL);

      expect(link.download).toBe('qrcode.png');
      expect(link.href).toBe(dataURL);
    });

    it('should download QR code with custom filename', () => {
      const dataURL = 'data:image/png;base64,test';
      const link = document.querySelector('a') as HTMLAnchorElement;

      downloadQRCode(dataURL, 'custom-qrcode.png');

      expect(link.download).toBe('custom-qrcode.png');
      expect(link.href).toBe(dataURL);
    });

    it('should append link to body and remove after click', () => {
      const dataURL = 'data:image/png;base64,test';
      const link = document.querySelector('a') as HTMLAnchorElement;

      const appendSpy = vi.spyOn(document.body, 'appendChild');
      const removeSpy = vi.spyOn(document.body, 'removeChild');

      downloadQRCode(dataURL);

      expect(appendSpy).toHaveBeenCalledWith(link);
      expect(removeSpy).toHaveBeenCalledWith(link);
    });

    it('should trigger click on link', () => {
      const dataURL = 'data:image/png;base64,test';
      const link = document.querySelector('a') as HTMLAnchorElement;

      const clickSpy = vi.spyOn(link, 'click');

      downloadQRCode(dataURL);

      expect(clickSpy).toHaveBeenCalled();
    });

    it('should handle special characters in filename', () => {
      const dataURL = 'data:image/png;base64,test';
      const link = document.querySelector('a') as HTMLAnchorElement;

      downloadQRCode(dataURL, '测试二维码.png');

      expect(link.download).toBe('测试二维码.png');
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete QR code generation workflow', async () => {
      const mockDataURL = 'data:image/png;base64,mockdata';
      vi.mocked(QRCode.toDataURL).mockResolvedValue(mockDataURL);

      const dataURL = await generateQRCodeDataURL('https://example.com', {
        width: 512,
        errorCorrectionLevel: 'H',
        color: { dark: '#0000ff', light: '#ffff00' },
      });

      expect(dataURL).toBe(mockDataURL);
      expect(dataURL).toMatch(/^data:image\/png;base64,/);
    });

    it('should support all error correction levels', async () => {
      const mockDataURL = 'data:image/png;base64,test';
      vi.mocked(QRCode.toDataURL).mockResolvedValue(mockDataURL);

      for (const level of errorCorrectionLevels) {
        await generateQRCodeDataURL('test', {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          errorCorrectionLevel: level.value as any,
        });

        expect(QRCode.toDataURL).toHaveBeenCalledWith(
          'test',
          expect.objectContaining({
            errorCorrectionLevel: level.value,
          })
        );
      }
    });

    it('should handle various content types', async () => {
      const mockDataURL = 'data:image/png;base64,test';
      vi.mocked(QRCode.toDataURL).mockResolvedValue(mockDataURL);

      const testCases = [
        'https://example.com',
        'mailto:test@example.com',
        'tel:+1234567890',
        'WIFI:S:MyNetwork;T:WPA;P:password;;',
        'TEXT:Plain text content',
        '测试中文',
        'Special chars: !@#$%^&*()',
      ];

      for (const content of testCases) {
        await generateQRCodeDataURL(content);
        expect(QRCode.toDataURL).toHaveBeenCalledWith(content, expect.any(Object));
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle very short content', async () => {
      const mockDataURL = 'data:image/png;base64,test';
      vi.mocked(QRCode.toDataURL).mockResolvedValue(mockDataURL);

      await generateQRCodeDataURL('a');

      expect(QRCode.toDataURL).toHaveBeenCalledWith('a', expect.any(Object));
    });

    it('should handle numeric content', async () => {
      const mockDataURL = 'data:image/png;base64,test';
      vi.mocked(QRCode.toDataURL).mockResolvedValue(mockDataURL);

      await generateQRCodeDataURL('123456789');

      expect(QRCode.toDataURL).toHaveBeenCalledWith('123456789', expect.any(Object));
    });

    it('should handle null/undefined in options gracefully', async () => {
      const mockDataURL = 'data:image/png;base64,test';
      vi.mocked(QRCode.toDataURL).mockResolvedValue(mockDataURL);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await generateQRCodeDataURL('test', undefined as any);

      expect(QRCode.toDataURL).toHaveBeenCalled();
    });

    it('should handle zero margin', async () => {
      const mockDataURL = 'data:image/png;base64,test';
      vi.mocked(QRCode.toDataURL).mockResolvedValue(mockDataURL);

      await generateQRCodeDataURL('test', { margin: 0 });

      expect(QRCode.toDataURL).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({
          margin: 0,
        })
      );
    });

    it('should handle very small width', async () => {
      const mockDataURL = 'data:image/png;base64,test';
      vi.mocked(QRCode.toDataURL).mockResolvedValue(mockDataURL);

      await generateQRCodeDataURL('test', { width: 10 });

      expect(QRCode.toDataURL).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({
          width: 10,
        })
      );
    });
  });
});
