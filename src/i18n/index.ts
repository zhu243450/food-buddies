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
    const saved = localStorage.getItem('language');
    if (saved) return saved;
    const navLang = (navigator.language || (navigator.languages && navigator.languages[0]) || 'en').toLowerCase();
    return navLang.startsWith('zh') ? 'zh' : 'en';
  } catch {
    return 'en';
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