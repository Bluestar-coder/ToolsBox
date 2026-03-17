import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import RecipePage from './RecipePage';

describe('RecipePage', () => {
  it('renders recipe page content', async () => {
    render(<RecipePage />);

    expect(await screen.findByRole('button', { name: /导入/i })).toBeInTheDocument();
  });
});
