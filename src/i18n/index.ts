import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zhCN from './locales/zh-CN';

const DEFAULT_LANGUAGE = 'zh-CN';
const LANGUAGE_STORAGE_KEY = 'app-language';
const SUPPORTED_LANGUAGE_CODES = ['zh-CN', 'en-US'] as const;
const loadedLanguages = new Set<string>([DEFAULT_LANGUAGE]);

const localeLoaders: Record<string, () => Promise<{ default: Record<string, unknown> }>> = {
  'en-US': () => import('./locales/en-US'),
};

function normalizeLanguage(lng: string | null | undefined): string {
  if (!lng) {
    return DEFAULT_LANGUAGE;
  }

  if (SUPPORTED_LANGUAGE_CODES.includes(lng as (typeof SUPPORTED_LANGUAGE_CODES)[number])) {
    return lng;
  }

  const matched = SUPPORTED_LANGUAGE_CODES.find((code) => lng.startsWith(code.split('-')[0]));
  return matched ?? DEFAULT_LANGUAGE;
}

function isTestRuntime(): boolean {
  const runtime = globalThis as typeof globalThis & { __TEST__?: boolean };
  return !!runtime.__TEST__ || !!import.meta.vitest || import.meta.env.MODE === 'test';
}

function detectInitialLanguage(): string {
  if (isTestRuntime()) {
    return DEFAULT_LANGUAGE;
  }

  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE;
  }

  const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (storedLanguage) {
    return normalizeLanguage(storedLanguage);
  }

  const navigatorLanguage = window.navigator.language ?? window.navigator.languages?.[0];
  return normalizeLanguage(navigatorLanguage);
}

export async function ensureLanguageLoaded(lng: string): Promise<string> {
  const normalizedLanguage = normalizeLanguage(lng);
  if (loadedLanguages.has(normalizedLanguage)) {
    return normalizedLanguage;
  }

  const loadLocale = localeLoaders[normalizedLanguage];
  if (!loadLocale) {
    return DEFAULT_LANGUAGE;
  }

  const mod = await loadLocale();
  i18n.addResourceBundle(normalizedLanguage, 'translation', mod.default, true, true);
  loadedLanguages.add(normalizedLanguage);
  return normalizedLanguage;
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      [DEFAULT_LANGUAGE]: { translation: zhCN },
    },
    lng: DEFAULT_LANGUAGE,
    supportedLngs: [...SUPPORTED_LANGUAGE_CODES],
    fallbackLng: DEFAULT_LANGUAGE,
    debug: false,
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

export const i18nReady = (async () => {
  const initialLanguage = detectInitialLanguage();
  if (initialLanguage !== DEFAULT_LANGUAGE) {
    const loadedLanguage = await ensureLanguageLoaded(initialLanguage);
    await i18n.changeLanguage(loadedLanguage);
    return;
  }

  await i18n.changeLanguage(DEFAULT_LANGUAGE);
})();

// 导出支持的语言列表
export const supportedLanguages = [
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
  { code: 'en-US', name: 'English', flag: '🇺🇸' },
];

// 切换语言
export const changeLanguage = async (lng: string) => {
  const normalizedLanguage = await ensureLanguageLoaded(lng);
  await i18n.changeLanguage(normalizedLanguage);

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, normalizedLanguage);
  }
};

// 获取当前语言
export const getCurrentLanguage = () => i18n.language;
