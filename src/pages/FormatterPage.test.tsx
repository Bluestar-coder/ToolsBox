import { describe, it, expect } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@/test/utils';
import FormatterPage from './FormatterPage';

describe('FormatterPage', () => {
  it('selects formatter tab from route param', async () => {
    render(
      <MemoryRouter initialEntries={['/formatter/http']}>
        <Routes>
          <Route path="/formatter/:type" element={<FormatterPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('button', { name: /格式化/i })).toBeInTheDocument();
  });
});
