import { supabase } from '../../lib/supabase';

interface AIUsageLog {
  service_type: string;
  operation: string;
  tokens_used?: number;
  cost_fcfa?: number;
  response_time_ms?: number;
  success: boolean;
  error_message?: string;
  metadata?: Record<string, any>;
}

export class AzureAIService {
  private static getEnvVar(key: string): string {
    const value = import.meta.env[key];
    if (!value || value === '' || value === 'undefined') {
      console.warn(`Missing or empty environment variable: ${key}`);
      throw new Error(`Missing environment variable: ${key}`);
    }
    return value;
  }

  static async logUsage(userId: string | null, log: AIUsageLog): Promise<void> {
    try {
      await supabase.from('ai_usage_logs').insert({
        user_id: userId,
        ...log,
      });
    } catch (error) {
      console.error('Failed to log AI usage:', error);
    }
  }

  static async getCachedResponse(
    cacheKey: string
  ): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('ai_cache')
        .select('response_data, hit_count')
        .eq('cache_key', cacheKey)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error || !data) return null;

      await supabase
        .from('ai_cache')
        .update({
          hit_count: data.hit_count + 1,
          last_accessed_at: new Date().toISOString(),
        })
        .eq('cache_key', cacheKey);

      return data.response_data;
    } catch (error) {
      console.error('Cache read error:', error);
      return null;
    }
  }

  static async setCachedResponse(
    cacheKey: string,
    serviceType: string,
    requestHash: string,
    responseData: any,
    ttlMinutes: number = 60
  ): Promise<void> {
    try {
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + ttlMinutes);

      await supabase.from('ai_cache').upsert({
        cache_key: cacheKey,
        service_type: serviceType,
        request_hash: requestHash,
        response_data: responseData,
        expires_at: expiresAt.toISOString(),
        hit_count: 0,
      });
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  static async callAzureOpenAI(
    messages: Array<{ role: string; content: string }>,
    userId: string | null = null,
    operation: string = 'chat',
    options: {
      temperature?: number;
      maxTokens?: number;
      useCache?: boolean;
    } = {}
  ): Promise<string> {
    const startTime = Date.now();
    const {
      temperature = 0.7,
      maxTokens = 1000,
      useCache = true,
    } = options;

    const cacheKey = useCache
      ? `openai:${operation}:${JSON.stringify(messages).slice(0, 100)}`
      : null;

    if (cacheKey) {
      const cached = await this.getCachedResponse(cacheKey);
      if (cached) {
        await this.logUsage(userId, {
          service_type: 'openai',
          operation,
          tokens_used: 0,
          cost_fcfa: 0,
          response_time_ms: Date.now() - startTime,
          success: true,
          metadata: { cached: true },
        });
        return cached.content;
      }
    }

    try {
      const endpoint = this.getEnvVar('AZURE_OPENAI_ENDPOINT');
      const apiKey = this.getEnvVar('AZURE_OPENAI_API_KEY');
      const deploymentName = this.getEnvVar('AZURE_OPENAI_DEPLOYMENT_NAME');
      const apiVersion = this.getEnvVar('AZURE_OPENAI_API_VERSION');

      const url = `${endpoint}openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
        },
        body: JSON.stringify({
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Azure OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      const tokensUsed = data.usage?.total_tokens || 0;
      const costFcfa = tokensUsed * 0.05;

      const responseTime = Date.now() - startTime;

      await this.logUsage(userId, {
        service_type: 'openai',
        operation,
        tokens_used: tokensUsed,
        cost_fcfa: costFcfa,
        response_time_ms: responseTime,
        success: true,
        metadata: {
          model: deploymentName,
          temperature,
          max_tokens: maxTokens,
        },
      });

      if (cacheKey) {
        await this.setCachedResponse(
          cacheKey,
          'openai',
          JSON.stringify(messages),
          { content, tokens: tokensUsed },
          60
        );
      }

      return content;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      await this.logUsage(userId, {
        service_type: 'openai',
        operation,
        tokens_used: 0,
        cost_fcfa: 0,
        response_time_ms: responseTime,
        success: false,
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  static async analyzeText(
    text: string,
    analysisType: 'sentiment' | 'entities' | 'language',
    userId: string | null = null
  ): Promise<any> {
    const startTime = Date.now();

    try {
      const endpoint = this.getEnvVar('AZURE_AI_SERVICES_ENDPOINT');
      const apiKey = this.getEnvVar('AZURE_AI_SERVICES_API_KEY');

      let url = '';
      let body: any = {};

      switch (analysisType) {
        case 'sentiment':
          url = `${endpoint}text/analytics/v3.1/sentiment`;
          body = {
            documents: [{ id: '1', text, language: 'fr' }],
          };
          break;
        case 'entities':
          url = `${endpoint}text/analytics/v3.1/entities/recognition/general`;
          body = {
            documents: [{ id: '1', text, language: 'fr' }],
          };
          break;
        case 'language':
          url = `${endpoint}text/analytics/v3.1/languages`;
          body = {
            documents: [{ id: '1', text }],
          };
          break;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': apiKey,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Azure AI Services error: ${response.status}`);
      }

      const data = await response.json();
      const responseTime = Date.now() - startTime;

      await this.logUsage(userId, {
        service_type: 'nlp',
        operation: `text_analysis_${analysisType}`,
        tokens_used: text.length,
        cost_fcfa: 0.1,
        response_time_ms: responseTime,
        success: true,
      });

      return data.documents[0];
    } catch (error) {
      const responseTime = Date.now() - startTime;
      await this.logUsage(userId, {
        service_type: 'nlp',
        operation: `text_analysis_${analysisType}`,
        response_time_ms: responseTime,
        success: false,
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  static async extractKeyPhrases(
    text: string,
    userId: string | null = null
  ): Promise<string[]> {
    const startTime = Date.now();

    try {
      const endpoint = this.getEnvVar('AZURE_AI_SERVICES_ENDPOINT');
      const apiKey = this.getEnvVar('AZURE_AI_SERVICES_API_KEY');

      const response = await fetch(
        `${endpoint}text/analytics/v3.1/keyPhrases`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': apiKey,
          },
          body: JSON.stringify({
            documents: [{ id: '1', text, language: 'fr' }],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Azure AI Services error: ${response.status}`);
      }

      const data = await response.json();
      const keyPhrases = data.documents[0].keyPhrases;
      const responseTime = Date.now() - startTime;

      await this.logUsage(userId, {
        service_type: 'nlp',
        operation: 'extract_keyphrases',
        tokens_used: text.length,
        cost_fcfa: 0.05,
        response_time_ms: responseTime,
        success: true,
      });

      return keyPhrases;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      await this.logUsage(userId, {
        service_type: 'nlp',
        operation: 'extract_keyphrases',
        response_time_ms: responseTime,
        success: false,
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  static calculateTokenEstimate(text: string): number {
    return Math.ceil(text.length / 4);
  }

  static estimateCostFcfa(tokens: number, serviceType: string = 'openai'): number {
    const rates: Record<string, number> = {
      openai: 0.05,
      nlp: 0.01,
      vision: 0.02,
      speech: 0.03,
    };
    return tokens * (rates[serviceType] || 0.05);
  }
}

export const azureAIService = AzureAIService;
