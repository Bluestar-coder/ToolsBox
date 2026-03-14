import type { ComponentType } from 'react';
import type { ToolModuleId } from './catalog';

type ModuleComponentImport = () => Promise<{ default: ComponentType<Record<string, never>> }>;

export const toolModulePageImports: Record<ToolModuleId, ModuleComponentImport> = {
  'encoder-decoder': () => import('../pages/EncoderPage'),
  'crypto-tool': () => import('../pages/CryptoPage'),
  'time-tool': () => import('../pages/TimePage'),
  'regex-tool': () => import('../pages/RegexPage'),
  'code-formatter': () => import('../pages/FormatterPage'),
  'qrcode-tool': () => import('../pages/QRCodePage'),
  'diff-tool': () => import('../pages/DiffPage'),
  'http-debug': () => import('../pages/HttpDebugPage'),
  'ip-network': () => import('../pages/IpNetworkPage'),
  'recipe-tool': () => import('../pages/RecipePage'),
};

export const toolModuleComponentImports: Record<ToolModuleId, ModuleComponentImport> = {
  'encoder-decoder': () => import('./encoder-decoder/components/EncoderDecoder'),
  'crypto-tool': () => import('./crypto-tool/components/CryptoTool'),
  'time-tool': () => import('./time-tool/components/TimeTool'),
  'regex-tool': () => import('./regex-tool/components/RegexTool'),
  'code-formatter': () => import('./code-formatter/components/CodeFormatter'),
  'qrcode-tool': () => import('./qrcode-tool/components/QRCodeTool'),
  'diff-tool': () => import('./diff-tool/components/DiffTool'),
  'http-debug': () => import('./http-debug/components/HttpDebugTool'),
  'ip-network': () => import('./ip-network/components/IpNetworkTool'),
  'recipe-tool': () => import('./recipe-tool/components/RecipeTool'),
};

export function getToolModulePageImport(moduleId: ToolModuleId): ModuleComponentImport {
  return toolModulePageImports[moduleId];
}

export function getToolModuleComponentImport(moduleId: ToolModuleId): ModuleComponentImport {
  return toolModuleComponentImports[moduleId];
}
