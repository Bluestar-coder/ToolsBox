import { render, screen, fireEvent, userEvent } from '@/test/utils';
import { describe, expect, it, vi } from 'vitest';
import RequestBuilder from './RequestBuilder';
import type { HttpRequestConfig } from '../../utils/types';

function createConfig(overrides: Partial<HttpRequestConfig> = {}): HttpRequestConfig {
  return {
    method: 'GET',
    url: '',
    headers: [],
    bodyType: 'none',
    body: '',
    formData: [],
    ...overrides,
  };
}

describe('RequestBuilder', () => {
  it('disables send for invalid url and sends on Enter for valid url', async () => {
    const onChange = vi.fn();
    const onSend = vi.fn();
    const { rerender } = render(
      <RequestBuilder config={createConfig()} onChange={onChange} onSend={onSend} loading={false} />
    );

    expect(screen.getByRole('button', { name: /发送/ })).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText(/输入请求 URL/), {
      target: { value: 'invalid-url' },
    });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ url: 'invalid-url' }));

    rerender(
      <RequestBuilder
        config={createConfig({ url: 'https://api.example.com/users' })}
        onChange={onChange}
        onSend={onSend}
        loading={false}
      />
    );

    const urlInput = screen.getByPlaceholderText(/输入请求 URL/);
    fireEvent.keyDown(urlInput, { key: 'Enter' });
    expect(onSend).toHaveBeenCalled();
  });

  it('manages headers, form body and binary validation states', async () => {
    const onChange = vi.fn();
    const onSend = vi.fn();
    const { rerender } = render(
      <RequestBuilder
        config={createConfig({
          url: 'https://api.example.com/users',
          headers: [{ key: 'X-Test', value: '1', enabled: true }],
        })}
        onChange={onChange}
        onSend={onSend}
        loading={false}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /添加/i }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      headers: [
        expect.objectContaining({ key: 'X-Test' }),
        expect.objectContaining({ key: '', value: '', enabled: true }),
      ],
    }));

    const headerInputs = screen.getAllByPlaceholderText(/Header Name|Header Value/);
    fireEvent.change(headerInputs[0], { target: { value: 'Authorization' } });
    expect(onChange).toHaveBeenCalled();

    await userEvent.click(screen.getByRole('tab', { name: 'Body' }));
    await userEvent.click(screen.getByText('Form'));
    rerender(
      <RequestBuilder
        config={createConfig({
          url: 'https://api.example.com/users',
          bodyType: 'form',
          formData: [{ key: 'foo', value: 'bar', enabled: true }],
        })}
        onChange={onChange}
        onSend={onSend}
        loading={false}
      />
    );
    expect(screen.getByDisplayValue('foo')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Binary'));
    rerender(
      <RequestBuilder
        config={createConfig({
          url: 'https://api.example.com/users',
          bodyType: 'binary',
          body: 'xyz',
        })}
        onChange={onChange}
        onSend={onSend}
        loading={false}
      />
    );

    expect(screen.getByText(/请输入有效的十六进制字符串/)).toBeInTheDocument();
  });
});
