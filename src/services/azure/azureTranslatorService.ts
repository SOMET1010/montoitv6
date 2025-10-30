import { serviceProviderFactory, ServiceResponse } from '../providers/serviceProviderFactory';

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
}

export interface LanguageDetectionResult {
  language: string;
  confidence: number;
}

class AzureTranslatorService {
  async translate(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<ServiceResponse<TranslationResult>> {
    return serviceProviderFactory.callWithFallback(
      'translation',
      'translate',
      async (provider) => {
        const apiKey = provider.keys.api_key;
        const endpoint = provider.keys.endpoint || 'https://api.cognitive.microsofttranslator.com';
        const region = provider.keys.region || 'global';

        const params = new URLSearchParams({
          'api-version': '3.0',
          to: targetLanguage,
        });

        if (sourceLanguage) {
          params.append('from', sourceLanguage);
        }

        const response = await fetch(`${endpoint}/translate?${params}`, {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': apiKey,
            'Ocp-Apim-Subscription-Region': region,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([{ text }]),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Azure Translator error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const translation = data[0];

        const detectedLanguage = translation.detectedLanguage?.language || sourceLanguage || 'unknown';
        const translatedText = translation.translations[0].text;

        const characters = text.length;
        await serviceProviderFactory.logProviderCost(
          provider.providerId,
          'translation',
          'translate',
          characters,
          characters * 0.005,
          characters * 0.00001,
          { sourceLanguage: detectedLanguage, targetLanguage, characterCount: characters }
        );

        return {
          originalText: text,
          translatedText,
          sourceLanguage: detectedLanguage,
          targetLanguage,
          confidence: translation.detectedLanguage?.score || 1.0,
        };
      }
    );
  }

  async detectLanguage(text: string): Promise<ServiceResponse<LanguageDetectionResult>> {
    return serviceProviderFactory.callWithFallback(
      'translation',
      'detect_language',
      async (provider) => {
        const apiKey = provider.keys.api_key;
        const endpoint = provider.keys.endpoint || 'https://api.cognitive.microsofttranslator.com';
        const region = provider.keys.region || 'global';

        const response = await fetch(
          `${endpoint}/detect?api-version=3.0`,
          {
            method: 'POST',
            headers: {
              'Ocp-Apim-Subscription-Key': apiKey,
              'Ocp-Apim-Subscription-Region': region,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify([{ text }]),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Azure Translator error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const detection = data[0];

        await serviceProviderFactory.logProviderCost(
          provider.providerId,
          'translation',
          'detect_language',
          text.length,
          text.length * 0.005,
          text.length * 0.00001,
          { detectedLanguage: detection.language }
        );

        return {
          language: detection.language,
          confidence: detection.score,
        };
      }
    );
  }

  async translateBatch(
    texts: string[],
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<ServiceResponse<TranslationResult[]>> {
    return serviceProviderFactory.callWithFallback(
      'translation',
      'translate_batch',
      async (provider) => {
        const apiKey = provider.keys.api_key;
        const endpoint = provider.keys.endpoint || 'https://api.cognitive.microsofttranslator.com';
        const region = provider.keys.region || 'global';

        const params = new URLSearchParams({
          'api-version': '3.0',
          to: targetLanguage,
        });

        if (sourceLanguage) {
          params.append('from', sourceLanguage);
        }

        const response = await fetch(`${endpoint}/translate?${params}`, {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': apiKey,
            'Ocp-Apim-Subscription-Region': region,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(texts.map((text) => ({ text }))),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Azure Translator error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        const totalCharacters = texts.reduce((sum, text) => sum + text.length, 0);
        await serviceProviderFactory.logProviderCost(
          provider.providerId,
          'translation',
          'translate_batch',
          totalCharacters,
          totalCharacters * 0.005,
          totalCharacters * 0.00001,
          { targetLanguage, count: texts.length, totalCharacters }
        );

        return data.map((translation: any, index: number) => ({
          originalText: texts[index],
          translatedText: translation.translations[0].text,
          sourceLanguage: translation.detectedLanguage?.language || sourceLanguage || 'unknown',
          targetLanguage,
          confidence: translation.detectedLanguage?.score || 1.0,
        }));
      }
    );
  }

  async getSupportedLanguages(): Promise<ServiceResponse<Array<{
    code: string;
    name: string;
    nativeName: string;
  }>>> {
    return serviceProviderFactory.callWithFallback(
      'translation',
      'get_languages',
      async (provider) => {
        const endpoint = provider.keys.endpoint || 'https://api.cognitive.microsofttranslator.com';

        const response = await fetch(
          `${endpoint}/languages?api-version=3.0&scope=translation`,
          {
            method: 'GET',
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to get supported languages: ${response.status}`);
        }

        const data = await response.json();
        const languages = data.translation;

        return Object.entries(languages).map(([code, info]: [string, any]) => ({
          code,
          name: info.name,
          nativeName: info.nativeName,
        }));
      },
      { enableFallback: false }
    );
  }
}

export const azureTranslatorService = new AzureTranslatorService();
