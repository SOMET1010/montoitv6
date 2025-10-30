import { azureAIService } from './azureAIService';
import { supabase } from '../../lib/supabase';

interface SearchCriteria {
  city?: string;
  neighborhood?: string;
  property_type?: string;
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  bathrooms?: number;
  has_parking?: boolean;
  has_ac?: boolean;
  is_furnished?: boolean;
  keywords?: string[];
}

interface NLPSearchResult {
  criteria: SearchCriteria;
  intent: string;
  confidence: number;
  originalQuery: string;
}

export class NLPSearchService {
  static async parseNaturalLanguageQuery(
    query: string,
    userId: string | null = null
  ): Promise<NLPSearchResult> {
    try {
      const messages = [
        {
          role: 'system',
          content: `Tu es un expert en analyse de requêtes immobilières en français pour la Côte d'Ivoire.
Ton rôle est d'extraire les critères de recherche structurés à partir de requêtes en langage naturel.

Villes principales: Abidjan, Bouaké, Yamoussoukro, Daloa, Korhogo, San-Pédro
Quartiers d'Abidjan: Cocody, Plateau, Yopougon, Marcory, Treichville, Adjamé, Koumassi, Abobo, Riviera

Types de biens: appartement, villa, studio, chambre, bureau, commerce

Réponds UNIQUEMENT avec un JSON valide suivant ce format:
{
  "city": "nom de la ville ou null",
  "neighborhood": "nom du quartier ou null",
  "property_type": "type de bien ou null",
  "min_price": nombre ou null,
  "max_price": nombre ou null,
  "bedrooms": nombre ou null,
  "bathrooms": nombre ou null,
  "has_parking": boolean ou null,
  "has_ac": boolean ou null,
  "is_furnished": boolean ou null,
  "keywords": ["mot-clé1", "mot-clé2"] ou null,
  "intent": "description de l'intention",
  "confidence": nombre entre 0 et 1
}`,
        },
        {
          role: 'user',
          content: `Analyse cette requête de recherche immobilière et extrait les critères:

"${query}"

Réponds uniquement avec le JSON, sans texte supplémentaire.`,
        },
      ];

      const response = await azureAIService.callAzureOpenAI(
        messages,
        userId,
        'nlp_search_parse',
        {
          temperature: 0.3,
          maxTokens: 500,
          useCache: true,
        }
      );

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      const result: NLPSearchResult = {
        criteria: {
          city: parsed.city || undefined,
          neighborhood: parsed.neighborhood || undefined,
          property_type: parsed.property_type || undefined,
          min_price: parsed.min_price || undefined,
          max_price: parsed.max_price || undefined,
          bedrooms: parsed.bedrooms || undefined,
          bathrooms: parsed.bathrooms || undefined,
          has_parking: parsed.has_parking || undefined,
          has_ac: parsed.has_ac || undefined,
          is_furnished: parsed.is_furnished || undefined,
          keywords: parsed.keywords || undefined,
        },
        intent: parsed.intent || 'search_property',
        confidence: parsed.confidence || 0.7,
        originalQuery: query,
      };

      if (userId) {
        await this.trackSearchQuery(userId, query, result);
      }

      return result;
    } catch (error) {
      console.error('Error parsing NLP query:', error);
      return this.getFallbackParsing(query);
    }
  }

  private static getFallbackParsing(query: string): NLPSearchResult {
    const lowerQuery = query.toLowerCase();
    const criteria: SearchCriteria = {};

    const cities = [
      'abidjan',
      'bouaké',
      'yamoussoukro',
      'daloa',
      'korhogo',
      'san-pédro',
    ];
    const foundCity = cities.find((city) => lowerQuery.includes(city));
    if (foundCity) {
      criteria.city =
        foundCity.charAt(0).toUpperCase() + foundCity.slice(1);
    }

    const neighborhoods = [
      'cocody',
      'plateau',
      'yopougon',
      'marcory',
      'treichville',
      'adjamé',
      'koumassi',
      'abobo',
      'riviera',
    ];
    const foundNeighborhood = neighborhoods.find((n) =>
      lowerQuery.includes(n)
    );
    if (foundNeighborhood) {
      criteria.neighborhood =
        foundNeighborhood.charAt(0).toUpperCase() +
        foundNeighborhood.slice(1);
    }

    if (lowerQuery.includes('appartement')) criteria.property_type = 'appartement';
    if (lowerQuery.includes('villa')) criteria.property_type = 'villa';
    if (lowerQuery.includes('studio')) criteria.property_type = 'studio';

    const bedroomMatch = query.match(/(\d+)\s*(chambre|pièce|bedroom)/i);
    if (bedroomMatch) {
      criteria.bedrooms = parseInt(bedroomMatch[1]);
    }

    if (lowerQuery.includes('parking')) criteria.has_parking = true;
    if (lowerQuery.includes('climatisé') || lowerQuery.includes('climatisation'))
      criteria.has_ac = true;
    if (lowerQuery.includes('meublé')) criteria.is_furnished = true;

    const priceMatch = query.match(/(\d+)\s*k?/gi);
    if (priceMatch && priceMatch.length >= 1) {
      const prices = priceMatch.map((p) => {
        const num = parseInt(p.replace(/k/gi, ''));
        return p.toLowerCase().includes('k') ? num * 1000 : num;
      });

      if (prices.length === 1) {
        criteria.max_price = prices[0];
      } else {
        criteria.min_price = Math.min(...prices);
        criteria.max_price = Math.max(...prices);
      }
    }

    return {
      criteria,
      intent: 'search_property',
      confidence: 0.6,
      originalQuery: query,
    };
  }

