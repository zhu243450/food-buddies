import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import zh from './locales/zh.json';

const resources = {
  en: { translation: en },
  zh: { translation: zh }
};

// 从localStorage读取用户设置的语言，没有则使用默认中文
const savedLanguage = localStorage.getItem('language') || 'zh';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage, // 使用保存的语言设置
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;