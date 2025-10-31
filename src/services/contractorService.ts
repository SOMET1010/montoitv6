import { supabase } from '../lib/supabase';

export interface Contractor {
  id: string;
  user_id: string;
  company_name: string;
  registration_number?: string;
  manager_name: string;
  business_email: string;
  phone_mobile: string;
  address: string;
  specialties: string[];
  expertise_levels?: Record<string, string>;
  service_cities: string[];
  service_radius_km: number;
  hourly_rate: number;
  emergency_available: boolean;
  avg_rating: number;
  total_reviews: number;
  response_rate: number;
  completion_rate: number;
  status: 'pending' | 'active' | 'suspended' | 'blacklisted' | 'inactive';
  verified: boolean;
  premium_member: boolean;
  created_at: string;
}

export interface MaintenanceAssignment {
  id: string;
  maintenance_request_id: string;
  contractor_id: string;
  match_score: number;
  contractor_response: 'pending' | 'accepted' | 'declined' | 'expired' | 'withdrawn';
  responded_at?: string;
  estimated_cost?: number;
  estimated_duration_hours?: number;
  selected_by_owner: boolean;
  work_validated: boolean;
  created_at: string;
}

export interface ContractorReview {
  id: string;
  contractor_id: string;
  reviewer_id: string;
  overall_rating: number;
  quality_rating?: number;
  punctuality_rating?: number;
  communication_rating?: number;
  value_rating?: number;
  comment?: string;
  would_recommend?: boolean;
  status: 'pending' | 'published' | 'flagged' | 'removed';
  created_at: string;
}

class ContractorService {
  async getActiveContractors(filters?: {
    specialty?: string;
    city?: string;
    minRating?: number;
  }): Promise<Contractor[]> {
    let query = supabase
      .from('contractors')
      .select('*')
      .eq('status', 'active')
      .eq('verified', true);

    if (filters?.specialty) {
      query = query.contains('specialties', [filters.specialty]);
    }

    if (filters?.city) {
      query = query.contains('service_cities', [filters.city]);
    }

    if (filters?.minRating) {
      query = query.gte('avg_rating', filters.minRating);
    }

    query = query.order('avg_rating', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Erreur lors de la récupération des prestataires: ${error.message}`);
    }

    return data || [];
  }

  async getContractorById(contractorId: string): Promise<Contractor | null> {
    const { data, error } = await supabase
      .from('contractors')
      .select('*')
      .eq('id', contractorId)
      .maybeSingle();

    if (error) {
      throw new Error(`Erreur lors de la récupération du prestataire: ${error.message}`);
    }

    return data;
  }

  async getContractorByUserId(userId: string): Promise<Contractor | null> {
    const { data, error } = await supabase
      .from('contractors')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw new Error(`Erreur lors de la récupération du prestataire: ${error.message}`);
    }

    return data;
  }

  async createContractor(contractorData: Partial<Contractor>): Promise<Contractor> {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) {
      throw new Error('Utilisateur non authentifié');
    }

    const { data, error } = await supabase
      .from('contractors')
      .insert([
        {
          ...contractorData,
          user_id: currentUser.user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de la création du prestataire: ${error.message}`);
    }

