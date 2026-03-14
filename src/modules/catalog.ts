import type { AppIconName } from '../components/icons/AppIcon';

export type ToolModuleId =
  | 'encoder-decoder'
  | 'crypto-tool'
  | 'time-tool'
  | 'code-formatter'
  | 'regex-tool'
  | 'qrcode-tool'
  | 'diff-tool'
  | 'http-debug'
  | 'ip-network'
  | 'recipe-tool';

export interface ToolModuleDefinition {
  id: ToolModuleId;
  routePath: string;
  iconName: AppIconName;
  i18nKey: string;
  fallbackTitle: string;
  fallbackDescription: string;
  supportsTypeParam?: boolean;
  supportedTypes?: readonly string[];
}

const formatterTypes = ['json', 'sql', 'http', 'general'] as const;
const timeTypes = ['smart', 'code', 'calc', 'batch', 'timezone', 'uuid'] as const;
const regexTypes = ['test', 'replace', 'split'] as const;
const qrcodeTypes = ['generate', 'scan'] as const;
const cryptoTypes = [
  'symmetric',
  'asymmetric',
  'hash',
  'jwt',
  'classical',
  'gm',
  'aes',
  'des',
  '3des',
  'aes-gcm',
  'aes-siv',
  'chacha20',
  'rc',
  'blowfish',
  'openssl',
  'rsa',
  'ecdsa',
  'ed25519',
  'x25519',
  'ecdh',
  'sm3',
  'kdf',
  'substitute',
  'transpose',
  'encode',
  'sm2',
  'sm4',
  'zuc',
  'gm-info',
] as const;

export const toolModules: ToolModuleDefinition[] = [
  {
    id: 'encoder-decoder',
    routePath: '/encoder',
    iconName: 'encoder',
    i18nKey: 'modules.encoder',
    fallbackTitle: '编码/解码',
    fallbackDescription: '支持多种编码格式的编码和解码工具',
    supportsTypeParam: true,
  },
  {
    id: 'crypto-tool',
    routePath: '/crypto',
    iconName: 'crypto',
    i18nKey: 'modules.crypto',
    fallbackTitle: '加密/解密',
    fallbackDescription: '支持AES、DES、3DES等多种加密算法的加密解密工具',
    supportsTypeParam: true,
    supportedTypes: cryptoTypes,
  },
  {
    id: 'time-tool',
    routePath: '/time',
    iconName: 'time',
    i18nKey: 'modules.time',
    fallbackTitle: '时间工具',
    fallbackDescription: '时间格式转换、时间戳获取、UTC与本地时间转换等功能',
    supportsTypeParam: true,
    supportedTypes: timeTypes,
  },
  {
    id: 'regex-tool',
    routePath: '/regex',
    iconName: 'regex',
    i18nKey: 'modules.regex',
    fallbackTitle: '正则工具',
    fallbackDescription: '正则表达式测试、替换和分割工具',
    supportsTypeParam: true,
    supportedTypes: regexTypes,
  },
  {
    id: 'code-formatter',
    routePath: '/formatter',
    iconName: 'formatter',
    i18nKey: 'modules.formatter',
    fallbackTitle: '代码格式化',
    fallbackDescription: '支持多种语言的代码格式化和压缩工具',
    supportsTypeParam: true,
    supportedTypes: formatterTypes,
  },
  {
    id: 'qrcode-tool',
    routePath: '/qrcode',
    iconName: 'qrcode',
    i18nKey: 'modules.qrcode',
    fallbackTitle: '二维码工具',
    fallbackDescription: '二维码生成与识别工具',
    supportsTypeParam: true,
    supportedTypes: qrcodeTypes,
  },
  {
    id: 'diff-tool',
    routePath: '/diff',
    iconName: 'diff',
    i18nKey: 'modules.diff',
    fallbackTitle: 'Diff Tool',
    fallbackDescription: 'Compare text, code, or JSON files to find differences.',
  },
  {
    id: 'http-debug',
    routePath: '/http-debug',
    iconName: 'http',
    i18nKey: 'modules.httpDebug',
    fallbackTitle: '网络调试',
    fallbackDescription: 'HTTP 接口调试与 WebSocket 调试工具',
  },
  {
    id: 'ip-network',
    routePath: '/ip-network',
    iconName: 'network',
    i18nKey: 'modules.ipNetwork',
    fallbackTitle: 'IP/网络工具',
    fallbackDescription: 'IP 地址转换、CIDR 计算、子网划分、归属地查询、端口速查',
  },
  {
    id: 'recipe-tool',
    routePath: '/recipe',
    iconName: 'recipe',
    i18nKey: 'modules.recipe',
    fallbackTitle: 'Recipe工具',
    fallbackDescription: '基于CyberChef设计理念的操作链式处理工具',
  },
];

export const toolModulesById: Record<ToolModuleId, ToolModuleDefinition> = Object.fromEntries(
  toolModules.map((module) => [module.id, module])
) as Record<ToolModuleId, ToolModuleDefinition>;

export const moduleIdToPath: Record<ToolModuleId, string> = Object.fromEntries(
  toolModules.map((module) => [module.id, module.routePath])
) as Record<ToolModuleId, string>;

export const pathToModuleId: Record<string, ToolModuleId> = Object.fromEntries(
  toolModules.map((module) => [module.routePath, module.id])
) as Record<string, ToolModuleId>;

export const defaultToolModuleId: ToolModuleId = toolModules[0].id;

export function createToolModulePath(moduleId: ToolModuleId, type?: string): string {
  const basePath = moduleIdToPath[moduleId];
  return type ? `${basePath}/${type}` : basePath;
}

export function getValidatedModuleType(
  moduleId: ToolModuleId,
  type: string | undefined
): string | undefined {
  if (!type) {
    return undefined;
  }

  const supportedTypes = toolModulesById[moduleId].supportedTypes;
  if (!supportedTypes) {
    return undefined;
  }

  return supportedTypes.includes(type) ? type : undefined;
}
