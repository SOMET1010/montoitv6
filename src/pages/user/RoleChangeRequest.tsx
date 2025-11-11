import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Building2, Home, Briefcase, CheckCircle, AlertCircle, ArrowRight, UserCircle, Sparkles, Shield, FileText, Upload, Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface RoleRequest {
  current_role: string;
  requested_role: 'proprietaire' | 'agence' | 'locataire';
  reason: string;
  documents?: File[];
}

export default function RoleChangeRequest() {
  const { user, profile } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'proprietaire' | 'agence' | 'locataire' | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [reason, setReason] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  // Rôles disponibles selon le rôle actuel
  const getAvailableRoles = () => {
    if (!profile) return [];

    const currentRole = profile.user_type;
    const roles = [];

    if (currentRole === 'locataire') {
      roles.push({
        type: 'proprietaire' as const,
        icon: Building2,
        title: 'Devenir Propriétaire',
        subtitle: 'Mettre mes biens en location',
        description: 'Gérez vos propriétés, trouvez des locataires et suivez vos revenus.',
        requirements: [
          'Justificatif de propriété (titre foncier, facture d\'eau/électricité)',
          'Pièce d\'identité valide',
          'Informations sur le(s) bien(s) à mettre en location'
        ],
        color: 'from-terracotta-400 to-coral-500',
        bgColor: 'from-terracotta-50 to-coral-50',
        borderColor: 'border-terracotta-300'
      });
    }

    if (currentRole === 'locataire' || currentRole === 'proprietaire') {
      roles.push({
        type: 'agence' as const,
        icon: Briefcase,
        title: 'Créer une Agence',
        subtitle: 'Professionnaliser mon activité',
        description: 'Transformez votre activité en agence immobilière professionnelle.',
        requirements: [
          'RCCM (Registre de Commerce et des Crédits Mobiliers)',
          'Licence d\'agence immobilière',
          'Pièce d\'identité du représentant légal',
          'Justificatif de domicile'
        ],
        color: 'from-olive-400 to-green-500',
        bgColor: 'from-olive-50 to-green-50',
        borderColor: 'border-olive-300'
      });
    }

    if (currentRole === 'proprietaire' || currentRole === 'agence') {
      roles.push({
        type: 'locataire' as const,
        icon: Home,
        title: 'Devenir Locataire',
        subtitle: 'Chercher un logement pour moi-même',
        description: 'Accédez aux fonctionnalités de recherche et de candidature locative.',
        requirements: [
          'Justificatif de revenus',
          'Pièce d\'identité valide',
          'Références (optionnel)'
        ],
        color: 'from-cyan-400 to-blue-500',
        bgColor: 'from-cyan-50 to-blue-50',
        borderColor: 'border-cyan-300'
      });
    }

    return roles;
  };

  const availableRoles = getAvailableRoles();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedRole || !user || !profile) return;

    setLoading(true);
    setError('');

    try {
      // Créer la demande de changement de rôle
      const { error: requestError } = await supabase
        .from('role_change_requests')
        .insert({
          user_id: user.id,
          current_role: profile.user_type,
          requested_role: selectedRole,
          reason: reason,
          status: 'pending',
          created_at: new Date().toISOString()
        });

      if (requestError) throw requestError;

      // Uploader les documents s'il y en a
      if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}/role-change/${Date.now()}_${i}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(fileName, file);

          if (uploadError) throw uploadError;
        }
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la demande de changement de rôle');
    } finally {
      setLoading(false);
    }
  };

  if (!user || !profile) {
    window.location.href = '/connexion';
    return null;
  }

  if (success) {
    return (
      <div className="min-h-screen custom-cursor relative overflow-hidden flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-olive-400 via-cyan-300 to-blue-400" />

        <div className="max-w-2xl w-full relative z-10">
          <div className="glass-card rounded-3xl p-8 md:p-12 shadow-2xl text-center animate-scale-in">
            <div className="w-20 h-20 bg-gradient-to-br from-olive-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Demande envoyée avec succès !
            </h1>

            <p className="text-lg text-gray-600 mb-8">
              Votre demande de changement de rôle a été soumise à l'équipe ANSUT pour validation.
              Vous recevrez une réponse par email dans les 24-48 heures.
            </p>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 mb-8">
              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <h3 className="font-semibold text-blue-900 mb-2">Prochaines étapes :</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Vérification de vos documents par l'équipe ANSUT</li>
                    <li>• Validation de votre demande sous 24-48h</li>
                    <li>• Notification par email une fois la demande approuvée</li>
                    <li>• Accès immédiat aux nouvelles fonctionnalités après validation</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={() => window.location.href = '/profil'}
              className="btn-primary text-lg px-8 py-3"
            >
              Retour à mon profil
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen custom-cursor relative overflow-hidden flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-gradient-to-br from-terracotta-400 via-coral-300 to-amber-300" />

      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-20 w-64 h-64 bg-cyan-300 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-olive-300 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-200 rounded-full blur-3xl animate-float" style={{ animationDelay: '0.5s' }} />
      </div>

      <div className="max-w-7xl w-full relative z-10">
        <div className="text-center mb-12 animate-slide-down">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <UserCircle className="h-12 w-12 text-white" />
            <span className="text-4xl font-bold text-white">Mon Toit</span>
          </div>

          <div className="inline-flex items-center space-x-2 mb-6 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
            <Sparkles className="h-5 w-5 text-amber-300" />
            <span className="text-sm font-semibold text-white">
              Rôle actuel : {profile.user_type === 'locataire' ? 'Locataire' : profile.user_type === 'proprietaire' ? 'Propriétaire' : 'Agence'}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            Changer de rôle
          </h1>
          <p className="text-xl text-amber-100 max-w-3xl mx-auto">
            Étendez vos fonctionnalités en ajoutant un nouveau rôle à votre profil
          </p>
        </div>

        {error && (
          <div className="mb-8 max-w-3xl mx-auto p-4 bg-red-50 border-2 border-red-200 rounded-2xl text-red-700 text-sm font-medium animate-shake">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {availableRoles.length === 0 ? (
          <div className="max-w-3xl mx-auto text-center">
            <div className="glass-card rounded-3xl p-8 shadow-2xl">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Tous les rôles disponibles
              </h2>
              <p className="text-gray-600 mb-6">
                Vous avez déjà accès à tous les rôles disponibles pour votre profil actuel.
              </p>
              <button
                onClick={() => window.location.href = '/profil'}
                className="btn-primary"
              >
                Retour au profil
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className={`grid gap-8 mb-12 ${
              availableRoles.length === 1
                ? 'grid-cols-1 max-w-2xl mx-auto'
                : availableRoles.length === 2
                  ? 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto'
                  : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto'
            }`}>
              {availableRoles.map((role, index) => {
                const Icon = role.icon;
                const isSelected = selectedRole === role.type;

                return (
                  <div
                    key={role.type}
                    onClick={() => setSelectedRole(role.type)}
                    className={`glass-card rounded-3xl p-8 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                      isSelected
                        ? 'ring-4 ring-white shadow-2xl scale-105'
                        : 'hover:shadow-xl'
                    } animate-scale-in`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="relative">
                      {isSelected && (
                        <div className="absolute -top-4 -right-4 bg-white rounded-full p-2 shadow-lg animate-bounce-subtle">
                          <CheckCircle className="h-6 w-6 text-green-500" />
                        </div>
                      )}

                      <div className={`w-16 h-16 bg-gradient-to-br ${role.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                        <Icon className="h-8 w-8 text-white" />
                      </div>

                      <div className="text-center mb-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{role.title}</h3>
                        <p className="text-sm font-semibold text-gray-600 mb-3">{role.subtitle}</p>
                        <p className="text-gray-700 text-sm leading-relaxed">{role.description}</p>
                      </div>

                      <div className={`bg-gradient-to-br ${role.bgColor} rounded-xl p-4 border ${role.borderColor}`}>
                        <h4 className="font-semibold text-gray-900 mb-3 text-sm flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-amber-500" />
                          Documents requis
                        </h4>
                        <ul className="space-y-2 text-xs text-gray-700">
                          {role.requirements.map((req, i) => (
                            <li key={i} className="flex items-start">
                              <CheckCircle className="h-3 w-3 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                              <span>{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedRole && (
              <div className="max-w-4xl mx-auto space-y-8 animate-slide-up">
                <div className="glass-card rounded-3xl p-8 shadow-2xl">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <Info className="h-5 w-5 mr-2 text-cyan-600" />
                    Pourquoi souhaitez-vous changer de rôle ?
                  </h3>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-terracotta-200 focus:border-terracotta-500 transition-all bg-white/70 resize-none"
                    rows={4}
                    placeholder="Expliquez brièvement pourquoi vous souhaitez accéder à ce rôle..."
                    required
                  />
                </div>

                <div className="glass-card rounded-3xl p-8 shadow-2xl">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <Upload className="h-5 w-5 mr-2 text-olive-600" />
                    Documents de vérification
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Uploadez les documents requis pour accélérer le traitement de votre demande
                  </p>

                  <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-olive-400 transition-colors">
                    <input
                      type="file"
                      id="documents"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="documents" className="cursor-pointer">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-700 font-medium mb-2">
                        Cliquez pour uploader vos documents
                      </p>
                      <p className="text-sm text-gray-500">
                        PDF, JPG, PNG (Max 10MB par fichier)
                      </p>
                    </label>
                  </div>

                  {files.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="font-semibold text-gray-700">Documents sélectionnés :</p>
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                          <span className="text-sm text-gray-700 truncate">{file.name}</span>
                          <button
                            onClick={() => removeFile(index)}
                            className="text-red-500 hover:text-red-700 text-sm font-medium"
                          >
                            Supprimer
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-center">
                  <button
                    onClick={handleSubmit}
                    disabled={!reason || loading}
                    className="btn-primary text-lg px-12 py-4 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center space-x-3 shadow-2xl"
                  >
                    {loading ? (
                      <>
                        <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Traitement...</span>
                      </>
                    ) : (
                      <>
                        <span>Soumettre la demande</span>
                        <ArrowRight className="h-6 w-6" />
                      </>
                    )}
                  </button>

                  <p className="mt-4 text-white/80 text-sm">
                    Votre demande sera traitée dans les 24-48 heures
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}