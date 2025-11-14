import { supabase, handleQuery } from '../client';
import type { Database } from '../../lib/database.types';

type Lease = Database['public']['Tables']['leases']['Row'];
type LeaseInsert = Database['public']['Tables']['leases']['Insert'];
type LeaseUpdate = Database['public']['Tables']['leases']['Update'];

export const leaseRepository = {
  async getById(id: string) {
    const query = supabase
      .from('leases')
      .select('*, properties(*), profiles!tenant_id(*), profiles!landlord_id(*)')
      .eq('id', id)
      .maybeSingle();
    return handleQuery(query);
  },

  async getByTenantId(tenantId: string) {
    const query = supabase
      .from('leases')
      .select('*, properties(*), profiles!landlord_id(*)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    return handleQuery(query);
  },

  async getByLandlordId(landlordId: string) {
    const query = supabase
      .from('leases')
      .select('*, properties(*), profiles!tenant_id(*)')
      .eq('landlord_id', landlordId)
      .order('created_at', { ascending: false });
    return handleQuery(query);
  },

  async getByPropertyId(propertyId: string) {
    const query = supabase
      .from('leases')
      .select('*, profiles!tenant_id(*), profiles!landlord_id(*)')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false });
    return handleQuery(query);
  },

  async getActiveByTenantId(tenantId: string) {
    const query = supabase
      .from('leases')
      .select('*, properties(*), profiles!landlord_id(*)')
      .eq('tenant_id', tenantId)
      .eq('status', 'actif')
      .maybeSingle();
    return handleQuery(query);
  },

  async create(lease: LeaseInsert) {
    const query = supabase.from('leases').insert(lease).select().single();
    return handleQuery(query);
  },

  async update(id: string, updates: LeaseUpdate) {
    const query = supabase.from('leases').update(updates).eq('id', id).select().single();
    return handleQuery(query);
  },

  async updateStatus(id: string, status: string) {
    const query = supabase.from('leases').update({ status }).eq('id', id).select().single();
    return handleQuery(query);
  },

  async delete(id: string) {
    const query = supabase.from('leases').delete().eq('id', id);
    return handleQuery(query);
  },

  async getExpiringLeases(daysBeforeExpiry: number = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysBeforeExpiry);

    const query = supabase
      .from('leases')
      .select('*, properties(*), profiles!tenant_id(*)')
      .eq('status', 'actif')
      .lte('end_date', futureDate.toISOString())
      .order('end_date', { ascending: true });
    return handleQuery(query);
  },
};
