import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Español', flag: '🇪🇸' }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 px-3 py-2 text-sm text-vscode-text-primary hover:bg-vscode-bg-hover rounded-md transition-colors"
        title={t('changeLanguage') || 'Change Language'}
      >
        <span className="text-lg">{currentLanguage.flag}</span>
        <span className="hidden sm:inline">{currentLanguage.code.toUpperCase()}</span>
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="bg-vscode-bg-sidebar rounded-lg border border-vscode-border p-6 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-vscode-text-primary">
                {t('selectLanguage') || 'Select Language'}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-vscode-text-secondary hover:text-vscode-text-primary"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-2">
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageChange(language.code)}
                  className={`w-full flex items-center space-x-4 p-4 rounded-lg transition-colors ${
                    i18n.language === language.code
                      ? 'bg-indigo-600 text-white'
                      : 'bg-vscode-bg-input hover:bg-vscode-bg-hover text-vscode-text-primary'
                  }`}
                >
                  <span className="text-3xl">{language.flag}</span>
                  <div className="flex-1 text-left">
                    <div className="font-semibold">{language.name}</div>
                    <div className={`text-sm ${
                      i18n.language === language.code ? 'text-white/80' : 'text-vscode-text-secondary'
                    }`}>
                      {language.code.toUpperCase()}
                    </div>
                  </div>
                  {i18n.language === language.code && (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsOpen(false)}
                className="px-6 py-2 bg-vscode-bg-input hover:bg-vscode-bg-hover text-vscode-text-primary rounded-lg transition-colors"
              >
                {t('close') || 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
