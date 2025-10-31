import { supabase, handleQuery } from '../client';
import type { Database } from '../../lib/database.types';

type Application = Database['public']['Tables']['applications']['Row'];
type ApplicationInsert = Database['public']['Tables']['applications']['Insert'];
type ApplicationUpdate = Database['public']['Tables']['applications']['Update'];

export const applicationRepository = {
  async getById(id: string) {
    return handleQuery(
      supabase
        .from('applications')
        .select('*, properties(*), profiles!applicant_id(*)')
        .eq('id', id)
        .maybeSingle()
    );
  },

  async getByApplicantId(applicantId: string) {
    return handleQuery(
      supabase
        .from('applications')
        .select('*, properties(*)')
        .eq('applicant_id', applicantId)
        .order('created_at', { ascending: false })
    );
  },

  async getByPropertyId(propertyId: string) {
    return handleQuery(
      supabase
        .from('applications')
        .select('*, profiles!applicant_id(*)')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false })
    );
  },

  async getByOwnerId(ownerId: string) {
    const { data: properties } = await supabase.from('properties').select('id').eq('owner_id', ownerId);

    if (!properties || properties.length === 0) {
      return { data: [], error: null };
    }

    const propertyIds = properties.map((p) => p.id);

    return handleQuery(
      supabase
        .from('applications')
        .select('*, properties(*), profiles!applicant_id(*)')
        .in('property_id', propertyIds)
        .order('created_at', { ascending: false })
    );
  },

  async create(application: ApplicationInsert) {
    return handleQuery(supabase.from('applications').insert(application).select().single());
  },

  async update(id: string, updates: ApplicationUpdate) {
    return handleQuery(supabase.from('applications').update(updates).eq('id', id).select().single());
  },

  async updateStatus(id: string, status: string, reviewNotes?: string) {
    const updates: ApplicationUpdate = { status };
    if (reviewNotes) {
      updates.review_notes = reviewNotes;
    }
    return handleQuery(supabase.from('applications').update(updates).eq('id', id).select().single());
  },

  async delete(id: string) {
    return handleQuery(supabase.from('applications').delete().eq('id', id));
  },

  async getByStatus(status: string) {
    return handleQuery(
      supabase
        .from('applications')
        .select('*, properties(*), profiles!applicant_id(*)')
        .eq('status', status)
        .order('created_at', { ascending: false })
    );
  },

  async getPendingCount(ownerId: string) {
    const { data: properties } = await supabase.from('properties').select('id').eq('owner_id', ownerId);

    if (!properties || properties.length === 0) {
      return { data: 0, error: null };
    }

    const propertyIds = properties.map((p) => p.id);

    return handleQuery(
      supabase
        .from('applications')
        .select('id', { count: 'exact', head: true })
        .in('property_id', propertyIds)
        .eq('status', 'en_attente')
    );
  },

  async checkExistingApplication(applicantId: string, propertyId: string) {
    return handleQuery(
      supabase
        .from('applications')
        .select('*')
        .eq('applicant_id', applicantId)
        .eq('property_id', propertyId)
        .maybeSingle()
    );
  },
};
