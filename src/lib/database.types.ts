export type UserType = 'locataire' | 'proprietaire' | 'agence' | 'admin_ansut';
export type UserRole = 'admin' | 'user' | 'agent' | 'moderator';
export type PropertyType = 'appartement' | 'villa' | 'studio' | 'chambre' | 'bureau' | 'commerce';
export type PropertyStatus = 'disponible' | 'loue' | 'en_attente' | 'retire';
export type ApplicationStatus = 'en_attente' | 'acceptee' | 'refusee' | 'annulee';
export type VerificationStatus = 'en_attente' | 'verifie' | 'rejete';
export type PaymentStatus = 'en_attente' | 'complete' | 'echoue' | 'annule';
export type PaymentType = 'loyer' | 'depot_garantie' | 'charges' | 'frais_agence';
export type PaymentMethod = 'mobile_money' | 'carte_bancaire' | 'virement' | 'especes';
export type LeaseStatus = 'brouillon' | 'en_attente_signature' | 'actif' | 'expire' | 'resilie';
export type LeaseType = 'courte_duree' | 'longue_duree';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_type: UserType;
          active_role: UserType | null;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          bio: string | null;
          city: string | null;
          address: string | null;
          is_verified: boolean;
          oneci_verified: boolean;
          cnam_verified: boolean;
          face_verified: boolean;
          face_verified_at: string | null;
          ansut_certified: boolean;
          profile_setup_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_type?: UserType;
          active_role?: UserType | null;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          city?: string | null;
          address?: string | null;
          is_verified?: boolean;
          oneci_verified?: boolean;
          cnam_verified?: boolean;
          face_verified?: boolean;
          face_verified_at?: string | null;
          ansut_certified?: boolean;
          profile_setup_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_type?: UserType;
          active_role?: UserType | null;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          city?: string | null;
          address?: string | null;
          is_verified?: boolean;
          oneci_verified?: boolean;
          cnam_verified?: boolean;
          face_verified?: boolean;
          face_verified_at?: string | null;
          ansut_certified?: boolean;
          profile_setup_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      properties: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          description: string | null;
          address: string;
          city: string;
          neighborhood: string | null;
          latitude: number | null;
          longitude: number | null;
          property_type: PropertyType;
          status: PropertyStatus;
          bedrooms: number;
          bathrooms: number;
          surface_area: number | null;
          has_parking: boolean;
          has_garden: boolean;
          is_furnished: boolean;
          has_ac: boolean;
          monthly_rent: number;
          deposit_amount: number | null;
          charges_amount: number;
          images: string[];
          main_image: string | null;
          view_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title: string;
          description?: string | null;
          address: string;
          city: string;
          neighborhood?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          property_type: PropertyType;
          status?: PropertyStatus;
          bedrooms?: number;
          bathrooms?: number;
          surface_area?: number | null;
          has_parking?: boolean;
          has_garden?: boolean;
          is_furnished?: boolean;
          has_ac?: boolean;
          monthly_rent: number;
          deposit_amount?: number | null;
          charges_amount?: number;
          images?: string[];
          main_image?: string | null;
          view_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          title?: string;
          description?: string | null;
          address?: string;
          city?: string;
          neighborhood?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          property_type?: PropertyType;
          status?: PropertyStatus;
          bedrooms?: number;
          bathrooms?: number;
          surface_area?: number | null;
          has_parking?: boolean;
          has_garden?: boolean;
          is_furnished?: boolean;
          has_ac?: boolean;
          monthly_rent?: number;
          deposit_amount?: number | null;
          charges_amount?: number;
          images?: string[];
          main_image?: string | null;
          view_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      rental_applications: {
        Row: {
          id: string;
          property_id: string;
          applicant_id: string;
          status: ApplicationStatus;
          cover_letter: string | null;
          application_score: number;
          documents: string[];
          created_at: string;
          updated_at: string;
        };
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          application_id: string | null;
          content: string;
          is_read: boolean;
          created_at: string;
        };
      };
      user_verifications: {
        Row: {
          id: string;
          user_id: string;
          oneci_status: VerificationStatus;
          cnam_status: VerificationStatus;
          tenant_score: number;
          profile_completeness_score: number;
          rental_history_score: number;
          payment_reliability_score: number;
          last_score_update: string;
          created_at: string;
          updated_at: string;
        };
      };
      score_history: {
        Row: {
          id: string;
          user_id: string;
          score_type: string;
          old_score: number;
          new_score: number;
          change_reason: string | null;
          metadata: Record<string, any>;
          created_at: string;
        };
      };
      score_settings: {
        Row: {
          id: string;
          setting_key: string;
          setting_value: Record<string, any>;
          description: string | null;
          updated_at: string;
        };
      };
      rental_history: {
        Row: {
          id: string;
          tenant_id: string;
          landlord_id: string;
          property_id: string | null;
          lease_id: string | null;
          start_date: string;
          end_date: string | null;
          monthly_rent: number;
          payment_reliability_score: number;
          property_condition_score: number;
          lease_compliance_score: number;
          landlord_notes: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      owner_ratings: {
        Row: {
          id: string;
          owner_id: string;
          overall_rating: number;
          response_time_score: number;
          contract_completion_rate: number;
          tenant_satisfaction_score: number;
          total_properties: number;
          total_rentals: number;
          updated_at: string;
        };
      };
      score_achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_type: string;
          achievement_name: string;
          achievement_description: string | null;
          icon: string;
          achieved_at: string;
        };
      };
    };
  };
}
