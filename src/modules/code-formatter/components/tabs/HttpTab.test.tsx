import { render, screen, fireEvent, waitFor } from '@/test/utils';
import { message } from 'antd';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockValidateHttpMessage,
  mockParseHttpMessage,
  mockFormatHttpRequest,
  mockFormatHttpResponse,
  mockMinifyHttpMessage,
  mockFromCurl,
} = vi.hoisted(() => ({
  mockValidateHttpMessage: vi.fn(),
  mockParseHttpMessage: vi.fn(),
  mockFormatHttpRequest: vi.fn(),
  mockFormatHttpResponse: vi.fn(),
  mockMinifyHttpMessage: vi.fn(),
  mockFromCurl: vi.fn(),
}));

vi.mock('../CodeEditor', () => ({
  default: ({
    value,
    onChange,
    readOnly,
    placeholder,
  }: {
    value: string;
    onChange?: (value: string) => void;
    readOnly?: boolean;
    placeholder?: string;
  }) => (
    <textarea
      data-testid={readOnly ? 'http-output' : 'http-input'}
      value={value}
      placeholder={placeholder}
      readOnly={readOnly}
      onChange={(event) => onChange?.(event.target.value)}
    />
  ),
}));

vi.mock('../../utils/http-utils', () => ({
  parseHttpMessage: mockParseHttpMessage,
  formatHttpRequest: mockFormatHttpRequest,
  formatHttpResponse: mockFormatHttpResponse,
  minifyHttpMessage: mockMinifyHttpMessage,
  fromCurl: mockFromCurl,
  validateHttpMessage: mockValidateHttpMessage,
}));

vi.mock('../../../../utils/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

import HttpTab from './HttpTab';

describe('HttpTab', () => {
  beforeEach(() => {
    vi.spyOn(message, 'warning').mockImplementation(() => ({}) as never);
    vi.spyOn(message, 'success').mockImplementation(() => ({}) as never);
    vi.spyOn(message, 'info').mockImplementation(() => ({}) as never);
    vi.spyOn(message, 'error').mockImplementation(() => ({}) as never);
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    mockValidateHttpMessage.mockReset();
    mockParseHttpMessage.mockReset();
    mockFormatHttpRequest.mockReset();
    mockFormatHttpResponse.mockReset();
    mockMinifyHttpMessage.mockReset();
    mockFromCurl.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('formats, validates, copies and clears a valid request message', async () => {
    mockValidateHttpMessage.mockReturnValue({ valid: true, warnings: [], errors: [] });
    mockParseHttpMessage.mockReturnValue({
      type: 'request',
      message: { method: 'GET', url: '/users', version: 'HTTP/1.1', headers: [], body: '' },
    });
    mockFormatHttpRequest.mockReturnValue('GET /users HTTP/1.1\n\n# General');

    render(<HttpTab />);

    fireEvent.change(screen.getByTestId('http-input'), {
      target: { value: 'GET /users HTTP/1.1' },
    });

    fireEvent.click(screen.getByRole('button', { name: /格式化/ }));
    await waitFor(() => {
      expect(screen.getByTestId('http-output')).toHaveValue('GET /users HTTP/1.1\n\n# General');
    });

    fireEvent.click(screen.getByRole('button', { name: /验证/ }));
    expect(message.success).toHaveBeenCalledWith('验证通过');

    fireEvent.click(screen.getByRole('button', { name: /复制/ }));
    await waitFor(() => {
      expect(message.success).toHaveBeenCalledWith('已复制到剪贴板');
    });

    fireEvent.click(screen.getByRole('button', { name: /清空/ }));
    expect(screen.getByTestId('http-input')).toHaveValue('');
    expect(screen.getByTestId('http-output')).toHaveValue('');
  });

  it('handles invalid messages, curl parsing and minify flow', async () => {
    mockValidateHttpMessage
      .mockReturnValueOnce({ valid: false, warnings: [], errors: ['bad request'] })
      .mockReturnValueOnce({ valid: true, warnings: ['header case'], errors: [] });
    mockFromCurl.mockReturnValue({ method: 'POST', url: '/users', version: 'HTTP/1.1', headers: [], body: '{}' });
    mockFormatHttpRequest.mockReturnValue('POST /users HTTP/1.1\n\n# Body\n{}');
    mockMinifyHttpMessage.mockReturnValue('POST /users HTTP/1.1\r\n\r\n{}');

    render(<HttpTab />);

    fireEvent.change(screen.getByTestId('http-input'), {
      target: { value: 'invalid message' },
    });
    fireEvent.click(screen.getByRole('button', { name: /格式化/ }));
    expect(message.error).toHaveBeenCalledWith('HTTP 报文格式无效，请先修复后再格式化');

    fireEvent.change(screen.getByTestId('http-input'), {
      target: { value: "curl http://example.com -X POST" },
    });
    fireEvent.click(screen.getByRole('button', { name: /解析 cURL/ }));
    await waitFor(() => {
      expect(screen.getByTestId('http-output')).toHaveValue('POST /users HTTP/1.1\n\n# Body\n{}');
    });

    fireEvent.click(screen.getByRole('button', { name: /压缩/ }));
    await waitFor(() => {
      const value = (screen.getByTestId('http-output') as HTMLTextAreaElement).value;
      expect(value).toContain('POST /users HTTP/1.1');
      expect(value).toContain('{}');
    });

    fireEvent.click(screen.getByRole('button', { name: /验证/ }));
    expect(message.info).toHaveBeenCalledWith('验证通过，但有一些建议');
  });
});
