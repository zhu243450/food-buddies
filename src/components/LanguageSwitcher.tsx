import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { useEffect, useState } from 'react';

const languages = [
  { code: 'zh', name: '中文' },
  { code: 'en', name: 'English' },
];

export const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  // 确保组件挂载时读取正确的语言设置
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && savedLanguage !== i18n.language) {
      i18n.changeLanguage(savedLanguage);
    }
  }, [i18n]);

  const changeLanguage = async (languageCode: string) => {
    console.log('Changing language to:', languageCode);
    await i18n.changeLanguage(languageCode);
    localStorage.setItem('language', languageCode);
    setIsOpen(false);
  };

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="sm" 
        className="gap-2"
        onClick={(e) => {
          console.log('Language switcher clicked!');
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        <Globe className="w-4 h-4" />
        {currentLanguage.name}
      </Button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full right-0 mt-1 bg-background border rounded-md shadow-lg z-50 min-w-[100px]">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => changeLanguage(language.code)}
                className={`block w-full px-3 py-2 text-sm text-left hover:bg-accent rounded-md transition-colors ${
                  i18n.language === language.code ? 'bg-accent' : ''
                }`}
              >
                {language.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};