import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type Property = Database['public']['Tables']['properties']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface RecommendationParams {
  userId: string;
  limit?: number;
  excludePropertyIds?: string[];
}

interface PropertyScore {
  property: Property;
  score: number;
  reasons: string[];
}

export class RecommendationEngine {
  private async getUserPreferences(userId: string) {
    const { data: favoriteProperties } = await supabase
      .from('favorites')
      .select('property_id, properties(*)')
      .eq('user_id', userId)
      .limit(10);

    const { data: viewedProperties } = await supabase
      .from('property_views')
      .select('property_id, properties(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    const { data: savedSearches } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    return {
      favoriteProperties: favoriteProperties || [],
      viewedProperties: viewedProperties || [],
      savedSearches: savedSearches || [],
    };
  }

  private calculatePropertyScore(
    property: Property,
    preferences: {
      favoriteProperties: any[];
      viewedProperties: any[];
      savedSearches: any[];
    }
  ): PropertyScore {
    let score = 0;
    const reasons: string[] = [];

    const favoriteCities = new Set(
      preferences.favoriteProperties
        .map((f) => f.properties?.city)
        .filter(Boolean)
    );
    if (favoriteCities.has(property.city)) {
      score += 15;
      reasons.push(`Situé à ${property.city}, une ville que vous aimez`);
    }

    const favoriteTypes = new Set(
      preferences.favoriteProperties
        .map((f) => f.properties?.property_type)
        .filter(Boolean)
    );
    if (favoriteTypes.has(property.property_type)) {
      score += 10;
      reasons.push(`Type de bien similaire à vos favoris (${property.property_type})`);
    }

    const viewedPriceRange = preferences.viewedProperties
      .map((v) => v.properties?.monthly_rent)
      .filter(Boolean);
    if (viewedPriceRange.length > 0) {
      const avgPrice =
        viewedPriceRange.reduce((a, b) => a + b, 0) / viewedPriceRange.length;
      const priceDiff = Math.abs(property.monthly_rent - avgPrice);
      const priceScore = Math.max(0, 20 - (priceDiff / avgPrice) * 20);
      score += priceScore;
      if (priceScore > 15) {
        reasons.push(`Prix similaire à vos recherches récentes`);
      }
    }

    if (preferences.savedSearches.length > 0) {
      const latestSearch = preferences.savedSearches[0];
      const criteria = latestSearch.search_criteria as any;

      if (criteria.city && property.city === criteria.city) {
        score += 15;
        reasons.push(`Correspond à votre recherche sauvegardée`);
      }

      if (criteria.property_type && property.property_type === criteria.property_type) {
        score += 10;
      }

      if (criteria.price_max && property.monthly_rent <= criteria.price_max) {
        score += 10;
        reasons.push(`Respecte votre budget`);
      }

      if (criteria.bedrooms_min && property.bedrooms >= criteria.bedrooms_min) {
        score += 5;
      }
    }

    if (property.rating && property.rating >= 4.5) {
      score += 10;
      reasons.push(`Excellente notation (${property.rating}/5)`);
    }

    if (property.status === 'disponible') {
      score += 5;
      reasons.push('Disponible immédiatement');
    }

    const viewCount = property.views_count || 0;
    if (viewCount > 100) {
      score += 5;
      reasons.push('Très populaire');
    }

    return {
      property,
      score,
      reasons,
    };
  }

  async getRecommendations(params: RecommendationParams): Promise<PropertyScore[]> {
    const { userId, limit = 10, excludePropertyIds = [] } = params;

    const preferences = await this.getUserPreferences(userId);

    let query = supabase
      .from('properties')
      .select('*')
      .eq('status', 'disponible')
      .order('created_at', { ascending: false })
      .limit(50);

    if (excludePropertyIds.length > 0) {
      query = query.not('id', 'in', `(${excludePropertyIds.join(',')})`);
    }

    const { data: properties, error } = await query;

    if (error || !properties) {
      console.error('Error fetching properties for recommendations:', error);
      return [];
    }

    const scoredProperties = properties
      .map((property) => this.calculatePropertyScore(property, preferences))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scoredProperties;
  }

  async getSimilarProperties(propertyId: string, limit = 5): Promise<Property[]> {
    const { data: targetProperty } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();

    if (!targetProperty) return [];

    const { data: similarProperties } = await supabase
      .from('properties')
      .select('*')
      .eq('city', targetProperty.city)
      .eq('property_type', targetProperty.property_type)
      .neq('id', propertyId)
      .gte('monthly_rent', targetProperty.monthly_rent * 0.8)
      .lte('monthly_rent', targetProperty.monthly_rent * 1.2)
      .eq('status', 'disponible')
      .limit(limit);

    return similarProperties || [];
  }

  async getTrendingProperties(limit = 10): Promise<Property[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: properties } = await supabase
      .from('properties')
      .select('*')
      .eq('status', 'disponible')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('views_count', { ascending: false })
      .limit(limit);

    return properties || [];
  }

  async getNewProperties(limit = 10): Promise<Property[]> {
    const { data: properties } = await supabase
      .from('properties')
      .select('*')
      .eq('status', 'disponible')
      .order('created_at', { ascending: false })
      .limit(limit);

    return properties || [];
  }
}

export const recommendationEngine = new RecommendationEngine();
