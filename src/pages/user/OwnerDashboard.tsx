import { useState, useEffect } from 'react';
import { Plus, Home, Eye, Calendar, TrendingUp, Edit, ExternalLink, Award, Filter, DollarSign, MessageSquare, Users, Clock, BarChart3, TrendingDown, Wrench, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ScoringService } from '../../services/scoringService';
import type { Database } from '../../lib/database.types';
import Breadcrumb from '../../components/Breadcrumb';

type Property = Database['public']['Tables']['properties']['Row'];
type Application = Database['public']['Tables']['rental_applications']['Row'];

export default function OwnerDashboard() {
  const { user, profile } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'date' | 'score'>('score');
  const [stats, setStats] = useState({
    totalProperties: 0,
    activeProperties: 0,
    rentedProperties: 0,
    totalViews: 0,
    pendingApplications: 0,
    unreadMessages: 0,
    upcomingVisits: 0,
    monthlyRevenue: 0,
    projectedRevenue: 0,
  });
  const [revenueHistory, setRevenueHistory] = useState<{month: string, revenue: number}[]>([]);
  const [upcomingPayments, setUpcomingPayments] = useState<any[]>([]);
  const [upcomingVisitsData, setUpcomingVisitsData] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      window.location.href = '/connexion';
      return;
    }

    if (profile && profile.user_type !== 'proprietaire' && profile.user_type !== 'agence') {
      window.location.href = '/';
      return;
    }

    loadDashboardData();
  }, [user, profile]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      const { data: propsData, error: propsError } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (propsError) throw propsError;
      setProperties(propsData || []);

      const totalViews = (propsData || []).reduce((sum, prop) => sum + prop.view_count, 0);
      const activeProps = (propsData || []).filter(p => p.status === 'disponible').length;
      const rentedProps = (propsData || []).filter(p => p.status === 'loue').length;

      const propertyIds = (propsData || []).map(p => p.id);

      let pendingApps = 0;
      let unreadMsgs = 0;
      let upVisits = 0;
      let monthlyRev = 0;
      let projectedRev = 0;

      if (propertyIds.length > 0) {
        const { data: appsData, error: appsError } = await supabase
          .from('rental_applications')
          .select('*')
          .in('property_id', propertyIds)
          .order('application_score', { ascending: false });

        if (appsError) throw appsError;
        setApplications(appsData || []);
        pendingApps = (appsData || []).filter(app => app.status === 'en_attente').length;

        const { data: conversationsData } = await supabase
          .from('conversations')
          .select('id')
          .eq('owner_id', user.id);

        if (conversationsData) {
          const conversationIds = conversationsData.map(c => c.id);
          const { data: unreadData } = await supabase
            .from('messages')
            .select('id')
            .in('conversation_id', conversationIds)
            .neq('sender_id', user.id)
            .eq('read', false);
          unreadMsgs = unreadData?.length || 0;
        }

        const { data: visitsData } = await supabase
          .from('visit_requests')
          .select('*, properties(title)')
          .in('property_id', propertyIds)
          .eq('status', 'acceptee')
          .gte('visit_date', new Date().toISOString().split('T')[0])
          .order('visit_date', { ascending: true })
          .limit(5);

        upVisits = visitsData?.length || 0;
        setUpcomingVisitsData(visitsData || []);

        const { data: leasesData } = await supabase
          .from('leases')
          .select('*, properties(title, monthly_rent)')
          .in('property_id', propertyIds)
          .eq('status', 'actif');

        if (leasesData) {
          monthlyRev = leasesData.reduce((sum, lease) => sum + (lease.properties as any)?.monthly_rent || 0, 0);
          projectedRev = monthlyRev;
          setUpcomingPayments(leasesData.slice(0, 5));
        }

        const { data: revenueData } = await supabase
          .from('payments')
          .select('amount, created_at, property_id')
          .in('property_id', propertyIds)
          .eq('status', 'complete')
          .gte('created_at', new Date(new Date().setMonth(new Date().getMonth() - 12)).toISOString());

        if (revenueData) {
          const monthlyData: {[key: string]: number} = {};
          revenueData.forEach(payment => {
            const month = new Date(payment.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' });
            monthlyData[month] = (monthlyData[month] || 0) + payment.amount;
          });
          const chartData = Object.entries(monthlyData).map(([month, revenue]) => ({ month, revenue }));
          setRevenueHistory(chartData);
        }
      }

      setStats({
        totalProperties: propsData?.length || 0,
        activeProperties: activeProps,
        rentedProperties: rentedProps,
        totalViews,
        pendingApplications: pendingApps,
        unreadMessages: unreadMsgs,
        upcomingVisits: upVisits,
        monthlyRevenue: monthlyRev,
        projectedRevenue: projectedRev,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSortedApplications = () => {
    const sorted = [...applications];
    if (sortBy === 'score') {
      return sorted.sort((a, b) => b.application_score - a.application_score);
    }
    return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-coral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-terracotta-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-coral-50 custom-cursor">
      <div className="glass-card border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
            <div className="animate-slide-down">
              <Breadcrumb items={[{ label: 'Tableau de Bord Propriétaire' }]} />
              <h1 className="text-4xl font-bold text-gradient flex items-center space-x-3">
                <Home className="h-10 w-10 text-terracotta-500" />
                <span>Tableau de bord</span>
              </h1>
              <p className="text-gray-700 mt-2 text-lg">Bienvenue, {profile?.full_name || 'Propriétaire'}</p>
            </div>
            <a
              href="/dashboard/ajouter-propriete"
              className="btn-primary px-6 py-3 flex items-center space-x-2 w-fit animate-slide-down"
              style={{ animationDelay: '0.1s' }}
            >
              <Plus className="h-5 w-5" />
              <span>Ajouter une propriété</span>
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card-scrapbook p-6 animate-scale-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-gray-700 text-sm font-bold uppercase tracking-wide">Total propriétés</h3>
              <div className="bg-gradient-to-br from-terracotta-100 to-coral-100 p-3 rounded-2xl">
                <Home className="h-8 w-8 text-terracotta-600" />
              </div>
            </div>
            <p className="text-4xl font-bold text-gradient">{stats.totalProperties}</p>
            <p className="text-xs text-gray-600 mt-2">{stats.activeProperties} disponibles, {stats.rentedProperties} louées</p>
          </div>

          <div className="card-scrapbook p-6 animate-scale-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-gray-700 text-sm font-bold uppercase tracking-wide">Revenus du mois</h3>
              <div className="bg-gradient-to-br from-olive-100 to-green-100 p-3 rounded-2xl">
                <DollarSign className="h-8 w-8 text-olive-600" />
              </div>
            </div>
            <p className="text-4xl font-bold text-gradient">{stats.monthlyRevenue.toLocaleString()}</p>
            <p className="text-xs text-gray-600 mt-2">FCFA</p>
          </div>

          <div className="card-scrapbook p-6 animate-scale-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-gray-700 text-sm font-bold uppercase tracking-wide">Messages</h3>
              <div className="bg-gradient-to-br from-amber-100 to-orange-100 p-3 rounded-2xl">
                <MessageSquare className="h-8 w-8 text-amber-600" />
              </div>
            </div>
            <p className="text-4xl font-bold text-gradient">{stats.unreadMessages}</p>
            <p className="text-xs text-gray-600 mt-2">non lus</p>
          </div>

          <div className="card-scrapbook p-6 animate-scale-in" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-gray-700 text-sm font-bold uppercase tracking-wide">Visites à venir</h3>
              <div className="bg-gradient-to-br from-cyan-100 to-blue-100 p-3 rounded-2xl">
                <Calendar className="h-8 w-8 text-cyan-600" />
              </div>
            </div>
            <p className="text-4xl font-bold text-gradient">{stats.upcomingVisits}</p>
            <p className="text-xs text-gray-600 mt-2">{stats.pendingApplications} candidatures en attente</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="card-scrapbook p-6 animate-slide-up">
            <h3 className="text-xl font-bold text-gradient mb-4 flex items-center space-x-2">
              <BarChart3 className="h-6 w-6 text-terracotta-500" />
              <span>Revenus des 12 derniers mois</span>
            </h3>
            {revenueHistory.length > 0 ? (
              <div className="space-y-2">
                {revenueHistory.slice(-6).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 font-medium">{item.month}</span>
                    <div className="flex items-center space-x-2 flex-1 mx-4">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-terracotta-500 to-coral-500 h-full rounded-full"
                          style={{ width: `${Math.min((item.revenue / Math.max(...revenueHistory.map(r => r.revenue))) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-bold text-terracotta-600">{item.revenue.toLocaleString()} FCFA</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">Aucune donnée de revenus disponible</p>
            )}
          </div>

          <div className="card-scrapbook p-6 animate-slide-up">
            <h3 className="text-xl font-bold text-gradient mb-4 flex items-center space-x-2">
              <Clock className="h-6 w-6 text-terracotta-500" />
              <span>Prochaines visites</span>
            </h3>
            {upcomingVisitsData.length > 0 ? (
              <div className="space-y-3">
                {upcomingVisitsData.map((visit: any) => (
                  <div key={visit.id} className="bg-gradient-to-br from-white to-cyan-50 border border-cyan-200 rounded-lg p-3">
                    <p className="font-bold text-gray-900 text-sm">{visit.properties?.title}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-600">
                        {new Date(visit.visit_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                      </span>
                      <span className="text-xs font-bold text-cyan-600">{visit.visit_time}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">Aucune visite planifiée</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="card-scrapbook p-8 animate-slide-up">
              <h2 className="text-2xl font-bold text-gradient mb-6 flex items-center space-x-2">
                <Home className="h-7 w-7 text-terracotta-500" />
                <span>Mes propriétés</span>
              </h2>

              {properties.length > 0 ? (
                <div className="space-y-4">
                  {properties.map((property, index) => (
                    <div
                      key={property.id}
                      className="bg-gradient-to-br from-white to-amber-50 border-2 border-terracotta-200 rounded-2xl p-5 hover:border-terracotta-400 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] animate-slide-up"
                      style={{ animationDelay: `${0.1 * index}s` }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center flex-wrap gap-3 mb-3">
                            <h3 className="text-xl font-bold text-gray-900">{property.title}</h3>
                            <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                              property.status === 'disponible'
                                ? 'bg-gradient-to-r from-olive-100 to-green-100 text-olive-800 border border-olive-300'
                                : property.status === 'loue'
                                ? 'bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-800 border border-cyan-300'
                                : property.status === 'en_attente'
                                ? 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border border-amber-200'
                                : 'bg-gray-100 text-gray-800 border border-gray-300'
                            }`}>
                              {property.status === 'disponible'
                                ? 'Disponible'
                                : property.status === 'loue'
                                ? 'Loué'
                                : property.status === 'en_attente'
                                ? 'En attente'
                                : 'Retiré'}
                            </span>
                          </div>
                          <p className="text-gray-600 mb-3 flex items-center space-x-1">
                            <span className="font-medium">{property.city}</span>
                            {property.neighborhood && (
                              <>
                                <span>•</span>
                                <span>{property.neighborhood}</span>
                              </>
                            )}
                          </p>
                          <div className="flex items-center flex-wrap gap-4 text-sm">
                            <span className="flex items-center space-x-2 bg-amber-100 px-3 py-1 rounded-full text-amber-800 font-medium">
                              <Eye className="h-4 w-4" />
                              <span>{property.view_count} vues</span>
                            </span>
                            <span className="font-bold text-terracotta-600 text-lg">
                              {property.monthly_rent.toLocaleString()} FCFA/mois
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2 ml-4">
                          <a
                            href={`/propriete/${property.id}`}
                            className="flex items-center space-x-1 text-terracotta-600 hover:text-terracotta-700 text-sm font-bold transition-all duration-300 transform hover:scale-105"
                          >
                            <ExternalLink className="h-4 w-4" />
                            <span>Voir</span>
                          </a>
                          <a
                            href={`/creer-contrat/${property.id}`}
                            className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-bold transition-all duration-300 transform hover:scale-105"
                          >
                            <span>+ Contrat</span>
                          </a>
                          <a
                            href={`/dashboard/propriete/${property.id}/stats`}
                            className="flex items-center space-x-1 text-purple-600 hover:text-purple-700 text-sm font-bold transition-all duration-300 transform hover:scale-105"
                          >
                            <BarChart3 className="h-4 w-4" />
                            <span>Stats</span>
                          </a>
                          <a
                            href={`/dashboard/propriete/${property.id}/modifier`}
                            className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 text-sm font-bold transition-all duration-300 transform hover:scale-105"
                          >
                            <Edit className="h-4 w-4" />
                            <span>Modifier</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-dashed border-terracotta-300">
                  <div className="bg-gradient-to-br from-terracotta-100 to-coral-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-lg">
                    <Home className="h-12 w-12 text-terracotta-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gradient mb-3">Aucune propriété</h3>
                  <p className="text-gray-700 mb-6 text-lg">
                    Commencez par ajouter votre première propriété
                  </p>
                  <a
                    href="/dashboard/ajouter-propriete"
                    className="inline-flex items-center space-x-2 btn-primary px-8 py-3"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Ajouter une propriété</span>
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="card-scrapbook p-6 animate-slide-up">
              <h3 className="text-xl font-bold text-gradient mb-4">Actions Rapides</h3>
              <div className="space-y-3">
                <a href="/dashboard/ajouter-propriete" className="btn-primary w-full flex items-center justify-center">
                  <Plus className="h-5 w-5 mr-2" />
                  Ajouter une propriété
                </a>
                <a href="/maintenance/proprietaire" className="btn-secondary w-full flex items-center justify-center">
                  <Wrench className="h-5 w-5 mr-2" />
                  Demandes de maintenance
                </a>
                <a href="/mes-contrats" className="btn-secondary w-full flex items-center justify-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Gérer les contrats
                </a>
                <a href="/messages" className="btn-secondary w-full flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Messages
                </a>
              </div>
            </div>

            <div className="card-scrapbook p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gradient flex items-center space-x-2">
                  <Calendar className="h-6 w-6 text-terracotta-500" />
                  <span>Candidatures</span>
                </h2>
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-600" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'date' | 'score')}
                    className="text-sm border-2 border-gray-200 rounded-lg px-2 py-1 font-medium text-gray-700 focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500"
                  >
                    <option value="score">Par score</option>
                    <option value="date">Par date</option>
                  </select>
                </div>
              </div>

              {applications.length > 0 ? (
                <div className="space-y-4">
                  {getSortedApplications().slice(0, 5).map((application) => {
                    const scoreBadge = ScoringService.getScoreBadge(application.application_score);
                    const property = properties.find(p => p.id === application.property_id);
                    return (
                      <div key={application.id} className="bg-gradient-to-br from-white to-amber-50 border-2 border-cyan-200 rounded-xl p-4 hover:border-cyan-400 transition-all duration-300 transform hover:scale-105">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-bold text-gray-900 text-sm mb-1">
                              {property?.title || 'Propriété inconnue'}
                            </p>
                            <div className="flex items-center space-x-2 mb-1">
                              <Award className="h-4 w-4 text-terracotta-500" />
                              <span className="text-xs font-bold text-gray-700">
                                Score: {application.application_score}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${scoreBadge.color}`}>
                                {scoreBadge.text}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600">
                              {new Date(application.created_at).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                          <span className={`text-xs px-3 py-1 rounded-full font-bold whitespace-nowrap ml-2 ${
                            application.status === 'en_attente'
                              ? 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-300'
                              : application.status === 'acceptee'
                              ? 'bg-gradient-to-r from-olive-100 to-green-100 text-olive-800 border border-olive-300'
                              : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-300'
                          }`}>
                            {application.status.replace('_', ' ')}
                          </span>
                        </div>
                        <a
                          href={`/dashboard/candidature/${application.id}`}
                          className="text-terracotta-600 hover:text-terracotta-700 text-sm font-bold inline-flex items-center space-x-1 transition-all duration-300 transform hover:scale-105"
                        >
                          <span>Voir détails</span>
                          <span>→</span>
                        </a>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl border-2 border-dashed border-cyan-300">
                  <div className="bg-gradient-to-br from-cyan-100 to-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white">
                    <Calendar className="h-8 w-8 text-cyan-600" />
                  </div>
                  <p className="text-gray-700 font-medium">Aucune candidature</p>
                </div>
              )}
            </div>

            <div className="glass-card rounded-3xl p-6 bg-gradient-to-br from-terracotta-100 to-coral-100 border-2 border-terracotta-200 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <h3 className="font-bold text-terracotta-900 mb-3 text-lg flex items-center space-x-2">
                <span>💡</span>
                <span>Conseil du jour</span>
              </h3>
              <p className="text-sm text-terracotta-800 leading-relaxed">
                Ajoutez des photos de qualité et des descriptions détaillées pour attirer plus de locataires. Les annonces avec 5+ photos reçoivent 3x plus de vues.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
