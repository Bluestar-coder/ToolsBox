import { beforeEach, describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@/test/utils';
import EncoderPage from './EncoderPage';

describe('EncoderPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('selects encoder category from route param', async () => {
    render(
      <MemoryRouter initialEntries={['/encoder/utf8']}>
        <Routes>
          <Route path="/encoder/:type" element={<EncoderPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('UTF-8')).toBeInTheDocument();
  });

  it('syncs mode and input from search params', async () => {
    render(
      <MemoryRouter initialEntries={['/encoder/base64?mode=decode&input=SGVsbG8%3D']}>
        <Routes>
          <Route path="/encoder/:type" element={<EncoderPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByDisplayValue('SGVsbG8=')).toBeInTheDocument();
    expect(await screen.findByDisplayValue('Hello')).toBeInTheDocument();
  });

  it('falls back to raw input when search param decoding fails', async () => {
    const originalDecodeURIComponent = globalThis.decodeURIComponent;
    const decodeSpy = vi
      .spyOn(globalThis, 'decodeURIComponent')
      .mockImplementation((value: string) => {
        if (value === 'raw-value') {
          throw new URIError('bad uri');
        }
        return originalDecodeURIComponent(value);
      });

    render(
      <MemoryRouter initialEntries={['/encoder/base64?input=raw-value']}>
        <Routes>
          <Route path="/encoder/:type" element={<EncoderPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByDisplayValue('raw-value')).toBeInTheDocument();

    decodeSpy.mockRestore();
  });

  it('falls back to smart category for unknown encoder route types', async () => {
    render(
      <MemoryRouter initialEntries={['/encoder/not-real-type']}>
        <Routes>
          <Route path="/encoder/:type" element={<EncoderPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText(/解码选项/i)).toBeInTheDocument();
  });
});
