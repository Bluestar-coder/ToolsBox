import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Operation, OperationInput } from './types';
import { operationRegistry, RegisterOperation } from './registry';

function createOperation(
  id: string,
  name: string,
  category: Operation['category'] = 'encoding',
  description = `${name} description`
): Operation {
  return {
    id,
    name,
    description,
    category,
    inputType: 'text',
    outputType: 'text',
    getParameters: () => [],
    validateInput: () => ({ valid: true }),
    execute: async (input: OperationInput) => ({
      success: true,
      output: {
        data: input.data,
        dataType: input.dataType,
      },
    }),
  };
}

describe('operationRegistry', () => {
  beforeEach(() => {
    operationRegistry.clear();
  });

  it('registers, reads, filters and searches operations', () => {
    const base64 = createOperation('base64_decode', 'Base64 Decode', 'encoding', 'decode text');
    const url = createOperation('url_encode', 'URL Encode', 'encoding', 'encode urls');
    const ip = createOperation('ip_info', 'IP Info', 'network', 'lookup ip');

    operationRegistry.register(base64);
    operationRegistry.register(url);
    operationRegistry.register(ip);

    expect(operationRegistry.get('base64_decode')).toBe(base64);
    expect(operationRegistry.getAll()).toEqual([base64, url, ip]);
    expect(operationRegistry.getByCategory('encoding')).toEqual([base64, url]);
    expect(operationRegistry.getByCategory('network')).toEqual([ip]);
    expect(operationRegistry.search('url')).toEqual([url]);
    expect(operationRegistry.search('LOOKUP')).toEqual([ip]);
    expect(operationRegistry.getCategories().sort()).toEqual(['encoding', 'network']);
  });

  it('handles listeners, enable toggles, unregister and clear', () => {
    const listener = vi.fn();
    const unsubscribe = operationRegistry.subscribe(listener);
    const base64 = createOperation('base64_decode', 'Base64 Decode');
    const url = createOperation('url_encode', 'URL Encode');

    operationRegistry.register(base64);
    operationRegistry.register(url);
    expect(listener).toHaveBeenCalledTimes(2);

    operationRegistry.setEnabled('url_encode', false);
    expect(operationRegistry.get('url_encode')).toBeUndefined();
    expect(operationRegistry.getAll()).toEqual([base64]);
    expect(operationRegistry.getByCategory('encoding')).toEqual([base64]);
    expect(listener).toHaveBeenCalledTimes(3);

    operationRegistry.setEnabled('url_encode', false);
    expect(listener).toHaveBeenCalledTimes(3);

    operationRegistry.setEnabled('url_encode', true);
    expect(operationRegistry.get('url_encode')).toBe(url);
    expect(listener).toHaveBeenCalledTimes(4);

    operationRegistry.unregister('base64_decode');
    expect(operationRegistry.get('base64_decode')).toBeUndefined();
    expect(listener).toHaveBeenCalledTimes(5);

    operationRegistry.unregister('missing');
    expect(listener).toHaveBeenCalledTimes(5);

    unsubscribe();
    operationRegistry.clear();
    expect(operationRegistry.getAll()).toEqual([]);
    expect(listener).toHaveBeenCalledTimes(5);
  });

  it('registers operations through the decorator helper', () => {
    class DecoratedOperation implements Operation {
      id = 'decorated_operation';
      name = 'Decorated Operation';
      description = 'registered by decorator';
      category = 'utility' as const;
      inputType = 'text';
      outputType = 'text';
      getParameters() {
        return [];
      }
      validateInput() {
        return { valid: true };
      }
      async execute(input: OperationInput) {
        return {
          success: true,
          output: {
            data: input.data,
            dataType: input.dataType,
          },
        };
      }
    }

    RegisterOperation('utility')(DecoratedOperation);

    expect(DecoratedOperation).toBeDefined();
    expect(operationRegistry.get('decorated_operation')).toBeDefined();
    expect(operationRegistry.getCategories()).toContain('utility');
  });
});
