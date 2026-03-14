import React, { useState } from 'react';
import { act, fireEvent, render, screen } from '@/test/utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CodeEditor from './CodeEditor';

function ControlledEditor({
  language = 'json',
  initialValue = '',
  readOnly = false,
}: {
  language?: string;
  initialValue?: string;
  readOnly?: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  return (
    <CodeEditor
      value={value}
      onChange={setValue}
      language={language}
      readOnly={readOnly}
      placeholder="editor-placeholder"
      rows={4}
    />
  );
}

describe('CodeEditor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('updates the controlled value on input and keeps placeholder/readOnly wiring', async () => {
    render(<ControlledEditor initialValue="" readOnly={false} />);

    const textarea = screen.getByPlaceholderText('editor-placeholder') as HTMLTextAreaElement;
    expect(textarea.readOnly).toBe(false);

    fireEvent.change(textarea, { target: { value: '{"name":"toolsbox"}' } });
    expect(textarea.value).toBe('{"name":"toolsbox"}');

    render(<ControlledEditor initialValue="locked" readOnly />);
    const readonlyTextarea = screen.getByDisplayValue('locked') as HTMLTextAreaElement;
    expect(readonlyTextarea.readOnly).toBe(true);
  });

  it('inserts two spaces when Tab is pressed', async () => {
    render(<ControlledEditor initialValue="ab" language="json" />);

    const textarea = screen.getByDisplayValue('ab') as HTMLTextAreaElement;
    textarea.focus();
    textarea.selectionStart = 1;
    textarea.selectionEnd = 1;

    await act(async () => {
      fireEvent.keyDown(textarea, { key: 'Tab' });
      vi.runAllTimers();
    });

    expect(textarea.value).toBe('a  b');
    expect(textarea.selectionStart).toBeGreaterThanOrEqual(3);
    expect(textarea.selectionEnd).toBeGreaterThanOrEqual(3);
  });

  it('synchronizes scroll position to the highlight layer', () => {
    const { container } = render(
      <CodeEditor
        value={'line1\nline2\nline3\nline4\nline5\nline6'}
        onChange={vi.fn()}
        language="json"
        rows={2}
      />
    );

    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
    const pre = container.querySelector('pre') as HTMLPreElement;

    textarea.scrollTop = 42;
    textarea.scrollLeft = 16;
    fireEvent.scroll(textarea);

    expect(pre.scrollTop).toBe(42);
    expect(pre.scrollLeft).toBe(16);
  });

  it('renders HTTP syntax highlighting and escapes raw html in fallback mode', () => {
    const { container: httpContainer } = render(
      <CodeEditor
        value={'GET /users HTTP/1.1\nHost: api.example.com'}
        onChange={vi.fn()}
        language="http"
        rows={4}
      />
    );

    const httpHighlight = httpContainer.querySelector('pre') as HTMLPreElement;
    expect(httpHighlight.innerHTML).toContain('GET');
    expect(httpHighlight.innerHTML).toContain('Host');
    expect(httpHighlight.innerHTML).toContain('span');

    const { container: fallbackContainer } = render(
      <CodeEditor
        value={'<script>alert(1)</script>'}
        onChange={vi.fn()}
        language="unknown-language"
        rows={4}
      />
    );

    const fallbackHighlight = fallbackContainer.querySelector('pre') as HTMLPreElement;
    expect(fallbackHighlight.innerHTML).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(fallbackHighlight.innerHTML).not.toContain('<script>alert(1)</script>');
  });
});
