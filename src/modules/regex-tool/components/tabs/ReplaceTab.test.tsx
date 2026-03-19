import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@/test/utils';
import ReplaceTab from './ReplaceTab';

describe('ReplaceTab', () => {
  it('replaces text and renders the transformed output', async () => {
    render(<ReplaceTab />);

    const patternInput = screen.getByPlaceholderText(/输入正则表达式|Enter regex pattern/i);
    const replacementInput = screen.getByPlaceholderText(/替换文本|Replacement text/i);
    const sourceInput = screen.getByPlaceholderText(/输入要处理的文本|Enter text to process/i);
    const outputInput = screen.getAllByRole('textbox').at(-1);

    fireEvent.change(patternInput, { target: { value: '(foo)' } });
    fireEvent.change(replacementInput, { target: { value: '$1-bar' } });
    fireEvent.change(sourceInput, { target: { value: 'foo baz foo' } });

    await waitFor(() => {
      expect(outputInput).toHaveValue('foo-bar baz foo-bar');
    });
  });
});
