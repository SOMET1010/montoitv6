import { CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface VerificationStatusProps {
  status: 'en_attente' | 'verifie' | 'rejete';
  label: string;
  rejectionReason?: string | null;
}

export default function VerificationStatus({ status, label, rejectionReason }: VerificationStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'verifie':
        return {
          icon: CheckCircle,
          color: 'bg-green-100 text-green-800 border-green-300',
          text: 'Vérifié'
        };
      case 'rejete':
        return {
          icon: AlertCircle,
          color: 'bg-red-100 text-red-800 border-red-300',
          text: 'Rejeté'
        };
      default:
        return {
          icon: Clock,
          color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
          text: 'En attente'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`border-2 rounded-xl p-4 ${config.color}`}>
      <div className="flex items-center space-x-3 mb-2">
        <Icon className="w-6 h-6" />
        <div>
          <p className="font-bold">{label}</p>
          <p className="text-sm">{config.text}</p>
        </div>
      </div>
      {rejectionReason && status === 'rejete' && (
        <p className="text-sm mt-2">Raison: {rejectionReason}</p>
      )}
    </div>
  );
}
