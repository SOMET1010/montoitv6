import { supabase, handleQuery } from '../client';
import type { Database } from '../../lib/database.types';

type MaintenanceRequest = Database['public']['Tables']['maintenance_requests']['Row'];
type MaintenanceRequestInsert = Database['public']['Tables']['maintenance_requests']['Insert'];
type MaintenanceRequestUpdate = Database['public']['Tables']['maintenance_requests']['Update'];

export const maintenanceRepository = {
  async getById(id: string) {
    const query = supabase
      .from('maintenance_requests')
      .select('*, properties(*), profiles!tenant_id(*)')
      .eq('id', id)
      .maybeSingle();
    return handleQuery(query);
  },

  async getByTenantId(tenantId: string) {
    const query = supabase
      .from('maintenance_requests')
      .select('*, properties(*)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    return handleQuery(query);
  },

  async getByPropertyId(propertyId: string) {
    const query = supabase
      .from('maintenance_requests')
      .select('*, profiles!tenant_id(*)')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false });
    return handleQuery(query);
  },

  async getByOwnerId(ownerId: string) {
    const { data: properties } = await supabase.from('properties').select('id').eq('owner_id', ownerId);

    if (!properties || properties.length === 0) {
      return { data: [], error: null };
    }

    const propertyIds = properties.map((p) => p.id);

    const query = supabase
      .from('maintenance_requests')
      .select('*, properties(*), profiles!tenant_id(*)')
      .in('property_id', propertyIds)
      .order('created_at', { ascending: false });
    return handleQuery(query);
  },

  async create(request: MaintenanceRequestInsert) {
    const query = supabase.from('maintenance_requests').insert(request).select().single();
    return handleQuery(query);
  },

  async update(id: string, updates: MaintenanceRequestUpdate) {
    const query = supabase.from('maintenance_requests').update(updates).eq('id', id).select().single();
    return handleQuery(query);
  },

  async updateStatus(id: string, status: string) {
    const query = supabase.from('maintenance_requests').update({ status }).eq('id', id).select().single();
    return handleQuery(query);
  },

  async delete(id: string) {
    const query = supabase.from('maintenance_requests').delete().eq('id', id);
    return handleQuery(query);
  },

  async getByStatus(status: string, userId?: string, userType?: string) {
    let query = supabase
      .from('maintenance_requests')
      .select('*, properties(*), profiles!tenant_id(*)')
      .eq('status', status);

    if (userId && userType === 'locataire') {
      query = query.eq('tenant_id', userId);
    } else if (userId && userType === 'proprietaire') {
      const { data: properties } = await supabase.from('properties').select('id').eq('owner_id', userId);
      if (properties && properties.length > 0) {
        const propertyIds = properties.map((p) => p.id);
        query = query.in('property_id', propertyIds);
      }
    }

    const finalQuery = query.order('created_at', { ascending: false });
    return handleQuery(finalQuery);
  },

  async getPendingCount(userId: string, userType: string) {
    let query = supabase
      .from('maintenance_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'en_attente');

    if (userType === 'locataire') {
      query = query.eq('tenant_id', userId);
    } else if (userType === 'proprietaire') {
      const { data: properties } = await supabase.from('properties').select('id').eq('owner_id', userId);
      if (properties && properties.length > 0) {
        const propertyIds = properties.map((p) => p.id);
        query = query.in('property_id', propertyIds);
      }
    }

    return handleQuery(query);
  },
};
