import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  showHomeButton?: boolean;
  type?: 'error' | 'warning' | 'info';
}

export default function ErrorDisplay({
  title = 'Une erreur est survenue',
  message,
  onRetry,
  showHomeButton = true,
  type = 'error',
}: ErrorDisplayProps) {
  const colors = {
    error: {
      bg: 'from-red-50 to-orange-50',
      border: 'border-red-200',
      icon: 'text-red-500',
      button: 'from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600',
    },
    warning: {
      bg: 'from-amber-50 to-yellow-50',
      border: 'border-amber-200',
      icon: 'text-amber-500',
      button: 'from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600',
    },
    info: {
      bg: 'from-blue-50 to-cyan-50',
      border: 'border-blue-200',
      icon: 'text-blue-500',
      button: 'from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600',
    },
  };

  const currentColors = colors[type];

  return (
    <div
      className={`max-w-2xl mx-auto p-8 bg-gradient-to-br ${currentColors.bg} rounded-3xl shadow-lg border-4 ${currentColors.border}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex flex-col items-center text-center">
        <div
          className={`w-20 h-20 rounded-full bg-white flex items-center justify-center mb-6 shadow-lg ${currentColors.icon}`}
        >
          <AlertCircle className="w-12 h-12" />
        </div>

        <h2 className="text-3xl font-bold text-gray-900 mb-4">{title}</h2>

        <p className="text-lg text-gray-700 mb-8 max-w-md leading-relaxed">{message}</p>

        <div className="flex flex-col sm:flex-row gap-4">
          {onRetry && (
            <button
              onClick={onRetry}
              className={`inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r ${currentColors.button} text-white font-bold rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-2`}
              aria-label="Réessayer"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Réessayer</span>
            </button>
          )}

          {showHomeButton && (
            <a
              href="/"
              className="inline-flex items-center space-x-2 px-8 py-4 bg-white border-3 border-gray-300 text-gray-800 font-bold rounded-2xl shadow-md hover:bg-gray-50 transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-gray-300 focus:ring-offset-2"
              aria-label="Retour à l'accueil"
            >
              <Home className="w-5 h-5" />
              <span>Retour à l'accueil</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
