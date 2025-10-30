import { CheckCircle, Clock, XCircle, FileSignature, Shield } from 'lucide-react';

interface SignatureStatusBadgeProps {
  status: 'pending' | 'tenant_signed' | 'landlord_signed' | 'fully_signed' | 'rejected';
  isTenant?: boolean;
  compact?: boolean;
}

export default function SignatureStatusBadge({ status, isTenant = false, compact = false }: SignatureStatusBadgeProps) {
  const configs = {
    pending: {
      icon: Clock,
      label: 'En attente de signature',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      iconColor: 'text-yellow-600'
    },
    tenant_signed: {
      icon: FileSignature,
      label: isTenant ? 'Vous avez signé' : 'Locataire a signé',
      color: 'bg-blue-100 text-blue-800 border-blue-300',
      iconColor: 'text-blue-600'
    },
    landlord_signed: {
      icon: FileSignature,
      label: isTenant ? 'Propriétaire a signé' : 'Vous avez signé',
      color: 'bg-purple-100 text-purple-800 border-purple-300',
      iconColor: 'text-purple-600'
    },
    fully_signed: {
      icon: CheckCircle,
      label: 'Contrat signé',
      color: 'bg-green-100 text-green-800 border-green-300',
      iconColor: 'text-green-600'
    },
    rejected: {
      icon: XCircle,
      label: 'Signature rejetée',
      color: 'bg-red-100 text-red-800 border-red-300',
      iconColor: 'text-red-600'
    }
  };

  const config = configs[status];
  const Icon = config.icon;

  if (compact) {
    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full border ${config.color} text-xs font-bold`}>
        <Icon className={`w-3 h-3 ${config.iconColor}`} />
        <span>{config.label}</span>
      </span>
    );
  }

  return (
    <div className={`flex items-center space-x-3 p-4 rounded-xl border-2 ${config.color}`}>
      <Icon className={`w-6 h-6 ${config.iconColor} flex-shrink-0`} />
      <div>
        <p className="font-bold">{config.label}</p>
        {status === 'fully_signed' && (
          <p className="text-xs mt-1 flex items-center space-x-1">
            <Shield className="w-3 h-3" />
            <span>Certifié électroniquement</span>
          </p>
        )}
      </div>
    </div>
  );
}
