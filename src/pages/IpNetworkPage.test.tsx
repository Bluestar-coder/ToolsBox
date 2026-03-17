import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import IpNetworkPage from './IpNetworkPage';

describe('IpNetworkPage', () => {
  it('renders ip network page content', async () => {
    render(<IpNetworkPage />);

    expect(await screen.findByText(/IP转换/i)).toBeInTheDocument();
  });
});
