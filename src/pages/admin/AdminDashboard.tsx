import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  Users, Home, FileText, CreditCard, AlertTriangle,
  CheckCircle, TrendingUp, Activity, Shield, Settings
} from 'lucide-react';
import Header from '../../components/ui/Header';
import Footer from '../../components/ui/Footer';
import { FormatService } from '../../services/format/formatService';

interface PlatformStats {
  total_users: number;
  total_properties: number;
  total_leases: number;
  active_leases: number;
  total_payments: number;
  total_visits: number;
  pending_verifications: number;
  pending_maintenance: number;
  total_revenue: number;
}

interface RecentActivity {
  id: string;
  action: string;
  entity_type: string;
  created_at: string;
  details: any;
}

export default function AdminDashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      checkAdminAccess();
    }
  }, [user]);

  const checkAdminAccess = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        window.location.href = '/';
        return;
      }

      setIsAdmin(true);
      loadDashboardData();
    } catch (err) {
      console.error('Error checking admin access:', err);
      window.location.href = '/';
    }
  };

  const loadDashboardData = async () => {
    try {
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_platform_stats');

      if (statsError) throw statsError;

      setStats(statsData);

      const { data: activitiesData } = await supabase
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      setActivities(activitiesData || []);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin || loading) {
    return (
      <div className="min-h-screen bg-warm-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-xl text-gray-600">Vérification des accès...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Utilisateurs',
      value: stats?.total_users || 0,
      icon: Users,
      color: 'bg-blue-100 text-blue-800',
      iconBg: 'bg-blue-500'
    },
    {
      title: 'Propriétés',
      value: stats?.total_properties || 0,
      icon: Home,
      color: 'bg-green-100 text-green-800',
      iconBg: 'bg-green-500'
    },
    {
      title: 'Baux actifs',
      value: stats?.active_leases || 0,
      icon: FileText,
      color: 'bg-purple-100 text-purple-800',
      iconBg: 'bg-purple-500'
    },
    {
      title: 'Revenus total',
      value: FormatService.formatCurrency(stats?.total_revenue || 0),
      icon: CreditCard,
      color: 'bg-orange-100 text-orange-800',
      iconBg: 'bg-orange-500',
      isFormatted: true
    },
    {
      title: 'Vérifications en attente',
      value: stats?.pending_verifications || 0,
      icon: AlertTriangle,
      color: 'bg-yellow-100 text-yellow-800',
      iconBg: 'bg-yellow-500'
    },
    {
      title: 'Maintenance en attente',
      value: stats?.pending_maintenance || 0,
      icon: Activity,
      color: 'bg-red-100 text-red-800',
      iconBg: 'bg-red-500'
    }
  ];

  return (
    <div className="min-h-screen bg-warm-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Shield className="w-8 h-8 text-terracotta-600" />
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
          <p className="text-gray-600">Vue d'ensemble de la plateforme Mon Toit</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div key={index} className="card-scrapbook p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${card.iconBg}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {card.isFormatted ? card.value : card.value.toLocaleString('fr-FR')}
                </p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card-scrapbook p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Activités récentes</h2>
            <div className="space-y-4">
              {activities.length > 0 ? (
                activities.map(activity => (
                  <div key={activity.id} className="flex items-start space-x-3 pb-3 border-b border-gray-200 last:border-0">
                    <Activity className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-xs text-gray-600">{activity.entity_type}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {FormatService.formatRelativeTime(activity.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">Aucune activité récente</p>
              )}
            </div>
          </div>

          <div className="card-scrapbook p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Actions rapides</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => window.location.href = '/admin/users'}
                className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition text-left"
              >
                <Users className="w-6 h-6 text-blue-600 mb-2" />
                <p className="text-sm font-medium text-gray-900">Utilisateurs</p>
              </button>

              <button
                onClick={() => window.location.href = '/admin/properties'}
                className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition text-left"
              >
                <Home className="w-6 h-6 text-green-600 mb-2" />
                <p className="text-sm font-medium text-gray-900">Propriétés</p>
              </button>

              <button
                onClick={() => window.location.href = '/admin/verifications'}
                className="p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition text-left"
              >
                <CheckCircle className="w-6 h-6 text-yellow-600 mb-2" />
                <p className="text-sm font-medium text-gray-900">Vérifications</p>
              </button>

              <button
                onClick={() => window.location.href = '/admin/reports'}
                className="p-4 bg-red-50 rounded-lg hover:bg-red-100 transition text-left"
              >
                <AlertTriangle className="w-6 h-6 text-red-600 mb-2" />
                <p className="text-sm font-medium text-gray-900">Signalements</p>
              </button>

              <button
                onClick={() => window.location.href = '/admin/payments'}
                className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition text-left"
              >
                <CreditCard className="w-6 h-6 text-purple-600 mb-2" />
                <p className="text-sm font-medium text-gray-900">Paiements</p>
              </button>

              <button
                onClick={() => window.location.href = '/admin/settings'}
                className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition text-left"
              >
                <Settings className="w-6 h-6 text-gray-600 mb-2" />
                <p className="text-sm font-medium text-gray-900">Paramètres</p>
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
