import { useState, useEffect } from 'react';
import { Languages, Globe, Check } from 'lucide-react';
import { azureTranslatorService } from '../services/azure/azureTranslatorService';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'fr', name: 'Français', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
];

interface LanguageSelectorProps {
  onLanguageChange?: (language: string) => void;
  defaultLanguage?: string;
}

export default function LanguageSelector({
  onLanguageChange,
  defaultLanguage = 'fr'
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(defaultLanguage);
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred_language');
    if (savedLanguage) {
      setCurrentLanguage(savedLanguage);
    }
  }, []);

  const handleLanguageSelect = async (languageCode: string) => {
    if (languageCode === currentLanguage) {
      setIsOpen(false);
      return;
    }

    setTranslating(true);
    try {
      setCurrentLanguage(languageCode);
      localStorage.setItem('preferred_language', languageCode);

      if (onLanguageChange) {
        onLanguageChange(languageCode);
      }

      await azureTranslatorService.setTargetLanguage(languageCode);

      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Error changing language:', error);
    } finally {
      setTranslating(false);
      setIsOpen(false);
    }
  };

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-white border-2 border-gray-200 hover:border-terracotta-400 transition-all"
        disabled={translating}
      >
        <Globe className="h-5 w-5 text-terracotta-600" />
        <span className="text-2xl">{currentLang.flag}</span>
        <span className="font-medium text-gray-700">{currentLang.nativeName}</span>
        {translating && (
          <div className="animate-spin h-4 w-4 border-2 border-terracotta-500 border-t-transparent rounded-full"></div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border-2 border-gray-200 z-50 animate-scale-in">
          <div className="p-3 border-b border-gray-200">
            <div className="flex items-center space-x-2 text-gray-700">
              <Languages className="h-5 w-5 text-terracotta-600" />
              <span className="font-bold">Choisir la langue</span>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {SUPPORTED_LANGUAGES.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageSelect(language.code)}
                className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-terracotta-50 transition-colors ${
                  currentLanguage === language.code ? 'bg-terracotta-50' : ''
                }`}
              >
                <span className="text-2xl">{language.flag}</span>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900">{language.nativeName}</div>
                  <div className="text-xs text-gray-500">{language.name}</div>
                </div>
                {currentLanguage === language.code && (
                  <Check className="h-5 w-5 text-terracotta-600" />
                )}
              </button>
            ))}
          </div>

          <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <p className="text-xs text-gray-500 text-center">
              Traduction propulsée par Azure AI
            </p>
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </div>
  );
}
