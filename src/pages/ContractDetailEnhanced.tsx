import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ArrowLeft, FileText, Send, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ContractPreview from '../components/ContractPreview';
import ContractAnnexes from '../components/ContractAnnexes';

interface Contract {
  id: string;
  contract_number: string;
  property_id: string;
  owner_id: string;
  tenant_id: string;
  contract_type: string;
  status: string;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  deposit_amount: number;
  charges_amount: number;
  payment_day: number;
  custom_clauses: string | null;
  owner_signed_at: string | null;
  tenant_signed_at: string | null;
  created_at: string;
}

interface Property {
  title: string;
  address: string;
  city: string;
  property_type: string;
  surface_area: number;
  bedrooms: number;
  bathrooms: number;
  description: string | null;
}

interface Profile {
  full_name: string;
  email: string;
  phone: string;
  address: string | null;
  profession: string | null;
}

export default function ContractDetailEnhanced() {
  const { user } = useAuth();
  const [contract, setContract] = useState<Contract | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [owner, setOwner] = useState<Profile | null>(null);
  const [tenant, setTenant] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingForSignature, setSendingForSignature] = useState(false);

  const contractId = window.location.pathname.split('/')[2];

  useEffect(() => {
    if (user && contractId) {
      loadContractData();
    }
  }, [user, contractId]);

  const loadContractData = async () => {
    try {
      const { data: contractData, error: contractError } = await supabase
        .from('lease_contracts')
        .select('*')
        .eq('id', contractId)
        .single();

      if (contractError) throw contractError;
      setContract(contractData);

      const [propertyRes, ownerRes, tenantRes] = await Promise.all([
        supabase
          .from('properties')
          .select('title, address, city, property_type, surface_area, bedrooms, bathrooms, description')
          .eq('id', contractData.property_id)
          .single(),
        supabase
          .from('profiles')
          .select('full_name, email, phone, address, profession')
          .eq('id', contractData.owner_id)
          .single(),
        supabase
          .from('profiles')
          .select('full_name, email, phone, address, profession')
          .eq('id', contractData.tenant_id)
          .single()
      ]);

      if (propertyRes.data) setProperty(propertyRes.data);
      if (ownerRes.data) setOwner(ownerRes.data);
      if (tenantRes.data) setTenant(tenantRes.data);
    } catch (error) {
      console.error('Error loading contract data:', error);
      alert('Erreur lors du chargement du contrat');
    } finally {
      setLoading(false);
    }
  };

  const sendForSignature = async () => {
    if (!contract) return;

    if (contract.status !== 'brouillon') {
      alert('Ce contrat a déjà été envoyé pour signature');
      return;
    }

    if (window.confirm('Envoyer ce contrat pour signature électronique? Les deux parties recevront un email de notification.')) {
      setSendingForSignature(true);
      try {
        const { error } = await supabase
          .from('lease_contracts')
          .update({ status: 'en_attente_signature' })
          .eq('id', contract.id);

        if (error) throw error;

        alert('✅ Contrat envoyé pour signature! Les parties recevront un email avec les instructions.');
        window.location.reload();
      } catch (error) {
        console.error('Error sending for signature:', error);
        alert('Erreur lors de l\'envoi du contrat');
      } finally {
        setSendingForSignature(false);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { label: string; color: string; icon: any } } = {
      'brouillon': { label: 'Brouillon', color: 'bg-gray-100 text-gray-800', icon: FileText },
      'en_attente_signature': { label: 'En attente de signature', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'partiellement_signe': { label: 'Partiellement signé', color: 'bg-blue-100 text-blue-800', icon: Clock },
      'actif': { label: 'Actif', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'expire': { label: 'Expiré', color: 'bg-red-100 text-red-800', icon: AlertCircle },
      'resilie': { label: 'Résilié', color: 'bg-red-100 text-red-800', icon: AlertCircle }
    };

    const config = statusConfig[status] || statusConfig['brouillon'];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="w-4 h-4" />
        <span>{config.label}</span>
      </span>
    );
  };

  if (!user) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Veuillez vous connecter</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
        <Footer />
      </>
    );
  }

  if (!contract || !property || !owner || !tenant) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Contrat non trouvé</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const isOwner = user.id === contract.owner_id;
  const isTenant = user.id === contract.tenant_id;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-20 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => window.history.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour</span>
          </button>

          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="w-8 h-8 text-orange-500" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Contrat de Bail - {contract.contract_number}
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Créé le {new Date(contract.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
              {getStatusBadge(contract.status)}
            </div>

            {contract.status === 'brouillon' && isOwner && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 mb-2">Prêt à envoyer?</h3>
                    <p className="text-sm text-blue-800">
                      Une fois que vous avez vérifié le contrat et téléchargé tous les documents obligatoires,
                      vous pouvez l'envoyer pour signature électronique.
                    </p>
                  </div>
                  <button
                    onClick={sendForSignature}
                    disabled={sendingForSignature}
                    className="ml-4 flex items-center space-x-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                    <span>{sendingForSignature ? 'Envoi...' : 'Envoyer pour signature'}</span>
                  </button>
                </div>
              </div>
            )}

            {contract.owner_signed_at && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 text-green-800">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    Signé par le propriétaire le {new Date(contract.owner_signed_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            )}

            {contract.tenant_signed_at && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 text-green-800">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    Signé par le locataire le {new Date(contract.tenant_signed_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <ContractPreview
              contractData={{
                id: contract.id,
                contract_number: contract.contract_number,
                property: {
                  title: property.title,
                  address: property.address,
                  city: property.city,
                  property_type: property.property_type,
                  surface_area: property.surface_area,
                  bedrooms: property.bedrooms,
                  bathrooms: property.bathrooms,
                  description: property.description || undefined
                },
                owner: {
                  full_name: owner.full_name,
                  email: owner.email,
                  phone: owner.phone,
                  address: owner.address || undefined
                },
                tenant: {
                  full_name: tenant.full_name,
                  email: tenant.email,
                  phone: tenant.phone,
                  address: tenant.address || undefined,
                  profession: tenant.profession || undefined
                },
                monthly_rent: contract.monthly_rent,
                deposit_amount: contract.deposit_amount,
                charges_amount: contract.charges_amount,
                start_date: contract.start_date,
                end_date: contract.end_date,
                payment_day: contract.payment_day,
                custom_clauses: contract.custom_clauses || undefined
              }}
            />

            {isOwner && (
              <ContractAnnexes
                contractId={contract.id}
                onUploadComplete={() => loadContractData()}
              />
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
