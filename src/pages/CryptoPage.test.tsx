import { describe, it, expect } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@/test/utils';
import CryptoPage from './CryptoPage';

describe('CryptoPage', () => {
  it('selects crypto view from route param', async () => {
    render(
      <MemoryRouter initialEntries={['/crypto/x25519']}>
        <Routes>
          <Route path="/crypto/:type" element={<CryptoPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByPlaceholderText(/计算后显示共享密钥/i)).toBeInTheDocument();
  });
});
