import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { RefreshCw, AlertCircle, Wifi, Database, Shield, Clock, HelpCircle } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();
  const { user, profile, loading, initialize, profileError, clearProfileError, forceRefresh, retryCount } = useAuthStore();
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!profile && !loading) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [profile, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terracotta-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/connexion" state={{ from: location }} replace />;
  }

  if (!profile && !loadingTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-terracotta-100 rounded-full mb-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-terracotta-500"></div>
          </div>
          <p className="text-lg font-semibold text-gray-900 mb-2">Chargement du profil...</p>
          <p className="text-sm text-gray-600">Veuillez patienter quelques instants</p>
        </div>
      </div>
    );
  }

  const handleRetry = async () => {
    setRetrying(true);
    setLoadingTimeout(false);
    clearProfileError();
    await forceRefresh();
    setTimeout(() => setRetrying(false), 1000);
  };

  const getErrorIcon = () => {
    if (!profileError) return <AlertCircle className="w-8 h-8" />;

    switch (profileError.type) {
      case 'network':
        return <Wifi className="w-8 h-8" />;
      case 'database':
        return <Database className="w-8 h-8" />;
      case 'permission':
        return <Shield className="w-8 h-8" />;
      case 'timeout':
        return <Clock className="w-8 h-8" />;
      case 'not_found':
        return <HelpCircle className="w-8 h-8" />;
      default:
        return <AlertCircle className="w-8 h-8" />;
    }
  };

  const getErrorColor = () => {
    if (!profileError) return 'red';

    switch (profileError.type) {
      case 'network':
        return 'orange';
      case 'permission':
        return 'red';
      case 'not_found':
        return 'yellow';
      default:
        return 'red';
    }
  };

  if ((!profile && loadingTimeout) || profileError) {
    const errorColor = getErrorColor();

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-coral-50">
        <div className="max-w-lg w-full mx-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-100">
            <div className={`inline-flex items-center justify-center w-16 h-16 bg-${errorColor}-100 rounded-full mb-6`}>
              <div className={`text-${errorColor}-600`}>
                {getErrorIcon()}
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              {profileError?.message || 'Problème de chargement'}
            </h2>

            <p className="text-gray-600 mb-4">
              {profileError?.details || 'Impossible de charger votre profil. Cela peut être dû à un problème de connexion.'}
            </p>

            {retryCount > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Tentative {retryCount + 1}/6</strong> - Nouvelle tentative en cours...
                </p>
              </div>
            )}

            {(profileError?.type === 'network' || profileError?.type === 'permission') && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-amber-800 mb-2">
                  <strong>Conseils :</strong>
                </p>
                <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                  <li>Vérifiez votre connexion Internet</li>
                  <li>Réessayez dans quelques instants</li>
                  <li>Contactez le support si le problème persiste</li>
                </ul>
              </div>
            )}

            {profileError?.type === 'not_found' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  <strong>Votre profil n'a pas été trouvé.</strong> Cela peut arriver si votre compte vient d'être créé.
                  Veuillez contacter le support à <strong>support@montoit.ci</strong>
                </p>
              </div>
            )}


            <div className="space-y-3">
              <button
                onClick={handleRetry}
                disabled={retrying || loading}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-terracotta-500 text-white rounded-xl hover:bg-terracotta-600 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <RefreshCw className={`w-5 h-5 ${retrying || loading ? 'animate-spin' : ''}`} />
                {retrying || loading ? 'Nouvelle tentative...' : 'Réessayer'}
              </button>

              <button
                onClick={() => window.location.href = '/connexion'}
                className="w-full px-6 py-3 text-gray-700 hover:text-gray-900 transition-colors font-medium border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50"
              >
                Retour à la connexion
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 text-center">
                Besoin d'aide ? Contactez-nous à <a href="mailto:support@montoit.ci" className="text-terracotta-600 hover:text-terracotta-700 font-medium">support@montoit.ci</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile.profile_setup_completed && location.pathname !== '/choix-profil') {
    return <Navigate to="/choix-profil" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = profile.active_role || profile.user_type;
    if (!allowedRoles.includes(userRole)) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès refusé</h2>
            <p className="text-gray-600">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
            <button
              onClick={() => window.history.back()}
              className="mt-4 px-4 py-2 bg-terracotta-500 text-white rounded hover:bg-terracotta-600"
            >
              Retour
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
