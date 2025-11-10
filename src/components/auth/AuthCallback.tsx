import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Loader } from 'lucide-react';

export default function AuthCallback() {
  const { user, profile, loading } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const errorParam = hashParams.get('error');
      const errorDescription = hashParams.get('error_description');

      if (errorParam) {
        setError(errorDescription || 'Erreur lors de l\'authentification');
        setTimeout(() => {
          window.location.href = '/connexion';
        }, 3000);
        return;
      }

      if (user && !loading) {
        if (!profile?.profile_setup_completed) {
          window.location.href = '/choix-profil';
        } else {
          window.location.href = '/';
        }
      }
    };

    if (!loading) {
      const timer = setTimeout(() => {
        handleCallback();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [user, profile, loading]);

  return (
    <div className="min-h-screen bg-warm-50 flex items-center justify-center">
      <div className="text-center">
        {error ? (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-3xl">❌</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Erreur</h2>
            <p className="text-gray-600">{error}</p>
            <p className="text-sm text-gray-500">Redirection vers la page de connexion...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Loader className="w-16 h-16 text-terracotta-600 mx-auto animate-spin" />
            <h2 className="text-2xl font-bold text-gray-900">Connexion en cours...</h2>
            <p className="text-gray-600">Veuillez patienter</p>
          </div>
        )}
      </div>
    </div>
  );
}
