import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Shield, CheckCircle, XCircle, Clock, AlertCircle, RefreshCw, FileText } from 'lucide-react';
import Header from '../../components/ui/Header';
import Footer from '../../components/ui/Footer';

interface Certificate {
  id: string;
  certificate_id: string;
  provider: string;
  status: string;
  issued_at: string;
  expires_at: string;
  revoked_at: string | null;
  certificate_data: any;
}

interface SignatureHistory {
  id: string;
  lease_id: string;
  action: string;
  signature_type: string;
  created_at: string;
  metadata: any;
}

export default function MyCertificates() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [signatureHistory, setSignatureHistory] = useState<SignatureHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      loadCertificatesAndHistory();
    }
  }, [user]);

  const loadCertificatesAndHistory = async () => {
    try {
      const [certsRes, historyRes] = await Promise.all([
        supabase
          .from('digital_certificates')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('signature_history')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(20)
      ]);

      if (certsRes.error) throw certsRes.error;
      if (historyRes.error) throw historyRes.error;

      setCertificates(certsRes.data || []);
      setSignatureHistory(historyRes.data || []);
    } catch (err: any) {
      console.error('Error loading certificates:', err);
      setError(err.message || 'Erreur lors du chargement des certificats');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, expiresAt: string) => {
    const daysUntilExpiry = Math.floor((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    if (status === 'revoked') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300 flex items-center space-x-1">
          <XCircle className="w-3 h-3" />
          <span>Révoqué</span>
        </span>
      );
    }

    if (daysUntilExpiry < 0) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 border border-gray-300 flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>Expiré</span>
        </span>
      );
    }

    if (daysUntilExpiry < 30) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center space-x-1">
          <AlertCircle className="w-3 h-3" />
          <span>Expire bientôt ({daysUntilExpiry}j)</span>
        </span>
      );
    }

    if (status === 'active') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-300 flex items-center space-x-1">
          <CheckCircle className="w-3 h-3" />
          <span>Actif</span>
        </span>
      );
    }

    return (
      <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-300 flex items-center space-x-1">
        <Clock className="w-3 h-3" />
        <span>En attente</span>
      </span>
    );
  };

  const getActionLabel = (action: string) => {
    const labels: { [key: string]: string } = {
      'otp_verified': 'OTP Vérifié',
      'document_signed': 'Document Signé',
      'certificate_requested': 'Certificat Demandé',
      'certificate_issued': 'Certificat Émis',
    };
    return labels[action] || action;
  };

  if (!user) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Connexion requise
            </h2>
            <p className="text-gray-600">
              Veuillez vous connecter pour accéder à vos certificats
            </p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-coral-50 pt-20 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="w-10 h-10 text-terracotta-600" />
              <h1 className="text-4xl font-bold text-gradient">Mes Certificats Numériques</h1>
            </div>
            <p className="text-gray-600 text-lg">
              Gérez vos certificats CryptoNeo pour la signature électronique de documents
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3 mb-6">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start space-x-3 mb-6">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-green-700">{success}</p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terracotta-500 mx-auto"></div>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center justify-between">
                    <span>Certificats</span>
                    <button
                      onClick={loadCertificatesAndHistory}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Actualiser"
                    >
                      <RefreshCw className="w-5 h-5 text-gray-600" />
                    </button>
                  </h2>

                  {certificates.length === 0 ? (
                    <div className="text-center py-12">
                      <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">Aucun certificat numérique</p>
                      <p className="text-sm text-gray-500">
                        Un certificat sera créé automatiquement lors de votre première signature
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {certificates.map((cert) => {
                        const daysUntilExpiry = Math.floor(
                          (new Date(cert.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                        );

                        return (
                          <div
                            key={cert.id}
                            className="border-2 border-gray-200 rounded-xl p-6 hover:border-terracotta-300 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-terracotta-500 to-coral-500 flex items-center justify-center">
                                  <Shield className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                  <h3 className="font-bold text-gray-900">
                                    Certificat {cert.provider.toUpperCase()}
                                  </h3>
                                  <p className="text-sm text-gray-600">
                                    ID: {cert.certificate_id}
                                  </p>
                                </div>
                              </div>
                              {getStatusBadge(cert.status, cert.expires_at)}
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-600 mb-1">Émis le</p>
                                <p className="font-medium text-gray-900">
                                  {new Date(cert.issued_at).toLocaleDateString('fr-FR')}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600 mb-1">Expire le</p>
                                <p className="font-medium text-gray-900">
                                  {new Date(cert.expires_at).toLocaleDateString('fr-FR')}
                                </p>
                              </div>
                            </div>

                            {daysUntilExpiry >= 0 && daysUntilExpiry < 30 && (
                              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <p className="text-sm text-amber-800">
                                  ⚠️ Ce certificat expire dans {daysUntilExpiry} jours. Un renouvellement automatique sera effectué.
                                </p>
                              </div>
                            )}

                            {cert.revoked_at && (
                              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-sm text-red-800">
                                  Révoqué le {new Date(cert.revoked_at).toLocaleDateString('fr-FR')}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-200 rounded-2xl p-6">
                  <h3 className="font-bold text-cyan-900 mb-3 flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5" />
                    <span>À propos des certificats numériques</span>
                  </h3>
                  <ul className="space-y-2 text-sm text-cyan-800">
                    <li className="flex items-start space-x-2">
                      <span className="text-cyan-600 font-bold">•</span>
                      <span>Les certificats sont automatiquement créés lors de votre première signature</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-cyan-600 font-bold">•</span>
                      <span>Chaque certificat est valide pendant 365 jours</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-cyan-600 font-bold">•</span>
                      <span>Le renouvellement est automatique 30 jours avant expiration</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-cyan-600 font-bold">•</span>
                      <span>Vos signatures sont sécurisées par CryptoNeo et juridiquement valables</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                    <FileText className="w-6 h-6 text-terracotta-600" />
                    <span>Historique des signatures</span>
                  </h3>

                  {signatureHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-600">Aucune signature effectuée</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {signatureHistory.map((item) => (
                        <div
                          key={item.id}
                          className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <p className="font-medium text-sm text-gray-900">
                              {getActionLabel(item.action)}
                            </p>
                            {item.signature_type && (
                              <span className="text-xs px-2 py-0.5 bg-terracotta-100 text-terracotta-700 rounded-full font-medium">
                                {item.signature_type}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600">
                            {new Date(item.created_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          {item.lease_id && (
                            <a
                              href={`/contrat/${item.lease_id}`}
                              className="text-xs text-terracotta-600 hover:text-terracotta-700 font-medium mt-1 inline-block"
                            >
                              Voir le bail →
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
