import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type TrustValidationRequest = Database['public']['Tables']['trust_validation_requests']['Row'];
type TrustAgent = Database['public']['Tables']['trust_agents']['Row'];
type Dispute = Database['public']['Tables']['disputes']['Row'];
type DisputeMessage = Database['public']['Tables']['dispute_messages']['Row'];

export interface ValidationRequestInput {
  userId: string;
}

export interface UpdateValidationInput {
  requestId: string;
  status: 'approved' | 'rejected' | 'additional_info_required';
  documentsVerified?: boolean;
  identityVerified?: boolean;
  backgroundCheck?: boolean;
  interviewCompleted?: boolean;
  trustScore?: number;
  agentNotes?: string;
  rejectionReason?: string;
  additionalInfoRequested?: string;
}

export interface DisputeInput {
  leaseId: string;
  openedBy: string;
  againstUser: string;
  disputeType: 'deposit_return' | 'inventory_disagreement' | 'unpaid_rent' |
                'maintenance_not_done' | 'nuisance' | 'early_termination' | 'other';
  description: string;
  amountDisputed?: number;
  urgency?: 'normal' | 'urgent';
  evidenceFiles?: string[];
}

export interface DisputeResolutionInput {
  disputeId: string;
  resolutionProposed: string;
  mediatorNotes?: string;
}

export interface DisputeMessageInput {
  disputeId: string;
  senderId: string;
  message: string;
  attachments?: string[];
}

/**
 * Service de gestion des validations par le Tiers de Confiance
 */
export const trustValidationService = {
  /**
   * Créer une demande de validation manuelle
   */
  async requestValidation(input: ValidationRequestInput): Promise<TrustValidationRequest> {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('ansut_verified, tenant_score, trust_verified')
      .eq('id', input.userId)
      .single();

    if (profileError) {
      throw new Error('Erreur lors de la récupération du profil');
    }

    if (!profile.ansut_verified) {
      throw new Error('Vérification Mon Toit requise avant demande de validation');
    }

    if (profile.trust_verified) {
      throw new Error('Vous êtes déjà vérifié par le Tiers de Confiance');
    }

    if (profile.tenant_score && profile.tenant_score < 600) {
      throw new Error('Score ANSUT minimum requis: 600/850');
    }

    const { data: existingRequest } = await supabase
      .from('trust_validation_requests')
      .select('id, status')
      .eq('user_id', input.userId)
      .maybeSingle();

    if (existingRequest && existingRequest.status !== 'rejected') {
      throw new Error('Une demande est déjà en cours');
    }

    const { data, error } = await supabase
      .from('trust_validation_requests')
      .insert({
        user_id: input.userId,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de la création de la demande: ${error.message}`);
    }

    return data;
  },

  /**
   * Récupérer les demandes de validation (pour agents)
   */
  async getValidationRequests(filters?: {
    status?: string;
    assignedTo?: string;
  }): Promise<TrustValidationRequest[]> {
    let query = supabase
      .from('trust_validation_requests')
      .select(`
        *,
        profiles!trust_validation_requests_user_id_fkey (
          id,
          first_name,
          last_name,
          email,
          phone,
          date_of_birth,
          id_number,
          ansut_verified,
          tenant_score,
          identity_verifications (
            id,
            verification_type,
            status,
            document_image_url,
            selfie_image_url,
            created_at
          )
        )
      `)
      .order('requested_at', { ascending: true });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.assignedTo) {
      query = query.eq('assigned_to', filters.assignedTo);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Erreur lors de la récupération des demandes: ${error.message}`);
    }

    return data || [];
  },

  /**
   * Récupérer une demande de validation spécifique
   */
  async getValidationRequest(requestId: string): Promise<TrustValidationRequest | null> {
    const { data, error } = await supabase
      .from('trust_validation_requests')
      .select(`
        *,
        profiles!trust_validation_requests_user_id_fkey (
          *,
          identity_verifications (
            *
          ),
          facial_verifications (
            *
          )
        ),
        trust_agents!trust_validation_requests_assigned_to_fkey (
          id,
          full_name,
          email
        )
      `)
      .eq('id', requestId)
      .maybeSingle();

    if (error) {
      throw new Error(`Erreur lors de la récupération de la demande: ${error.message}`);
    }

    return data;
  },

  /**
   * Mettre à jour une demande de validation (par agent)
   */
  async updateValidationRequest(input: UpdateValidationInput): Promise<TrustValidationRequest> {
    const updateData: any = {
      status: input.status,
      validated_at: input.status === 'approved' || input.status === 'rejected' ? new Date().toISOString() : undefined,
      documents_verified: input.documentsVerified,
      identity_verified: input.identityVerified,
      background_check: input.backgroundCheck,
      interview_completed: input.interviewCompleted,
      trust_score: input.trustScore,
      agent_notes: input.agentNotes,
      rejection_reason: input.rejectionReason,
      additional_info_requested: input.additionalInfoRequested
    };

    if (input.status === 'approved' || input.status === 'rejected') {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: agent } = await supabase
          .from('trust_agents')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (agent) {
          updateData.validated_by = agent.id;
        }
      }
    }

    Object.keys(updateData).forEach(key =>
      updateData[key] === undefined && delete updateData[key]
    );

    const { data, error } = await supabase
      .from('trust_validation_requests')
      .update(updateData)
      .eq('id', input.requestId)
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de la mise à jour: ${error.message}`);
    }

    if (input.status === 'approved' && data.validated_by) {
      await supabase
        .from('trust_agents')
        .update({
          total_validations: supabase.rpc('increment', { row_id: data.validated_by, increment_by: 1 })
        })
        .eq('id', data.validated_by);
    }

    return data;
  },

  /**
   * Récupérer le statut de validation d'un utilisateur
   */
  async getUserValidationStatus(userId: string): Promise<TrustValidationRequest | null> {
    const { data, error } = await supabase
      .from('trust_validation_requests')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Erreur lors de la récupération du statut: ${error.message}`);
    }

    return data;
  }
};

