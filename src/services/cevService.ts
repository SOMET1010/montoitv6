import { supabase } from '../lib/supabase';

export interface CEVRequest {
  id: string;
  lease_id: string;
  property_id: string;
  landlord_id: string;
  tenant_id: string;
  status: 'pending_documents' | 'submitted' | 'under_review' | 'documents_requested' | 'approved' | 'issued' | 'rejected';
  landlord_cni_front_url?: string;
  landlord_cni_back_url?: string;
  tenant_cni_front_url?: string;
  tenant_cni_back_url?: string;
  property_title_url?: string;
  payment_proof_url?: string;
  property_photo_url?: string;
  signed_lease_url: string;
  oneci_request_id?: string;
  oneci_reference_number?: string;
  oneci_submission_date?: string;
  oneci_review_date?: string;
  oneci_response_data?: any;
  cev_number?: string;
  cev_issue_date?: string;
  cev_expiry_date?: string;
  cev_document_url?: string;
  cev_qr_code?: string;
  cev_verification_url?: string;
  cev_fee_amount: number;
  cev_fee_paid: boolean;
  cev_fee_payment_id?: string;
  rejection_reason?: string;
  rejection_details?: any;
  additional_documents_requested?: any;
  additional_documents_deadline?: string;
  submitted_by?: string;
  submitted_at?: string;
  reviewed_by_admin?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CEVPrerequisites {
  valid: boolean;
  missing_requirements: string[];
  error?: string;
  lease?: {
    id: string;
    status: string;
    electronically_signed: boolean;
  };
  landlord?: {
    id: string;
    ansut_verified: boolean;
    tenant_score: number;
  };
  tenant?: {
    id: string;
    ansut_verified: boolean;
    tenant_score: number;
  };
}

export interface CreateCEVRequestData {
  lease_id: string;
  property_id: string;
  landlord_id: string;
  tenant_id: string;
  signed_lease_url: string;
  landlord_cni_front_url?: string;
  landlord_cni_back_url?: string;
  tenant_cni_front_url?: string;
  tenant_cni_back_url?: string;
  property_title_url?: string;
  payment_proof_url?: string;
  property_photo_url?: string;
}

export interface UpdateCEVDocumentsData {
  landlord_cni_front_url?: string;
  landlord_cni_back_url?: string;
  tenant_cni_front_url?: string;
  tenant_cni_back_url?: string;
  property_title_url?: string;
  payment_proof_url?: string;
  property_photo_url?: string;
}

class CEVService {
  async checkPrerequisites(leaseId: string): Promise<CEVPrerequisites> {
    const { data, error } = await supabase.rpc('check_cev_prerequisites', {
      p_lease_id: leaseId,
    });

    if (error) {
      throw new Error(`Erreur lors de la vérification des prérequis: ${error.message}`);
    }

    return data as CEVPrerequisites;
  }

  async getCEVRequestsByLease(leaseId: string): Promise<CEVRequest[]> {
    const { data, error } = await supabase
      .from('cev_requests')
      .select('*')
      .eq('lease_id', leaseId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erreur lors de la récupération des demandes CEV: ${error.message}`);
    }

    return data || [];
  }

  async getCEVRequestById(requestId: string): Promise<CEVRequest | null> {
    const { data, error } = await supabase
      .from('cev_requests')
      .select('*')
      .eq('id', requestId)
      .maybeSingle();

    if (error) {
      throw new Error(`Erreur lors de la récupération de la demande CEV: ${error.message}`);
    }

    return data;
  }

  async getUserCEVRequests(userId: string): Promise<CEVRequest[]> {
    const { data, error } = await supabase
      .from('cev_requests')
      .select('*')
      .or(`landlord_id.eq.${userId},tenant_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erreur lors de la récupération des demandes CEV: ${error.message}`);
    }

    return data || [];
  }

  async createCEVRequest(requestData: CreateCEVRequestData): Promise<CEVRequest> {
    const prerequisites = await this.checkPrerequisites(requestData.lease_id);

    if (!prerequisites.valid) {
      throw new Error(
        `Prérequis non satisfaits: ${prerequisites.missing_requirements.join(', ')}`
      );
    }

    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) {
      throw new Error('Utilisateur non authentifié');
    }

    const { data, error } = await supabase
      .from('cev_requests')
      .insert([
        {
          ...requestData,
          submitted_by: currentUser.user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de la création de la demande CEV: ${error.message}`);
    }

    return data;
  }

