import { supabase, handleQuery } from '../client';
import type { Database } from '../../lib/database.types';

type Application = Database['public']['Tables']['applications']['Row'];
type ApplicationInsert = Database['public']['Tables']['applications']['Insert'];
type ApplicationUpdate = Database['public']['Tables']['applications']['Update'];

export const applicationRepository = {
  async getById(id: string) {
    const query = supabase
      .from('applications')
      .select('*, properties(*), profiles!applicant_id(*)')
      .eq('id', id)
      .maybeSingle();
    return handleQuery(query);
  },

  async getByApplicantId(applicantId: string) {
    const query = supabase
      .from('applications')
      .select('*, properties(*)')
      .eq('applicant_id', applicantId)
      .order('created_at', { ascending: false });
    return handleQuery(query);
  },

  async getByPropertyId(propertyId: string) {
    const query = supabase
      .from('applications')
      .select('*, profiles!applicant_id(*)')
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
      .from('applications')
      .select('*, properties(*), profiles!applicant_id(*)')
      .in('property_id', propertyIds)
      .order('created_at', { ascending: false });
    return handleQuery(query);
  },

  async create(application: ApplicationInsert) {
    const query = supabase.from('applications').insert(application).select().single();
    return handleQuery(query);
  },

  async update(id: string, updates: ApplicationUpdate) {
    const query = supabase.from('applications').update(updates).eq('id', id).select().single();
    return handleQuery(query);
  },

  async updateStatus(id: string, status: string, reviewNotes?: string) {
    const updates: any = { status };
    if (reviewNotes) {
      updates.review_notes = reviewNotes;
    }
    const query = supabase.from('applications').update(updates).eq('id', id).select().single();
    return handleQuery(query);
  },

  async delete(id: string) {
    const query = supabase.from('applications').delete().eq('id', id);
    return handleQuery(query);
  },

  async getByStatus(status: string) {
    const query = supabase
      .from('applications')
      .select('*, properties(*), profiles!applicant_id(*)')
      .eq('status', status)
      .order('created_at', { ascending: false });
    return handleQuery(query);
  },

  async getPendingCount(ownerId: string) {
    const { data: properties } = await supabase.from('properties').select('id').eq('owner_id', ownerId);

    if (!properties || properties.length === 0) {
      return { data: 0, error: null };
    }

    const propertyIds = properties.map((p) => p.id);

    const query = supabase
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .in('property_id', propertyIds)
      .eq('status', 'en_attente');
    return handleQuery(query);
  },

  async checkExistingApplication(applicantId: string, propertyId: string) {
    const query = supabase
      .from('applications')
      .select('*')
      .eq('applicant_id', applicantId)
      .eq('property_id', propertyId)
      .maybeSingle();
    return handleQuery(query);
  },
};
