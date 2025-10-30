import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Building2, Users, Home, TrendingUp, DollarSign, UserPlus,
  Calendar, Phone, Mail, CheckCircle, Clock, AlertCircle, XCircle
} from 'lucide-react';
import SimpleBarChart from '../components/charts/SimpleBarChart';
import SimpleLineChart from '../components/charts/SimpleLineChart';

interface Agency {
  id: string;
  name: string;
  verification_status: string;
  commission_rate: number;
}

interface AgencyStats {
  totalAgents: number;
  activeLeads: number;
  propertiesManaged: number;
  monthlyCommissions: number;
  conversionRate: number;
  pendingTasks: number;
}

export default function AgencyDashboard() {
  const { user } = useAuth();
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AgencyStats>({
    totalAgents: 0,
    activeLeads: 0,
    propertiesManaged: 0,
    monthlyCommissions: 0,
    conversionRate: 0,
    pendingTasks: 0
  });
  const [leads, setLeads] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      window.location.href = '/connexion';
      return;
    }
    loadAgencyData();
  }, [user]);

  const loadAgencyData = async () => {
    if (!user) return;

    try {
      const { data: agencyData, error: agencyError } = await supabase
        .from('agencies')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (agencyError) {
        if (agencyError.code === 'PGRST116') {
          window.location.href = '/agence/inscription';
          return;
        }
        throw agencyError;
      }

      setAgency(agencyData);

      const { data: teamMembers } = await supabase
        .from('agency_team_members')
        .select('*')
        .eq('agency_id', agencyData.id)
        .eq('status', 'active');

      const { data: leadsData } = await supabase
        .from('crm_leads')
        .select('*')
        .eq('agency_id', agencyData.id)
        .order('created_at', { ascending: false })
        .limit(50);

      const { data: propertiesData } = await supabase
        .from('property_assignments')
        .select('*')
        .eq('agency_id', agencyData.id);

      const { data: commissionsData } = await supabase
        .from('agency_commissions')
        .select('*')
        .eq('agency_id', agencyData.id)
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

      const { data: activitiesData } = await supabase
        .from('lead_activities')
        .select('*, crm_leads(name)')
        .in('lead_id', (leadsData || []).map(l => l.id))
        .order('created_at', { ascending: false })
        .limit(10);

      const activeLeads = (leadsData || []).filter(l =>
        !['converted', 'lost', 'archived'].includes(l.status)
      ).length;

      const convertedLeads = (leadsData || []).filter(l => l.status === 'converted').length;
      const conversionRate = leadsData?.length ? (convertedLeads / leadsData.length) * 100 : 0;

      const totalCommissions = (commissionsData || []).reduce((sum, c) => sum + (c.amount || 0), 0);

      setStats({
        totalAgents: (teamMembers || []).length,
        activeLeads,
        propertiesManaged: (propertiesData || []).length,
        monthlyCommissions: totalCommissions,
        conversionRate,
        pendingTasks: (leadsData || []).filter(l => l.status === 'nouveau').length
      });

      setLeads(leadsData || []);
      setRecentActivities(activitiesData || []);

      const monthlyData = Array.from({ length: 6 }, (_, i) => {
        const month = new Date();
        month.setMonth(month.getMonth() - (5 - i));
        return {
          label: month.toLocaleDateString('fr-FR', { month: 'short' }),
          value: Math.floor(Math.random() * 50) + 10
        };
      });
      setPerformanceData(monthlyData);

    } catch (err) {
      console.error('Error loading agency data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getLeadStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      nouveau: 'bg-blue-100 text-blue-800',
      contacte: 'bg-purple-100 text-purple-800',
      qualifie: 'bg-indigo-100 text-indigo-800',
      visite_planifiee: 'bg-cyan-100 text-cyan-800',
      offre_envoyee: 'bg-orange-100 text-orange-800',
      negociation: 'bg-yellow-100 text-yellow-800',
      converted: 'bg-green-100 text-green-800',
      lost: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-olive-50 to-amber-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-olive-600"></div>
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-olive-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl text-gray-600">Agence non trouvée</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-olive-50 to-amber-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center space-x-3">
              <Building2 className="w-10 h-10 text-terracotta-600" />
              <span>{agency.name}</span>
              {getStatusIcon(agency.verification_status)}
            </h1>
            <p className="text-xl text-gray-600">Tableau de bord agence</p>
          </div>
          <div className="flex space-x-3">
            <a href="/agence/equipe" className="btn-secondary">
              <Users className="w-4 h-4 mr-2" />
              Équipe
            </a>
            <a href="/agence/proprietes" className="btn-secondary">
              <Home className="w-4 h-4 mr-2" />
              Propriétés
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card-scrapbook p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-blue-600" />
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalAgents}</p>
            <p className="text-sm text-gray-600">Agents actifs</p>
          </div>

          <div className="card-scrapbook p-6">
            <div className="flex items-center justify-between mb-4">
              <UserPlus className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.activeLeads}</p>
            <p className="text-sm text-gray-600">Leads actifs</p>
          </div>

          <div className="card-scrapbook p-6">
            <div className="flex items-center justify-between mb-4">
              <Home className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.propertiesManaged}</p>
            <p className="text-sm text-gray-600">Propriétés gérées</p>
          </div>

          <div className="card-scrapbook p-6">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-8 h-8 text-terracotta-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {stats.monthlyCommissions.toLocaleString('fr-FR')} FCFA
            </p>
            <p className="text-sm text-gray-600">Commissions ce mois</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="card-scrapbook p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Performance mensuelle</h3>
            <SimpleLineChart data={performanceData} height={200} />
          </div>

          <div className="card-scrapbook p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Taux de conversion</h3>
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <div className="text-6xl font-bold text-terracotta-600 mb-2">
                  {stats.conversionRate.toFixed(1)}%
                </div>
                <p className="text-gray-600">Leads convertis</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card-scrapbook p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center justify-between">
              <span>Leads récents</span>
              <a href="/agence/crm" className="text-sm text-terracotta-600 hover:underline">
                Voir tout
              </a>
            </h3>
            <div className="space-y-3">
              {leads.slice(0, 5).map(lead => (
                <div key={lead.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{lead.name}</p>
                    <p className="text-sm text-gray-600 flex items-center space-x-2">
                      <Phone className="w-3 h-3" />
                      <span>{lead.phone}</span>
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getLeadStatusColor(lead.status)}`}>
                    {lead.status}
                  </span>
                </div>
              ))}
              {leads.length === 0 && (
                <p className="text-center text-gray-500 py-8">Aucun lead pour le moment</p>
              )}
            </div>
          </div>

          <div className="card-scrapbook p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Activités récentes</h3>
            <div className="space-y-3">
              {recentActivities.map(activity => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.activity_type}</p>
                    <p className="text-xs text-gray-600">{activity.notes}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(activity.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))}
              {recentActivities.length === 0 && (
                <p className="text-center text-gray-500 py-8">Aucune activité récente</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
