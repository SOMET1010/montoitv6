/**
 * Property Repository
 * Data access layer for property-related operations
 */

import { supabase, handleQuery, handlePaginatedQuery } from '../client';
import type { Property, PropertyInsert, PropertyUpdate, PropertyFilters } from '../../types';

export const propertyRepository = {
  /**
   * Get all properties with optional filtering and pagination
   */
  async getAll(filters?: PropertyFilters, page?: number, pageSize?: number) {
    let query = supabase
      .from('properties')
      .select('*, profiles!owner_id(full_name, user_type)', { count: 'exact' })
      .eq('status', 'disponible')
      .order('created_at', { ascending: false });

    if (filters?.propertyType) {
      query = query.eq('property_type', filters.propertyType);
    }

    if (filters?.city) {
      query = query.eq('city', filters.city);
    }

    if (filters?.minPrice) {
      query = query.gte('price', filters.minPrice);
    }

    if (filters?.maxPrice) {
      query = query.lte('price', filters.maxPrice);
    }

    if (filters?.bedrooms) {
      query = query.gte('bedrooms', filters.bedrooms);
    }

    if (filters?.bathrooms) {
      query = query.gte('bathrooms', filters.bathrooms);
    }

    if (filters?.searchQuery) {
      query = query.or(
        `title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%,address.ilike.%${filters.searchQuery}%`
      );
    }

    if (page && pageSize) {
      return handlePaginatedQuery<Property>(query, page, pageSize);
    }

    return handleQuery(query);
  },

  /**
   * Get a single property by ID
   */
  async getById(id: string) {
    const query = supabase
      .from('properties')
      .select('*, profiles!owner_id(id, full_name, email, phone, user_type, avatar_url)')
      .eq('id', id)
      .maybeSingle();

    return handleQuery<Property>(query);
  },

  /**
   * Get properties owned by a specific user
   */
  async getByOwnerId(ownerId: string) {
    const query = supabase
      .from('properties')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    return handleQuery<Property[]>(query);
  },

  /**
   * Create a new property
   */
  async create(property: PropertyInsert) {
    const query = supabase.from('properties').insert(property).select().single();

    return handleQuery<Property>(query);
  },

  /**
   * Update an existing property
   */
  async update(id: string, updates: PropertyUpdate) {
    const query = supabase
      .from('properties')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return handleQuery<Property>(query);
  },

  /**
   * Delete a property
   */
  async delete(id: string) {
    const query = supabase.from('properties').delete().eq('id', id);

    return handleQuery<null>(query);
  },

  /**
   * Increment property view count
   */
  async incrementViewCount(id: string) {
    const { error } = await supabase.rpc('increment_property_views', {
      property_id: id,
    });

    return { error };
  },

  /**
   * Search properties by location
   */
  async searchByLocation(city: string, radius?: number) {
    const query = supabase
      .from('properties')
      .select('*')
      .eq('city', city)
      .eq('status', 'disponible')
      .order('created_at', { ascending: false });

    return handleQuery<Property[]>(query);
  },

  /**
   * Get featured/popular properties
   */
  async getFeatured(limit: number = 6) {
    const query = supabase
      .from('properties')
      .select('*, profiles!owner_id(full_name, user_type)')
      .eq('status', 'disponible')
      .order('views', { ascending: false })
      .limit(limit);

    return handleQuery<Property[]>(query);
  },
};
