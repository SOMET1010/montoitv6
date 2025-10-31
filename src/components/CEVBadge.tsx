import React from 'react';
import { Shield, CheckCircle, ExternalLink } from 'lucide-react';

interface CEVBadgeProps {
  certified: boolean;
  cevNumber?: string;
  verificationUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export default function CEVBadge({
  certified,
  cevNumber,
  verificationUrl,
  size = 'md',
  showDetails = false,
}: CEVBadgeProps) {
  if (!certified) {
    return null;
  }

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  if (showDetails && cevNumber) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="bg-green-100 rounded-full p-2">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-green-900">Certificat CEV ONECI</h3>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-sm text-green-800 mb-2">
                Ce bail est certifié par l'Office National de l'État Civil et de
                l'Identification (ONECI) et possède une force légale complète devant les
                tribunaux ivoiriens.
              </p>
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-green-700 font-medium">Numéro CEV:</span>
                  <span className="ml-2 font-mono font-bold text-green-900">{cevNumber}</span>
                </div>
                {verificationUrl && (
                  <a
                    href={verificationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-green-700 hover:text-green-900 font-medium"
                  >
                    Vérifier sur ONECI.ci
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 font-semibold rounded-full border border-green-300 ${sizeClasses[size]}`}
      title={`Certifié CEV ONECI${cevNumber ? ` - ${cevNumber}` : ''}`}
    >
      <Shield className={iconSizes[size]} />
      <span>CEV ONECI</span>
      <CheckCircle className={iconSizes[size]} />
    </div>
  );
}
