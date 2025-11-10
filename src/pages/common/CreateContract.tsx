import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, FileText, Calendar, DollarSign } from 'lucide-react';
import Header from '../../components/ui/Header';
import Footer from '../../components/ui/Footer';

interface Property {
  id: string;
  title: string;
  address: string;
  city: string;
  property_type: string;
  surface_area: number;
  bedrooms: number;
  bathrooms: number;
  monthly_rent: number;
  deposit_amount: number;
  charges_amount: number;
}

interface Template {
  id: string;
  name: string;
  description: string;
  contract_type: string;
}

interface Tenant {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  address?: string;
  profession?: string;
  ansut_verified?: boolean;
}

interface ValidationError {
  field: string;
  message: string;
}

export default function CreateContract() {
  const { user } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchingTenant, setSearchingTenant] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState({
    template_id: '',
    tenant_id: '',
    contract_type: 'longue_duree' as 'courte_duree' | 'longue_duree' | 'meuble' | 'professionnel',
    start_date: '',
    end_date: '',
    monthly_rent: '',
    deposit_amount: '',
    charges_amount: '0',
    payment_day: '1',
    custom_clauses: ''
  });

  const propertyId = window.location.pathname.split('/').pop();

  useEffect(() => {
    if (user && propertyId) {
      loadData();
    }
  }, [user, propertyId]);

  const loadData = async () => {
    try {
      const [propertyRes, templatesRes] = await Promise.all([
        supabase
          .from('properties')
          .select('*')
          .eq('id', propertyId)
          .eq('owner_id', user?.id)
          .single(),
        supabase
          .from('contract_templates')
          .select('id, name, description, contract_type')
          .eq('is_active', true)
      ]);

      if (propertyRes.error) throw propertyRes.error;
      if (templatesRes.error) throw templatesRes.error;

      setProperty(propertyRes.data);
      setTemplates(templatesRes.data || []);

      setFormData(prev => ({
        ...prev,
        monthly_rent: propertyRes.data.monthly_rent.toString(),
        deposit_amount: propertyRes.data.deposit_amount.toString(),
        charges_amount: propertyRes.data.charges_amount.toString()
      }));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchTenant = async () => {
    if (!searchEmail.trim()) return;

    setSearchingTenant(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, address, profession')
        .eq('email', searchEmail.trim().toLowerCase())
        .eq('user_type', 'locataire')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const { data: verification } = await supabase
          .from('user_verifications')
          .select('ansut_verified')
          .eq('user_id', data.id)
          .maybeSingle();

        const tenantData = {
          ...data,
          ansut_verified: verification?.ansut_verified || false
        };

        setTenants([tenantData]);
        setFormData(prev => ({ ...prev, tenant_id: data.id }));

        if (!tenantData.ansut_verified) {
          alert('⚠️ Attention: Ce locataire n\'est pas certifié ANSUT. Il devra compléter sa certification avant de pouvoir signer le contrat.');
        }
      } else {
        alert('Aucun locataire trouvé avec cet email');
        setTenants([]);
      }
    } catch (error) {
      console.error('Error searching tenant:', error);
      alert('Erreur lors de la recherche du locataire');
    } finally {
      setSearchingTenant(false);
    }
  };

  const validateContract = (): boolean => {
    const errors: ValidationError[] = [];

    if (!formData.tenant_id) {
      errors.push({ field: 'tenant_id', message: 'Veuillez sélectionner un locataire' });
    }

    if (!formData.start_date) {
      errors.push({ field: 'start_date', message: 'La date de début est obligatoire' });
    }

    if (!formData.end_date) {
      errors.push({ field: 'end_date', message: 'La date de fin est obligatoire' });
    }

    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      const diffMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
                         (endDate.getMonth() - startDate.getMonth());

      if (diffMonths < 1) {
        errors.push({ field: 'end_date', message: 'La durée minimale du bail est d\'un mois' });
      }

      if (formData.contract_type === 'longue_duree' && diffMonths < 12) {
        errors.push({ field: 'end_date', message: 'Pour un bail longue durée, la durée minimale est de 12 mois' });
      }
    }

    const rent = parseFloat(formData.monthly_rent);
    if (isNaN(rent) || rent < 1000) {
      errors.push({ field: 'monthly_rent', message: 'Le loyer doit être d\'au moins 1 000 FCFA' });
    }

    const deposit = parseFloat(formData.deposit_amount);
    if (isNaN(deposit) || deposit < 0) {
      errors.push({ field: 'deposit_amount', message: 'Le dépôt de garantie doit être un montant valide' });
    }

    if (deposit > rent * 3) {
      errors.push({ field: 'deposit_amount', message: 'Le dépôt de garantie ne peut excéder 3 mois de loyer' });
    }

    const paymentDay = parseInt(formData.payment_day);
    if (isNaN(paymentDay) || paymentDay < 1 || paymentDay > 31) {
      errors.push({ field: 'payment_day', message: 'Le jour de paiement doit être entre 1 et 31' });
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const getValidationError = (field: string): string | null => {
    const error = validationErrors.find(e => e.field === field);
    return error ? error.message : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !property) return;

    if (!validateContract()) {
      alert('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    setSubmitting(true);
    try {
      const { data: contractNumber, error: numberError } = await supabase
        .rpc('generate_contract_number');

      if (numberError) throw numberError;

      const { data: newContract, error } = await supabase
        .from('lease_contracts')
        .insert({
          contract_number: contractNumber,
          property_id: property.id,
          owner_id: user.id,
          tenant_id: formData.tenant_id,
          template_id: formData.template_id || null,
          contract_type: formData.contract_type,
          start_date: formData.start_date,
          end_date: formData.end_date || null,
          monthly_rent: parseFloat(formData.monthly_rent),
          deposit_amount: parseFloat(formData.deposit_amount),
          charges_amount: parseFloat(formData.charges_amount),
          payment_day: parseInt(formData.payment_day),
          custom_clauses: formData.custom_clauses || null,
          status: 'brouillon'
        })
        .select()
        .single();

      if (error) throw error;

      alert('✅ Contrat créé avec succès! Vous pouvez maintenant prévisualiser et envoyer pour signature.');
      window.location.href = `/contrat/${newContract.id}`;
    } catch (error) {
      console.error('Error creating contract:', error);
      alert('Erreur lors de la création du contrat');
    } finally {
      setSubmitting(false);
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

  if (!property) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Propriété non trouvée</p>
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
          <button
            onClick={() => window.history.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour</span>
          </button>

          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <FileText className="w-8 h-8 text-orange-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Créer un contrat de bail</h1>
                <p className="text-gray-600">{property.title}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Rechercher le locataire par email
              </label>
              <div className="flex space-x-2">
                <input
                  type="email"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder="email@exemple.com"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={searchTenant}
                  disabled={searchingTenant || !searchEmail.trim()}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50"
                >
                  {searchingTenant ? 'Recherche...' : 'Rechercher'}
                </button>
              </div>
              {tenants.length > 0 && (
                <div className={`mt-3 p-3 rounded-lg border ${tenants[0].ansut_verified ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                  <p className={`text-sm font-semibold ${tenants[0].ansut_verified ? 'text-green-800' : 'text-yellow-800'}`}>
                    Locataire trouvé :
                    {tenants[0].ansut_verified ? ' ✓ Certifié ANSUT' : ' ⚠️ Non certifié ANSUT'}
                  </p>
                  <p className={`text-sm ${tenants[0].ansut_verified ? 'text-green-700' : 'text-yellow-700'}`}>
                    {tenants[0].full_name} - {tenants[0].email}
                  </p>
                  <p className={`text-sm ${tenants[0].ansut_verified ? 'text-green-600' : 'text-yellow-600'}`}>
                    {tenants[0].phone}
                  </p>
                  {tenants[0].address && (
                    <p className={`text-sm ${tenants[0].ansut_verified ? 'text-green-600' : 'text-yellow-600'}`}>
                      {tenants[0].address}
                    </p>
                  )}
                  {!tenants[0].ansut_verified && (
                    <p className="text-xs text-yellow-700 mt-2">
                      Le locataire devra compléter sa certification ANSUT avant de pouvoir signer le contrat.
                    </p>
                  )}
                </div>
              )}
              {getValidationError('tenant_id') && (
                <p className="mt-2 text-sm text-red-600">{getValidationError('tenant_id')}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Template de contrat
                </label>
                <select
                  value={formData.template_id}
                  onChange={(e) => setFormData({ ...formData, template_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Sélectionner un template</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Type de contrat
                </label>
                <select
                  value={formData.contract_type}
                  onChange={(e) => setFormData({ ...formData, contract_type: e.target.value as any })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="longue_duree">Longue durée</option>
                  <option value="courte_duree">Courte durée</option>
                  <option value="meuble">Meublé</option>
                  <option value="professionnel">Professionnel</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Date de début
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${getValidationError('start_date') ? 'border-red-300' : 'border-gray-300'}`}
                />
                {getValidationError('start_date') && (
                  <p className="mt-1 text-sm text-red-600">{getValidationError('start_date')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Date de fin
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  required
                  min={formData.start_date}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${getValidationError('end_date') ? 'border-red-300' : 'border-gray-300'}`}
                />
                {getValidationError('end_date') && (
                  <p className="mt-1 text-sm text-red-600">{getValidationError('end_date')}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">Durée minimale: 1 mois (12 mois pour longue durée)</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Loyer mensuel (FCFA)
                </label>
                <input
                  type="number"
                  value={formData.monthly_rent}
                  onChange={(e) => setFormData({ ...formData, monthly_rent: e.target.value })}
                  required
                  min="1000"
                  step="1000"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${getValidationError('monthly_rent') ? 'border-red-300' : 'border-gray-300'}`}
                />
                {getValidationError('monthly_rent') && (
                  <p className="mt-1 text-sm text-red-600">{getValidationError('monthly_rent')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Dépôt de garantie (FCFA)
                </label>
                <input
                  type="number"
                  value={formData.deposit_amount}
                  onChange={(e) => setFormData({ ...formData, deposit_amount: e.target.value })}
                  required
                  min="0"
                  step="1000"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${getValidationError('deposit_amount') ? 'border-red-300' : 'border-gray-300'}`}
                />
                {getValidationError('deposit_amount') && (
                  <p className="mt-1 text-sm text-red-600">{getValidationError('deposit_amount')}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">Maximum: 3 mois de loyer</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Charges mensuelles (FCFA)
                </label>
                <input
                  type="number"
                  value={formData.charges_amount}
                  onChange={(e) => setFormData({ ...formData, charges_amount: e.target.value })}
                  min="0"
                  step="1000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Jour de paiement du mois
                </label>
                <input
                  type="number"
                  value={formData.payment_day}
                  onChange={(e) => setFormData({ ...formData, payment_day: e.target.value })}
                  required
                  min="1"
                  max="31"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Clauses personnalisées (optionnel)
              </label>
              <textarea
                value={formData.custom_clauses}
                onChange={(e) => setFormData({ ...formData, custom_clauses: e.target.value })}
                rows={6}
                placeholder="Ajoutez des clauses spécifiques à ce contrat..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={!formData.tenant_id || submitting}
                className="px-8 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Création...' : 'Créer le contrat'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}
