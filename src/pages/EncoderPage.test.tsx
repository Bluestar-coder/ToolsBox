import { describe, it, expect } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@/test/utils';
import EncoderPage from './EncoderPage';

describe('EncoderPage', () => {
  it('selects encoder category from route param', async () => {
    render(
      <MemoryRouter initialEntries={['/encoder/base64']}>
        <Routes>
          <Route path="/encoder/:type" element={<EncoderPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Base64')).toBeInTheDocument();
  });
});
