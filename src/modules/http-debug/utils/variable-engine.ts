import type { KeyValuePair, HttpRequestConfig, Environment } from './types';

/**
 * 替换字符串中的变量占位符 {{variableName}}
 * - 只替换 enabled 为 true 的变量
 * - 未定义的变量保留原始占位符文本
 */
export function replaceVariables(template: string, variables: KeyValuePair[]): string {
  const enabledVars = new Map<string, string>();
  for (const v of variables) {
    if (v.enabled) {
      enabledVars.set(v.key, v.value);
    }
  }

  return template.replace(/\{\{(\w+)\}\}/g, (match, name) => {
    return enabledVars.has(name) ? enabledVars.get(name)! : match;
  });
}

/**
 * 对请求配置中的 URL、请求头值和请求体执行变量替换
 * 返回替换后的新配置对象（不修改原对象）
 */
export function applyVariablesToRequest(
  config: HttpRequestConfig,
  variables: KeyValuePair[],
): HttpRequestConfig {
  return {
    ...config,
    url: replaceVariables(config.url, variables),
    headers: config.headers.map((h) => ({
      ...h,
      value: replaceVariables(h.value, variables),
    })),
    body: replaceVariables(config.body, variables),
    formData: config.formData?.map((f) => ({
      ...f,
      value: replaceVariables(f.value, variables),
    })),
  };
}

const ENVIRONMENTS_KEY = 'http-debug-environments';
const ACTIVE_ENV_KEY = 'http-debug-active-env';

/**
 * 将环境变量列表保存到 localStorage
 */
export function saveEnvironments(environments: Environment[]): void {
  localStorage.setItem(ENVIRONMENTS_KEY, JSON.stringify(environments));
}

/**
 * 从 localStorage 加载环境变量列表，解析失败时返回空数组
 */
export function loadEnvironments(): Environment[] {
  try {
    const raw = localStorage.getItem(ENVIRONMENTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Environment[];
  } catch {
    return [];
  }
}

/**
 * 保存当前激活的环境 ID 到 localStorage
 * 传入 null 时移除该键
 */
export function saveActiveEnvId(id: string | null): void {
  if (id === null) {
    localStorage.removeItem(ACTIVE_ENV_KEY);
  } else {
    localStorage.setItem(ACTIVE_ENV_KEY, id);
  }
}

/**
 * 从 localStorage 加载当前激活的环境 ID
 */
export function loadActiveEnvId(): string | null {
  return localStorage.getItem(ACTIVE_ENV_KEY);
}
