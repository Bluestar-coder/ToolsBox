import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import zhCN from './locales/zh-CN';
import enUS from './locales/en-US';

const resources = {
  'zh-CN': { translation: zhCN },
  'en-US': { translation: enUS },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: ['zh-CN', 'en-US'],
    fallbackLng: 'zh-CN',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'app-language',
    },
  });

export default i18n;

// 导出支持的语言列表
export const supportedLanguages = [
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
  { code: 'en-US', name: 'English', flag: '🇺🇸' },
];

// 切换语言
export const changeLanguage = (lng: string) => {
  i18n.changeLanguage(lng);
  localStorage.setItem('app-language', lng);
};

// 获取当前语言
export const getCurrentLanguage = () => i18n.language;
