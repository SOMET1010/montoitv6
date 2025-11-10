import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  RefreshCw,
  Download,
} from 'lucide-react';
import Header from '../../components/ui/Header';
import Footer from '../../components/ui/Footer';

interface ServiceStats {
  service_name: string;
  provider: string;
  success_count: number;
  failure_count: number;
  success_rate: number;
  avg_response_time: number;
}

interface TimeRange {
  label: string;
  value: string;
}

export default function AdminServiceMonitoring() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<ServiceStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('24 hours');

  const timeRanges: TimeRange[] = [
    { label: '1 heure', value: '1 hour' },
    { label: '24 heures', value: '24 hours' },
    { label: '7 jours', value: '7 days' },
    { label: '30 jours', value: '30 days' },
  ];

  useEffect(() => {
    if (user && profile?.user_type === 'admin_ansut') {
      loadStats();
    }
  }, [user, profile, selectedTimeRange]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_service_stats', {
        service_filter: null,
        time_range: selectedTimeRange,
      });

      if (error) throw error;
      setStats(data || []);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const handleRunHealthCheck = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/service-health-check`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        }
      );

      const result = await response.json();
      alert(result.message);
      await loadStats();
    } catch (error) {
      console.error('Error running health check:', error);
      alert('Erreur lors de la vérification de santé');
    }
  };

  const getStatusColor = (successRate: number) => {
    if (successRate >= 95) return 'text-green-600 bg-green-100';
    if (successRate >= 80) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusIcon = (successRate: number) => {
    if (successRate >= 95) return <CheckCircle className="w-5 h-5" />;
    if (successRate >= 80) return <AlertTriangle className="w-5 h-5" />;
    return <AlertTriangle className="w-5 h-5" />;
  };

  const getTrendIcon = (successRate: number) => {
    if (successRate >= 95) return <TrendingUp className="w-4 h-4 text-green-600" />;
    return <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  const exportStats = () => {
    const csv = [
      ['Service', 'Provider', 'Success Rate', 'Success Count', 'Failure Count', 'Avg Response Time (ms)'],
      ...stats.map(s => [
        s.service_name,
        s.provider,
        `${s.success_rate.toFixed(2)}%`,
        s.success_count,
        s.failure_count,
        s.avg_response_time?.toFixed(2) || 'N/A',
      ]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `service-stats-${new Date().toISOString()}.csv`;
    a.click();
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

  const totalCalls = stats.reduce((sum, s) => sum + s.success_count + s.failure_count, 0);
  const totalSuccess = stats.reduce((sum, s) => sum + s.success_count, 0);
  const overallSuccessRate = totalCalls > 0 ? (totalSuccess / totalCalls) * 100 : 0;
  const avgResponseTime = stats.length > 0
    ? stats.reduce((sum, s) => sum + (s.avg_response_time || 0), 0) / stats.length
    : 0;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Activity className="w-10 h-10 text-blue-600" />
                <h1 className="text-4xl font-bold text-gray-900">
                  Monitoring des Services
                </h1>
              </div>
              <p className="text-gray-600 text-lg">
                Surveillance en temps réel de tous les services et providers
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {timeRanges.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Actualiser</span>
              </button>
              <button
                onClick={handleRunHealthCheck}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Activity className="w-5 h-5" />
                <span>Vérifier Santé</span>
              </button>
              <button
                onClick={exportStats}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                <Download className="w-5 h-5" />
                <span>Exporter</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Total d'Appels</span>
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {totalCalls.toLocaleString()}
                  </p>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Taux de Réussite</span>
                    {getStatusIcon(overallSuccessRate)}
                  </div>
                  <p className={`text-3xl font-bold ${overallSuccessRate >= 95 ? 'text-green-600' : overallSuccessRate >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {overallSuccessRate.toFixed(1)}%
                  </p>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Temps Réponse Moy.</span>
                    <Clock className="w-6 h-6 text-purple-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {avgResponseTime.toFixed(0)}ms
                  </p>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Services Actifs</span>
                    <Activity className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.length}
                  </p>
                </div>
              </div>

              {/* Facial Verification Cost Savings Section */}
              {stats.filter(s => s.service_name === 'face_recognition').length > 0 && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg p-6 mb-8 border-2 border-green-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Activity className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Reconnaissance Faciale - Économies</h2>
                      <p className="text-sm text-gray-600">Comparaison des coûts entre les providers</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {stats.filter(s => s.service_name === 'face_recognition').map((faceStats) => {
                      const costPerVerification = faceStats.provider === 'smileless' ? 0 :
                                                  faceStats.provider === 'azure' ? 0.75 : 0.90;
                      const totalCost = (faceStats.success_count + faceStats.failure_count) * costPerVerification;
                      const costSavedVsAzure = (faceStats.success_count + faceStats.failure_count) * 0.75;

                      return (
                        <div key={faceStats.provider} className="bg-white rounded-lg p-4 shadow">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-900 capitalize">{faceStats.provider}</span>
                            {faceStats.provider === 'smileless' && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded">
                                GRATUIT
                              </span>
                            )}
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Vérifications:</span>
                              <span className="font-semibold">{faceStats.success_count + faceStats.failure_count}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Taux de réussite:</span>
                              <span className={`font-semibold ${faceStats.success_rate >= 95 ? 'text-green-600' : 'text-yellow-600'}`}>
                                {faceStats.success_rate.toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex justify-between text-sm border-t pt-2">
                              <span className="text-gray-600">Coût total:</span>
                              <span className="font-bold text-lg">
                                {faceStats.provider === 'smileless' ? (
                                  <span className="text-green-600">0 FCFA</span>
                                ) : (
                                  <span className="text-gray-900">{totalCost.toFixed(2)} FCFA</span>
                                )}
                              </span>
                            </div>
                            {faceStats.provider === 'smileless' && costSavedVsAzure > 0 && (
                              <div className="bg-green-50 rounded p-2 text-center">
                                <p className="text-xs text-green-700">Économie vs Azure:</p>
                                <p className="font-bold text-green-600">{costSavedVsAzure.toFixed(2)} FCFA</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">
                    Détails par Service et Provider
                  </h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Service
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Provider
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Taux de Réussite
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Succès
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Échecs
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Temps Réponse
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tendance
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {stats.map((stat, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-semibold text-gray-900 capitalize">
                              {stat.service_name.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-gray-600 capitalize">{stat.provider}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(stat.success_rate)}`}>
                              {stat.success_rate.toFixed(2)}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                            {stat.success_count.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
                            {stat.failure_count.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {stat.avg_response_time ? `${stat.avg_response_time.toFixed(0)}ms` : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getTrendIcon(stat.success_rate)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
