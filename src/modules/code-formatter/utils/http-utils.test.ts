import { describe, expect, it } from 'vitest';
import {
  formatHttpRequest,
  formatHttpResponse,
  fromCurl,
  getHttpStats,
  isHttpRequest,
  minifyHttpMessage,
  parseHttpMessage,
  parseHttpRequest,
  parseHttpResponse,
  toCurl,
  validateHttpMessage,
} from './http-utils';

describe('http-utils', () => {
  it('parses and formats HTTP requests with grouped headers and JSON bodies', () => {
    const raw = [
      'POST /api/users HTTP/1.1',
      'Host: example.com',
      'Accept: application/json',
      'Content-Type: application/json',
      'Authorization: Bearer token',
      '',
      '{"name":"jack","roles":["admin"]}',
    ].join('\n');

    const request = parseHttpRequest(raw);
    const parsedMessage = parseHttpMessage(raw);
    const formatted = formatHttpRequest(request, 2);

    expect(request).toMatchObject({
      method: 'POST',
      url: '/api/users',
      version: 'HTTP/1.1',
      body: '{"name":"jack","roles":["admin"]}',
    });
    expect(request.headers).toEqual([
      { name: 'Host', value: 'example.com' },
      { name: 'Accept', value: 'application/json' },
      { name: 'Content-Type', value: 'application/json' },
      { name: 'Authorization', value: 'Bearer token' },
    ]);
    expect(parsedMessage.type).toBe('request');
    expect(isHttpRequest(parsedMessage.message)).toBe(true);
    expect(formatted).toContain('# General\nHost: example.com');
    expect(formatted).toContain('# Request/Response\nAccept: application/json');
    expect(formatted).toContain('# Content\nContent-Type: application/json');
    expect(formatted).toContain('# Security\nAuthorization: Bearer token');
    expect(formatted).toContain('# Body\n{\n  "name": "jack",\n  "roles": [\n    "admin"\n  ]\n}');
  });

  it('parses and formats HTTP responses with XML bodies', () => {
    const raw = [
      'HTTP/1.1 200 OK',
      'Date: Sun, 16 Mar 2026 00:00:00 GMT',
      'Set-Cookie: sid=1',
      'Content-Type: application/xml',
      '',
      '<root><item>1</item></root>',
    ].join('\n');

    const response = parseHttpResponse(raw);
    const parsedMessage = parseHttpMessage(raw);
    const formatted = formatHttpResponse(response, 2);

    expect(response).toMatchObject({
      version: 'HTTP/1.1',
      statusCode: 200,
      statusText: 'OK',
      body: '<root><item>1</item></root>',
    });
    expect(parsedMessage.type).toBe('response');
    expect(isHttpRequest(parsedMessage.message)).toBe(false);
    expect(formatted).toContain('# General\nDate: Sun, 16 Mar 2026 00:00:00 GMT');
    expect(formatted).toContain('# Security\nSet-Cookie: sid=1');
    expect(formatted).toContain('# Content\nContent-Type: application/xml');
    expect(formatted).toContain('# Body\n<root>\n  <item>1</item>\n</root>');
  });

  it('formats urlencoded bodies, minifies messages and calculates stats', () => {
    const raw = [
      'POST /submit HTTP/1.1',
      'Host: example.com',
      'Content-Type: application/x-www-form-urlencoded',
      '',
      'name=jack%20ma&role=admin',
    ].join('\n');

    const request = parseHttpRequest(raw);
    const formatted = formatHttpRequest(request);
    const minified = minifyHttpMessage([
      'POST /submit HTTP/1.1  ',
      'Host: example.com   ',
      '',
      '  name=jack%20ma&role=admin  ',
    ].join('\n'));
    const stats = getHttpStats(raw);

    expect(formatted).toContain('# Body\nname: jack ma\nrole: admin');
    expect(minified).toBe('POST /submit HTTP/1.1\r\nHost: example.com\r\n\r\nname=jack%20ma&role=admin');
    expect(stats).toEqual({
      headerCount: 2,
      bodySize: 25,
      contentType: 'application/x-www-form-urlencoded',
      isRequest: true,
      method: 'POST',
      statusCode: undefined,
    });
  });

  it('converts requests to curl and parses curl back to HTTP requests', () => {
    const request = {
      method: 'PUT',
      url: 'https://example.com/users/1',
      version: 'HTTP/1.1',
      headers: [
        { name: 'Accept', value: 'application/json' },
        { name: 'Content-Type', value: 'application/x-www-form-urlencoded' },
      ],
      body: 'name=jack',
    };

    const curl = toCurl(request);
    const parsed = fromCurl([
      'curl https://example.com/users/1',
      "-H 'Accept: application/json'",
      "-H 'Content-Type: application/x-www-form-urlencoded'",
      "-d 'name=jack'",
    ].join(' \\\n  '));

    expect(curl).toContain('-X PUT');
    expect(curl).toContain("'https://example.com/users/1'");
    expect(curl).toContain("-H 'Accept: application/json'");
    expect(curl).toContain("-d 'name=jack'");
    expect(parsed).toEqual({
      method: 'POST',
      url: 'https://example.com/users/1',
      version: 'HTTP/1.1',
      headers: [
        { name: 'Accept', value: 'application/json' },
        { name: 'Content-Type', value: 'application/x-www-form-urlencoded' },
      ],
      body: 'name=jack',
    });
  });

  it('validates HTTP messages and reports warnings for incomplete bodies', () => {
    const raw = [
      'POST /users HTTP/1.1',
      'Content-Length: 1',
      '',
      '{"a":1}',
    ].join('\n');

    const validation = validateHttpMessage(raw);

    expect(validation.valid).toBe(true);
    expect(validation.errors).toEqual([]);
    expect(validation.warnings).toEqual([
      '缺少 Host 头部',
      '有 Body 但缺少 Content-Type 头部',
      'Content-Length (1) 与实际 Body 长度 (7) 不匹配',
    ]);
  });

  it('returns parser and stats errors for invalid inputs', () => {
    expect(() => parseHttpRequest('invalid request')).toThrow('无效的 HTTP 请求行');
    expect(() => parseHttpResponse('invalid response')).toThrow('无效的 HTTP 响应状态行');
    expect(() => parseHttpMessage('hello world')).toThrow('无法识别的 HTTP 报文格式');
    expect(validateHttpMessage('')).toEqual({
      valid: false,
      errors: ['报文内容为空'],
      warnings: [],
    });
    expect(getHttpStats('hello world')).toEqual({
      headerCount: 0,
      bodySize: 0,
      contentType: 'N/A',
      isRequest: false,
    });
  });
});
