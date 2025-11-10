import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  Server,
  Activity,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import Header from '../../components/ui/Header';
import Footer from '../../components/ui/Footer';
import { serviceProviderFactory } from '../../services/providers/serviceProviderFactory';

interface ProviderConfig {
  id: string;
  service_name: string;
  display_name: string;
  provider_type: string;
  priority: number;
  health_status: string;
  last_health_check: string;
  response_time_ms: number;
  success_rate: number;
  is_active: boolean;
}

interface ServiceCategory {
  name: string;
  displayName: string;
  providers: ProviderConfig[];
}

interface ProviderStats {
  totalCalls: number;
  successRate: number;
  avgResponseTime: number;
  totalCostFcfa: number;
  totalCostUsd: number;
}

export default function AdminServiceProviders() {
  const { user, profile } = useAuth();
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [stats, setStats] = useState<ProviderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const categories = [
    { name: 'chatbot', displayName: 'Chatbot IA', icon: '🤖' },
    { name: 'speech_recognition', displayName: 'Reconnaissance vocale', icon: '🎤' },
    { name: 'speech_synthesis', displayName: 'Synthèse vocale', icon: '🔊' },
    { name: 'face_recognition', displayName: 'Reconnaissance faciale', icon: '👤' },
    { name: 'computer_vision', displayName: 'Vision par ordinateur', icon: '👁️' },
    { name: 'document_extraction', displayName: 'Extraction de documents', icon: '📄' },
    { name: 'translation', displayName: 'Traduction', icon: '🌐' },
    { name: 'maps', displayName: 'Cartographie', icon: '🗺️' },
    { name: 'sms', displayName: 'SMS', icon: '💬' },
    { name: 'email', displayName: 'Email', icon: '📧' },
    { name: 'whatsapp', displayName: 'WhatsApp', icon: '📱' },
  ];

  useEffect(() => {
    if (user && profile?.user_type === 'admin_ansut') {
      loadProviders();
    }
  }, [user, profile]);

  useEffect(() => {
    if (selectedCategory) {
      loadCategoryStats(selectedCategory);
    }
  }, [selectedCategory]);

  const loadProviders = async () => {
    setLoading(true);
    try {
      const { data: providers, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('service_name');

      if (error) throw error;

      const grouped = categories.map((cat) => {
        const categoryProviders = (providers || []).filter((p: any) =>
          p.service_name.includes(cat.name.split('_')[0])
        );
        return {
          name: cat.name,
          displayName: cat.displayName,
          providers: categoryProviders,
        };
      }).filter((cat) => cat.providers.length > 0);

      setServiceCategories(grouped);
    } catch (error) {
      console.error('Error loading providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryStats = async (category: string) => {
    try {
      const stats = await serviceProviderFactory.getProviderStats(category);
      setStats(stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    serviceProviderFactory.clearCache();
    await loadProviders();
    if (selectedCategory) {
      await loadCategoryStats(selectedCategory);
    }
    setRefreshing(false);
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      case 'unhealthy':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4" />;
      case 'degraded':
        return <AlertTriangle className="w-4 h-4" />;
      case 'unhealthy':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
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

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Server className="w-10 h-10 text-blue-600" />
                <h1 className="text-4xl font-bold text-gray-900">
                  Gestion des Services Providers
                </h1>
              </div>
              <p className="text-gray-600 text-lg">
                Gérez les providers Azure et les services alternatifs avec failover automatique
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Actualiser</span>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Catégories de services
                </h2>

                {serviceCategories.map((category) => (
                  <div
                    key={category.name}
                    className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition"
                    onClick={() => setSelectedCategory(category.name)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900">
                        {category.displayName}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {category.providers.length} provider(s)
                      </span>
                    </div>

                    <div className="space-y-3">
                      {category.providers.map((provider) => (
                        <div
                          key={provider.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`p-2 rounded-full ${getHealthColor(provider.health_status)}`}
                            >
                              {getHealthIcon(provider.health_status)}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {provider.display_name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {provider.provider_type} • Priorité {provider.priority}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900">
                              {provider.response_time_ms || 0}ms
                            </p>
                            <p className="text-xs text-gray-500">
                              {provider.success_rate || 0}% succès
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-6">
                {selectedCategory && stats && (
                  <>
                    <div className="bg-white rounded-xl shadow-lg p-6">
                      <div className="flex items-center space-x-2 mb-4">
                        <BarChart3 className="w-6 h-6 text-blue-600" />
                        <h3 className="text-xl font-bold text-gray-900">Statistiques</h3>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Total d'appels</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {stats.totalCalls.toLocaleString()}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600 mb-1">Taux de succès</p>
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${stats.successRate}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-gray-900">
                              {stats.successRate.toFixed(1)}%
                            </span>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600 mb-1">Temps de réponse moyen</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {stats.avgResponseTime}ms
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600 mb-1">Coût total (FCFA)</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {stats.totalCostFcfa.toLocaleString()} FCFA
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600 mb-1">Coût total (USD)</p>
                          <p className="text-2xl font-bold text-gray-900">
                            ${stats.totalCostUsd.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
                      <div className="flex items-center space-x-2 mb-4">
                        <Settings className="w-6 h-6 text-blue-600" />
                        <h3 className="text-lg font-bold text-blue-900">Failover automatique</h3>
                      </div>
                      <ul className="space-y-2 text-sm text-blue-800">
                        <li className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>Bascule automatique en cas d'échec</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>Réessais automatiques configurables</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>Monitoring de santé en temps réel</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>Logs détaillés de tous les basculements</span>
                        </li>
                      </ul>
                    </div>
                  </>
                )}

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <DollarSign className="w-6 h-6 text-green-600" />
                    <h3 className="text-lg font-bold text-gray-900">Optimisation des coûts</h3>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start space-x-2">
                      <TrendingUp className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
                      <span>Azure OpenAI GPT-3.5 : 70% moins cher que GPT-4</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <TrendingUp className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
                      <span>Azure Maps : 10% moins cher que Mapbox</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <TrendingUp className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
                      <span>WhatsApp : 70% moins cher que SMS</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <TrendingUp className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
                      <span>Cache intelligent pour réduire les appels</span>
                    </li>
                  </ul>
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
