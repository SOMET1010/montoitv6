import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Key, Save, Eye, EyeOff, RefreshCw, CheckCircle, XCircle, Activity, AlertCircle } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface ApiKey {
  id: string;
  service_name: string;
  display_name: string;
  description: string;
  keys: Record<string, string>;
  is_active: boolean;
  environment: 'sandbox' | 'production';
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ApiKeyLog {
  id: string;
  service_name: string;
  action: string;
  status: string;
  created_at: string;
}

export default function AdminApiKeys() {
  const { user, profile } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [logs, setLogs] = useState<ApiKeyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [selectedService, setSelectedService] = useState<ApiKey | null>(null);
  const [editedKeys, setEditedKeys] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (user && profile?.user_type === 'admin_ansut') {
      loadApiKeys();
      loadLogs();
    }
  }, [user, profile]);

  const loadApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('service_name');

      if (error) throw error;
      setApiKeys(data || []);
    } catch (err: any) {
      console.error('Error loading API keys:', err);
      setError('Erreur lors du chargement des clés API');
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('api_key_logs')
        .select('id, service_name, action, status, created_at')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (err: any) {
      console.error('Error loading logs:', err);
    }
  };

  const handleEditService = (service: ApiKey) => {
    setSelectedService(service);
    setEditedKeys(service.keys);
    setError('');
    setSuccess('');
  };

  const handleSaveKeys = async () => {
    if (!selectedService) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase
        .from('api_keys')
        .update({
          keys: editedKeys,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedService.id);

      if (error) throw error;

      setSuccess('Clés API mises à jour avec succès');
      await loadApiKeys();
      setTimeout(() => {
        setSelectedService(null);
        setSuccess('');
      }, 2000);
    } catch (err: any) {
      console.error('Error saving keys:', err);
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (service: ApiKey) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: !service.is_active })
        .eq('id', service.id);

      if (error) throw error;
      await loadApiKeys();
    } catch (err: any) {
      console.error('Error toggling service:', err);
      setError(err.message);
    }
  };

  const handleToggleEnvironment = async (service: ApiKey) => {
    try {
      const newEnv = service.environment === 'sandbox' ? 'production' : 'sandbox';
      const { error } = await supabase
        .from('api_keys')
        .update({ environment: newEnv })
        .eq('id', service.id);

      if (error) throw error;
      await loadApiKeys();
    } catch (err: any) {
      console.error('Error toggling environment:', err);
      setError(err.message);
    }
  };

  const maskKey = (key: string) => {
    if (!key || key.length < 8) return key;
    return key.substring(0, 4) + '****' + key.substring(key.length - 4);
  };

  const getServiceIcon = (serviceName: string) => {
    const icons: Record<string, string> = {
      resend: '📧',
      brevo: '📱',
      orange_money: '🟠',
      mtn_money: '🟡',
      moov_money: '🔵',
      wave: '🌊',
      cryptoneo: '🔏',
      mapbox: '🗺️',
      firebase: '🔔',
      sentry: '🐛',
      oneci: '🆔',
      cnam: '🏥',
      smile_id: '😊'
    };
    return icons[serviceName] || '🔑';
  };

  if (!user || profile?.user_type !== 'admin_ansut') {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Accès refusé
            </h2>
            <p className="text-gray-600">
              Cette page est réservée aux administrateurs ANSUT
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <Key className="w-10 h-10 text-blue-600" />
              <h1 className="text-4xl font-bold text-gray-900">Gestion des clés API</h1>
            </div>
            <p className="text-gray-600 text-lg">
              Configurez les clés API pour tous les services externes de la plateforme
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Services configurés</h2>

                {apiKeys.map((service) => (
                  <div
                    key={service.id}
                    className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-3xl">{getServiceIcon(service.service_name)}</span>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{service.display_name}</h3>
                          <p className="text-sm text-gray-600">{service.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleActive(service)}
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            service.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {service.is_active ? 'Actif' : 'Inactif'}
                        </button>
                        <button
                          onClick={() => handleToggleEnvironment(service)}
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            service.environment === 'production'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {service.environment === 'production' ? 'Production' : 'Sandbox'}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {Object.entries(service.keys).map(([keyName, keyValue]) => (
                        <div key={keyName} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm font-medium text-gray-700">{keyName}:</span>
                          <span className="text-sm text-gray-600">
                            {keyValue ? maskKey(keyValue as string) : '❌ Non configuré'}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {service.last_used_at
                          ? `Dernière utilisation: ${new Date(service.last_used_at).toLocaleString('fr-FR')}`
                          : 'Jamais utilisé'}
                      </span>
                      <button
                        onClick={() => handleEditService(service)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
                      >
                        Configurer
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Activity className="w-6 h-6 text-blue-600" />
                    <h3 className="text-xl font-bold text-gray-900">Activité récente</h3>
                  </div>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {logs.length === 0 ? (
                      <p className="text-sm text-gray-500">Aucune activité</p>
                    ) : (
                      logs.map((log) => (
                        <div key={log.id} className="p-2 bg-gray-50 rounded text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-gray-900">{log.service_name}</span>
                            {log.status === 'success' ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                          </div>
                          <p className="text-gray-600">{log.action}</p>
                          <p className="text-gray-400">
                            {new Date(log.created_at).toLocaleString('fr-FR')}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-blue-900 mb-3">Sécurité</h3>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>Clés cryptées en base de données</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>Accès restreint aux admins ANSUT</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>Logs de toutes les utilisations</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>RLS activé sur toutes les tables</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {getServiceIcon(selectedService.service_name)} {selectedService.display_name}
                </h2>
                <button
                  onClick={() => setSelectedService(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-green-700">{success}</p>
                </div>
              )}

              <div className="space-y-4">
                {Object.entries(editedKeys).map(([keyName, keyValue]) => (
                  <div key={keyName}>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      {keyName}
                    </label>
                    <div className="relative">
                      <input
                        type={showKeys[keyName] ? 'text' : 'password'}
                        value={keyValue as string}
                        onChange={(e) => setEditedKeys({ ...editedKeys, [keyName]: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 pr-12"
                        placeholder={`Entrez votre ${keyName}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowKeys({ ...showKeys, [keyName]: !showKeys[keyName] })}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showKeys[keyName] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex space-x-4">
                <button
                  onClick={() => setSelectedService(null)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-bold"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveKeys}
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Sauvegarde...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Sauvegarder</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
