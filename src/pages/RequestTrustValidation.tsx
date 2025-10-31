import { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, AlertCircle, Clock, FileText } from 'lucide-react';
import { trustValidationService } from '../services/trustValidationService';
import { useAuth } from '../contexts/AuthContext';
import TrustVerifiedBadge from '../components/TrustVerifiedBadge';
import AnsutBadge from '../components/AnsutBadge';

export default function RequestTrustValidation() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [validationRequest, setValidationRequest] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.id) {
      loadValidationStatus();
    }
  }, [profile?.id]);

  const loadValidationStatus = async () => {
    try {
      setLoading(true);
      const request = await trustValidationService.getUserValidationStatus(profile!.id);
      setValidationRequest(request);
    } catch (err: any) {
      console.error('Erreur lors du chargement:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const request = await trustValidationService.requestValidation({
        userId: profile!.id
      });

      setValidationRequest(request);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (profile?.trust_verified) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-12 h-12 text-white" />
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Félicitations !
            </h1>

            <p className="text-lg text-gray-600 mb-6">
              Vous êtes déjà vérifié par le Tiers de Confiance
            </p>

            <div className="flex justify-center mb-6">
              <TrustVerifiedBadge
                verified={true}
                score={profile.trust_score}
                size="lg"
                showScore={true}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-left">
              <h3 className="font-semibold text-blue-900 mb-3">
                Avantages de votre vérification :
              </h3>
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Confiance maximale des propriétaires (+200% de conversion)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Accès prioritaire aux annonces premium</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Médiation gratuite en cas de litige</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Badge visible sur votre profil</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (validationRequest) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <ValidationRequestStatus request={validationRequest} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Shield className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Validation Tiers de Confiance</h1>
                <p className="text-blue-100 mt-1">
                  Faites vérifier votre profil par un expert humain
                </p>
              </div>
            </div>
          </div>

          <div className="p-8">
            {!profile?.ansut_verified && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-yellow-900 mb-2">
                      Certification ANSUT requise
                    </h3>
                    <p className="text-yellow-800 mb-4">
                      Vous devez d'abord obtenir la certification ANSUT (vérification automatique)
                      avant de pouvoir demander la validation manuelle par le Tiers de Confiance.
                    </p>
                    <a
                      href="/ansut-verification"
                      className="inline-flex items-center gap-2 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                      Obtenir la certification ANSUT
                    </a>
                  </div>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Qu'est-ce que la validation Tiers de Confiance ?
                </h2>
                <p className="text-gray-600 mb-4">
                  Après avoir passé la certification automatique ANSUT, votre profil est examiné
                  manuellement par un expert immobilier certifié. Cette double validation garantit
                  une sécurité maximale pour tous les utilisateurs de Mon Toit.
                </p>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Processus en 2 phases :
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0 font-semibold">
                        1
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Certification ANSUT</p>
                        <p className="text-sm text-gray-600">
                          Vérification automatique (ONECI + CNAM + Smile ID)
                        </p>
                        <AnsutBadge verified={profile?.ansut_verified || false} size="sm" />
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 font-semibold">
                        2
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Validation Tiers de Confiance</p>
                        <p className="text-sm text-gray-600">
                          Vérification manuelle par un expert humain
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-4">
                  <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Avantages de la validation
                  </h3>
                  <ul className="space-y-2 text-blue-800 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600">•</span>
                      <span>Confiance maximale (+200% de conversion)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600">•</span>
                      <span>Badge visible sur votre profil</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600">•</span>
                      <span>Accès prioritaire aux annonces</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600">•</span>
                      <span>Médiation gratuite en cas de litige</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600">•</span>
                      <span>Support prioritaire niveau 2</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Ce qui sera vérifié
                  </h3>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                      <span>Authenticité des documents</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                      <span>Correspondance photo/selfie</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                      <span>Cohérence des informations</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                      <span>Historique plateforme</span>
                    </li>
                  </ul>
                  <p className="text-xs text-gray-500 mt-3">
                    Délai de traitement: 24-48h
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-900">Erreur</h3>
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={handleSubmitRequest}
                disabled={!profile?.ansut_verified || submitting}
                className={`
                  flex-1 py-4 px-6 rounded-lg font-semibold text-lg
                  transition-all transform hover:scale-105
                  ${
                    profile?.ansut_verified && !submitting
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Envoi en cours...
                  </span>
                ) : (
                  'Demander la validation'
                )}
              </button>
            </div>

            <p className="text-center text-sm text-gray-500 mt-4">
              En soumettant cette demande, vous acceptez qu'un expert examine vos documents.
              Vos données sont traitées de manière confidentielle.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ValidationRequestStatus({ request }: { request: any }) {
  const getStatusInfo = () => {
    switch (request.status) {
      case 'pending':
        return {
          icon: Clock,
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          title: 'Demande en attente',
          description: 'Votre demande a été soumise et sera assignée à un agent sous 24h.',
          color: 'yellow'
        };
      case 'under_review':
        return {
          icon: FileText,
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          title: 'En cours d\'examen',
          description: 'Un agent examine actuellement vos documents.',
          color: 'blue'
        };
      case 'additional_info_required':
        return {
          icon: AlertCircle,
          iconBg: 'bg-orange-100',
          iconColor: 'text-orange-600',
          title: 'Informations additionnelles requises',
          description: request.additional_info_requested || 'Des informations complémentaires sont nécessaires.',
          color: 'orange'
        };
      case 'approved':
        return {
          icon: CheckCircle,
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          title: 'Validation approuvée !',
          description: 'Félicitations ! Votre profil a été validé par le Tiers de Confiance.',
          color: 'green'
        };
      case 'rejected':
        return {
          icon: XCircle,
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          title: 'Validation rejetée',
          description: request.rejection_reason || 'Votre demande a été rejetée.',
          color: 'red'
        };
      default:
        return {
          icon: AlertCircle,
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-600',
          title: 'Statut inconnu',
          description: '',
          color: 'gray'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const Icon = statusInfo.icon;

  return (
    <div>
      <div className="text-center mb-8">
        <div className={`w-20 h-20 ${statusInfo.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
          <Icon className={`w-12 h-12 ${statusInfo.iconColor}`} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {statusInfo.title}
        </h1>
        <p className="text-lg text-gray-600">
          {statusInfo.description}
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Détails de la demande</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Demandé le:</span>
              <span className="font-medium">
                {new Date(request.requested_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            {request.assigned_at && (
              <div className="flex justify-between">
                <span className="text-gray-600">Assigné le:</span>
                <span className="font-medium">
                  {new Date(request.assigned_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            )}
            {request.validated_at && (
              <div className="flex justify-between">
                <span className="text-gray-600">Validé le:</span>
                <span className="font-medium">
                  {new Date(request.validated_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        {request.agent_notes && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Notes de l'agent</h3>
            <p className="text-blue-800 text-sm">{request.agent_notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
