import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();
  const { user, profile, loading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

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

  const [loadingTimeout, setLoadingTimeout] = useState(false);

  useEffect(() => {
    if (!profile && !loading) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [profile, loading]);

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

  if (!profile && loadingTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Problème de chargement</h2>
            <p className="text-gray-600 mb-6">
              Impossible de charger votre profil. Cela peut être dû à un problème de connexion.
            </p>
            <button
              onClick={() => {
                setLoadingTimeout(false);
                initialize();
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600 transition-colors font-semibold"
            >
              <RefreshCw className="w-5 h-5" />
              Réessayer
            </button>
            <button
              onClick={() => window.location.href = '/connexion'}
              className="block w-full mt-3 px-6 py-3 text-gray-700 hover:text-gray-900 transition-colors"
            >
              Retour à la connexion
            </button>
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
