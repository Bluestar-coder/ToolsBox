import { describe, expect, it } from 'vitest';
import { createErrorResult, createSuccessResult, withErrorHandling } from './common';

describe('encoder common helpers', () => {
  it('creates success and error results', () => {
    expect(createSuccessResult('ok')).toEqual({ success: true, result: 'ok' });
    expect(createErrorResult('boom')).toEqual({ success: false, result: '', error: 'boom' });
  });

  it('wraps functions with success and error handling', () => {
    const wrapped = withErrorHandling((input: string) => input.toUpperCase(), 'fallback');
    const failing = withErrorHandling(() => {
      throw new Error('broken');
    }, 'fallback');

    expect(wrapped('abc')).toEqual({ success: true, result: 'ABC' });
    expect(failing('abc')).toEqual({ success: false, result: '', error: 'broken' });
  });
});
