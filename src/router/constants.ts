/**
 * 导航辅助函数
 */
export const createNavigation = {
  /**
   * 编码工具路径
   */
  encoder: (type?: string) => `/encoder${type ? `/${type}` : ''}`,

  /**
   * 加密工具路径
   */
  crypto: (type?: string) => `/crypto${type ? `/${type}` : ''}`,

  /**
   * 时间工具路径
   */
  time: (type?: string) => `/time${type ? `/${type}` : ''}`,

  /**
   * 代码格式化路径
   */
  formatter: (type?: string) => `/formatter${type ? `/${type}` : ''}`,

  /**
   * 正则工具路径
   */
  regex: (type?: string) => `/regex${type ? `/${type}` : ''}`,

  /**
   * 二维码工具路径
   */
  qrcode: (type?: string) => `/qrcode${type ? `/${type}` : ''}`,

  /**
   * 差异对比工具路径
   */
  diff: () => '/diff',

  /**
   * HTTP 调试工具路径
   */
  httpDebug: () => '/http-debug',

  /**
   * IP/网络工具路径
   */
  ipNetwork: () => '/ip-network',

  /**
   * 设置路径
   */
  settings: () => '/settings',
};

/**
 * 模块ID到路由路径的映射
 */
export const moduleIdToPath: Record<string, string> = {
  'encoder-decoder': '/encoder',
  'crypto-tool': '/crypto',
  'time-tool': '/time',
  'code-formatter': '/formatter',
  'regex-tool': '/regex',
  'qrcode-tool': '/qrcode',
  'diff-tool': '/diff',
  'http-debug': '/http-debug',
  'ip-network': '/ip-network',
};

/**
 * 路由路径到模块ID的映射
 */
export const pathToModuleId: Record<string, string> = {
  '/encoder': 'encoder-decoder',
  '/crypto': 'crypto-tool',
  '/time': 'time-tool',
  '/formatter': 'code-formatter',
  '/regex': 'regex-tool',
  '/qrcode': 'qrcode-tool',
  '/diff': 'diff-tool',
  '/http-debug': 'http-debug',
  '/ip-network': 'ip-network',
  '/settings': 'settings',
};
