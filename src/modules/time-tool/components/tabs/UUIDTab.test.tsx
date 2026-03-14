import { describe, expect, it } from 'vitest';
import { render, screen, userEvent } from '@/test/utils';
import UUIDTab from './UUIDTab';

describe('UUIDTab', () => {
  it('refreshes uuid values', async () => {
    render(<UUIDTab />);

    const firstValue = screen.getAllByText(/^[a-z0-9-]{8,}$/i)[0].textContent;
    await userEvent.click(screen.getByRole('button', { name: /刷新全部/i }));
    const nextValue = screen.getAllByText(/^[a-z0-9-]{8,}$/i)[0].textContent;

    expect(firstValue).toBeTruthy();
    expect(nextValue).toBeTruthy();
    expect(firstValue).not.toBe(nextValue);
  });
});
