import {
  createToolModulePath,
  moduleIdToPath,
  pathToModuleId,
} from '../modules/catalog';

export { moduleIdToPath, pathToModuleId };

export const createNavigation = {
  encoder: (type?: string) => createToolModulePath('encoder-decoder', type),
  crypto: (type?: string) => createToolModulePath('crypto-tool', type),
  time: (type?: string) => createToolModulePath('time-tool', type),
  formatter: (type?: string) => createToolModulePath('code-formatter', type),
  regex: (type?: string) => createToolModulePath('regex-tool', type),
  qrcode: (type?: string) => createToolModulePath('qrcode-tool', type),
  diff: () => createToolModulePath('diff-tool'),
  httpDebug: () => createToolModulePath('http-debug'),
  ipNetwork: () => createToolModulePath('ip-network'),
  recipe: () => createToolModulePath('recipe-tool'),
};
