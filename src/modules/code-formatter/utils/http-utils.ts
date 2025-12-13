// HTTP 报文解析和格式化工具

export interface HttpHeader {
  name: string;
  value: string;
}

export interface HttpRequest {
  method: string;
  url: string;
  version: string;
  headers: HttpHeader[];
  body: string;
}

export interface HttpResponse {
  version: string;
  statusCode: number;
  statusText: string;
  headers: HttpHeader[];
  body: string;
}

export type HttpMessage = HttpRequest | HttpResponse;

// 判断是请求还是响应
export function isHttpRequest(message: HttpMessage): message is HttpRequest {
  return 'method' in message;
}

// 解析 HTTP 请求
export function parseHttpRequest(raw: string): HttpRequest {
  const lines = raw.split(/\r?\n/);
  const requestLine = lines[0];
  
  // 解析请求行: METHOD URL HTTP/VERSION
  const requestMatch = requestLine.match(/^(\w+)\s+(.+?)\s+(HTTP\/[\d.]+)$/i);
  if (!requestMatch) {
    throw new Error('无效的 HTTP 请求行');
  }
  
  const [, method, url, version] = requestMatch;
  const headers: HttpHeader[] = [];
  let bodyStartIndex = -1;
  
  // 解析头部
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line === '' || line === '\r') {
      bodyStartIndex = i + 1;
      break;
    }
    
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      headers.push({
        name: line.substring(0, colonIndex).trim(),
        value: line.substring(colonIndex + 1).trim(),
      });
    }
  }
  
  // 解析 body
  const body = bodyStartIndex > 0 ? lines.slice(bodyStartIndex).join('\n') : '';
  
  return { method, url, version, headers, body };
}

// 解析 HTTP 响应
export function parseHttpResponse(raw: string): HttpResponse {
  const lines = raw.split(/\r?\n/);
  const statusLine = lines[0];
  
  // 解析状态行: HTTP/VERSION STATUS_CODE STATUS_TEXT
  const statusMatch = statusLine.match(/^(HTTP\/[\d.]+)\s+(\d+)\s*(.*)$/i);
  if (!statusMatch) {
    throw new Error('无效的 HTTP 响应状态行');
  }
  
  const [, version, statusCode, statusText] = statusMatch;
  const headers: HttpHeader[] = [];
  let bodyStartIndex = -1;
  
  // 解析头部
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line === '' || line === '\r') {
      bodyStartIndex = i + 1;
      break;
    }
    
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      headers.push({
        name: line.substring(0, colonIndex).trim(),
        value: line.substring(colonIndex + 1).trim(),
      });
    }
  }
  
  // 解析 body
  const body = bodyStartIndex > 0 ? lines.slice(bodyStartIndex).join('\n') : '';
  
  return { version, statusCode: parseInt(statusCode), statusText, headers, body };
}

// 自动检测并解析 HTTP 报文
export function parseHttpMessage(raw: string): { type: 'request' | 'response'; message: HttpMessage } {
  const firstLine = raw.split(/\r?\n/)[0];
  
  if (firstLine.match(/^HTTP\//i)) {
    return { type: 'response', message: parseHttpResponse(raw) };
  } else if (firstLine.match(/^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS|TRACE|CONNECT)\s/i)) {
    return { type: 'request', message: parseHttpRequest(raw) };
  }
  
  throw new Error('无法识别的 HTTP 报文格式');
}

// 格式化 HTTP 请求
export function formatHttpRequest(request: HttpRequest, indent: number = 2): string {
  const lines: string[] = [];
  
  // 请求行
  lines.push(`${request.method} ${request.url} ${request.version}`);
  lines.push('');
  
  // 头部（按类别分组）
  const headerGroups = groupHeaders(request.headers);
  
  for (const [group, headers] of Object.entries(headerGroups)) {
    if (headers.length > 0) {
      lines.push(`# ${group}`);
      for (const header of headers) {
        lines.push(`${header.name}: ${header.value}`);
      }
      lines.push('');
    }
  }
  
  // Body
  if (request.body) {
    lines.push('# Body');
    lines.push(formatBody(request.body, request.headers, indent));
  }
  
  return lines.join('\n').trim();
}

// 格式化 HTTP 响应
export function formatHttpResponse(response: HttpResponse, indent: number = 2): string {
  const lines: string[] = [];
  
  // 状态行
  lines.push(`${response.version} ${response.statusCode} ${response.statusText}`);
  lines.push('');
  
  // 头部（按类别分组）
  const headerGroups = groupHeaders(response.headers);
  
  for (const [group, headers] of Object.entries(headerGroups)) {
    if (headers.length > 0) {
      lines.push(`# ${group}`);
      for (const header of headers) {
        lines.push(`${header.name}: ${header.value}`);
      }
      lines.push('');
    }
  }
  
  // Body
  if (response.body) {
    lines.push('# Body');
    lines.push(formatBody(response.body, response.headers, indent));
  }
  
  return lines.join('\n').trim();
}

