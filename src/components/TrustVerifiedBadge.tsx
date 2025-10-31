import { ShieldCheck } from 'lucide-react';

interface TrustVerifiedBadgeProps {
  verified: boolean;
  score?: number | null;
  size?: 'sm' | 'md' | 'lg';
  showScore?: boolean;
}

export default function TrustVerifiedBadge({
  verified,
  score,
  size = 'md',
  showScore = false
}: TrustVerifiedBadgeProps) {
  if (!verified) {
    return null;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20
  };

  return (
    <div className="inline-flex items-center gap-2">
      <div
        className={`
          inline-flex items-center gap-1.5
          bg-gradient-to-r from-blue-600 to-indigo-600
          text-white
          rounded-full
          font-medium
          ${sizeClasses[size]}
          shadow-sm
        `}
      >
        <ShieldCheck size={iconSizes[size]} className="flex-shrink-0" />
        <span>Vérifié Tiers de Confiance</span>
      </div>

      {showScore && score !== null && score !== undefined && (
        <div
          className={`
            inline-flex items-center
            bg-gray-100 text-gray-700
            rounded-full
            font-semibold
            ${sizeClasses[size]}
          `}
        >
          Score: {score}/100
        </div>
      )}
    </div>
  );
}
