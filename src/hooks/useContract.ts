import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Lease {
  id: string;
  property_id: string;
  landlord_id: string;
  tenant_id: string;
  monthly_rent: number;
  deposit_amount: number;
  charges_amount: number;
  start_date: string;
  end_date: string;
  status: string;
  pdf_document_url: string;
  signed_pdf_url: string;
  tenant_signed_at: string | null;
  landlord_signed_at: string | null;
  tenant_otp_verified_at: string | null;
  landlord_otp_verified_at: string | null;
  custom_clauses: string | null;
  payment_day: number;
}

interface Property {
  title: string;
  address: string;
  city: string;
}

interface UserProfile {
  full_name: string;
  email: string;
  phone: string;
  ansut_certified: boolean;
}

interface ContractData {
  lease: Lease | null;
  property: Property | null;
  landlordProfile: UserProfile | null;
  tenantProfile: UserProfile | null;
}

export function useContract(leaseId: string | undefined, userId: string | undefined) {
  const [data, setData] = useState<ContractData>({
    lease: null,
    property: null,
    landlordProfile: null,
    tenantProfile: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadContractData = async () => {
    if (!leaseId || !userId) return;

    try {
      const { data: leaseData, error: leaseError } = await supabase
        .from('leases')
        .select('*')
        .eq('id', leaseId)
        .single();

      if (leaseError) throw leaseError;

      if (leaseData.landlord_id !== userId && leaseData.tenant_id !== userId) {
        setError('Vous n\'êtes pas autorisé à accéder à ce bail');
        setLoading(false);
        return;
      }

      const { data: propertyData } = await supabase
        .from('properties')
        .select('title, address, city')
        .eq('id', leaseData.property_id)
        .single();

      const { data: landlordData } = await supabase
        .from('profiles')
        .select('full_name, email, phone, ansut_certified')
        .eq('id', leaseData.landlord_id)
        .single();

      const { data: tenantData } = await supabase
        .from('profiles')
        .select('full_name, email, phone, ansut_certified')
        .eq('id', leaseData.tenant_id)
        .single();

      setData({
        lease: leaseData,
        property: propertyData,
        landlordProfile: landlordData,
        tenantProfile: tenantData
      });
    } catch (err: any) {
      console.error('Error loading contract:', err);
      setError('Erreur lors du chargement du contrat');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContractData();
  }, [leaseId, userId]);

  return { ...data, loading, error, reload: loadContractData };
}