/**
 * Service de gestion des litiges et médiation
 */
export const disputeService = {
  /**
   * Créer un litige
   */
  async createDispute(input: DisputeInput): Promise<Dispute> {
    const { data: lease, error: leaseError } = await supabase
      .from('leases')
      .select('id, tenant_id, landlord_id, status')
      .eq('id', input.leaseId)
      .single();

    if (leaseError) {
      throw new Error('Bail non trouvé');
    }

    if (input.openedBy !== lease.tenant_id && input.openedBy !== lease.landlord_id) {
      throw new Error('Vous n\'êtes pas partie prenante de ce bail');
    }

    const againstUserId = input.openedBy === lease.tenant_id ? lease.landlord_id : lease.tenant_id;

    const { data, error } = await supabase
      .from('disputes')
      .insert({
        lease_id: input.leaseId,
        opened_by: input.openedBy,
        against_user: againstUserId,
        dispute_type: input.disputeType,
        description: input.description,
        amount_disputed: input.amountDisputed,
        urgency: input.urgency || 'normal',
        evidence_files: input.evidenceFiles || [],
        status: 'open'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de la création du litige: ${error.message}`);
    }

    return data;
  },

  /**
   * Récupérer les litiges (pour utilisateurs ou médiateurs)
   */
  async getDisputes(filters?: {
    userId?: string;
    status?: string;
    assignedTo?: string;
  }): Promise<Dispute[]> {
    let query = supabase
      .from('disputes')
      .select(`
        *,
        leases!disputes_lease_id_fkey (
          id,
          property_id,
          properties (
            title,
            address
          )
        ),
        opener:profiles!disputes_opened_by_fkey (
          id,
          first_name,
          last_name,
          email
        ),
        opponent:profiles!disputes_against_user_fkey (
          id,
          first_name,
          last_name,
          email
        ),
        trust_agents!disputes_assigned_to_fkey (
          id,
          full_name,
          email
        )
      `)
      .order('opened_at', { ascending: false });

    if (filters?.userId) {
      query = query.or(`opened_by.eq.${filters.userId},against_user.eq.${filters.userId}`);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.assignedTo) {
      query = query.eq('assigned_to', filters.assignedTo);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Erreur lors de la récupération des litiges: ${error.message}`);
    }

    return data || [];
  },

  /**
   * Récupérer un litige spécifique
   */
  async getDispute(disputeId: string): Promise<Dispute | null> {
    const { data, error } = await supabase
      .from('disputes')
      .select(`
        *,
        leases!disputes_lease_id_fkey (
          *,
          properties (
            *
          )
        ),
        opener:profiles!disputes_opened_by_fkey (
          *
        ),
        opponent:profiles!disputes_against_user_fkey (
          *
        ),
        trust_agents!disputes_assigned_to_fkey (
          *
        )
      `)
      .eq('id', disputeId)
      .maybeSingle();

    if (error) {
      throw new Error(`Erreur lors de la récupération du litige: ${error.message}`);
    }

    return data;
  },

  /**
   * Proposer une résolution (médiateur)
   */
  async proposeResolution(input: DisputeResolutionInput): Promise<Dispute> {
    const { data, error } = await supabase
      .from('disputes')
      .update({
        resolution_proposed: input.resolutionProposed,
        status: 'awaiting_response',
        updated_at: new Date().toISOString()
      })
      .eq('id', input.disputeId)
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de la proposition: ${error.message}`);
    }

    return data;
  },

  /**
   * Répondre à une proposition de résolution
   */
  async respondToResolution(
    disputeId: string,
    userId: string,
    accepted: boolean
  ): Promise<Dispute> {
    const dispute = await this.getDispute(disputeId);

    if (!dispute) {
      throw new Error('Litige non trouvé');
    }

    const isOpener = dispute.opened_by === userId;
    const isOpponent = dispute.against_user === userId;

    if (!isOpener && !isOpponent) {
      throw new Error('Vous n\'êtes pas partie prenante de ce litige');
    }

    const updateData: any = {};

    if (isOpener) {
      updateData.resolution_accepted_by_opener = accepted;
    } else {
      updateData.resolution_accepted_by_opponent = accepted;
    }

    const { data: updatedDispute, error: updateError } = await supabase
      .from('disputes')
      .update(updateData)
      .eq('id', disputeId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Erreur lors de la réponse: ${updateError.message}`);
    }

    if (updatedDispute.resolution_accepted_by_opener && updatedDispute.resolution_accepted_by_opponent) {
      const { data: resolvedDispute, error: resolveError } = await supabase
        .from('disputes')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolution_final: updatedDispute.resolution_proposed
        })
        .eq('id', disputeId)
        .select()
        .single();

      if (resolveError) {
        throw new Error(`Erreur lors de la résolution: ${resolveError.message}`);
      }

      return resolvedDispute;
    }

    return updatedDispute;
  },

  /**
   * Escalader un litige
   */
  async escalateDispute(
    disputeId: string,
    escalateTo: 'ansut_arbitration' | 'external_arbitration' | 'court',
    reason: string
  ): Promise<Dispute> {
    const { data, error } = await supabase
      .from('disputes')
      .update({
        status: 'escalated',
        escalated_to: escalateTo,
        escalated_at: new Date().toISOString(),
        escalation_reason: reason
      })
      .eq('id', disputeId)
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de l'escalade: ${error.message}`);
    }

    return data;
  },

  /**
   * Récupérer les messages d'un litige
   */
  async getDisputeMessages(disputeId: string): Promise<DisputeMessage[]> {
    const { data, error } = await supabase
      .from('dispute_messages')
      .select(`
        *,
        profiles!dispute_messages_sender_id_fkey (
          id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('dispute_id', disputeId)
      .order('sent_at', { ascending: true });

    if (error) {
      throw new Error(`Erreur lors de la récupération des messages: ${error.message}`);
    }

    return data || [];
  },

  /**
   * Envoyer un message dans un litige
   */
  async sendDisputeMessage(input: DisputeMessageInput): Promise<DisputeMessage> {
    const { data, error } = await supabase
      .from('dispute_messages')
      .insert({
        dispute_id: input.disputeId,
        sender_id: input.senderId,
        message: input.message,
        attachments: input.attachments || []
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de l'envoi du message: ${error.message}`);
    }

    return data;
  }
};

