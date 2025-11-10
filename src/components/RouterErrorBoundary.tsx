import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react';

export default function RouterErrorBoundary() {
  const error = useRouteError();
  console.error('Route error:', error);

  let errorMessage = 'Une erreur inattendue s\'est produite';
  let errorStatus = 'Erreur';
  let errorDetails = '';

  if (isRouteErrorResponse(error)) {
    errorStatus = `Erreur ${error.status}`;
    errorMessage = error.statusText || errorMessage;

    if (error.status === 404) {
      errorMessage = 'Page non trouvée';
      errorDetails = 'La page que vous recherchez n\'existe pas ou a été déplacée.';
    } else if (error.status === 403) {
      errorMessage = 'Accès refusé';
      errorDetails = 'Vous n\'avez pas les permissions nécessaires pour accéder à cette page.';
    } else if (error.status === 500) {
      errorMessage = 'Erreur serveur';
      errorDetails = 'Une erreur s\'est produite sur le serveur. Veuillez réessayer plus tard.';
    }
  } else if (error instanceof Error) {
    errorMessage = error.message;
    errorDetails = import.meta.env.DEV ? error.stack || '' : '';
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
              {errorStatus}
            </h1>

            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              {errorMessage}
            </h2>

            {errorDetails && (
              <p className="text-gray-600 mb-6">
                {errorDetails}
              </p>
            )}
          </div>

          {import.meta.env.DEV && error instanceof Error && error.stack && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg overflow-auto">
              <p className="text-sm font-semibold text-red-800 mb-2">
                Détails de l'erreur (mode développement) :
              </p>
              <pre className="text-xs text-red-700 font-mono whitespace-pre-wrap">
                {error.stack}
              </pre>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => window.history.back()}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Retour
            </button>

            <Link
              to="/"
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-terracotta-500 hover:bg-terracotta-600 text-white font-semibold rounded-lg transition-colors"
            >
              <Home className="w-5 h-5" />
              Accueil
            </Link>
          </div>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 text-center">
              Si le problème persiste, veuillez contacter notre support technique.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
