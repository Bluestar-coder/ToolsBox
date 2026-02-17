import type { HttpRequestConfig, HttpResponse, KeyValuePair } from './types';
import { applyVariablesToRequest } from './variable-engine';

/**
 * 检测是否运行在 Tauri 环境
 * 通过检查 window.__TAURI_INTERNALS__ 判断
 */
export function isTauriEnvironment(): boolean {
  try {
    return typeof window !== 'undefined' && !!(window as any).__TAURI_INTERNALS__;
  } catch {
    return false;
  }
}

/**
 * 从 HttpRequestConfig 构建请求头 Headers 对象
 * 只包含 enabled 为 true 的头部
 */
function buildHeaders(config: HttpRequestConfig): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const h of config.headers) {
    if (h.enabled && h.key.trim()) {
      headers[h.key] = h.value;
    }
  }
  return headers;
}

/**
 * 根据 bodyType 构建请求体
 * 返回 [body, contentType]，contentType 为 null 表示不设置（如 multipart 由浏览器自动设置）
 */
function buildRequestBody(config: HttpRequestConfig): [BodyInit | null, string | null] {
  const { method } = config;
  // GET 和 HEAD 请求不应有 body
  if (method === 'GET' || method === 'HEAD') {
    return [null, null];
  }

  switch (config.bodyType) {
    case 'none':
      return [null, null];

    case 'json':
      return [config.body || '', 'application/json'];

    case 'form': {
      // 从 formData 键值对构建 URLSearchParams
      const params = new URLSearchParams();
      if (config.formData) {
        for (const field of config.formData) {
          if (field.enabled) {
            params.append(field.key, field.value);
          }
        }
      }
      return [params.toString(), 'application/x-www-form-urlencoded'];
    }

    case 'multipart': {
      // 构建 FormData，Content-Type 由浏览器自动设置（含 boundary）
      const formData = new FormData();
      if (config.formData) {
        for (const field of config.formData) {
          if (field.enabled) {
            formData.append(field.key, field.value);
          }
        }
      }
      return [formData, null]; // null 表示不手动设置 Content-Type
    }

    case 'raw':
      return [config.body || '', 'text/plain'];

    case 'binary': {
      // body 为 hex 字符串，转为 Uint8Array
      const hex = config.body.replace(/\s/g, '');
      if (!hex) return [null, null];
      const bytes = new Uint8Array(hex.length / 2);
      for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
      }
      return [bytes, 'application/octet-stream'];
    }

    default:
      return [null, null];
  }
}

/**
 * 从 Response 对象提取响应头为 Record
 */
function extractHeaders(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

/**
 * 计算字符串的字节大小（UTF-8）
 */
function getByteSize(str: string): number {
  try {
    return new TextEncoder().encode(str).byteLength;
  } catch {
    return str.length;
  }
}

/**
 * 使用浏览器 Fetch API 发送 HTTP 请求
 */
export async function sendViaFetch(config: HttpRequestConfig): Promise<HttpResponse> {
  const [body, contentType] = buildRequestBody(config);
  const headers = buildHeaders(config);

  // 如果 buildRequestBody 返回了 contentType 且用户没有手动设置，则自动添加
  if (contentType && !Object.keys(headers).some((k) => k.toLowerCase() === 'content-type')) {
    headers['Content-Type'] = contentType;
  }

  const startTime = performance.now();

  try {
    const response = await fetch(config.url, {
      method: config.method,
      headers,
      body,
    });

    const duration = Math.round(performance.now() - startTime);
    const responseBody = await response.text();
    const responseHeaders = extractHeaders(response.headers);
    const responseContentType = responseHeaders['content-type'] || '';
    const size = getByteSize(responseBody);

    return {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseBody,
      size,
      duration,
      contentType: responseContentType,
    };
  } catch (error: any) {
    const duration = Math.round(performance.now() - startTime);

    // 判断错误类型
    let errorMessage: string;
    if (error instanceof TypeError) {
      // Fetch API 的 TypeError 通常是网络错误或 CORS 错误
      errorMessage = `Network error: ${error.message}. This may be caused by CORS restrictions in the browser. Consider using the Tauri desktop app to bypass CORS.`;
    } else if (error.name === 'AbortError') {
      errorMessage = `Request timeout: ${error.message}`;
    } else {
      errorMessage = `Request failed: ${error.message || String(error)}`;
    }

    return {
      status: 0,
      statusText: 'Error',
      headers: {},
      body: errorMessage,
      size: 0,
      duration,
      contentType: '',
    };
  }
}

/**
 * 使用 Tauri HTTP 插件发送请求
 * 动态导入 @tauri-apps/plugin-http 以避免构建错误
 */
export async function sendViaTauri(config: HttpRequestConfig): Promise<HttpResponse> {
  const [body, contentType] = buildRequestBody(config);
  const headers = buildHeaders(config);

  if (contentType && !Object.keys(headers).some((k) => k.toLowerCase() === 'content-type')) {
    headers['Content-Type'] = contentType;
  }

  const startTime = performance.now();

  try {
    // 动态导入 Tauri HTTP 插件（运行时才可用，构建时可能不存在）
    // 使用字符串拼接避免 Vite 在构建时解析此依赖
    // @ts-ignore - @tauri-apps/plugin-http is only available in Tauri runtime
    const pluginName = '@tauri-apps/plugin-http';
    const { fetch: tauriFetch } = await import(/* @vite-ignore */ pluginName);

    const response = await tauriFetch(config.url, {
      method: config.method,
      headers,
      body,
    });

    const duration = Math.round(performance.now() - startTime);
    const responseBody = await response.text();
    const responseHeaders = extractHeaders(response.headers);
    const responseContentType = responseHeaders['content-type'] || '';
    const size = getByteSize(responseBody);

    return {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseBody,
      size,
      duration,
      contentType: responseContentType,
    };
  } catch (error: any) {
    const duration = Math.round(performance.now() - startTime);

    // Tauri 插件未安装或其他错误，回退到 Fetch API
    if (
      error.message?.includes('Failed to resolve') ||
      error.message?.includes('Module not found') ||
      error.code === 'ERR_MODULE_NOT_FOUND'
    ) {
      console.warn('Tauri HTTP plugin not available, falling back to Fetch API');
      return sendViaFetch(config);
    }

    return {
      status: 0,
      statusText: 'Error',
      headers: {},
      body: `Request failed: ${error.message || String(error)}`,
      size: 0,
      duration,
      contentType: '',
    };
  }
}

/**
 * 发送 HTTP 请求（自动选择平台策略）
 * - 先对请求配置执行变量替换
 * - 自动检测 Tauri 环境，选择对应的发送策略
 */
export async function sendHttpRequest(
  config: HttpRequestConfig,
  variables?: KeyValuePair[],
): Promise<HttpResponse> {
  // 应用变量替换
  const resolvedConfig = variables && variables.length > 0
    ? applyVariablesToRequest(config, variables)
    : config;

  // 根据环境选择发送策略
  if (isTauriEnvironment()) {
    return sendViaTauri(resolvedConfig);
  }
  return sendViaFetch(resolvedConfig);
}