/**
 * Service de gestion de la file de modération
 */
export const moderationService = {
  /**
   * Ajouter une annonce à la file de modération
   */
  async addToModerationQueue(
    propertyId: string,
    suspicionScore: number,
    suspicionReasons: string[]
  ): Promise<void> {
    const { error } = await supabase
      .from('moderation_queue')
      .insert({
        property_id: propertyId,
        suspicion_score: suspicionScore,
        suspicion_reasons: suspicionReasons,
        status: 'pending'
      });

    if (error) {
      throw new Error(`Erreur lors de l'ajout à la modération: ${error.message}`);
    }
  },

  /**
   * Récupérer la file de modération
   */
  async getModerationQueue(filters?: {
    status?: string;
    minSuspicionScore?: number;
  }): Promise<any[]> {
    let query = supabase
      .from('moderation_queue')
      .select(`
        *,
        properties (
          *,
          profiles (
            id,
            first_name,
            last_name,
            email,
            trust_verified
          )
        )
      `)
      .order('suspicion_score', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.minSuspicionScore) {
      query = query.gte('suspicion_score', filters.minSuspicionScore);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Erreur lors de la récupération: ${error.message}`);
    }

    return data || [];
  },

  /**
   * Modérer une annonce
   */
  async moderateProperty(
    queueId: string,
    status: 'approved' | 'rejected' | 'clarification_requested',
    notes?: string
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Non authentifié');
    }

    const { data: agent } = await supabase
      .from('trust_agents')
      .select('id')
      .eq('user_id', user.id)
      .single();

    const { error } = await supabase
      .from('moderation_queue')
      .update({
        status,
        moderator_id: agent?.id,
        moderator_notes: notes,
        moderated_at: new Date().toISOString()
      })
      .eq('id', queueId);

    if (error) {
      throw new Error(`Erreur lors de la modération: ${error.message}`);
    }

    if (status === 'approved' && agent) {
      await supabase
        .from('trust_agents')
        .update({
          total_moderations: supabase.rpc('increment', { row_id: agent.id, increment_by: 1 })
        })
        .eq('id', agent.id);
    }
  }
};
