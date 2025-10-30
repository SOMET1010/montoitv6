import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface VerificationData {
  id: string;
  user_id: string;
  oneci_status: 'en_attente' | 'verifie' | 'rejete';
  cnam_status: 'en_attente' | 'verifie' | 'rejete';
  face_verification_status: 'en_attente' | 'verifie' | 'rejete';
  oneci_document_url: string | null;
  cnam_document_url: string | null;
  selfie_image_url: string | null;
  oneci_number: string | null;
  cnam_number: string | null;
  rejection_reason: string | null;
  ansut_certified: boolean;
  created_at: string;
  updated_at: string;
}

export function useVerification(userId: string | undefined) {
  const [verification, setVerification] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadVerificationData = async () => {
    if (!userId) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('user_verifications')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      setVerification(data);
    } catch (err: any) {
      console.error('Error loading verification:', err);
      setError('Erreur lors du chargement des données de vérification');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVerificationData();
  }, [userId]);

  return { verification, loading, error, reload: loadVerificationData };
}
