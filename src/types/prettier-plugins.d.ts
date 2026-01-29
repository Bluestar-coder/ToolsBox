import type { Plugin } from 'prettier';

declare module '@prettier/plugin-xml' {
  const plugin: Plugin;
  export default plugin;
}

declare module '@prettier/plugin-php' {
  const plugin: Plugin;
  export default plugin;
}
