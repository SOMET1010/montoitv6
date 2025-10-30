import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { contractService } from '../services/contractService';
import {
  FileText, Download, Eye, CheckCircle, Clock, AlertCircle,
  FileSignature, Search, Filter, Calendar, MapPin
} from 'lucide-react';
import SignatureStatusBadge from '../components/SignatureStatusBadge';

interface Contract {
  id: string;
  property_id: string;
  landlord_id: string;
  tenant_id: string;
  monthly_rent: number;
  start_date: string;
  end_date: string;
  status: string;
  pdf_document_url: string | null;
  signed_pdf_url: string | null;
  tenant_signed_at: string | null;
  landlord_signed_at: string | null;
  created_at: string;
  property: {
    title: string;
    address: string;
    city: string;
  };
  landlord: {
    full_name: string;
  };
  tenant: {
    full_name: string;
  };
}

export default function ContractsList() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'signed'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      loadContracts();
    }
  }, [user, filter]);

  const loadContracts = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('leases')
        .select(`
          *,
          property:properties(title, address, city),
          landlord:profiles!leases_landlord_id_fkey(full_name),
          tenant:profiles!leases_tenant_id_fkey(full_name)
        `)
        .or(`landlord_id.eq.${user.id},tenant_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (filter === 'pending') {
        query = query.or('tenant_signed_at.is.null,landlord_signed_at.is.null');
      } else if (filter === 'signed') {
        query = query.not('tenant_signed_at', 'is', null).not('landlord_signed_at', 'is', null);
      }

      const { data, error } = await query;

      if (error) throw error;

      setContracts(data || []);
    } catch (err) {
      console.error('Error loading contracts:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSignatureStatus = (contract: Contract) => {
    const isTenantSigned = !!contract.tenant_signed_at;
    const isLandlordSigned = !!contract.landlord_signed_at;

    if (isTenantSigned && isLandlordSigned) return 'fully_signed';
    if (isTenantSigned) return 'tenant_signed';
    if (isLandlordSigned) return 'landlord_signed';
    return 'pending';
  };

  const handleDownload = async (contract: Contract) => {
    try {
      const url = contract.signed_pdf_url || contract.pdf_document_url;
      if (!url) {
        alert('Aucun document disponible');
        return;
      }

      const response = await fetch(url);
      const blob = await response.blob();
      contractService.downloadContract(blob, `contrat-${contract.id}.pdf`);
    } catch (err) {
      console.error('Error downloading contract:', err);
      alert('Erreur lors du téléchargement');
    }
  };

  const filteredContracts = contracts.filter(contract => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      contract.property?.title.toLowerCase().includes(search) ||
      contract.property?.city.toLowerCase().includes(search) ||
      contract.landlord?.full_name.toLowerCase().includes(search) ||
      contract.tenant?.full_name.toLowerCase().includes(search)
    );
  });

  const isTenant = (contract: Contract) => contract.tenant_id === user?.id;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-olive-50 to-amber-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-olive-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-olive-50 to-amber-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center space-x-3">
            <FileText className="w-10 h-10 text-terracotta-600" />
            <span>Mes Contrats</span>
          </h1>
          <p className="text-xl text-gray-600">
            Gérez vos baux et signatures électroniques
          </p>
        </div>

        <div className="card-scrapbook p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par propriété, ville, nom..."
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-olive-200 focus:border-olive-500"
              />
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-3 rounded-xl font-bold transition-all ${
                  filter === 'all'
                    ? 'bg-olive-600 text-white'
                    : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-olive-300'
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-3 rounded-xl font-bold transition-all flex items-center space-x-2 ${
                  filter === 'pending'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-yellow-300'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>En attente</span>
              </button>
              <button
                onClick={() => setFilter('signed')}
                className={`px-4 py-3 rounded-xl font-bold transition-all flex items-center space-x-2 ${
                  filter === 'signed'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-green-300'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span>Signés</span>
              </button>
            </div>
          </div>
        </div>

        {filteredContracts.length === 0 ? (
          <div className="card-scrapbook p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Aucun contrat trouvé</h3>
            <p className="text-gray-600">
              {filter !== 'all'
                ? 'Essayez de changer le filtre'
                : 'Vos contrats apparaîtront ici'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredContracts.map((contract) => (
              <div key={contract.id} className="card-scrapbook p-6 hover:shadow-xl transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {contract.property?.title}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{contract.property?.address}, {contract.property?.city}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(contract.start_date).toLocaleDateString('fr-FR')}</span>
                          </span>
                        </div>
                      </div>
                      <SignatureStatusBadge
                        status={getSignatureStatus(contract)}
                        isTenant={isTenant(contract)}
                        compact
                      />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">Loyer mensuel</p>
                        <p className="text-lg font-bold text-gray-900">
                          {contract.monthly_rent.toLocaleString('fr-FR')} FCFA
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">
                          {isTenant(contract) ? 'Propriétaire' : 'Locataire'}
                        </p>
                        <p className="text-sm font-bold text-gray-900">
                          {isTenant(contract)
                            ? contract.landlord?.full_name
                            : contract.tenant?.full_name}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">Statut</p>
                        <p className="text-sm font-bold text-gray-900">
                          {contract.status === 'actif' ? 'Actif' :
                           contract.status === 'en_attente_signature' ? 'En attente' :
                           contract.status}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">Créé le</p>
                        <p className="text-sm font-bold text-gray-900">
                          {new Date(contract.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {contract.tenant_signed_at && (
                        <div className="flex items-center space-x-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                          <CheckCircle className="w-3 h-3" />
                          <span>Locataire: {new Date(contract.tenant_signed_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                      )}
                      {contract.landlord_signed_at && (
                        <div className="flex items-center space-x-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                          <CheckCircle className="w-3 h-3" />
                          <span>Propriétaire: {new Date(contract.landlord_signed_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 lg:w-48">
                    {!contract.tenant_signed_at && isTenant(contract) && (
                      <a
                        href={`/bail/signer/${contract.id}`}
                        className="btn-primary py-3 flex items-center justify-center space-x-2"
                      >
                        <FileSignature className="w-4 h-4" />
                        <span>Signer</span>
                      </a>
                    )}
                    {!contract.landlord_signed_at && !isTenant(contract) && (
                      <a
                        href={`/bail/signer/${contract.id}`}
                        className="btn-primary py-3 flex items-center justify-center space-x-2"
                      >
                        <FileSignature className="w-4 h-4" />
                        <span>Signer</span>
                      </a>
                    )}
                    <a
                      href={`/bail/${contract.id}`}
                      className="btn-secondary py-3 flex items-center justify-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Voir</span>
                    </a>
                    {(contract.pdf_document_url || contract.signed_pdf_url) && (
                      <button
                        onClick={() => handleDownload(contract)}
                        className="btn-secondary py-3 flex items-center justify-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>PDF</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
