import { Shield, CheckCircle, Clock, XCircle } from 'lucide-react';

interface VerificationBadgeProps {
  type: 'oneci' | 'cnam' | 'face';
  status: 'en_attente' | 'verifie' | 'rejete';
  size?: 'small' | 'medium';
}

export default function VerificationBadge({ type, status, size = 'medium' }: VerificationBadgeProps) {
  const typeLabels = {
    oneci: 'ONECI',
    cnam: 'CNAM',
    face: 'Visage'
  };

  const statusConfig = {
    en_attente: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      border: 'border-yellow-300',
      icon: Clock,
      label: 'En attente'
    },
    verifie: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-300',
      icon: CheckCircle,
      label: 'Vérifié'
    },
    rejete: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-300',
      icon: XCircle,
      label: 'Rejeté'
    }
  };

  const config = statusConfig[status];
  const Icon = config.icon;
  const sizeClasses = size === 'small' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm';
  const iconSize = size === 'small' ? 'w-3 h-3' : 'w-4 h-4';

  return (
    <span className={`
      inline-flex items-center space-x-1.5 rounded-full font-bold border-2
      ${config.bg} ${config.text} ${config.border} ${sizeClasses}
    `}>
      <Icon className={iconSize} />
      <span>{typeLabels[type]}: {config.label}</span>
    </span>
  );
}
