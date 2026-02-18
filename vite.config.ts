import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React核心库
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor';
          }
          // Ant Design UI库
          if (id.includes('node_modules/antd/') || id.includes('node_modules/@ant-design/')) {
            return 'antd';
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
