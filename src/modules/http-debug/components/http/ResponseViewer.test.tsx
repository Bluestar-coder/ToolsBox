import { render, screen, userEvent } from '@/test/utils';
import { describe, expect, it } from 'vitest';
import ResponseViewer from './ResponseViewer';
import type { HttpResponse } from '../../utils/types';

function createResponse(overrides: Partial<HttpResponse> = {}): HttpResponse {
  return {
    status: 200,
    statusText: 'OK',
    headers: { 'content-type': 'application/json' },
    body: '{"ok":true}',
    size: 128,
    duration: 56,
    contentType: 'application/json',
    ...overrides,
  };
}

describe('ResponseViewer', () => {
  it('shows loading, error and empty states', () => {
    const { rerender } = render(<ResponseViewer response={null} loading error={null} />);
    expect(document.querySelector('.ant-spin')).not.toBeNull();

    rerender(<ResponseViewer response={null} loading={false} error="boom" />);
    expect(screen.getByText('请求错误')).toBeInTheDocument();
    expect(screen.getByText('boom')).toBeInTheDocument();

    rerender(<ResponseViewer response={null} loading={false} error={null} />);
    expect(screen.getByText('发送请求以查看响应')).toBeInTheDocument();
  });

  it('renders response metadata, formatted body, headers and warning alert', async () => {
    render(
      <ResponseViewer
        response={createResponse({
          headers: {
            'content-type': 'application/json',
            'x-request-id': 'abc123',
          },
        })}
        loading={false}
        error="warning"
      />
    );

    expect(screen.getByText('200 OK')).toBeInTheDocument();
    expect(screen.getByText('56 ms')).toBeInTheDocument();
    expect(screen.getByText('128 B')).toBeInTheDocument();
    expect(screen.getByText('warning')).toBeInTheDocument();

    expect(screen.getByText(/"ok": true/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: /Headers/ }));
    expect(screen.getByText('content-type')).toBeInTheDocument();
    expect(screen.getByText('application/json')).toBeInTheDocument();
    expect(screen.getByText('x-request-id')).toBeInTheDocument();
  });

  it('shows empty headers state for headerless response', async () => {
    render(
      <ResponseViewer
        response={createResponse({ headers: {}, contentType: 'text/plain', body: 'plain text' })}
        loading={false}
        error={null}
      />
    );

    await userEvent.click(screen.getByRole('tab', { name: /Headers/ }));
    expect(screen.getByText('无响应头')).toBeInTheDocument();
  });
});
