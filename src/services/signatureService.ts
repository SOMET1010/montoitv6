import { supabase } from '../lib/supabase';

interface CertificateRequest {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
}

interface OTPVerification {
  userId: string;
  leaseId: string;
  otpCode: string;
}

interface DocumentSignature {
  userId: string;
  leaseId: string;
  documentUrl: string;
}

export const signatureService = {
  async requestCertificate(data: CertificateRequest) {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cryptoneo-signature`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          action: 'request_certificate',
          userId: data.userId,
          fullName: data.fullName,
          email: data.email,
          phoneNumber: data.phoneNumber
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la demande de certificat');
    }

    return await response.json();
  },

  async verifyOTP(data: OTPVerification) {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cryptoneo-signature`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          action: 'verify_otp',
          userId: data.userId,
          leaseId: data.leaseId,
          otpCode: data.otpCode
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Code OTP invalide');
    }

    return await response.json();
  },

  async signDocument(data: DocumentSignature) {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cryptoneo-signature`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          action: 'sign_document',
          userId: data.userId,
          leaseId: data.leaseId,
          documentUrl: data.documentUrl
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la signature');
    }

    return await response.json();
  },

  async getUserCertificates(userId: string) {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cryptoneo-signature`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          action: 'get_certificate',
          userId
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la récupération des certificats');
    }

    return await response.json();
  },

  async getSignatureHistory(leaseId: string) {
    const { data, error } = await supabase
      .from('signature_history')
      .select('*')
      .eq('lease_id', leaseId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data;
  },

  async checkCertificateStatus(userId: string) {
    const { data, error } = await supabase
      .from('digital_certificates')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    return {
      hasCertificate: !!data,
      certificate: data
    };
  },

  async verifySignature(leaseId: string) {
    const { data: lease, error } = await supabase
      .from('leases')
      .select(`
        *,
        tenant_history:signature_history!signature_history_lease_id_fkey(*)
      `)
      .eq('id', leaseId)
      .single();

    if (error) throw error;

    const isTenantSigned = !!lease.tenant_signed_at;
    const isLandlordSigned = !!lease.landlord_signed_at;
    const isFullySigned = isTenantSigned && isLandlordSigned;

    return {
      isValid: isFullySigned,
      isTenantSigned,
      isLandlordSigned,
      signedPdfUrl: lease.signed_pdf_url,
      signatureTimestamp: lease.signature_timestamp,
      lease
    };
  }
};
