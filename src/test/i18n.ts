// i18n测试配置
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  lng: 'zh-CN',
  fallbackLng: 'en',
  resources: {
    'zh-CN': {
      translation: {
        'app': {
          'title': '🔧 效率工具箱',
          'switchToLight': '切换到浅色模式',
          'switchToDark': '切换到深色模式',
        },
        'modules': {
          'encoder': {
            'name': '编码/解码',
            'description': '支持多种编码格式的编码和解码工具',
          },
          'time': {
            'name': '时间工具',
            'description': '时间戳和日期格式转换工具',
          },
          'crypto': {
            'name': '加密/解密',
            'description': '对称加密和非对称加密工具',
          },
          'formatter': {
            'name': '代码格式化',
            'description': 'JSON、XML、SQL等代码格式化工具',
          },
          'regex': {
            'name': '正则工具',
            'description': '正则表达式测试和验证工具',
          },
          'qrcode': {
            'name': '二维码',
            'description': '二维码生成和识别工具',
          },
        },
        'errors': {
          'unknownError': '发生未知错误',
        },
      },
    },
    'en': {
      translation: {
        'app': {
          'title': '🔧 Efficiency Toolbox',
          'switchToLight': 'Switch to Light Mode',
          'switchToDark': 'Switch to Dark Mode',
        },
        'modules': {
          'encoder': {
            'name': 'Encode/Decode',
            'description': 'Support encoding and decoding for multiple formats',
          },
          'time': {
            'name': 'Time Tools',
            'description': 'Timestamp and date format conversion',
          },
          'crypto': {
            'name': 'Crypto Tools',
            'description': 'Symmetric and asymmetric encryption',
          },
          'formatter': {
            'name': 'Code Formatter',
            'description': 'JSON, XML, SQL code formatting tools',
          },
          'regex': {
            'name': 'Regex Tools',
            'description': 'Regex testing and validation',
          },
          'qrcode': {
            'name': 'QR Code',
            'description': 'QR code generation and recognition',
          },
        },
        'errors': {
          'unknownError': 'Unknown error occurred',
        },
      },
    },
  },
});

export default i18n;
