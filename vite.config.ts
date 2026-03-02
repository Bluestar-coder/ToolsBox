import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Keep dev URL stable for Tauri (tauri.conf.json -> build.devUrl)
    port: 5173,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React核心库
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor';
          }
          // Ant Design 生态拆分（避免主包聚合过大）
          if (id.includes('node_modules/@ant-design/icons/')) {
            return 'antd-icons';
          }
          if (id.includes('node_modules/@ant-design/cssinjs/')) {
            return 'antd-cssinjs';
          }
          if (id.includes('node_modules/@rc-component/') || id.includes('node_modules/rc-')) {
            return 'antd-rc';
          }
          if (id.includes('node_modules/antd/')) {
            return 'antd-core';
          }
          // Prettier 及插件（用于 CodeFormatter，按需懒加载）
          if (id.includes('node_modules/prettier/standalone')) {
            return 'prettier-standalone';
          }
          if (id.includes('node_modules/@prettier/plugin-php/')) {
            return 'prettier-php';
          }
          if (id.includes('node_modules/@prettier/plugin-xml/')) {
            return 'prettier-xml';
          }
          if (id.includes('node_modules/sql-formatter/')) {
            return 'sql-formatter';
          }
          // 加密相关库
          if (id.includes('node_modules/crypto-js/') || id.includes('node_modules/sm-crypto/')) {
            return 'crypto';
          }
          // 二维码相关库
          if (id.includes('node_modules/qrcode')) {
            return 'qrcode';
          }
          // 代码高亮相关库
          if (id.includes('node_modules/prismjs/') || id.includes('node_modules/react-syntax-highlighter/')) {
            return 'prism';
          }
          // 国际化相关库
          if (id.includes('node_modules/i18next/') || id.includes('node_modules/react-i18next/')) {
            return 'i18n';
          }
        },
      },
    },
    // 启用源码映射便于调试
    sourcemap: false,
    // 代码分割阈值
    chunkSizeWarningLimit: 1000,
  },
  // 优化依赖预构建
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'antd',
      '@ant-design/icons',
      'crypto-js',
      'qrcode',
      'prismjs',
      'i18next',
      'react-i18next',
      '@tauri-apps/plugin-http',
    ],
  },
})
