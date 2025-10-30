import { Shield, X, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface CertificationReminderProps {
  userType: string;
  oneciVerified: boolean;
  faceVerified: boolean;
  ansutCertified: boolean;
}

export default function CertificationReminder({
  userType,
  oneciVerified,
  faceVerified,
  ansutCertified
}: CertificationReminderProps) {
  const [dismissed, setDismissed] = useState(false);

  if (ansutCertified || dismissed) {
    return null;
  }

  const getMessage = () => {
    if (!oneciVerified) {
      return {
        title: 'Complétez votre certification ANSUT',
        message: 'Vérifiez votre identité pour accéder à toutes les fonctionnalités de la plateforme',
        urgency: 'high'
      };
    }
    if (!faceVerified) {
      return {
        title: 'Dernière étape!',
        message: 'Complétez la vérification faciale pour obtenir votre certification ANSUT',
        urgency: 'medium'
      };
    }
    return {
      title: 'Certification en cours',
      message: 'Votre vérification est en cours de traitement',
      urgency: 'low'
    };
  };

  const { title, message, urgency } = getMessage();

  const bgColor = urgency === 'high'
    ? 'bg-gradient-to-r from-red-500 to-orange-500'
    : urgency === 'medium'
    ? 'bg-gradient-to-r from-amber-500 to-yellow-500'
    : 'bg-gradient-to-r from-blue-500 to-cyan-500';

  return (
    <div className={`${bgColor} text-white shadow-lg`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <Shield className="w-6 h-6 flex-shrink-0 animate-pulse" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">{title}</p>
              <p className="text-sm opacity-90 hidden sm:block">{message}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <a
              href="/certification-ansut"
              className="btn-secondary px-4 py-2 text-sm font-bold whitespace-nowrap flex items-center space-x-1"
            >
              <span>Commencer</span>
              <ChevronRight className="w-4 h-4" />
            </a>
            <button
              onClick={() => setDismissed(true)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
