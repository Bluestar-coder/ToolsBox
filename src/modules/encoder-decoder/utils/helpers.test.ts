import { describe, it, expect, vi, beforeEach } from 'vitest';
import { copyToClipboard, detectImageType, formatFileSize } from './helpers';

describe('encoder-decoder helpers', () => {
  beforeEach(() => {
    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('formats file sizes across byte, kilobyte, and megabyte ranges', () => {
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(2048)).toBe('2.00 KB');
    expect(formatFileSize(3 * 1024 * 1024)).toBe('3.00 MB');
  });

  it('detects common image prefixes and preserves existing data urls', () => {
    expect(detectImageType('data:image/png;base64,abc')).toBe('data:image/png;base64,abc');
    expect(detectImageType('/9j/abc')).toBe('data:image/jpeg;base64,/9j/abc');
    expect(detectImageType('iVBORabc')).toBe('data:image/png;base64,iVBORabc');
    expect(detectImageType('R0lGOabc')).toBe('data:image/gif;base64,R0lGOabc');
    expect(detectImageType('UklGRabc')).toBe('data:image/webp;base64,UklGRabc');
    expect(detectImageType('unknown')).toBe('data:image/png;base64,unknown');
  });

  it('returns clipboard write status as a boolean', async () => {
    expect(await copyToClipboard('hello')).toBe(true);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('hello');

    vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error('denied'));
    await expect(copyToClipboard('fail')).resolves.toBe(false);
  });
});
