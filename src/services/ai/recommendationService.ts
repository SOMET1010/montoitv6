import { supabase } from '../../lib/supabase';
import { azureAIService } from './azureAIService';

interface Property {
  id: string;
  title: string;
  city: string;
  neighborhood: string | null;
  property_type: string;
  bedrooms: number;
  monthly_rent: number;
  has_parking: boolean;
  has_ac: boolean;
  is_furnished: boolean;
  view_count: number;
  created_at: string;
}

interface RecommendationScore {
  propertyId: string;
  score: number;
  reason: string;
  algorithm: string;
}

export class RecommendationService {
  static async trackUserActivity(
    userId: string,
    propertyId: string | null,
    actionType: 'view' | 'favorite' | 'search' | 'click' | 'apply' | 'visit_request',
    actionData: Record<string, any> = {},
    sessionId?: string
  ): Promise<void> {
    try {
      await supabase.rpc('track_user_activity', {
        p_user_id: userId,
        p_property_id: propertyId,
        p_action_type: actionType,
        p_action_data: actionData,
        p_session_id: sessionId || null,
      });
    } catch (error) {
      console.error('Error tracking user activity:', error);
    }
  }

  static async getUserActivityHistory(
    userId: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('user_activity_tracking')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user activity:', error);
      return [];
    }
  }

  static async getUserFavorites(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('property_favorites')
        .select('property_id')
        .eq('user_id', userId);

      if (error) throw error;
      return data?.map((f) => f.property_id) || [];
    } catch (error) {
      console.error('Error fetching favorites:', error);
      return [];
    }
  }

  static async getPersonalizedRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<Property[]> {
    try {
      const activity = await this.getUserActivityHistory(userId, 50);
      const favorites = await this.getUserFavorites(userId);

      const scores = await this.calculateRecommendationScores(
        userId,
        activity,
        favorites
      );

      const topPropertyIds = scores
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((s) => s.propertyId);

      const { data: properties, error } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'disponible')
        .in('id', topPropertyIds);

      if (error) throw error;

      await this.storeRecommendations(userId, scores.slice(0, limit));

      await azureAIService.logUsage(userId, {
        service_type: 'recommendations',
        operation: 'personalized_recommendations',
        tokens_used: 0,
        cost_fcfa: 0.5,
        success: true,
        metadata: {
          recommendations_count: limit,
          algorithm: 'hybrid',
        },
      });

      const sortedProperties = topPropertyIds
        .map((id) => properties?.find((p) => p.id === id))
        .filter((p): p is Property => p !== undefined);

      return sortedProperties;
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return this.getFallbackRecommendations(limit);
    }
  }

  private static async calculateRecommendationScores(
    userId: string,
    activity: any[],
    favorites: string[]
  ): Promise<RecommendationScore[]> {
    const { data: properties, error } = await supabase
      .from('properties')
      .select('*')
      .eq('status', 'disponible')
      .limit(100);

    if (error || !properties) return [];

    const scores: RecommendationScore[] = [];

    for (const property of properties) {
      let score = 0;
      const reasons: string[] = [];

      if (favorites.includes(property.id)) {
        score += 40;
        reasons.push('Similaire à vos favoris');
      }

      const viewedProperties = activity
        .filter((a) => a.action_type === 'view')
        .map((a) => a.property_id);

      const viewedCities = activity
        .filter((a) => a.action_type === 'view')
        .map((a) => a.action_data?.city)
        .filter(Boolean);

      if (viewedCities.includes(property.city)) {
        score += 25;
        reasons.push(`Ville préférée: ${property.city}`);
      }

      const searchActivity = activity.filter((a) => a.action_type === 'search');
      if (searchActivity.length > 0) {
        const lastSearch = searchActivity[0];
        const criteria = lastSearch.action_data || {};

        if (
          criteria.property_type &&
          property.property_type === criteria.property_type
        ) {
          score += 20;
          reasons.push('Correspond à votre recherche');
        }

        if (criteria.min_price && criteria.max_price) {
          const inRange =
            property.monthly_rent >= criteria.min_price &&
            property.monthly_rent <= criteria.max_price;
          if (inRange) {
            score += 15;
            reasons.push('Dans votre budget');
          }
        }
      }

      const popularityScore = Math.min(property.view_count * 0.1, 20);
      score += popularityScore;
      if (popularityScore > 10) {
        reasons.push('Populaire auprès des locataires');
      }

      const daysOld = Math.floor(
        (Date.now() - new Date(property.created_at).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      const freshnessScore = Math.max(10 - daysOld, 0);
      score += freshnessScore;
      if (freshnessScore > 5) {
        reasons.push('Annonce récente');
      }

      if (score > 0) {
        scores.push({
          propertyId: property.id,
          score: Math.min(score, 100),
          reason: reasons.join(', '),
          algorithm: 'hybrid',
        });
      }
    }

    return scores;
  }

  private static async storeRecommendations(
    userId: string,
    scores: RecommendationScore[]
  ): Promise<void> {
    try {
      const recommendations = scores.map((s) => ({
        user_id: userId,
        property_id: s.propertyId,
        recommendation_score: s.score,
        recommendation_reason: s.reason,
        algorithm_type: s.algorithm,
      }));

      await supabase.from('ai_recommendations').insert(recommendations);
    } catch (error) {
      console.error('Error storing recommendations:', error);
    }
  }

  private static async getFallbackRecommendations(
    limit: number
  ): Promise<Property[]> {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'disponible')
        .order('view_count', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting fallback recommendations:', error);
      return [];
    }
  }

  static async trackRecommendationClick(
    userId: string,
    propertyId: string
  ): Promise<void> {
    try {
      await supabase
        .from('ai_recommendations')
        .update({
          clicked: true,
          clicked_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('property_id', propertyId)
        .is('clicked', false);
    } catch (error) {
      console.error('Error tracking recommendation click:', error);
    }
  }

  static async getRecommendationAccuracy(days: number = 7): Promise<number> {
    try {
      const { data, error } = await supabase.rpc(
        'calculate_recommendation_accuracy',
        { p_days: days }
      );

      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Error getting recommendation accuracy:', error);
      return 0;
    }
  }

  static async getAIBasedSimilarProperties(
    propertyId: string,
    limit: number = 5
  ): Promise<Property[]> {
    try {
      const { data: currentProperty, error: propError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .maybeSingle();

      if (propError || !currentProperty) return [];

      const { data: similarProperties, error } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'disponible')
        .neq('id', propertyId)
        .eq('city', currentProperty.city)
        .eq('property_type', currentProperty.property_type)
        .gte('monthly_rent', currentProperty.monthly_rent * 0.8)
        .lte('monthly_rent', currentProperty.monthly_rent * 1.2)
        .limit(limit);

      if (error) throw error;
      return similarProperties || [];
    } catch (error) {
      console.error('Error getting similar properties:', error);
      return [];
    }
  }
}

export const recommendationService = RecommendationService;
