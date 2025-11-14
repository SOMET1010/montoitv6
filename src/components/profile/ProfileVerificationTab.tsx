import { Shield, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface ProfileVerificationTabProps {
  profile: any;
  verificationData: any;
}

export default function ProfileVerificationTab({ profile, verificationData }: ProfileVerificationTabProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verifie':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'en_attente':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <XCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'verifie':
        return 'Vérifié';
      case 'en_attente':
        return 'En attente';
      default:
        return 'Non vérifié';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verifie':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'en_attente':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="card-scrapbook p-8">
        <h2 className="text-2xl font-bold text-gradient mb-6 flex items-center space-x-2">
          <Shield className="h-7 w-7 text-terracotta-500" />
          <span>État de vérification</span>
        </h2>

        <div className="space-y-4">
          <div className={`p-4 rounded-xl border-2 ${getStatusColor(verificationData?.oneci_status || 'non_verifie')}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon(verificationData?.oneci_status || 'non_verifie')}
                <div>
                  <h3 className="font-bold">Vérification ONECI (CNI)</h3>
                  <p className="text-sm opacity-75">Vérification d'identité officielle</p>
                </div>
              </div>
              <span className="font-bold">{getStatusText(verificationData?.oneci_status || 'non_verifie')}</span>
            </div>
          </div>

          <div className={`p-4 rounded-xl border-2 ${getStatusColor(verificationData?.face_verification_status || 'non_verifie')}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon(verificationData?.face_verification_status || 'non_verifie')}
                <div>
                  <h3 className="font-bold">Vérification biométrique</h3>
                  <p className="text-sm opacity-75">Reconnaissance faciale</p>
                </div>
              </div>
              <span className="font-bold">{getStatusText(verificationData?.face_verification_status || 'non_verifie')}</span>
            </div>
          </div>

          <div className={`p-4 rounded-xl border-2 ${profile?.is_verified ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {profile?.is_verified ? <CheckCircle className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-gray-600" />}
                <div>
                  <h3 className="font-bold">Badge Mon Toit</h3>
                  <p className="text-sm opacity-75">Certification complète</p>
                </div>
              </div>
              <span className="font-bold">{profile?.is_verified ? 'Vérifié' : 'Non vérifié'}</span>
            </div>
          </div>
        </div>

        {!profile?.is_verified && (
          <div className="mt-6 p-6 bg-amber-50 border-2 border-amber-200 rounded-xl">
            <h4 className="font-bold text-amber-900 mb-2">Complétez votre vérification</h4>
            <p className="text-amber-800 mb-4">
              Pour bénéficier de toutes les fonctionnalités, complétez votre vérification d'identité.
            </p>
            <div className="flex space-x-3">
              <a
                href="/verification"
                className="btn-primary px-6 py-2"
              >
                Démarrer la vérification
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
