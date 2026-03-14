import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const chunkGroups = [
  {
    name: 'antd-base',
    patterns: [
      'node_modules/antd/es/_util/',
      'node_modules/antd/es/config-provider/',
      'node_modules/antd/es/theme/',
      'node_modules/antd/es/style/',
      'node_modules/antd/es/locale/',
      'node_modules/antd/es/app/',
      'node_modules/rc-util/',
      'node_modules/@rc-component/util/',
      'node_modules/rc-motion/',
    ],
  },
  {
    name: 'antd-button-space',
    patterns: [
      'node_modules/antd/es/button/',
      'node_modules/antd/es/space/',
    ],
  },
  {
    name: 'antd-layout-card',
    patterns: [
      'node_modules/antd/es/layout/',
      'node_modules/antd/es/spin/',
      'node_modules/antd/es/card/',
      'node_modules/antd/es/typography/',
      'node_modules/antd/es/grid/',
      'node_modules/antd/es/row/',
      'node_modules/antd/es/col/',
    ],
  },
  {
    name: 'antd-menu-dropdown',
    patterns: [
      'node_modules/antd/es/dropdown/',
      'node_modules/antd/es/menu/',
      'node_modules/@rc-component/trigger/',
      'node_modules/rc-menu/',
      'node_modules/rc-dropdown/',
      'node_modules/rc-overflow/',
      'node_modules/rc-resize-observer/',
    ],
  },
  {
    name: 'antd-input',
    patterns: [
      'node_modules/antd/es/input/',
      'node_modules/rc-input/',
      'node_modules/rc-textarea/',
    ],
  },
  {
    name: 'antd-select',
    patterns: [
      'node_modules/antd/es/select/',
      'node_modules/rc-select/',
    ],
  },
  {
    name: 'antd-form-core',
    patterns: [
      'node_modules/antd/es/form/',
      'node_modules/antd/es/checkbox/',
      'node_modules/antd/es/radio/',
      'node_modules/antd/es/switch/',
      'node_modules/rc-field-form/',
      'node_modules/rc-checkbox/',
      'node_modules/rc-switch/',
    ],
  },
  {
    name: 'antd-input-number',
    patterns: [
      'node_modules/antd/es/input-number/',
      'node_modules/rc-input-number/',
    ],
  },
  {
    name: 'antd-upload-color',
    patterns: [
      'node_modules/antd/es/upload/',
      'node_modules/antd/es/color-picker/',
      'node_modules/rc-upload/',
      'node_modules/@rc-component/color-picker/',
    ],
  },
  {
    name: 'antd-nav',
    patterns: [
      'node_modules/antd/es/tabs/',
      'node_modules/antd/es/collapse/',
      'node_modules/antd/es/pagination/',
      'node_modules/rc-tabs/',
      'node_modules/rc-collapse/',
      'node_modules/rc-pagination/',
    ],
  },
  {
    name: 'antd-table',
    patterns: [
      'node_modules/antd/es/table/',
      'node_modules/rc-table/',
    ],
  },
  {
    name: 'antd-tree-list',
    patterns: [
      'node_modules/antd/es/list/',
      'node_modules/antd/es/tree/',
      'node_modules/rc-tree/',
      'node_modules/rc-virtual-list/',
    ],
  },
  {
    name: 'antd-display',
    patterns: [
      'node_modules/antd/es/descriptions/',
      'node_modules/antd/es/tag/',
      'node_modules/antd/es/badge/',
      'node_modules/antd/es/empty/',
      'node_modules/antd/es/divider/',
    ],
  },
  {
    name: 'antd-feedback',
    patterns: [
      'node_modules/antd/es/alert/',
      'node_modules/antd/es/message/',
      'node_modules/antd/es/modal/',
      'node_modules/antd/es/popconfirm/',
      'node_modules/antd/es/tooltip/',
      'node_modules/rc-dialog/',
      'node_modules/rc-notification/',
      'node_modules/rc-tooltip/',
    ],
  },
]

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
        onlyExplicitManualChunks: true,
        manualChunks: (id) => {
          // React核心库
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor';
          }

          if (id.includes('node_modules/@ant-design/icons/')) {
            return 'antd-icons';
          }
          if (id.includes('node_modules/@ant-design/cssinjs/')) {
            return 'antd-cssinjs';
          }

          for (const group of chunkGroups) {
            if (group.patterns.some((pattern) => id.includes(pattern))) {
              return group.name;
            }
          }

          // Prettier 及插件（用于 CodeFormatter，按需懒加载）
          if (id.includes('node_modules/prettier/standalone')) {
            return 'prettier-standalone';
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
          if (id.includes('node_modules/jsqr/')) {
            return 'qrcode-scanner';
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