    return data;
  }

  async updateContractor(contractorId: string, updates: Partial<Contractor>): Promise<Contractor> {
    const { data, error } = await supabase
      .from('contractors')
      .update(updates)
      .eq('id', contractorId)
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de la mise à jour du prestataire: ${error.message}`);
    }

    return data;
  }

  async findMatchingContractors(
    specialty: string,
    latitude: number,
    longitude: number,
    isUrgent: boolean = false,
    limit: number = 5
  ): Promise<Array<{ contractor_id: string; match_score: number }>> {
    const { data, error } = await supabase.rpc('find_matching_contractors', {
      p_specialty: specialty,
      p_latitude: latitude,
      p_longitude: longitude,
      p_is_urgent: isUrgent,
      p_limit: limit,
    });

    if (error) {
      throw new Error(`Erreur lors de la recherche de prestataires: ${error.message}`);
    }

    return data || [];
  }

  async createMaintenanceAssignment(
    maintenanceRequestId: string,
    contractorId: string,
    matchScore: number,
    autoAssigned: boolean = false
  ): Promise<MaintenanceAssignment> {
    const { data, error } = await supabase
      .from('maintenance_assignments')
      .insert([
        {
          maintenance_request_id: maintenanceRequestId,
          contractor_id: contractorId,
          match_score: matchScore,
          auto_assigned: autoAssigned,
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de la création de l'attribution: ${error.message}`);
    }

    return data;
  }

  async getContractorAssignments(
    contractorId: string,
    filters?: { status?: string }
  ): Promise<MaintenanceAssignment[]> {
    let query = supabase
      .from('maintenance_assignments')
      .select('*')
      .eq('contractor_id', contractorId);

    if (filters?.status) {
      query = query.eq('contractor_response', filters.status);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Erreur lors de la récupération des attributions: ${error.message}`);
    }

    return data || [];
  }

  async respondToAssignment(
    assignmentId: string,
    response: 'accepted' | 'declined',
    details?: {
      decline_reason?: string;
      estimated_cost?: number;
      estimated_duration_hours?: number;
      proposed_start_date?: string;
      quote_document_url?: string;
    }
  ): Promise<MaintenanceAssignment> {
    const updateData: any = {
      contractor_response: response,
      responded_at: new Date().toISOString(),
      ...details,
    };

    const { data, error } = await supabase
      .from('maintenance_assignments')
      .update(updateData)
      .eq('id', assignmentId)
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de la réponse: ${error.message}`);
    }

    return data;
  }

  async selectContractor(assignmentId: string, reason?: string): Promise<MaintenanceAssignment> {
    const { data, error } = await supabase
      .from('maintenance_assignments')
      .update({
        selected_by_owner: true,
        selected_at: new Date().toISOString(),
        selection_reason: reason,
      })
      .eq('id', assignmentId)
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de la sélection: ${error.message}`);
    }

    return data;
  }

  async validateWork(assignmentId: string, satisfaction: number): Promise<MaintenanceAssignment> {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) {
      throw new Error('Utilisateur non authentifié');
    }

    const { data, error } = await supabase
      .from('maintenance_assignments')
      .update({
        work_validated: true,
        validated_by: currentUser.user.id,
        validated_at: new Date().toISOString(),
        client_satisfaction: satisfaction,
      })
      .eq('id', assignmentId)
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de la validation: ${error.message}`);
    }

    return data;
  }

  async getContractorReviews(contractorId: string): Promise<ContractorReview[]> {
    const { data, error } = await supabase
      .from('contractor_reviews')
      .select('*')
      .eq('contractor_id', contractorId)
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erreur lors de la récupération des avis: ${error.message}`);
    }

    return data || [];
  }

  async createReview(reviewData: {
    contractor_id: string;
    assignment_id?: string;
    overall_rating: number;
    quality_rating?: number;
    punctuality_rating?: number;
    communication_rating?: number;
    value_rating?: number;
    title?: string;
    comment?: string;
    would_recommend?: boolean;
  }): Promise<ContractorReview> {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) {
      throw new Error('Utilisateur non authentifié');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.user.id)
      .single();

    const { data, error } = await supabase
      .from('contractor_reviews')
      .insert([
        {
          ...reviewData,
          reviewer_id: currentUser.user.id,
          reviewer_role: profile?.role || 'tenant',
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de la création de l'avis: ${error.message}`);
    }

    return data;
  }

  async getContractorStats(contractorId: string) {
    const contractor = await this.getContractorById(contractorId);
    if (!contractor) {
      throw new Error('Prestataire introuvable');
    }

    const assignments = await this.getContractorAssignments(contractorId);
    const reviews = await this.getContractorReviews(contractorId);

    return {
      total_jobs: contractor.total_reviews,
      completed_jobs: assignments.filter((a) => a.work_validated).length,
      pending_jobs: assignments.filter((a) => a.contractor_response === 'pending').length,
      avg_rating: contractor.avg_rating,
      total_reviews: contractor.total_reviews,
      response_rate: contractor.response_rate,
      completion_rate: contractor.completion_rate,
      recent_reviews: reviews.slice(0, 5),
    };
  }
}

export const contractorService = new ContractorService();
