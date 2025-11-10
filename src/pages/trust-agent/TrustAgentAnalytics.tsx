import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, FileText, Download, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import SimpleBarChart from '../../components/charts/SimpleBarChart';
import SimpleLineChart from '../../components/charts/SimpleLineChart';

export default function TrustAgentAnalytics() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | '3months' | '6months'>('month');
  const [stats, setStats] = useState({
    totalValidations: 0,
    totalMediations: 0,
    totalModerations: 0,
    approvalRate: 0,
    mediationSuccessRate: 0,
    avgValidationTime: 0,
    avgMediationTime: 0
  });

  const [validationsChart, setValidationsChart] = useState<any[]>([]);
  const [disputesChart, setDisputesChart] = useState<any[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadStats(),
        loadValidationsChart(),
        loadDisputesChart()
      ]);
    } catch (err) {
      console.error('Erreur analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    const daysAgo = getPeriodDays();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const { data: validations } = await supabase
      .from('trust_validation_requests')
      .select('*')
      .gte('created_at', startDate.toISOString());

    const { data: disputes } = await supabase
      .from('disputes')
      .select('*')
      .gte('created_at', startDate.toISOString());

    const { data: moderation } = await supabase
      .from('moderation_queue')
      .select('*')
      .gte('created_at', startDate.toISOString());

    const completed = validations?.filter(v => v.status === 'approved' || v.status === 'rejected') || [];
    const approved = validations?.filter(v => v.status === 'approved') || [];
    const resolvedDisputes = disputes?.filter(d => d.status === 'resolved') || [];
    const allDisputes = disputes?.filter(d => d.status !== 'open') || [];

    const avgValTime = completed.length > 0
      ? completed.reduce((acc, v) => {
          if (!v.validated_at || !v.requested_at) return acc;
          const diff = new Date(v.validated_at).getTime() - new Date(v.requested_at).getTime();
          return acc + (diff / (1000 * 60 * 60));
        }, 0) / completed.length
      : 0;

    const avgMedTime = resolvedDisputes.length > 0
      ? resolvedDisputes.reduce((acc, d) => {
          if (!d.resolved_at || !d.opened_at) return acc;
          const diff = new Date(d.resolved_at).getTime() - new Date(d.opened_at).getTime();
          return acc + (diff / (1000 * 60 * 60 * 24));
        }, 0) / resolvedDisputes.length
      : 0;

    setStats({
      totalValidations: validations?.length || 0,
      totalMediations: disputes?.length || 0,
      totalModerations: moderation?.length || 0,
      approvalRate: completed.length > 0 ? (approved.length / completed.length) * 100 : 0,
      mediationSuccessRate: allDisputes.length > 0 ? (resolvedDisputes.length / allDisputes.length) * 100 : 0,
      avgValidationTime: avgValTime,
      avgMediationTime: avgMedTime
    });
  };

  const loadValidationsChart = async () => {
    const daysAgo = getPeriodDays();
    const data: any[] = [];

    for (let i = daysAgo; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const { data: validations } = await supabase
        .from('trust_validation_requests')
        .select('status')
        .gte('validated_at', date.toISOString())
        .lt('validated_at', nextDate.toISOString());

      const approved = validations?.filter(v => v.status === 'approved').length || 0;
      const rejected = validations?.filter(v => v.status === 'rejected').length || 0;

      data.push({
        name: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        Approuvées: approved,
        Rejetées: rejected
      });
    }

    setValidationsChart(data);
  };

  const loadDisputesChart = async () => {
    const daysAgo = getPeriodDays();
    const data: any[] = [];

    for (let i = daysAgo; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const { data: disputes } = await supabase
        .from('disputes')
        .select('*')
        .gte('opened_at', date.toISOString())
        .lt('opened_at', nextDate.toISOString());

      data.push({
        name: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        value: disputes?.length || 0
      });
    }

    setDisputesChart(data);
  };

  const getPeriodDays = () => {
    switch (period) {
      case 'week': return 7;
      case 'month': return 30;
      case '3months': return 90;
      case '6months': return 180;
      default: return 30;
    }
  };

  const handleExport = async () => {
    alert('Export PDF en développement - Fonctionnalité disponible prochainement');
  };

  if (!profile || profile.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès réservé</h2>
          <p className="text-gray-600">Cette page est réservée aux agents Tiers de Confiance.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Analytics & Rapports</h1>
                <p className="text-gray-600">Vue d'ensemble des performances</p>
              </div>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              Exporter PDF
            </button>
          </div>

          <div className="flex gap-2">
            <PeriodButton label="7 jours" active={period === 'week'} onClick={() => setPeriod('week')} />
            <PeriodButton label="30 jours" active={period === 'month'} onClick={() => setPeriod('month')} />
            <PeriodButton label="3 mois" active={period === '3months'} onClick={() => setPeriod('3months')} />
            <PeriodButton label="6 mois" active={period === '6months'} onClick={() => setPeriod('6months')} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            icon={Users}
            label="Validations"
            value={stats.totalValidations}
            subtitle={`${stats.approvalRate.toFixed(0)}% approuvées`}
            color="blue"
          />
          <MetricCard
            icon={FileText}
            label="Médiations"
            value={stats.totalMediations}
            subtitle={`${stats.mediationSuccessRate.toFixed(0)}% résolues`}
            color="green"
          />
          <MetricCard
            icon={TrendingUp}
            label="Modérations"
            value={stats.totalModerations}
            subtitle="Annonces examinées"
            color="orange"
          />
          <MetricCard
            icon={Calendar}
            label="Temps moyen"
            value={`${stats.avgValidationTime.toFixed(1)}h`}
            subtitle="Validation"
            color="purple"
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Validations par jour</h2>
            <div className="h-80">
              <SimpleBarChart
                data={validationsChart}
                dataKeys={['Approuvées', 'Rejetées']}
                colors={['#10b981', '#ef4444']}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📈 Litiges ouverts par jour</h2>
            <div className="h-80">
              <SimpleLineChart
                data={disputesChart}
                dataKey="value"
                color="#3b82f6"
              />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">🎯 Performance Globale</h2>
            <div className="space-y-4">
              <ProgressBar
                label="Taux d'approbation"
                value={stats.approvalRate}
                color="green"
                target={85}
              />
              <ProgressBar
                label="Taux de résolution litiges"
                value={stats.mediationSuccessRate}
                color="blue"
                target={75}
              />
              <div className="pt-4 border-t">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Temps moyen validation</span>
                  <span className="font-semibold">{stats.avgValidationTime.toFixed(1)}h</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Temps moyen médiation</span>
                  <span className="font-semibold">{stats.avgMediationTime.toFixed(1)} jours</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📝 Recommandations</h2>
            <div className="space-y-3">
              {stats.approvalRate < 80 && (
                <Alert
                  type="warning"
                  message="Le taux d'approbation est en dessous de l'objectif (85%). Vérifiez les critères de validation."
                />
              )}
              {stats.avgValidationTime > 24 && (
                <Alert
                  type="warning"
                  message="Le temps moyen de validation dépasse 24h. Considérez recruter un agent supplémentaire."
                />
              )}
              {stats.mediationSuccessRate >= 75 && (
                <Alert
                  type="success"
                  message="Excellent taux de résolution ! Les médiations sont efficaces."
                />
              )}
              {stats.totalValidations === 0 && (
                <Alert
                  type="info"
                  message="Aucune validation dans cette période. Système en attente de premières demandes."
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PeriodButton({ label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
        active
          ? 'bg-purple-600 text-white'
          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
      }`}
    >
      {label}
    </button>
  );
}

function MetricCard({ icon: Icon, label, value, subtitle, color }: any) {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    purple: 'from-purple-500 to-purple-600'
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <Icon className={`w-8 h-8 bg-gradient-to-r ${colors[color]} text-white p-1.5 rounded-lg mb-3`} />
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  );
}

function ProgressBar({ label, value, color, target }: any) {
  const percentage = Math.min(100, value);
  const isAboveTarget = value >= target;

  const colors = {
    green: isAboveTarget ? 'bg-green-600' : 'bg-yellow-600',
    blue: isAboveTarget ? 'bg-blue-600' : 'bg-orange-600'
  };

  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-gray-700">{label}</span>
        <span className="font-semibold">{value.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${colors[color]} transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">Objectif: {target}%</p>
    </div>
  );
}

function Alert({ type, message }: { type: 'success' | 'warning' | 'info'; message: string }) {
  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  const icons = {
    success: '✅',
    warning: '⚠️',
    info: 'ℹ️'
  };

  return (
    <div className={`border rounded-lg p-3 ${styles[type]}`}>
      <p className="text-sm">
        {icons[type]} {message}
      </p>
    </div>
  );
}
