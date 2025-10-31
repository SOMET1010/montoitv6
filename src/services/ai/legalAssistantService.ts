import { LLMOrchestrator, LLMRequest } from './llmOrchestrator';
import { supabase } from '../../lib/supabase';

export interface LegalQuery {
  question: string;
  context?: {
    userType?: 'locataire' | 'proprietaire' | 'agence';
    propertyType?: string;
    location?: string;
    contractDetails?: Record<string, any>;
  };
  userId?: string;
}

export interface LegalResponse {
  answer: string;
  sources: Array<{
    article: string;
    description: string;
    relevance: number;
  }>;
  confidence: number;
  disclaimer: string;
  relatedQuestions: string[];
}

export class LegalAssistantService {
  private static readonly LEGAL_CONTEXT = `
Tu es un assistant juridique spécialisé dans le droit immobilier en Côte d'Ivoire.
Tu dois fournir des informations précises basées sur:
- Le Code Civil Ivoirien
- Les lois sur la location immobilière
- Les réglementations ANSUT (Agence Nationale de la Salubrité Urbaine)
- Les droits et devoirs des locataires et propriétaires

IMPORTANT:
- Cite toujours les articles de loi pertinents
- Explique en termes simples et accessibles
- Mentionne les recours possibles
- Reste neutre et objectif
- Indique toujours qu'une consultation avec un avocat est recommandée pour des cas spécifiques
  `;

  private static readonly COMMON_QUESTIONS_DATABASE = [
    {
      category: 'Dépôt de garantie',
      questions: [
        'Quel est le montant maximum du dépôt de garantie ?',
        'Comment récupérer mon dépôt de garantie ?',
        'Dans quel délai le propriétaire doit-il rembourser le dépôt ?',
      ],
    },
    {
      category: 'Résiliation de bail',
      questions: [
        'Comment résilier mon bail avant la fin ?',
        'Quel préavis donner pour quitter le logement ?',
        'Le propriétaire peut-il résilier mon bail ?',
      ],
    },
    {
      category: 'Réparations',
      questions: [
        'Qui paie les réparations dans le logement ?',
        'Que faire si le propriétaire refuse les réparations urgentes ?',
        'Quelles sont mes obligations d\'entretien ?',
      ],
    },
    {
      category: 'Augmentation de loyer',
      questions: [
        'Le propriétaire peut-il augmenter le loyer ?',
        'Dans quelles conditions le loyer peut augmenter ?',
        'Comment contester une augmentation de loyer ?',
      ],
    },
    {
      category: 'Expulsion',
      questions: [
        'Dans quels cas puis-je être expulsé ?',
        'Quelle est la procédure légale d\'expulsion ?',
        'Quels sont mes recours face à une expulsion ?',
      ],
    },
  ];

  static async askQuestion(query: LegalQuery): Promise<LegalResponse> {
    const systemPrompt = this.buildSystemPrompt(query.context);
    const userPrompt = this.buildUserPrompt(query.question, query.context);

    const llmRequest: LLMRequest = {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      userId: query.userId,
      operation: 'legal_consultation',
      requiresExpertise: 'legal',
    };

    const response = await LLMOrchestrator.execute(llmRequest);

    const parsedAnswer = this.parseResponse(response.content);

    await this.logLegalQuery(
      query.userId || null,
      query.question,
      parsedAnswer.answer,
      response.modelUsed,
      response.tokensUsed,
      response.costFcfa
    );

    return parsedAnswer;
  }

  private static buildSystemPrompt(
    context?: LegalQuery['context']
  ): string {
    let prompt = this.LEGAL_CONTEXT;

    if (context?.userType) {
      prompt += `\n\nL'utilisateur est un ${context.userType}.`;
    }

    if (context?.propertyType) {
      prompt += `\nType de bien: ${context.propertyType}`;
    }

    if (context?.location) {
      prompt += `\nLocalisation: ${context.location}`;
    }

    prompt += `\n\nTu dois répondre au format JSON suivant:
{
  "answer": "Réponse détaillée et structurée",
  "sources": [
    {
      "article": "Article XX du Code Civil",
      "description": "Description de l'article",
      "relevance": 0.95
    }
  ],
  "confidence": 0.85,
  "disclaimer": "Message de mise en garde",
  "relatedQuestions": ["Question 1", "Question 2", "Question 3"]
}`;

    return prompt;
  }

  private static buildUserPrompt(
    question: string,
    context?: LegalQuery['context']
  ): string {
    let prompt = `Question: ${question}`;

    if (context?.contractDetails) {
      prompt += `\n\nDétails du contrat:\n${JSON.stringify(context.contractDetails, null, 2)}`;
    }

    return prompt;
  }

  private static parseResponse(content: string): LegalResponse {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          answer: parsed.answer || content,
          sources: parsed.sources || [],
          confidence: parsed.confidence || 0.7,
          disclaimer:
            parsed.disclaimer ||
            'Cette réponse est fournie à titre informatif. Consultez un avocat pour des conseils juridiques personnalisés.',
          relatedQuestions: parsed.relatedQuestions || [],
        };
      }
    } catch (error) {
      console.error('Failed to parse legal response:', error);
    }

    return {
      answer: content,
      sources: [],
      confidence: 0.6,
      disclaimer:
        'Cette réponse est fournie à titre informatif. Consultez un avocat pour des conseils juridiques personnalisés.',
      relatedQuestions: [],
    };
  }

  private static async logLegalQuery(
    userId: string | null,
    question: string,
    answer: string,
    modelUsed: string,
    tokensUsed: number,
    costFcfa: number
  ): Promise<void> {
    try {
      await supabase.from('legal_consultation_logs').insert({
        user_id: userId,
        question,
        answer,
        model_used: modelUsed,
        tokens_used: tokensUsed,
        cost_fcfa: costFcfa,
      });
    } catch (error) {
      console.error('Failed to log legal query:', error);
    }
  }

  static getCommonQuestions(
    category?: string
  ): Array<{ category: string; questions: string[] }> {
    if (category) {
      return this.COMMON_QUESTIONS_DATABASE.filter(
        (item) => item.category === category
      );
    }
    return this.COMMON_QUESTIONS_DATABASE;
  }

  static async getFrequentlyAskedQuestions(
    limit: number = 10
  ): Promise<Array<{ question: string; count: number }>> {
    try {
      const { data, error } = await supabase
        .from('legal_consultation_logs')
        .select('question')
        .limit(1000);

      if (error || !data) {
        return [];
      }

      const questionCounts: Record<string, number> = {};
      data.forEach((log) => {
        const q = log.question.toLowerCase().trim();
        questionCounts[q] = (questionCounts[q] || 0) + 1;
      });

      const sorted = Object.entries(questionCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([question, count]) => ({ question, count }));

      return sorted;
    } catch (error) {
      console.error('Failed to get FAQ:', error);
      return [];
    }
  }

  static async searchLegalDatabase(
    searchTerm: string,
    limit: number = 5
  ): Promise<
    Array<{
      article: string;
      content: string;
      relevance: number;
    }>
  > {
    try {
      const { data, error } = await supabase
        .from('legal_articles')
        .select('*')
        .textSearch('content', searchTerm, {
          type: 'websearch',
          config: 'french',
        })
        .limit(limit);

      if (error || !data) {
        return [];
      }

      return data.map((article) => ({
        article: article.article_number,
        content: article.content,
        relevance: article.relevance_score || 0.5,
      }));
    } catch (error) {
      console.error('Failed to search legal database:', error);
      return [];
    }
  }
}

export const legalAssistantService = LegalAssistantService;