// 按类别分组头部
function groupHeaders(headers: HttpHeader[]): Record<string, HttpHeader[]> {
  const groups: Record<string, HttpHeader[]> = {
    'General': [],
    'Request/Response': [],
    'Content': [],
    'Cache': [],
    'Security': [],
    'Other': [],
  };
  
  const generalHeaders = ['Host', 'Connection', 'Date', 'Transfer-Encoding'];
  const requestHeaders = ['Accept', 'Accept-Language', 'Accept-Encoding', 'User-Agent', 'Referer', 'Origin'];
  const contentHeaders = ['Content-Type', 'Content-Length', 'Content-Encoding', 'Content-Language', 'Content-Disposition'];
  const cacheHeaders = ['Cache-Control', 'Pragma', 'Expires', 'ETag', 'Last-Modified', 'If-None-Match', 'If-Modified-Since'];
  const securityHeaders = ['Authorization', 'Cookie', 'Set-Cookie', 'X-CSRF-Token', 'X-XSS-Protection', 'Strict-Transport-Security'];
  
  for (const header of headers) {
    const name = header.name;
    if (generalHeaders.some(h => h.toLowerCase() === name.toLowerCase())) {
      groups['General'].push(header);
    } else if (requestHeaders.some(h => h.toLowerCase() === name.toLowerCase())) {
      groups['Request/Response'].push(header);
    } else if (contentHeaders.some(h => h.toLowerCase() === name.toLowerCase())) {
      groups['Content'].push(header);
    } else if (cacheHeaders.some(h => h.toLowerCase() === name.toLowerCase())) {
      groups['Cache'].push(header);
    } else if (securityHeaders.some(h => h.toLowerCase() === name.toLowerCase())) {
      groups['Security'].push(header);
    } else {
      groups['Other'].push(header);
    }
  }
  
  return groups;
}

// 格式化 Body
function formatBody(body: string, headers: HttpHeader[], indent: number): string {
  const contentType = headers.find(h => h.name.toLowerCase() === 'content-type')?.value || '';
  
  // JSON
  if (contentType.includes('application/json') || body.trim().startsWith('{') || body.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(body);
      return JSON.stringify(parsed, null, indent);
    } catch {
      return body;
    }
  }
  
  // XML
  if (contentType.includes('application/xml') || contentType.includes('text/xml') || body.trim().startsWith('<?xml') || body.trim().startsWith('<')) {
    return formatXmlBody(body, indent);
  }
  
  // URL encoded
  if (contentType.includes('application/x-www-form-urlencoded')) {
    return formatUrlEncodedBody(body);
  }
  
  return body;
}

