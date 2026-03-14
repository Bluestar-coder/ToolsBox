import { describe, it, expect } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@/test/utils';
import TimePage from './TimePage';

describe('TimePage', () => {
  it('selects time tab from route param', async () => {
    render(
      <MemoryRouter initialEntries={['/time/uuid']}>
        <Routes>
          <Route path="/time/:type" element={<TimePage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText(/UUID v1/i)).toBeInTheDocument();
  });
});
