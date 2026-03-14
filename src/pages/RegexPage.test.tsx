import { describe, it, expect } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@/test/utils';
import RegexPage from './RegexPage';

describe('RegexPage', () => {
  it('selects regex tab from route param', async () => {
    render(
      <MemoryRouter initialEntries={['/regex/replace']}>
        <Routes>
          <Route path="/regex/:type" element={<RegexPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText(/替换为/i)).toBeInTheDocument();
  });
});
