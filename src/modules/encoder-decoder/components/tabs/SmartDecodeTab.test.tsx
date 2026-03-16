import { describe, it, expect } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { render, screen, userEvent, waitFor } from '@/test/utils';
import SmartDecodeTab from './SmartDecodeTab';

describe('SmartDecodeTab', () => {
  it('smart decodes base64 input and shows match details', async () => {
    render(<SmartDecodeTab />);

    fireEvent.change(screen.getByPlaceholderText(/粘贴包含各种编码的文本/i), {
      target: { value: 'SGVsbG8=' },
    });
    await userEvent.click(screen.getByRole('button', { name: /智能解码/i }));

    await waitFor(() => {
      expect(screen.getByDisplayValue('Hello')).toBeInTheDocument();
    });
    expect(screen.getByText(/解码详情/i)).toBeInTheDocument();
    expect(screen.getAllByText('Base64')).toHaveLength(2);
  });
});
