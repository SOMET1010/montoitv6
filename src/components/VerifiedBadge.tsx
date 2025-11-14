import { Shield, CheckCircle, Info } from 'lucide-react';
import { useState } from 'react';

interface VerifiedBadgeProps {
  verified: boolean;
  size?: 'small' | 'medium' | 'large';
  showTooltip?: boolean;
  className?: string;
  type?: 'full' | 'oneci' | 'cnam' | 'biometric';
}

export default function VerifiedBadge({
  verified,
  size = 'medium',
  showTooltip = true,
  className = '',
  type = 'full'
}: VerifiedBadgeProps) {
  const [showInfo, setShowInfo] = useState(false);

  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-1.5 text-sm',
    large: 'px-4 py-2 text-base'
  };

  const iconSizes = {
    small: 'w-3 h-3',
    medium: 'w-4 h-4',
    large: 'w-5 h-5'
  };

  const badgeLabels = {
    full: 'Vérifié Mon Toit',
    oneci: 'CNI Vérifiée',
    cnam: 'CNAM Vérifié',
    biometric: 'Biométrie OK'
  };

  const tooltipContent = {
    full: {
      title: 'Utilisateur vérifié',
      description: 'Identité confirmée via ONECI (CNI) et vérification biométrique. Badge de confiance Mon Toit.',
      checks: '✓ CNI vérifiée (ONECI) • ✓ Vérification biométrique • ✓ Profil complet'
    },
    oneci: {
      title: 'CNI vérifiée',
      description: 'Carte Nationale d\'Identité vérifiée auprès de l\'ONECI (Office National d\'État Civil et d\'Identification).',
      checks: '✓ Document officiel • ✓ Données validées'
    },
    cnam: {
      title: 'CNAM vérifié',
      description: 'Numéro CNAM vérifié auprès de la Caisse Nationale d\'Assurance Maladie.',
      checks: '✓ Couverture médicale validée'
    },
    biometric: {
      title: 'Biométrie validée',
      description: 'Reconnaissance faciale effectuée avec succès pour confirmer l\'identité.',
      checks: '✓ Visage vérifié • ✓ Vivacité confirmée'
    }
  };

  if (!verified) {
    return null;
  }

  const content = tooltipContent[type];

  return (
    <div className={`relative inline-flex ${className}`}>
      <div
        className={`
          flex items-center space-x-1.5 rounded-full font-bold
          bg-gradient-to-r from-green-500 to-emerald-600 text-white
          shadow-lg hover:shadow-xl transition-all duration-200
          border-2 border-green-400
          ${sizeClasses[size]}
        `}
        onMouseEnter={() => showTooltip && setShowInfo(true)}
        onMouseLeave={() => showTooltip && setShowInfo(false)}
      >
        <Shield className={iconSizes[size]} />
        <span>{badgeLabels[type]}</span>
        <CheckCircle className={iconSizes[size]} />
      </div>

      {showTooltip && showInfo && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-72 z-50">
          <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl">
            <div className="flex items-start space-x-2 mb-2">
              <Info className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-green-400 mb-1">{content.title}</p>
                <p className="text-gray-300 leading-relaxed">
                  {content.description}
                </p>
              </div>
            </div>
            <div className="border-t border-gray-700 mt-2 pt-2">
              <p className="text-gray-400 text-xs">
                {content.checks}
              </p>
            </div>
          </div>
          <div className="w-3 h-3 bg-gray-900 transform rotate-45 absolute top-full left-1/2 -translate-x-1/2 -mt-1.5"></div>
        </div>
      )}
    </div>
  );
}
