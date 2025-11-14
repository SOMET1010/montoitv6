import { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, Save, Info, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface VerificationPreferences {
  enable_oneci_verification: boolean;
  enable_cnam_verification: boolean;
  enable_face_verification: boolean;
  enable_ansut_certification: boolean;
}

interface VerificationOption {
  id: keyof VerificationPreferences;
  name: string;
  description: string;
  benefits: string[];
  icon: string;
  recommended: boolean;
}

export default function VerificationSettings() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [preferences, setPreferences] = useState<VerificationPreferences>({
    enable_oneci_verification: true,
    enable_cnam_verification: true,
    enable_face_verification: true,
    enable_ansut_certification: true,
  });

  const verificationOptions: VerificationOption[] = [
    {
      id: 'enable_oneci_verification',
      name: 'Vérification ONECI',
      description: 'Vérifiez votre pièce d\'identité nationale auprès de l\'Office National d\'Identification (ONECI)',
      benefits: [
        'Indispensable pour les locations',
        'Augmente votre crédibilité de 40%',
        'Requis par la plupart des propriétaires',
        'Vérification rapide en 24-48h',
      ],
      icon: '🆔',
      recommended: true,
    },
    {
      id: 'enable_cnam_verification',
      name: 'Vérification CNAM',
      description: 'Confirmez votre affiliation à la Caisse Nationale d\'Assurance Maladie',
      benefits: [
        'Prouve votre solvabilité',
        'Indique un emploi stable',
        'Rassure les propriétaires',
        'Améliore votre score locataire',
      ],
      icon: '🏥',
      recommended: true,
    },
    {
      id: 'enable_face_verification',
      name: 'Vérification Faciale (Smile ID)',
      description: 'Authentification biométrique pour une sécurité maximale',
      benefits: [
        'Sécurité renforcée',
        'Prévient l\'usurpation d\'identité',
        'Vérification instantanée',
        'Niveau de confiance élevé',
      ],
      icon: '😊',
      recommended: true,
    },
    {
      id: 'enable_ansut_certification',
      name: 'Vérification Mon Toit',
      description: 'Certification officielle ANSUT - Agence Nationale de Soutien à l\'Urbanisme et aux Territoires',
      benefits: [
        'Certification gouvernementale',
        'Profil vérifié officiellement',
        'Badge de confiance premium',
        'Accès aux propriétés premium',
      ],
      icon: '✓',
      recommended: true,
    },
  ];

  useEffect(() => {
    if (!user) {
      window.location.href = '/connexion';
      return;
    }
    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_verifications')
        .select('enable_oneci_verification, enable_cnam_verification, enable_face_verification, enable_ansut_certification')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPreferences({
          enable_oneci_verification: data.enable_oneci_verification ?? true,
          enable_cnam_verification: data.enable_cnam_verification ?? true,
          enable_face_verification: data.enable_face_verification ?? true,
          enable_ansut_certification: data.enable_ansut_certification ?? true,
        });
      }
    } catch (err: any) {
      console.error('Error loading preferences:', err);
      setError('Erreur lors du chargement des préférences');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof VerificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { data, error } = await supabase.rpc('update_verification_preferences', {
        p_enable_oneci: preferences.enable_oneci_verification,
        p_enable_cnam: preferences.enable_cnam_verification,
        p_enable_face: preferences.enable_face_verification,
        p_enable_ansut: preferences.enable_ansut_certification,
      });

      if (error) throw error;

      setSuccess('Préférences enregistrées avec succès');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error saving preferences:', err);
      setError(err.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const getEnabledCount = () => {
    return Object.values(preferences).filter(Boolean).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-coral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-terracotta-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-coral-50 custom-cursor">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 animate-slide-down">
          <div className="flex items-center space-x-3 mb-3">
            <Shield className="h-10 w-10 text-terracotta-500" />
            <h1 className="text-4xl font-bold text-gradient">Paramètres de Vérification</h1>
          </div>
          <p className="text-gray-700 text-lg">
            Choisissez les vérifications que vous souhaitez activer pour votre profil
          </p>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-2xl text-green-700 animate-slide-down flex items-center space-x-3">
            <CheckCircle className="h-6 w-6" />
            <span className="font-medium">{success}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl text-red-700 animate-shake flex items-center space-x-3">
            <XCircle className="h-6 w-6" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <div className="card-scrapbook p-6 mb-6 animate-scale-in">
          <div className="flex items-start space-x-4">
            <Info className="h-6 w-6 text-cyan-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">
                À propos des vérifications
              </h3>
              <p className="text-gray-700 mb-3">
                Les vérifications augmentent votre crédibilité auprès des propriétaires et agences immobilières.
                Plus vous avez de vérifications actives, meilleures sont vos chances d'obtenir un logement.
              </p>
              <div className="bg-gradient-to-r from-terracotta-50 to-coral-50 p-4 rounded-xl border border-terracotta-200">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">Vérifications actives:</span>
                  <span className="text-2xl font-bold text-gradient">
                    {getEnabledCount()}/4
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {getEnabledCount() === 0 && (
          <div className="card-scrapbook p-6 mb-6 bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-300 animate-shake">
            <div className="flex items-start space-x-4">
              <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg text-amber-900 mb-2">
                  Attention : Aucune vérification active
                </h3>
                <p className="text-amber-800">
                  Sans vérification active, votre profil aura une crédibilité très faible.
                  Nous vous recommandons fortement d'activer au moins la vérification ONECI.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {verificationOptions.map((option, index) => (
            <div
              key={option.id}
              className={`card-scrapbook p-6 animate-scale-in transition-all duration-300 ${
                preferences[option.id]
                  ? 'bg-gradient-to-br from-olive-50 to-green-50 border-2 border-olive-300'
                  : 'bg-white border-2 border-gray-200 opacity-75'
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-4xl">{option.icon}</span>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{option.name}</h3>
                    {option.recommended && (
                      <span className="inline-block text-xs bg-terracotta-100 text-terracotta-700 px-2 py-1 rounded-full font-semibold">
                        Recommandé
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleToggle(option.id)}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    preferences[option.id] ? 'bg-olive-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-lg ${
                      preferences[option.id] ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <p className="text-gray-700 text-sm mb-4">{option.description}</p>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-900">Avantages :</h4>
                <ul className="space-y-1">
                  {option.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start space-x-2 text-sm text-gray-700">
                      <CheckCircle className="h-4 w-4 text-olive-500 flex-shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="card-scrapbook p-6 animate-slide-up">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div className="text-center sm:text-left">
              <p className="text-gray-700 font-medium">
                {getEnabledCount() === 4
                  ? 'Toutes les vérifications sont activées!'
                  : getEnabledCount() > 0
                  ? `${getEnabledCount()} vérification${getEnabledCount() > 1 ? 's' : ''} activée${getEnabledCount() > 1 ? 's' : ''}`
                  : 'Activez au moins une vérification'}
              </p>
              <p className="text-sm text-gray-600">
                Les modifications prendront effet immédiatement
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Save className="h-5 w-5" />
              <span>{saving ? 'Enregistrement...' : 'Enregistrer les préférences'}</span>
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/profil"
            className="text-terracotta-600 hover:text-terracotta-700 font-semibold transition-colors inline-flex items-center space-x-2"
          >
            <span>← Retour au profil</span>
          </a>
        </div>
      </div>
    </div>
  );
}