  async updateCEVDocuments(
    requestId: string,
    documents: UpdateCEVDocumentsData
  ): Promise<CEVRequest> {
    const { data, error } = await supabase
      .from('cev_requests')
      .update(documents)
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de la mise à jour des documents: ${error.message}`);
    }

    return data;
  }

  async submitToONECI(requestId: string): Promise<CEVRequest> {
    const request = await this.getCEVRequestById(requestId);
    if (!request) {
      throw new Error('Demande CEV introuvable');
    }

    if (request.status !== 'pending_documents') {
      throw new Error('La demande ne peut pas être soumise dans son état actuel');
    }

    const requiredDocs = [
      'landlord_cni_front_url',
      'landlord_cni_back_url',
      'tenant_cni_front_url',
      'tenant_cni_back_url',
      'property_title_url',
      'payment_proof_url',
      'property_photo_url',
      'signed_lease_url',
    ];

    const missingDocs = requiredDocs.filter((doc) => !request[doc as keyof CEVRequest]);

    if (missingDocs.length > 0) {
      throw new Error(`Documents manquants: ${missingDocs.join(', ')}`);
    }

    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) {
      throw new Error('Utilisateur non authentifié');
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(`${supabaseUrl}/functions/v1/oneci-cev-submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        request_id: requestId,
        documents: {
          landlord_cni_front_url: request.landlord_cni_front_url,
          landlord_cni_back_url: request.landlord_cni_back_url,
          tenant_cni_front_url: request.tenant_cni_front_url,
          tenant_cni_back_url: request.tenant_cni_back_url,
          property_title_url: request.property_title_url,
          payment_proof_url: request.payment_proof_url,
          property_photo_url: request.property_photo_url,
          signed_lease_url: request.signed_lease_url,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erreur lors de la soumission à ONECI: ${errorData.error}`);
    }

    const result = await response.json();

    const { data, error } = await supabase
      .from('cev_requests')
      .update({
        status: 'submitted',
        oneci_request_id: result.oneci_request_id,
        oneci_reference_number: result.reference_number,
        oneci_submission_date: new Date().toISOString(),
        submitted_at: new Date().toISOString(),
        submitted_by: currentUser.user.id,
      })
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de la mise à jour du statut: ${error.message}`);
    }

    return data;
  }

  async payCEVFee(requestId: string, paymentId: string): Promise<CEVRequest> {
    const { data, error } = await supabase
      .from('cev_requests')
      .update({
        cev_fee_paid: true,
        cev_fee_payment_id: paymentId,
      })
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de l'enregistrement du paiement: ${error.message}`);
    }

    return data;
  }

  async getAllCEVRequests(filters?: {
    status?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<CEVRequest[]> {
    let query = supabase
      .from('cev_requests')
      .select(`
        *,
        lease:leases(id, property_id, start_date, end_date, monthly_rent),
        property:properties(id, title, address),
        landlord:profiles!cev_requests_landlord_id_fkey(id, full_name, email),
        tenant:profiles!cev_requests_tenant_id_fkey(id, full_name, email)
      `);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }

    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Erreur lors de la récupération des demandes: ${error.message}`);
    }

    return data || [];
  }

  async updateCEVRequestStatus(
    requestId: string,
    status: CEVRequest['status'],
    additionalData?: Partial<CEVRequest>
  ): Promise<CEVRequest> {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) {
      throw new Error('Utilisateur non authentifié');
    }

    const updateData: any = {
      status,
      ...additionalData,
    };

    if (status === 'issued') {
      updateData.reviewed_at = new Date().toISOString();
      updateData.reviewed_by_admin = currentUser.user.id;
    }

    const { data, error } = await supabase
      .from('cev_requests')
      .update(updateData)
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de la mise à jour du statut: ${error.message}`);
    }

    return data;
  }

  async downloadCEVCertificate(requestId: string): Promise<Blob> {
    const request = await this.getCEVRequestById(requestId);
    if (!request || !request.cev_document_url) {
      throw new Error('Certificat CEV non disponible');
    }

    const response = await fetch(request.cev_document_url);
    if (!response.ok) {
      throw new Error('Erreur lors du téléchargement du certificat');
    }

    return await response.blob();
  }

  async verifyCEVCertificate(cevNumber: string): Promise<CEVRequest | null> {
    const { data, error } = await supabase
      .from('cev_requests')
      .select('*')
      .eq('cev_number', cevNumber)
      .eq('status', 'issued')
      .maybeSingle();

    if (error) {
      throw new Error(`Erreur lors de la vérification du certificat: ${error.message}`);
    }

    return data;
  }

  async getExpiringCEVs(daysThreshold: number = 30): Promise<CEVRequest[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysThreshold);

    const { data, error } = await supabase
      .from('cev_requests')
      .select('*')
      .eq('status', 'issued')
      .not('cev_expiry_date', 'is', null)
      .gte('cev_expiry_date', new Date().toISOString())
      .lte('cev_expiry_date', futureDate.toISOString())
      .order('cev_expiry_date', { ascending: true });

    if (error) {
      throw new Error(`Erreur lors de la récupération des CEV expirants: ${error.message}`);
    }

    return data || [];
  }

  async getCEVAnalytics(dateFrom?: string, dateTo?: string) {
    let query = supabase.from('cev_analytics_snapshots').select('*');

    if (dateFrom) {
      query = query.gte('snapshot_date', dateFrom);
    }

    if (dateTo) {
      query = query.lte('snapshot_date', dateTo);
    }

    query = query.order('snapshot_date', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Erreur lors de la récupération des analytics: ${error.message}`);
    }

    return data || [];
  }
}

export const cevService = new CEVService();