  private static async trackSearchQuery(
    userId: string,
    query: string,
    result: NLPSearchResult
  ): Promise<void> {
    try {
      await supabase.from('user_activity_tracking').insert({
        user_id: userId,
        action_type: 'search',
        action_data: {
          query,
          parsed_criteria: result.criteria,
          intent: result.intent,
          confidence: result.confidence,
        },
      });
    } catch (error) {
      console.error('Error tracking search query:', error);
    }
  }

  static async searchProperties(
    criteria: SearchCriteria,
    userId: string | null = null
  ): Promise<any[]> {
    try {
      let query = supabase
        .from('properties')
        .select('*')
        .eq('status', 'disponible');

      if (criteria.city) {
        query = query.ilike('city', `%${criteria.city}%`);
      }

      if (criteria.neighborhood) {
        query = query.ilike('neighborhood', `%${criteria.neighborhood}%`);
      }

      if (criteria.property_type) {
        query = query.eq('property_type', criteria.property_type);
      }

      if (criteria.min_price) {
        query = query.gte('monthly_rent', criteria.min_price);
      }

      if (criteria.max_price) {
        query = query.lte('monthly_rent', criteria.max_price);
      }

      if (criteria.bedrooms) {
        query = query.gte('bedrooms', criteria.bedrooms);
      }

      if (criteria.bathrooms) {
        query = query.gte('bathrooms', criteria.bathrooms);
      }

      if (criteria.has_parking !== undefined) {
        query = query.eq('has_parking', criteria.has_parking);
      }

      if (criteria.has_ac !== undefined) {
        query = query.eq('has_ac', criteria.has_ac);
      }

      if (criteria.is_furnished !== undefined) {
        query = query.eq('is_furnished', criteria.is_furnished);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (userId) {
        await azureAIService.logUsage(userId, {
          service_type: 'nlp',
          operation: 'property_search',
          tokens_used: 0,
          cost_fcfa: 0.2,
          success: true,
          metadata: { results_count: data?.length || 0 },
        });
      }

      return data || [];
    } catch (error) {
      console.error('Error searching properties:', error);
      return [];
    }
  }

  static async getSuggestedQueries(userId: string): Promise<string[]> {
    try {
      const { data: activity } = await supabase
        .from('user_activity_tracking')
        .select('action_data')
        .eq('user_id', userId)
        .eq('action_type', 'search')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!activity || activity.length === 0) {
        return this.getDefaultSuggestions();
      }

      const recentSearches = activity.map((a) => a.action_data?.query).filter(Boolean);

      return recentSearches.slice(0, 3);
    } catch (error) {
      console.error('Error getting suggested queries:', error);
      return this.getDefaultSuggestions();
    }
  }

  private static getDefaultSuggestions(): string[] {
    return [
      'Appartement 2 pièces à Cocody avec parking',
      'Villa meublée à Marcory moins de 300000 FCFA',
      'Studio climatisé au Plateau',
      'Maison avec jardin à Yopougon',
      'Bureau moderne à Abidjan',
    ];
  }

  static async getAutocompleteSuggestions(
    partialQuery: string,
    limit: number = 5
  ): Promise<string[]> {
    if (partialQuery.length < 3) {
      return [];
    }

    const suggestions: string[] = [];
    const lowerQuery = partialQuery.toLowerCase();

    const locations = [
      'Abidjan',
      'Cocody',
      'Plateau',
      'Yopougon',
      'Marcory',
      'Treichville',
      'Bouaké',
    ];
    const types = [
      'Appartement',
      'Villa',
      'Studio',
      'Chambre',
      'Bureau',
    ];

    locations.forEach((loc) => {
      if (loc.toLowerCase().includes(lowerQuery)) {
        suggestions.push(`${loc}`);
      }
    });

    types.forEach((type) => {
      if (type.toLowerCase().includes(lowerQuery)) {
        suggestions.push(`${type} à Abidjan`);
      }
    });

    return suggestions.slice(0, limit);
  }
}

export const nlpSearchService = NLPSearchService;
