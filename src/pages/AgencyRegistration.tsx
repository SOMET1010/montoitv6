import { useState } from 'react';
import { Building2, Upload, CheckCircle, AlertCircle, ArrowRight, FileText, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function AgencyRegistration() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    legal_name: '',
    registration_number: '',
    tax_id: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    city: 'Abidjan',
    description: '',
    commission_rate: '10',
  });

  const [files, setFiles] = useState<{
    rccm?: File;
    license?: File;
    tax?: File;
  }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'rccm' | 'license' | 'tax') => {
    if (e.target.files && e.target.files[0]) {
      setFiles(prev => ({
        ...prev,
        [type]: e.target.files![0]
      }));
    }
  };

  const uploadFile = async (file: File, path: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!user) {
        throw new Error('Vous devez être connecté');
      }

      let rccmUrl, licenseUrl, taxUrl;

      if (files.rccm) {
        rccmUrl = await uploadFile(files.rccm, 'agencies/rccm');
      }
      if (files.license) {
        licenseUrl = await uploadFile(files.license, 'agencies/licenses');
      }
      if (files.tax) {
        taxUrl = await uploadFile(files.tax, 'agencies/tax');
      }

      const { error: insertError } = await supabase
        .from('agencies')
        .insert([{
          owner_id: user.id,
          name: formData.name,
          legal_name: formData.legal_name,
          registration_number: formData.registration_number || null,
          tax_id: formData.tax_id || null,
          phone: formData.phone,
          email: formData.email,
          website: formData.website || null,
          address: formData.address,
          city: formData.city,
          description: formData.description || null,
          rccm_document: rccmUrl || null,
          business_license: licenseUrl || null,
          tax_certificate: taxUrl || null,
          commission_rate: parseFloat(formData.commission_rate),
          verification_status: 'pending',
        }]);

      if (insertError) throw insertError;

      setSuccess(true);
    } catch (err: any) {
      console.error('Error creating agency:', err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-coral-50 py-20">
        <div className="max-w-2xl mx-auto px-4">
          <div className="card-scrapbook p-12 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-olive-400 to-olive-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Inscription soumise avec succès !
            </h2>
            <p className="text-gray-700 text-lg mb-8 leading-relaxed">
              Votre demande d'inscription en tant qu'agence a été soumise. Notre équipe va vérifier vos documents et vous recevrez une notification par email dans les 48 heures.
            </p>
            <a href="/dashboard/owner" className="btn-primary inline-flex items-center space-x-2">
              <span>Aller au tableau de bord</span>
              <ArrowRight className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-coral-50 py-20">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-terracotta-400 to-coral-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-glow transform rotate-3">
            <Building2 className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Inscription <span className="text-gradient">Agence Immobilière</span>
          </h1>
          <p className="text-xl text-gray-600">
            Rejoignez Mon Toit en tant qu'agence certifiée
          </p>
        </div>

        {error && (
          <div className="card-scrapbook p-6 mb-8 bg-red-50 border-red-200">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="card-scrapbook p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
              <Building2 className="h-6 w-6 text-terracotta-600" />
              <span>Informations de l'agence</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Nom commercial *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-terracotta-200 focus:border-terracotta-500"
                  placeholder="Agence Mon Toit"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Raison sociale *
                </label>
                <input
                  type="text"
                  name="legal_name"
                  value={formData.legal_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-terracotta-200 focus:border-terracotta-500"
                  placeholder="MON TOIT SARL"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Numéro RCCM
                </label>
                <input
                  type="text"
                  name="registration_number"
                  value={formData.registration_number}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-terracotta-200 focus:border-terracotta-500"
                  placeholder="CI-ABJ-2023-B-12345"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Numéro fiscal
                </label>
                <input
                  type="text"
                  name="tax_id"
                  value={formData.tax_id}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-terracotta-200 focus:border-terracotta-500"
                  placeholder="1234567890"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Téléphone *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-terracotta-200 focus:border-terracotta-500"
                  placeholder="+225 07 XX XX XX XX"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-terracotta-200 focus:border-terracotta-500"
                  placeholder="contact@montoit.ci"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Site web
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-terracotta-200 focus:border-terracotta-500"
                  placeholder="https://montoit.ci"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Ville *
                </label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-terracotta-200 focus:border-terracotta-500"
                >
                  <option value="Abidjan">Abidjan</option>
                  <option value="Yamoussoukro">Yamoussoukro</option>
                  <option value="Bouaké">Bouaké</option>
                  <option value="San Pedro">San Pedro</option>
                  <option value="Korhogo">Korhogo</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Adresse complète *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-terracotta-200 focus:border-terracotta-500"
                  placeholder="Cocody, Angré 8ème Tranche"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Description de l'agence
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-terracotta-200 focus:border-terracotta-500"
                  placeholder="Présentez votre agence, vos services, votre expertise..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Taux de commission (%)
                </label>
                <input
                  type="number"
                  name="commission_rate"
                  value={formData.commission_rate}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-terracotta-200 focus:border-terracotta-500"
                />
                <p className="text-sm text-gray-600 mt-2">
                  Commission par défaut sur les transactions
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
              <FileText className="h-6 w-6 text-cyan-600" />
              <span>Documents légaux</span>
            </h2>

            <div className="space-y-6">
              <div className="p-6 bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl border-2 border-cyan-200">
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Registre du Commerce (RCCM)
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, 'rccm')}
                  className="w-full"
                />
                {files.rccm && (
                  <p className="text-sm text-cyan-700 mt-2 flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>{files.rccm.name}</span>
                  </p>
                )}
              </div>

              <div className="p-6 bg-gradient-to-br from-olive-50 to-olive-100 rounded-xl border-2 border-olive-200">
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Agrément/Licence d'exploitation
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, 'license')}
                  className="w-full"
                />
                {files.license && (
                  <p className="text-sm text-olive-700 mt-2 flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>{files.license.name}</span>
                  </p>
                )}
              </div>

              <div className="p-6 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border-2 border-amber-200">
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Attestation fiscale
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, 'tax')}
                  className="w-full"
                />
                {files.tax && (
                  <p className="text-sm text-amber-700 mt-2 flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>{files.tax.name}</span>
                  </p>
                )}
              </div>
            </div>
          </section>

          <div className="pt-6 border-t-4 border-dashed border-terracotta-200">
            <div className="flex items-start space-x-3 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl mb-6">
              <Shield className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-bold text-gray-900 mb-2">
                  Processus de vérification
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Une fois votre demande soumise, notre équipe vérifiera vos documents sous 48h. Vous recevrez un badge "Agence Certifiée" après validation, ce qui renforce la confiance des clients.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-4 text-lg flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  <span>Envoi en cours...</span>
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5" />
                  <span>Soumettre ma demande</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
