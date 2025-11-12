import React, { useState } from 'react';
import { Shield, CheckCircle, AlertCircle, Loader, User, FileText, Calendar, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ANSUTVerificationFormProps {
  onVerified: () => void;
  onError: (error: string) => void;
}

interface VerificationData {
  full_name: string;
  date_of_birth: string;
  place_of_birth: string;
  address: string;
  phone: string;
}

export default function ANSUTVerificationForm({ onVerified, onError }: ANSUTVerificationFormProps) {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<VerificationData>({
    full_name: profile?.full_name || '',
    date_of_birth: '',
    place_of_birth: '',
    address: profile?.address || '',
    phone: profile?.phone || ''
  });

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
      // Créer la demande de vérification ANSUT
      const { data: verification, error: createError } = await supabase
        .from('ansut_certifications')
        .insert({
          user_id: user.id,
          full_name: formData.full_name,
          date_of_birth: formData.date_of_birth,
          place_of_birth: formData.place_of_birth,
          address: formData.address,
          phone: formData.phone,
          status: 'pending'
        })
        .select()
        .single();

      if (createError) throw createError;

      // Appeler l'Edge Function pour la vérification ANSUT
      const { data, error } = await supabase.functions.invoke('ansut-verification', {
        body: {
          verificationId: verification.id,
          fullName: formData.full_name,
          dateOfBirth: formData.date_of_birth,
          placeOfBirth: formData.place_of_birth,
          address: formData.address,
          phone: formData.phone,
          userId: user.id
        }
      });

      if (error) throw error;

      // Mettre à jour le statut de l'utilisateur
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_verified: true })
        .eq('id', user.id);

      if (updateError) throw updateError;

      onVerified();
    } catch (error: any) {
      console.error('ANSUT verification error:', error);
      onError(error.message || 'Erreur lors de la vérification ANSUT');
    } finally {
      setLoading(false);
    }
  };

  if (!showForm) {
    return (
      <div className={`p-6 rounded-2xl border-2 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-lg mb-2 flex items-center space-x-2">
              <Shield className="h-5 w-5 text-terracotta-500" />
              <span>Vérification ANSUT</span>
            </h3>
            <p className="text-gray-700 text-sm mb-3">
              Certification officielle ANSUT - Agence Nationale de Soutien à l'Urbanisme et aux Territoires
            </p>
            <div className="bg-white p-3 rounded-lg border border-amber-200">
              <h4 className="font-semibold text-amber-900 mb-2">Avantages de la certification :</h4>
              <ul className="text-sm text-amber-800 space-y-1">
                <li>• Certification gouvernementale officielle</li>
                <li>• Badge de confiance premium sur votre profil</li>
                <li>• Accès prioritaire aux propriétés premium</li>
                <li>• Profil vérifié officiellement</li>
              </ul>
            </div>
          </div>
          <div className="ml-4">
            <Shield className="h-8 w-8 text-terracotta-500" />
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="w-full btn-primary px-6 py-3 flex items-center justify-center space-x-2"
        >
          <Shield className="h-5 w-5" />
          <span>Commencer la certification ANSUT</span>
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl border-2 bg-gradient-to-br from-olive-50 to-green-50 border-olive-300">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-lg text-gray-900 flex items-center space-x-2">
          <Shield className="h-6 w-6 text-terracotta-500" />
          <span>Certification ANSUT</span>
        </h3>
        <button
          onClick={() => setShowForm(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white p-4 rounded-xl border border-olive-200">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
            <User className="h-4 w-4 text-terracotta-500" />
            <span>Informations personnelles</span>
          </h4>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom complet <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                required
                placeholder="Jean Dupont"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500"
              />
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lieu de naissance <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="place_of_birth"
                value={formData.place_of_birth}
                onChange={handleInputChange}
                required
                placeholder="Abidjan, Côte d'Ivoire"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-olive-200">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-terracotta-500" />
            <span>Contact et localisation</span>
          </h4>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresse complète <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                placeholder="Cocody, Rue des Jardins, Abidjan"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Téléphone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                placeholder="+225 XX XX XX XX XX"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-1">Important :</p>
              <p>
                Vos informations seront vérifiées auprès des autorités compétentes.
                La certification peut prendre 24-48 heures. Vous recevrez une notification
                dès que votre certification sera validée.
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
            className="flex-1 btn-primary px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader className="h-5 w-5 animate-spin" />
                <span>Vérification en cours...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                <span>Soumettre pour certification</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}