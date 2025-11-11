import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, FileText, Download, Edit, CheckCircle, X } from 'lucide-react';
import Breadcrumb from '../../components/Breadcrumb';

interface Contract {
  id: string;
  contract_number: string;
  property_id: string;
  owner_id: string;
  tenant_id: string;
  contract_type: string;
  status: string;
  start_date: string;
  end_date: string | null;
  monthly_rent: number;
  deposit_amount: number;
  charges_amount: number;
  payment_day: number;
  contract_content: string | null;
  custom_clauses: string | null;
  owner_signed_at: string | null;
  owner_signature: string | null;
  tenant_signed_at: string | null;
  tenant_signature: string | null;
  created_at: string;
  property: {
    title: string;
    address: string;
    city: string;
    property_type: string;
    surface_area: number;
    bedrooms: number;
    bathrooms: number;
  };
  owner: {
    full_name: string;
    email: string;
    phone: string;
  };
  tenant: {
    full_name: string;
    email: string;
    phone: string;
  };
}

export default function ContractDetail() {
  const { user } = useAuth();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSignature, setShowSignature] = useState(false);
  const [signing, setSigning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const contractId = window.location.pathname.split('/')[2];

  useEffect(() => {
    if (user && contractId) {
      loadContract();
    }
  }, [user, contractId]);

  const loadContract = async () => {
    try {
      const { data, error } = await supabase
        .from('lease_contracts')
        .select(`
          *,
          properties!inner(title, address, city, property_type, surface_area, bedrooms, bathrooms),
          owner:profiles!lease_contracts_owner_id_fkey(full_name, email, phone),
          tenant:profiles!lease_contracts_tenant_id_fkey(full_name, email, phone)
        `)
        .eq('id', contractId)
        .single();

      if (error) throw error;

      if (!data || (data.owner_id !== user?.id && data.tenant_id !== user?.id)) {
        alert('Vous n\'avez pas accès à ce contrat');
        window.location.href = '/mes-contrats';
        return;
      }

      const formattedContract = {
        ...data,
        property: data.properties,
        owner: data.owner,
        tenant: data.tenant
      };

      setContract(formattedContract);
      generateContractContent(formattedContract);
    } catch (error) {
      console.error('Error loading contract:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateContractContent = (contract: Contract) => {
    if (contract.contract_content) return;

    const content = `
# CONTRAT DE BAIL

**N° ${contract.contract_number}**

Entre les soussignés :

**LE BAILLEUR**
${contract.owner.full_name}
Email : ${contract.owner.email}
Téléphone : ${contract.owner.phone}

**LE LOCATAIRE**
${contract.tenant.full_name}
Email : ${contract.tenant.email}
Téléphone : ${contract.tenant.phone}

## OBJET DU CONTRAT

Le bailleur loue au locataire le bien suivant :

**Adresse :** ${contract.property.address}, ${contract.property.city}
**Type :** ${contract.property.property_type}
**Superficie :** ${contract.property.surface_area}m²
**Chambres :** ${contract.property.bedrooms}
**Salles de bain :** ${contract.property.bathrooms}

## DURÉE DU BAIL

Date de début : ${new Date(contract.start_date).toLocaleDateString('fr-FR')}
${contract.end_date ? `Date de fin : ${new Date(contract.end_date).toLocaleDateString('fr-FR')}` : 'Durée indéterminée'}

## CONDITIONS FINANCIÈRES

- Loyer mensuel : ${contract.monthly_rent.toLocaleString()} FCFA
- Charges mensuelles : ${contract.charges_amount.toLocaleString()} FCFA
- Dépôt de garantie : ${contract.deposit_amount.toLocaleString()} FCFA
- Jour de paiement : Le ${contract.payment_day} de chaque mois

## OBLIGATIONS DU LOCATAIRE

Le locataire s'engage à :
- Payer le loyer aux dates convenues
- Entretenir le logement en bon état
- Ne pas sous-louer sans autorisation écrite du bailleur
- Informer le bailleur de toute dégradation

## OBLIGATIONS DU BAILLEUR

Le bailleur s'engage à :
- Délivrer un logement décent et en bon état
- Assurer les réparations nécessaires
- Garantir la jouissance paisible du bien

${contract.custom_clauses ? `\n## CLAUSES PARTICULIÈRES\n\n${contract.custom_clauses}` : ''}

---

Fait à ${contract.property.city}, le ${new Date(contract.created_at).toLocaleDateString('fr-FR')}
    `.trim();

    setContract(prev => prev ? { ...prev, contract_content: content } : null);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const signContract = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !contract) return;

    const signatureData = canvas.toDataURL('image/png');

    setSigning(true);
    try {
      const isOwner = contract.owner_id === user?.id;
      const updateData = isOwner
        ? {
            owner_signed_at: new Date().toISOString(),
            owner_signature: signatureData
          }
        : {
            tenant_signed_at: new Date().toISOString(),
            tenant_signature: signatureData
          };

      const { error } = await supabase
        .from('lease_contracts')
        .update(updateData)
        .eq('id', contract.id);

      if (error) throw error;

      alert('Contrat signé avec succès !');
      loadContract();
      setShowSignature(false);
    } catch (error) {
      console.error('Error signing contract:', error);
      alert('Erreur lors de la signature du contrat');
    } finally {
      setSigning(false);
    }
  };

  const isOwner = () => contract?.owner_id === user?.id;
  const canSign = () => {
    if (!contract) return false;
    if (isOwner()) {
      return !contract.owner_signed_at;
    } else {
      return !contract.tenant_signed_at;
    }
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

  if (!contract) {
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

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumb
            items={[
              { label: 'Mes Contrats', href: '/mes-contrats' },
              { label: `Contrat ${contract.contract_number}` }
            ]}
          />
          <button
            onClick={() => window.history.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 focus:outline-none focus:ring-2 focus:ring-terracotta-500 focus:ring-offset-2 rounded px-2 py-1"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour</span>
          </button>

          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="w-8 h-8 text-orange-500" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Contrat {contract.contract_number}
                  </h1>
                  <p className="text-gray-600">{contract.property.title}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {canSign() && (
                  <button
                    onClick={() => setShowSignature(true)}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center space-x-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Signer</span>
                  </button>
                )}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                {contract.owner_signed_at ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-gray-700">
                      Propriétaire signé le {new Date(contract.owner_signed_at).toLocaleDateString('fr-FR')}
                    </span>
                  </>
                ) : (
                  <>
                    <X className="w-5 h-5 text-red-600" />
                    <span className="text-sm text-gray-700">Propriétaire non signé</span>
                  </>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {contract.tenant_signed_at ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-gray-700">
                      Locataire signé le {new Date(contract.tenant_signed_at).toLocaleDateString('fr-FR')}
                    </span>
                  </>
                ) : (
                  <>
                    <X className="w-5 h-5 text-red-600" />
                    <span className="text-sm text-gray-700">Locataire non signé</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{
                __html: (contract.contract_content || '')
                  .split('\n')
                  .map(line => {
                    if (line.startsWith('# ')) return `<h1 class="text-3xl font-bold mb-4">${line.slice(2)}</h1>`;
                    if (line.startsWith('## ')) return `<h2 class="text-2xl font-bold mt-8 mb-4">${line.slice(3)}</h2>`;
                    if (line.startsWith('**') && line.endsWith('**')) return `<p class="font-bold text-lg mb-2">${line.slice(2, -2)}</p>`;
                    if (line.startsWith('- ')) return `<li class="ml-6">${line.slice(2)}</li>`;
                    if (line.startsWith('---')) return '<hr class="my-8 border-gray-300" />';
                    if (line.trim() === '') return '<br />';
                    return `<p class="mb-2">${line}</p>`;
                  })
                  .join('')
              }}
            />

            {contract.owner_signature && (
              <div className="mt-8 border-t pt-6">
                <p className="text-sm font-semibold text-gray-700 mb-2">Signature du propriétaire :</p>
                <img src={contract.owner_signature} alt="Signature propriétaire" className="h-24 border border-gray-300 rounded" />
              </div>
            )}

            {contract.tenant_signature && (
              <div className="mt-8 border-t pt-6">
                <p className="text-sm font-semibold text-gray-700 mb-2">Signature du locataire :</p>
                <img src={contract.tenant_signature} alt="Signature locataire" className="h-24 border border-gray-300 rounded" />
              </div>
            )}
          </div>
        </div>
      </div>

      {showSignature && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Signer le contrat</h3>
              <button
                onClick={() => setShowSignature(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Dessinez votre signature dans le cadre ci-dessous
            </p>

            <div className="border-2 border-gray-300 rounded-lg mb-4">
              <canvas
                ref={canvasRef}
                width={600}
                height={200}
                className="w-full cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                style={{ touchAction: 'none' }}
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={clearSignature}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Effacer
              </button>
              <button
                onClick={signContract}
                disabled={signing}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50"
              >
                {signing ? 'Signature...' : 'Confirmer la signature'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
