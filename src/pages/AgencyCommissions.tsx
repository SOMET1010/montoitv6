import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { DollarSign, TrendingUp, Calendar, User, CheckCircle, Clock } from 'lucide-react';
import SimpleBarChart from '../components/charts/SimpleBarChart';
import { dashboardExportService } from '../services/dashboardExportService';

interface Commission {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  paid_at: string | null;
  agent_id: string;
  property_id: string;
  transaction_type: string;
  profiles: {
    full_name: string;
  };
  properties: {
    title: string;
  };
}

export default function AgencyCommissions() {
  const { user } = useAuth();
  const [agency, setAgency] = useState<any>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [stats, setStats] = useState({
    totalCommissions: 0,
    paidCommissions: 0,
    pendingCommissions: 0,
    thisMonth: 0
  });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      window.location.href = '/connexion';
      return;
    }
    loadCommissionsData();
  }, [user, filter]);

  const loadCommissionsData = async () => {
    if (!user) return;

    try {
      const { data: agencyData } = await supabase
        .from('agencies')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (!agencyData) {
        window.location.href = '/agence/inscription';
        return;
      }

      setAgency(agencyData);

      let query = supabase
        .from('agency_commissions')
        .select('*, profiles(full_name), properties(title)')
        .eq('agency_id', agencyData.id)
        .order('created_at', { ascending: false });

      if (filter === 'pending') {
        query = query.eq('status', 'pending');
      } else if (filter === 'paid') {
        query = query.eq('status', 'paid');
      }

      const { data: commissionsData } = await query;

      setCommissions(commissionsData || []);

      const total = (commissionsData || []).reduce((sum, c) => sum + c.amount, 0);
      const paid = (commissionsData || [])
        .filter(c => c.status === 'paid')
        .reduce((sum, c) => sum + c.amount, 0);
      const pending = (commissionsData || [])
        .filter(c => c.status === 'pending')
        .reduce((sum, c) => sum + c.amount, 0);

      const thisMonth = (commissionsData || [])
        .filter(c => {
          const date = new Date(c.created_at);
          const now = new Date();
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        })
        .reduce((sum, c) => sum + c.amount, 0);

      setStats({
        totalCommissions: total,
        paidCommissions: paid,
        pendingCommissions: pending,
        thisMonth
      });

      const monthly = Array.from({ length: 6 }, (_, i) => {
        const month = new Date();
        month.setMonth(month.getMonth() - (5 - i));
        const monthCommissions = (commissionsData || []).filter(c => {
          const date = new Date(c.created_at);
          return date.getMonth() === month.getMonth() && date.getFullYear() === month.getFullYear();
        });
        return {
          label: month.toLocaleDateString('fr-FR', { month: 'short' }),
          value: monthCommissions.reduce((sum, c) => sum + c.amount, 0) / 1000
        };
      });

      setMonthlyData(monthly);
    } catch (err) {
      console.error('Error loading commissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (commissionId: string) => {
    try {
      const { error } = await supabase
        .from('agency_commissions')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', commissionId);

      if (error) throw error;

      loadCommissionsData();
    } catch (err) {
      console.error('Error marking as paid:', err);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Agent', 'Propriété', 'Type', 'Montant', 'Statut'];
    const rows = commissions.map(c => [
      new Date(c.created_at).toLocaleDateString('fr-FR'),
      c.profiles.full_name,
      c.properties.title,
      c.transaction_type,
      `${c.amount.toLocaleString('fr-FR')} FCFA`,
      c.status === 'paid' ? 'Payé' : 'En attente'
    ]);

    dashboardExportService.exportToCSV({ headers, rows }, 'commissions.csv');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-olive-50 to-amber-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-olive-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-olive-50 to-amber-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center space-x-3">
              <DollarSign className="w-10 h-10 text-terracotta-600" />
              <span>Commissions</span>
            </h1>
            <p className="text-xl text-gray-600">{agency?.name}</p>
          </div>
          <button onClick={handleExportCSV} className="btn-secondary">
            Exporter CSV
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card-scrapbook p-6">
            <DollarSign className="w-8 h-8 text-blue-600 mb-2" />
            <p className="text-3xl font-bold text-gray-900">
              {(stats.totalCommissions / 1000).toFixed(0)}K
            </p>
            <p className="text-sm text-gray-600">Total commissions</p>
          </div>

          <div className="card-scrapbook p-6">
            <CheckCircle className="w-8 h-8 text-green-600 mb-2" />
            <p className="text-3xl font-bold text-gray-900">
              {(stats.paidCommissions / 1000).toFixed(0)}K
            </p>
            <p className="text-sm text-gray-600">Payées</p>
          </div>

          <div className="card-scrapbook p-6">
            <Clock className="w-8 h-8 text-yellow-600 mb-2" />
            <p className="text-3xl font-bold text-gray-900">
              {(stats.pendingCommissions / 1000).toFixed(0)}K
            </p>
            <p className="text-sm text-gray-600">En attente</p>
          </div>

          <div className="card-scrapbook p-6">
            <TrendingUp className="w-8 h-8 text-terracotta-600 mb-2" />
            <p className="text-3xl font-bold text-gray-900">
              {(stats.thisMonth / 1000).toFixed(0)}K
            </p>
            <p className="text-sm text-gray-600">Ce mois</p>
          </div>
        </div>

        <div className="card-scrapbook p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Évolution (en milliers FCFA)</h3>
          <SimpleBarChart data={monthlyData} height={200} color="#B87333" />
        </div>

        <div className="card-scrapbook p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Historique des commissions</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  filter === 'all' ? 'bg-terracotta-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Tout
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                En attente
              </button>
              <button
                onClick={() => setFilter('paid')}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  filter === 'paid' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Payées
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {commissions.map(commission => (
              <div key={commission.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-bold text-gray-900">{commission.properties.title}</p>
                      <div className="flex items-center space-x-3 mt-1 text-sm text-gray-600">
                        <span className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{commission.profiles.full_name}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(commission.created_at).toLocaleDateString('fr-FR')}</span>
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-gray-200 rounded">
                          {commission.transaction_type}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {commission.amount.toLocaleString('fr-FR')} FCFA
                    </p>
                    {commission.status === 'paid' ? (
                      <span className="text-xs text-green-600 font-medium">
                        Payé le {new Date(commission.paid_at!).toLocaleDateString('fr-FR')}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleMarkAsPaid(commission.id)}
                        className="text-xs text-terracotta-600 hover:underline font-medium"
                      >
                        Marquer comme payé
                      </button>
                    )}
                  </div>
                  {commission.status === 'pending' && (
                    <Clock className="w-5 h-5 text-yellow-600" />
                  )}
                  {commission.status === 'paid' && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                </div>
              </div>
            ))}

            {commissions.length === 0 && (
              <div className="text-center py-12">
                <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-xl text-gray-600">Aucune commission</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
