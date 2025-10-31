import { AzureAIService } from './azureAIService';
import { supabase } from '../../lib/supabase';

export type LLMModel = 'gpt-4' | 'gpt-35-turbo' | 'specialized';

export interface LLMRequest {
  messages: Array<{ role: string; content: string }>;
  userId?: string;
  operation: string;
  preferredModel?: LLMModel;
  maxCostFcfa?: number;
  requiresExpertise?: 'legal' | 'real-estate' | 'general';
}

export interface LLMResponse {
  content: string;
  modelUsed: LLMModel;
  tokensUsed: number;
  costFcfa: number;
  responseTimeMs: number;
  cached: boolean;
}

export class LLMOrchestrator {
  private static readonly MODEL_COSTS = {
    'gpt-4': 0.08,
    'gpt-35-turbo': 0.03,
    'specialized': 0.05,
  };

  private static readonly MODEL_CAPABILITIES = {
    'gpt-4': {
      maxTokens: 8000,
      quality: 'high',
      speed: 'slow',
      expertise: ['legal', 'real-estate', 'complex-reasoning'],
    },
    'gpt-35-turbo': {
      maxTokens: 4000,
      quality: 'medium',
      speed: 'fast',
      expertise: ['general', 'simple-queries'],
    },
    'specialized': {
      maxTokens: 2000,
      quality: 'medium',
      speed: 'very-fast',
      expertise: ['property-descriptions', 'simple-responses'],
    },
  };

  static async selectOptimalModel(request: LLMRequest): Promise<LLMModel> {
    if (request.preferredModel) {
      return request.preferredModel;
    }

    const estimatedTokens = request.messages.reduce(
      (sum, msg) => sum + AzureAIService.calculateTokenEstimate(msg.content),
      0
    );

    if (request.requiresExpertise === 'legal') {
      return 'gpt-4';
    }

    if (request.maxCostFcfa) {
      const costGpt35 = estimatedTokens * this.MODEL_COSTS['gpt-35-turbo'];
      if (costGpt35 <= request.maxCostFcfa) {
        return 'gpt-35-turbo';
      }
      return 'specialized';
    }

    if (estimatedTokens > 3000 || request.requiresExpertise === 'real-estate') {
      return 'gpt-4';
    }

    return 'gpt-35-turbo';
  }

  static async execute(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();
    const selectedModel = await this.selectOptimalModel(request);

    const cacheKey = `llm:${selectedModel}:${request.operation}:${JSON.stringify(
      request.messages
    ).substring(0, 100)}`;

    const cachedResponse = await AzureAIService.getCachedResponse(cacheKey);
    if (cachedResponse) {
      return {
        content: cachedResponse.content,
        modelUsed: selectedModel,
        tokensUsed: cachedResponse.tokens || 0,
        costFcfa: 0,
        responseTimeMs: Date.now() - startTime,
        cached: true,
      };
    }

    const maxTokens = this.MODEL_CAPABILITIES[selectedModel].maxTokens;
    const temperature = request.requiresExpertise === 'legal' ? 0.3 : 0.7;

    const content = await AzureAIService.callAzureOpenAI(
      request.messages,
      request.userId || null,
      request.operation,
      {
        temperature,
        maxTokens,
        useCache: true,
      }
    );

    const estimatedTokens = AzureAIService.calculateTokenEstimate(
      content + request.messages.map((m) => m.content).join('')
    );
    const costFcfa = estimatedTokens * this.MODEL_COSTS[selectedModel];
    const responseTimeMs = Date.now() - startTime;

    await this.logModelSelection(
      request.userId || null,
      selectedModel,
      request.operation,
      estimatedTokens,
      costFcfa,
      responseTimeMs
    );

    return {
      content,
      modelUsed: selectedModel,
      tokensUsed: estimatedTokens,
      costFcfa,
      responseTimeMs,
      cached: false,
    };
  }

  private static async logModelSelection(
    userId: string | null,
    model: LLMModel,
    operation: string,
    tokens: number,
    cost: number,
    responseTime: number
  ): Promise<void> {
    try {
      await supabase.from('llm_routing_logs').insert({
        user_id: userId,
        selected_model: model,
        operation,
        tokens_used: tokens,
        cost_fcfa: cost,
        response_time_ms: responseTime,
        reason: `Optimal selection for ${operation}`,
      });
    } catch (error) {
      console.error('Failed to log model selection:', error);
    }
  }

  static async getModelStats(
    userId?: string,
    timeRangeHours: number = 24
  ): Promise<{
    totalRequests: number;
    totalCost: number;
    totalTokens: number;
    modelBreakdown: Record<LLMModel, { count: number; avgResponseTime: number }>;
  }> {
    try {
      const startTime = new Date();
      startTime.setHours(startTime.getHours() - timeRangeHours);

      let query = supabase
        .from('llm_routing_logs')
        .select('*')
        .gte('created_at', startTime.toISOString());

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error || !data) {
        return {
          totalRequests: 0,
          totalCost: 0,
          totalTokens: 0,
          modelBreakdown: {
            'gpt-4': { count: 0, avgResponseTime: 0 },
            'gpt-35-turbo': { count: 0, avgResponseTime: 0 },
            'specialized': { count: 0, avgResponseTime: 0 },
          },
        };
      }

      const totalRequests = data.length;
      const totalCost = data.reduce((sum, log) => sum + (log.cost_fcfa || 0), 0);
      const totalTokens = data.reduce((sum, log) => sum + (log.tokens_used || 0), 0);

      const modelBreakdown: Record<
        LLMModel,
        { count: number; avgResponseTime: number }
      > = {
        'gpt-4': { count: 0, avgResponseTime: 0 },
        'gpt-35-turbo': { count: 0, avgResponseTime: 0 },
        'specialized': { count: 0, avgResponseTime: 0 },
      };

      data.forEach((log) => {
        const model = log.selected_model as LLMModel;
        if (modelBreakdown[model]) {
          modelBreakdown[model].count++;
          modelBreakdown[model].avgResponseTime += log.response_time_ms || 0;
        }
      });

      Object.keys(modelBreakdown).forEach((model) => {
        const key = model as LLMModel;
        if (modelBreakdown[key].count > 0) {
          modelBreakdown[key].avgResponseTime /= modelBreakdown[key].count;
        }
      });

      return {
        totalRequests,
        totalCost,
        totalTokens,
        modelBreakdown,
      };
    } catch (error) {
      console.error('Failed to get model stats:', error);
      return {
        totalRequests: 0,
        totalCost: 0,
        totalTokens: 0,
        modelBreakdown: {
          'gpt-4': { count: 0, avgResponseTime: 0 },
          'gpt-35-turbo': { count: 0, avgResponseTime: 0 },
          'specialized': { count: 0, avgResponseTime: 0 },
        },
      };
    }
  }
}

export const llmOrchestrator = LLMOrchestrator;
