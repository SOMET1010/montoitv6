import React, { useState } from 'react';
import { Shield, CheckCircle, AlertCircle, Loader, Heart, User, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface CNAMVerificationFormProps {
  onVerified: () => void;
  onError: (error: string) => void;
}

interface VerificationData {
  cnam_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
}

export default function CNAMVerificationForm({ onVerified, onError }: CNAMVerificationFormProps) {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<VerificationData>({
    cnam_number: '',
    first_name: '',
    last_name: '',
    date_of_birth: ''
  });

  // Séparer le nom complet si disponible
  React.useEffect(() => {
    if (profile?.full_name) {
      const parts = profile.full_name.split(' ');
      setFormData(prev => ({
        ...prev,
        first_name: parts[0] || '',
        last_name: parts.slice(1).join(' ') || ''
      }));
    }
  }, [profile?.full_name]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    onError('');

    try {
      // Créer la demande de vérification CNAM
      const { data: verification, error: createError } = await supabase
        .from('cnam_verifications')
        .insert({
          user_id: user.id,
          cnam_number: formData.cnam_number,
          first_name: formData.first_name,
          last_name: formData.last_name,
          date_of_birth: formData.date_of_birth,
          status: 'pending'
        })
        .select()
        .single();

      if (createError) throw createError;

      // Appeler l'Edge Function pour la vérification CNAM
      const { data, error } = await supabase.functions.invoke('cnam-verification', {
        body: {
          verificationId: verification.id,
          cnamNumber: formData.cnam_number,
          firstName: formData.first_name,
          lastName: formData.last_name,
          userId: user.id
        }
      });

      if (error) throw error;

      // Mettre à jour le statut de l'utilisateur
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ cnam_verified: true })
        .eq('id', user.id);

      if (updateError) throw updateError;

      onVerified();
    } catch (error: any) {
      console.error('CNAM verification error:', error);
      onError(error.message || 'Erreur lors de la vérification CNAM');
    } finally {
      setLoading(false);
    }
  };

  if (!showForm) {
    return (
      <div className={`p-6 rounded-2xl border-2 bg-gradient-to-br from-green-50 to-emerald-50 border-green-300`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-lg mb-2 flex items-center space-x-2">
              <Heart className="h-5 w-5 text-green-500" />
              <span>Vérification CNAM</span>
            </h3>
            <p className="text-gray-700 text-sm mb-3">
              Confirmez votre affiliation à la Caisse Nationale d'Assurance Maladie
            </p>
            <div className="bg-white p-3 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-2">Avantages de la vérification CNAM :</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Prouve votre solvabilité et stabilité</li>
                <li>• Indique un emploi stable et régulier</li>
                <li>• Rassure les propriétaires sur votre sérieux</li>
                <li>• Améliore votre score locataire</li>
              </ul>
            </div>
          </div>
          <div className="ml-4">
            <Heart className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
        >
          <Heart className="h-5 w-5" />
          <span>Vérifier mon affiliation CNAM</span>
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl border-2 bg-gradient-to-br from-green-50 to-emerald-50 border-green-300">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-lg text-gray-900 flex items-center space-x-2">
          <Heart className="h-6 w-6 text-green-500" />
          <span>Vérification CNAM</span>
        </h3>
        <button
          onClick={() => setShowForm(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white p-4 rounded-xl border border-green-200">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
            <FileText className="h-4 w-4 text-green-500" />
            <span>Informations d'affiliation CNAM</span>
          </h4>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Numéro d'affiliation CNAM <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="cnam_number"
                value={formData.cnam_number}
                onChange={handleInputChange}
                required
                placeholder="Ex: 2024001234567"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Ce numéro se trouve sur votre carte CNAM ou vos bulletins de paie
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  required
                  placeholder="Jean"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  required
                  placeholder="Dupont"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de naissance <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleInputChange}
                required
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Doit correspondre à la date sur votre dossier CNAM
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-xl border border-green-200">
          <div className="flex items-start space-x-3">
            <User className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-800">
              <p className="font-semibold mb-2">Comment trouver votre numéro CNAM ?</p>
              <ul className="space-y-1 text-xs">
                <li>• Sur votre carte d'assuré social CNAM</li>
                <li>• Dans votre espace employeur (bulletins de paie)</li>
                <li>• En contactant le service RH de votre entreprise</li>
                <li>• Au centre CNAM le plus proche de votre domicile</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-emerald-800">
              <p className="font-semibold mb-1">Important :</p>
              <p>
                Les informations que vous fournissez doivent correspondre exactement à celles
                enregistrées à la CNAM. La vérification est confidentielle et sécurisée.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Pourquoi cette vérification ?</p>
              <p>
                Une affiliation CNAM active prouve que vous avez un emploi stable et une
                couverture sociale, ce qui rassure les propriétaires sur votre capacité
                à payer votre loyer régulièrement.
              </p>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader className="h-5 w-5 animate-spin" />
                <span>Vérification en cours...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                <span>Vérifier mon affiliation</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}