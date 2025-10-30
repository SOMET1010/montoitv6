import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Settings,
  Save,
  AlertTriangle,
  CheckCircle,
  Power,
  ArrowUp,
  ArrowDown,
  DollarSign,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface ServiceConfig {
  id: string;
  service_name: string;
  provider: string;
  is_enabled: boolean;
  priority: number;
  config: Record<string, any>;
}

interface GroupedConfigs {
  [serviceName: string]: ServiceConfig[];
}

export default function AdminServiceConfiguration() {
  const { user, profile } = useAuth();
  const [configs, setConfigs] = useState<ServiceConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const serviceLabels: Record<string, string> = {
    chatbot: '🤖 Chatbot IA',
    sms: '💬 SMS',
    whatsapp: '📱 WhatsApp',
    email: '📧 Email',
    maps: '🗺️ Cartographie',
    face_recognition: '👤 Reconnaissance Faciale',
    speech_to_text: '🎤 Reconnaissance Vocale',
    text_to_speech: '🔊 Synthèse Vocale',
    translation: '🌐 Traduction',
  };

  const providerCosts: Record<string, Record<string, string>> = {
    sms: { intouch: '25 FCFA/SMS (50% moins cher)', azure: '50 FCFA/SMS', brevo: '30 FCFA/SMS' },
    maps: { azure: '2 250 FCFA/1K (10% moins cher)', mapbox: '2 500 FCFA/1K' },
    face_recognition: { azure: '750 FCFA/1K (20% moins cher)', smile_id: '900 FCFA/1K' },
  };

  useEffect(() => {
    if (user && profile?.user_type === 'admin_ansut') {
      loadConfigs();
    }
  }, [user, profile]);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('service_configurations')
        .select('*')
        .order('service_name')
        .order('priority');

      if (error) throw error;
      setConfigs(data || []);
    } catch (err: any) {
      console.error('Error loading configs:', err);
      setError('Erreur lors du chargement des configurations');
    } finally {
      setLoading(false);
    }
  };

  const toggleEnabled = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('service_configurations')
        .update({ is_enabled: !currentState, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setSuccess(`Service ${!currentState ? 'activé' : 'désactivé'} avec succès`);
      await loadConfigs();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error updating config:', err);
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const updatePriority = async (id: string, newPriority: number) => {
    try {
      const { error } = await supabase
        .from('service_configurations')
        .update({ priority: newPriority, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setSuccess('Priorité mise à jour avec succès');
      await loadConfigs();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error updating priority:', err);
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const optimizeCosts = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.rpc('optimize_service_costs');

      if (error) throw error;

      setSuccess('Coûts optimisés avec succès ! Les services les moins chers sont maintenant prioritaires.');
      await loadConfigs();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      console.error('Error optimizing costs:', err);
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (!user || profile?.user_type !== 'admin_ansut') {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Accès refusé</h2>
            <p className="text-gray-600">
              Cette page est réservée aux administrateurs ANSUT
            </p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const groupedConfigs: GroupedConfigs = configs.reduce((acc, config) => {
    if (!acc[config.service_name]) {
      acc[config.service_name] = [];
    }
    acc[config.service_name].push(config);
    return acc;
  }, {} as GroupedConfigs);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Settings className="w-10 h-10 text-blue-600" />
                <h1 className="text-4xl font-bold text-gray-900">
                  Configuration des Services
                </h1>
              </div>
              <p className="text-gray-600 text-lg">
                Gérez les providers principaux et de fallback pour chaque service
              </p>
            </div>
            <button
              onClick={optimizeCosts}
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              <DollarSign className="w-5 h-5" />
              <span>{saving ? 'Optimisation...' : 'Optimiser les Coûts'}</span>
            </button>
          </div>

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-green-700">{success}</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedConfigs).map(([serviceName, serviceConfigs]) => (
                <div key={serviceName} className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {serviceLabels[serviceName] || serviceName}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {serviceConfigs.length} provider(s) configuré(s) • Fallback automatique activé
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Provider
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Coût
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Statut
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Priorité
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {serviceConfigs.map((config) => (
                          <tr key={config.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <span className="font-semibold text-gray-900 capitalize">
                                {config.provider}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {providerCosts[serviceName]?.[config.provider] || 'N/A'}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                                  config.is_enabled
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {config.is_enabled ? '✓ Activé' : '✗ Désactivé'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <select
                                  value={config.priority}
                                  onChange={(e) =>
                                    updatePriority(config.id, parseInt(e.target.value))
                                  }
                                  className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option value={1}>1 - Principal</option>
                                  <option value={2}>2 - Fallback</option>
                                  <option value={3}>3 - Tertiary</option>
                                </select>
                                {config.priority === 1 && (
                                  <span className="text-green-600">
                                    <ArrowUp className="w-4 h-4" />
                                  </span>
                                )}
                                {config.priority === 2 && (
                                  <span className="text-yellow-600">
                                    <ArrowDown className="w-4 h-4" />
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => toggleEnabled(config.id, config.is_enabled)}
                                className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg transition font-semibold ${
                                  config.is_enabled
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                              >
                                <Power className="w-4 h-4" />
                                <span>{config.is_enabled ? 'Désactiver' : 'Activer'}</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-blue-900 mb-3">
              ℹ️ Comment fonctionne le système de fallback ?
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start space-x-2">
                <span className="font-bold">1.</span>
                <span>Le système essaie d'abord le provider avec la <strong>priorité 1</strong> (Principal)</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-bold">2.</span>
                <span>Si le principal échoue, il bascule automatiquement sur la <strong>priorité 2</strong> (Fallback)</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-bold">3.</span>
                <span>Si le fallback échoue aussi, il essaie la <strong>priorité 3</strong> (Tertiary) si configurée</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-bold">4.</span>
                <span>Tous les appels sont <strong>loggés</strong> pour monitoring et alertes</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-bold">💡</span>
                <span>Utilisez <strong>Optimiser les Coûts</strong> pour basculer automatiquement vers les providers les moins chers</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
