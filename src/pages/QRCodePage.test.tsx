import { describe, it, expect } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@/test/utils';
import QRCodePage from './QRCodePage';

describe('QRCodePage', () => {
  it('selects qr code tab from route param', async () => {
    render(
      <MemoryRouter initialEntries={['/qrcode/scan']}>
        <Routes>
          <Route path="/qrcode/:type" element={<QRCodePage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText(/识别方式/i)).toBeInTheDocument();
  });
});
