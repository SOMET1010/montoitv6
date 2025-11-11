import { MapPin, Loader2, AlertCircle } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';

interface GeolocationButtonProps {
  onLocationFound: (latitude: number, longitude: number) => void;
  className?: string;
}

export default function GeolocationButton({ onLocationFound, className = '' }: GeolocationButtonProps) {
  const { position, error, loading, supported, requestLocation, clearError } = useGeolocation();

  const handleClick = () => {
    if (position) {
      onLocationFound(position.latitude, position.longitude);
    } else {
      requestLocation();
    }
  };

  if (position && !error) {
    onLocationFound(position.latitude, position.longitude);
  }

  if (!supported) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={loading}
        className={`btn-secondary flex items-center space-x-2 ${className} ${
          loading ? 'opacity-70 cursor-not-allowed' : ''
        }`}
        aria-label="Trouver des propriétés près de moi"
        aria-busy={loading}
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <MapPin className="h-5 w-5" />
        )}
        <span>
          {loading ? 'Localisation...' : position ? 'Proche de moi' : 'Près de moi'}
        </span>
      </button>

      {error && (
        <div
          className="absolute top-full mt-2 left-0 right-0 bg-red-50 border-2 border-red-200 rounded-xl p-3 shadow-lg z-50 min-w-max"
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800 font-medium">{error.message}</p>
              <button
                onClick={clearError}
                className="text-xs text-red-600 hover:text-red-700 underline mt-1 focus:outline-none focus:ring-2 focus:ring-red-400 rounded"
                aria-label="Fermer le message d'erreur"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
