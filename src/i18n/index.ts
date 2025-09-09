import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import zh from './locales/zh.json';

const resources = {
  en: { translation: en },
  zh: { translation: zh }
};

// 异步读取用户设置的语言，提升初始加载性能
const getSavedLanguage = () => {
  try {
    return localStorage.getItem('language') || 'zh';
  } catch {
    return 'zh';
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getSavedLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;