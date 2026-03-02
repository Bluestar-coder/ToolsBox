import { describe, expect, it } from 'vitest';
import { createExtendedEncodingOperations } from './extended-encoding';

describe('extended encoding operations', () => {
  it('registers key operations for recipe workbench', () => {
    const operations = createExtendedEncodingOperations();
    const ids = operations.map(operation => operation.id);

    expect(ids).toContain('from_hex');
    expect(ids).toContain('from_binary');
    expect(ids).toContain('json_format');
    expect(ids).toContain('html_entity_decode');
    expect(ids).toContain('unicode_unescape');
    expect(ids).toContain('base64url_decode');
    expect(ids.length).toBeGreaterThanOrEqual(30);
  });

  it('decodes hex payload via from_hex operation', async () => {
    const operation = createExtendedEncodingOperations().find(item => item.id === 'from_hex');
    expect(operation).toBeDefined();

    const result = await operation!.execute(
      { data: '48656c6c6f', dataType: 'hex' },
      {}
    );

    expect(result.success).toBe(true);
    expect(result.output.data).toBe('Hello');
  });

  it('decodes binary payload via from_binary operation', async () => {
    const operation = createExtendedEncodingOperations().find(item => item.id === 'from_binary');
    expect(operation).toBeDefined();

    const result = await operation!.execute(
      { data: '01001000 01101001', dataType: 'binary' },
      {}
    );

    expect(result.success).toBe(true);
    expect(result.output.data).toBe('Hi');
  });
});

