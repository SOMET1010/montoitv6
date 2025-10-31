import { supabase, handleQuery } from '../client';
import type { Database } from '../../lib/database.types';

type Lease = Database['public']['Tables']['leases']['Row'];
type LeaseInsert = Database['public']['Tables']['leases']['Insert'];
type LeaseUpdate = Database['public']['Tables']['leases']['Update'];

export const leaseRepository = {
  async getById(id: string) {
    return handleQuery(
      supabase
        .from('leases')
        .select('*, properties(*), profiles!tenant_id(*), profiles!landlord_id(*)')
        .eq('id', id)
        .maybeSingle()
    );
  },

  async getByTenantId(tenantId: string) {
    return handleQuery(
      supabase
        .from('leases')
        .select('*, properties(*), profiles!landlord_id(*)')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
    );
  },

  async getByLandlordId(landlordId: string) {
    return handleQuery(
      supabase
        .from('leases')
        .select('*, properties(*), profiles!tenant_id(*)')
        .eq('landlord_id', landlordId)
        .order('created_at', { ascending: false })
    );
  },

  async getByPropertyId(propertyId: string) {
    return handleQuery(
      supabase
        .from('leases')
        .select('*, profiles!tenant_id(*), profiles!landlord_id(*)')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false })
    );
  },

  async getActiveByTenantId(tenantId: string) {
    return handleQuery(
      supabase
        .from('leases')
        .select('*, properties(*), profiles!landlord_id(*)')
        .eq('tenant_id', tenantId)
        .eq('status', 'actif')
        .maybeSingle()
    );
  },

  async create(lease: LeaseInsert) {
    return handleQuery(supabase.from('leases').insert(lease).select().single());
  },

  async update(id: string, updates: LeaseUpdate) {
    return handleQuery(supabase.from('leases').update(updates).eq('id', id).select().single());
  },

  async updateStatus(id: string, status: string) {
    return handleQuery(supabase.from('leases').update({ status }).eq('id', id).select().single());
  },

  async delete(id: string) {
    return handleQuery(supabase.from('leases').delete().eq('id', id));
  },

  async getExpiringLeases(daysBeforeExpiry: number = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysBeforeExpiry);

    return handleQuery(
      supabase
        .from('leases')
        .select('*, properties(*), profiles!tenant_id(*)')
        .eq('status', 'actif')
        .lte('end_date', futureDate.toISOString())
        .order('end_date', { ascending: true })
    );
  },
};
