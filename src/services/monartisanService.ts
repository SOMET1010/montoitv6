import { supabase } from '../lib/supabase';

export interface MonArtisanJobRequest {
  id: string;
  maintenance_request_id: string;
  property_id: string;
  requester_id: string;
  monartisan_request_id?: string;
  monartisan_job_reference?: string;
  job_type: string;
  job_description: string;
  urgency_level: 'low' | 'medium' | 'high' | 'emergency';
  property_address: string;
  property_city: string;
  status: string;
  assigned_contractor_id?: string;
  artisans_contacted_count: number;
  quotes_received_count: number;
  created_at: string;
  updated_at: string;
}

export interface MonArtisanQuote {
  id: string;
  job_request_id: string;
  contractor_id: string;
  quote_amount: number;
  quote_details?: string;
  estimated_duration_hours?: number;
  proposed_start_date?: string;
  valid_until: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  contractor_notes?: string;
  created_at: string;
}

export interface MonArtisanContractor {
  id: string;
  monartisan_id: string;
  company_name: string;
  contact_name: string;
  email?: string;
  phone: string;
  specialties: string[];
  services_offered: string[];
  service_cities: string[];
  hourly_rate_min?: number;
  hourly_rate_max?: number;
  monartisan_rating?: number;
  monartisan_reviews_count: number;
  sync_status: string;
}

export interface CreateJobRequestData {
  maintenance_request_id: string;
  job_type: string;
  job_description: string;
  urgency_level: 'low' | 'medium' | 'high' | 'emergency';
  preferred_date?: string;
  preferred_time_slot?: string;
  budget_max?: number;
}

class MonArtisanService {
  async createJobRequest(data: CreateJobRequestData): Promise<MonArtisanJobRequest> {
    const { data: result, error } = await supabase.functions.invoke('monartisan-request', {
      body: data,
    });

    if (error) {
      throw new Error(error.message || 'Erreur lors de la création de la demande Mon Artisan');
    }

    return result.job_request;
  }

  async getJobRequestsByMaintenance(maintenanceRequestId: string): Promise<MonArtisanJobRequest[]> {
    const { data, error } = await supabase
      .from('monartisan_job_requests')
      .select('*')
      .eq('maintenance_request_id', maintenanceRequestId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }

  async getJobRequestById(id: string): Promise<MonArtisanJobRequest | null> {
    const { data, error } = await supabase
      .from('monartisan_job_requests')
      .select(`
        *,
        maintenance_request:maintenance_requests(*),
        property:properties(*),
        assigned_contractor:monartisan_contractors(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async getQuotesByJobRequest(jobRequestId: string): Promise<MonArtisanQuote[]> {
    const { data, error } = await supabase
      .from('monartisan_quotes')
      .select(`
        *,
        contractor:monartisan_contractors(*)
      `)
      .eq('job_request_id', jobRequestId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }

  async acceptQuote(quoteId: string): Promise<void> {
    const { error } = await supabase
      .from('monartisan_quotes')
      .update({
        status: 'accepted',
        decision_made_at: new Date().toISOString(),
      })
      .eq('id', quoteId);

    if (error) {
      throw new Error(error.message);
    }

    const { data: quote } = await supabase
      .from('monartisan_quotes')
      .select('job_request_id')
      .eq('id', quoteId)
      .single();

    if (quote) {
      await supabase
        .from('monartisan_quotes')
        .update({ status: 'rejected', rejection_reason: 'Autre devis accepté' })
        .eq('job_request_id', quote.job_request_id)
        .neq('id', quoteId);
    }
  }

  async rejectQuote(quoteId: string, reason: string): Promise<void> {
    const { error } = await supabase
      .from('monartisan_quotes')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        decision_made_at: new Date().toISOString(),
      })
      .eq('id', quoteId);

    if (error) {
      throw new Error(error.message);
    }
  }

  async getAvailableContractors(
    specialty?: string,
    city?: string
  ): Promise<MonArtisanContractor[]> {
    let query = supabase
      .from('monartisan_contractors')
      .select('*')
      .eq('sync_status', 'active');

    if (specialty) {
      query = query.contains('specialties', [specialty]);
    }

    if (city) {
      query = query.contains('service_cities', [city]);
    }

    const { data, error } = await query.order('monartisan_rating', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }

  async cancelJobRequest(jobRequestId: string, reason: string): Promise<void> {
    const { error } = await supabase
      .from('monartisan_job_requests')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason,
      })
      .eq('id', jobRequestId);

    if (error) {
      throw new Error(error.message);
    }
  }

  async getJobRequestStats(userId: string): Promise<{
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    cancelled: number;
  }> {
    const { data, error } = await supabase
      .from('monartisan_job_requests')
      .select('status')
      .eq('requester_id', userId);

    if (error) {
      throw new Error(error.message);
    }

    const stats = {
      total: data.length,
      pending: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
    };

    data.forEach((request) => {
      if (request.status === 'pending' || request.status === 'submitted') {
        stats.pending++;
      } else if (request.status === 'in_progress') {
        stats.in_progress++;
      } else if (request.status === 'completed') {
        stats.completed++;
      } else if (request.status === 'cancelled') {
        stats.cancelled++;
      }
    });

    return stats;
  }
}

export const monartisanService = new MonArtisanService();
