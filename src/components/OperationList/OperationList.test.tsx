import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Operation, OperationInput } from '../../core/operations';
import OperationList from './OperationList';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, defaultValue?: string) => defaultValue ?? _key,
  }),
}));

function createOperation(id: string, name: string, description: string): Operation {
  return {
    id,
    name,
    description,
    category: 'encoding',
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

describe('OperationList', () => {
  it('filters operations by search query and emits click callback', () => {
    const onOperationClick = vi.fn();
    const base64 = createOperation('base64_decode', 'Base64 Decode', 'decode base64');
    const url = createOperation('url_decode', 'URL Decode', 'decode url');

    render(
      <OperationList
        operations={[base64, url]}
        onOperationClick={onOperationClick}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('搜索操作...'), {
      target: { value: 'base64' },
    });

    expect(screen.getByText('Base64 Decode')).toBeInTheDocument();
    expect(screen.queryByText('URL Decode')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Base64 Decode'));
    expect(onOperationClick).toHaveBeenCalledWith(base64);
  });
});
