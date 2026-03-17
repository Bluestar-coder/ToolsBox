import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import DiffPage from './DiffPage';

describe('DiffPage', () => {
  it('renders diff page content', async () => {
    render(<DiffPage />);

    expect(await screen.findByRole('button', { name: /交换/i })).toBeInTheDocument();
  });
});