// 格式化 XML body
function formatXmlBody(xml: string, indent: number): string {
  const indentStr = ' '.repeat(indent);
  let formatted = '';
  let indentLevel = 0;
  
  const tokens = xml.replace(/>\s*</g, '>\n<').split('\n');
  
  for (const token of tokens) {
    const trimmed = token.trim();
    if (!trimmed) continue;
    
    if (trimmed.match(/^<\?/)) {
      formatted += trimmed + '\n';
    } else if (trimmed.match(/^<\//)) {
      indentLevel = Math.max(0, indentLevel - 1);
      formatted += indentStr.repeat(indentLevel) + trimmed + '\n';
    } else if (trimmed.match(/\/>$/)) {
      formatted += indentStr.repeat(indentLevel) + trimmed + '\n';
    } else if (trimmed.match(/^</)) {
      formatted += indentStr.repeat(indentLevel) + trimmed + '\n';
      if (!trimmed.match(/<.*>.*<\//)) {
        indentLevel++;
      }
    } else {
      formatted += indentStr.repeat(indentLevel) + trimmed + '\n';
    }
  }
  
  return formatted.trim();
}

// 格式化 URL encoded body
function formatUrlEncodedBody(body: string): string {
  const params = body.split('&');
  return params.map(param => {
    const [key, value] = param.split('=');
    return `${decodeURIComponent(key || '')}: ${decodeURIComponent(value || '')}`;
  }).join('\n');
}

// 压缩 HTTP 报文
export function minifyHttpMessage(raw: string): string {
  const lines = raw.split(/\r?\n/);
  const result: string[] = [];
  let inBody = false;
  
  for (const line of lines) {
    if (line === '' && !inBody) {
      inBody = true;
      result.push('');
      continue;
    }
    
    if (inBody) {
      // 压缩 body
      result.push(line.trim());
    } else {
      // 保留头部格式
      result.push(line.trim());
    }
  }
  
  return result.join('\r\n');
}

// 生成 cURL 命令
export function toCurl(request: HttpRequest): string {
  const parts: string[] = ['curl'];
  
  // 方法
  if (request.method !== 'GET') {
    parts.push(`-X ${request.method}`);
  }
  
  // URL
  parts.push(`'${request.url}'`);
  
  // 头部
  for (const header of request.headers) {
    parts.push(`-H '${header.name}: ${header.value}'`);
  }
  
  // Body
  if (request.body) {
    parts.push(`-d '${request.body.replace(/'/g, "\\'")}'`);
  }
  
  return parts.join(' \\\n  ');
}

// 从 cURL 解析为 HTTP 请求
export function fromCurl(curl: string): HttpRequest {
  const normalized = curl.replace(/\\\n\s*/g, ' ').trim();
  
  let method = 'GET';
  let url = '';
  const headers: HttpHeader[] = [];
  let body = '';
  
  // 解析方法
  const methodMatch = normalized.match(/-X\s+(\w+)/);
  if (methodMatch) {
    method = methodMatch[1];
  }
  
  // 解析 URL
  const urlMatch = normalized.match(/curl\s+(?:-[^\s]+\s+)*['"]?([^'"\s]+)['"]?/);
  if (urlMatch) {
    url = urlMatch[1];
  }
  
  // 解析头部
  const headerMatches = normalized.matchAll(/-H\s+['"]([^'"]+)['"]/g);
  for (const match of headerMatches) {
    const colonIndex = match[1].indexOf(':');
    if (colonIndex > 0) {
      headers.push({
        name: match[1].substring(0, colonIndex).trim(),
        value: match[1].substring(colonIndex + 1).trim(),
      });
    }
  }
  
  // 解析 body
  const bodyMatch = normalized.match(/-d\s+['"]([^'"]+)['"]/);
  if (bodyMatch) {
    body = bodyMatch[1];
    if (method === 'GET') {
      method = 'POST';
    }
  }
  
  return {
    method,
    url,
    version: 'HTTP/1.1',
    headers,
    body,
  };
}

// HTTP 报文统计
export interface HttpStats {
  headerCount: number;
  bodySize: number;
  contentType: string;
  isRequest: boolean;
  method?: string;
  statusCode?: number;
}

export function getHttpStats(raw: string): HttpStats {
  try {
    const { type, message } = parseHttpMessage(raw);
    const isRequest = type === 'request';
    
    const contentType = message.headers.find(h => h.name.toLowerCase() === 'content-type')?.value || 'N/A';
    
    return {
      headerCount: message.headers.length,
      bodySize: message.body.length,
      contentType,
      isRequest,
      method: isRequest ? (message as HttpRequest).method : undefined,
      statusCode: !isRequest ? (message as HttpResponse).statusCode : undefined,
    };
  } catch {
    return {
      headerCount: 0,
      bodySize: 0,
      contentType: 'N/A',
      isRequest: false,
    };
  }
}

// 验证 HTTP 报文
export interface HttpValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateHttpMessage(raw: string): HttpValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!raw.trim()) {
    errors.push('报文内容为空');
    return { valid: false, errors, warnings };
  }
  
  try {
    const { type, message } = parseHttpMessage(raw);
    
    // 检查必要头部
    const hasHost = message.headers.some(h => h.name.toLowerCase() === 'host');
    const hasContentType = message.headers.some(h => h.name.toLowerCase() === 'content-type');
    const hasContentLength = message.headers.some(h => h.name.toLowerCase() === 'content-length');
    
    if (type === 'request' && !hasHost) {
      warnings.push('缺少 Host 头部');
    }
    
    if (message.body && !hasContentType) {
      warnings.push('有 Body 但缺少 Content-Type 头部');
    }
    
    if (message.body && !hasContentLength) {
      warnings.push('有 Body 但缺少 Content-Length 头部');
    }
    
    // 检查 Content-Length 是否正确
    if (hasContentLength) {
      const contentLength = parseInt(message.headers.find(h => h.name.toLowerCase() === 'content-length')?.value || '0');
      if (contentLength !== message.body.length) {
        warnings.push(`Content-Length (${contentLength}) 与实际 Body 长度 (${message.body.length}) 不匹配`);
      }
    }
    
  } catch (e) {
    errors.push(e instanceof Error ? e.message : '解析失败');
  }
  
  return { valid: errors.length === 0, errors, warnings };
}
