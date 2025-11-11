import { useState, useEffect } from 'react';
import { Home, DollarSign, MessageSquare, Clock, Calendar, Heart, Search, AlertCircle, CheckCircle, FileText, Wrench } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Database } from '../../lib/database.types';
import Breadcrumb from '../../components/Breadcrumb';

type Lease = Database['public']['Tables']['leases']['Row'];
type Property = Database['public']['Tables']['properties']['Row'];
type Payment = Database['public']['Tables']['payments']['Row'];

export default function TenantDashboard() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeLease, setActiveLease] = useState<(Lease & { properties: Property }) | null>(null);
  const [nextPayment, setNextPayment] = useState<{
    amount: number;
    dueDate: string;
    daysRemaining: number;
  } | null>(null);
  const [stats, setStats] = useState({
    unreadMessages: 0,
    maintenanceRequests: 0,
    paymentStatus: 'up_to_date' as 'up_to_date' | 'late',
  });
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [recentFavorites, setRecentFavorites] = useState<any[]>([]);
  const [savedSearches, setSavedSearches] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      window.location.href = '/connexion';
      return;
    }

    if (profile && profile.user_type !== 'locataire') {
      window.location.href = '/';
      return;
    }

    loadDashboardData();
  }, [user, profile]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      const { data: leaseData } = await supabase
        .from('leases')
        .select('*, properties(*)')
        .eq('tenant_id', user.id)
        .eq('status', 'actif')
        .single();

      if (leaseData) {
        setActiveLease(leaseData as any);

        const today = new Date();
        const nextPaymentDate = new Date(leaseData.start_date);

        while (nextPaymentDate < today) {
          nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
        }

        const daysRemaining = Math.ceil((nextPaymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        setNextPayment({
          amount: (leaseData.properties as any).monthly_rent,
          dueDate: nextPaymentDate.toISOString(),
          daysRemaining,
        });

        const { data: paymentsData } = await supabase
          .from('payments')
          .select('*')
          .eq('property_id', leaseData.property_id)
          .eq('payer_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        setRecentPayments(paymentsData || []);

        const lastPayment = paymentsData?.[0];
        const isLate = lastPayment && new Date(lastPayment.created_at) < new Date(nextPaymentDate.getTime() - 30 * 24 * 60 * 60 * 1000);

        setStats(prev => ({
          ...prev,
          paymentStatus: isLate ? 'late' : 'up_to_date',
        }));
      }

      const { data: conversationsData } = await supabase
        .from('conversations')
        .select('id')
        .eq('tenant_id', user.id);

      if (conversationsData) {
        const conversationIds = conversationsData.map(c => c.id);
        const { data: unreadData } = await supabase
          .from('messages')
          .select('id')
          .in('conversation_id', conversationIds)
          .neq('sender_id', user.id)
          .eq('read', false);

        setStats(prev => ({ ...prev, unreadMessages: unreadData?.length || 0 }));
      }

      const { data: maintenanceData } = await supabase
        .from('maintenance_requests')
        .select('id')
        .eq('tenant_id', user.id)
        .in('status', ['en_attente', 'en_cours']);

      setStats(prev => ({ ...prev, maintenanceRequests: maintenanceData?.length || 0 }));

      const { data: favoritesData } = await supabase
        .from('favorites')
        .select('*, properties(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      setRecentFavorites(favoritesData || []);

      const { data: searchesData } = await supabase
        .from('saved_searches')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      setSavedSearches(searchesData || []);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
          <div className="animate-slide-down">
            <Breadcrumb items={[{ label: 'Tableau de Bord Locataire' }]} />
            <h1 className="text-4xl font-bold text-gradient flex items-center space-x-3">
              <Home className="h-10 w-10 text-terracotta-500" />
              <span>Mon Tableau de Bord</span>
            </h1>
            <p className="text-gray-700 mt-2 text-lg">Bienvenue, {profile?.full_name || 'Locataire'}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {activeLease ? (
              <div className="card-scrapbook p-6 animate-slide-up">
                <h2 className="text-2xl font-bold text-gradient mb-4 flex items-center space-x-2">
                  <Home className="h-7 w-7 text-terracotta-500" />
                  <span>Mon Logement Actuel</span>
                </h2>
                <div className="bg-gradient-to-br from-white to-amber-50 border-2 border-terracotta-200 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {(activeLease.properties as any)?.title}
                  </h3>
                  <p className="text-gray-700 mb-4">
                    {(activeLease.properties as any)?.city} • {(activeLease.properties as any)?.neighborhood}
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Loyer mensuel</p>
                      <p className="text-2xl font-bold text-terracotta-600">
                        {(activeLease.properties as any)?.monthly_rent.toLocaleString()} FCFA
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Durée du bail</p>
                      <p className="text-2xl font-bold text-gradient">
                        {activeLease.lease_duration} mois
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <a href={`/contrat/${activeLease.id}`} className="btn-secondary text-sm">
                      <FileText className="h-4 w-4 mr-2" />
                      Voir le bail
                    </a>
                    <a href={`/propriete/${activeLease.property_id}`} className="btn-secondary text-sm">
                      <Home className="h-4 w-4 mr-2" />
                      Détails du logement
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card-scrapbook p-8 text-center animate-slide-up">
                <div className="bg-gradient-to-br from-terracotta-100 to-coral-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Home className="h-12 w-12 text-terracotta-600" />
                </div>
                <h3 className="text-2xl font-bold text-gradient mb-3">Aucun logement actif</h3>
                <p className="text-gray-700 mb-6">
                  Vous n'avez pas encore de bail actif. Commencez votre recherche dès maintenant!
                </p>
                <a href="/recherche" className="btn-primary inline-flex items-center">
                  <Search className="h-5 w-5 mr-2" />
                  Rechercher un logement
                </a>
              </div>
            )}

            {nextPayment && (
              <div className="card-scrapbook p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <h2 className="text-2xl font-bold text-gradient mb-4 flex items-center space-x-2">
                  <DollarSign className="h-7 w-7 text-terracotta-500" />
                  <span>Prochain Paiement</span>
                </h2>
                <div className={`rounded-2xl p-6 border-2 ${
                  stats.paymentStatus === 'late'
                    ? 'bg-gradient-to-br from-red-50 to-pink-50 border-red-300'
                    : 'bg-gradient-to-br from-olive-50 to-green-50 border-olive-300'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-700 mb-1">Montant dû</p>
                      <p className="text-3xl font-bold text-gradient">
                        {nextPayment.amount.toLocaleString()} FCFA
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-700 mb-1">Date limite</p>
                      <p className="text-xl font-bold text-gray-900">
                        {new Date(nextPayment.dueDate).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className={`h-5 w-5 ${stats.paymentStatus === 'late' ? 'text-red-600' : 'text-olive-600'}`} />
                      <span className={`font-bold ${stats.paymentStatus === 'late' ? 'text-red-800' : 'text-olive-800'}`}>
                        {nextPayment.daysRemaining > 0
                          ? `${nextPayment.daysRemaining} jours restants`
                          : 'Paiement en retard'
                        }
                      </span>
                    </div>
                    <a href="/effectuer-paiement" className="btn-primary">
                      Payer maintenant
                    </a>
                  </div>
                </div>
              </div>
            )}

            {recentPayments.length > 0 && (
              <div className="card-scrapbook p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gradient">Historique des Paiements</h2>
                  <a href="/mes-paiements" className="text-terracotta-600 hover:text-terracotta-700 text-sm font-bold">
                    Voir tout →
                  </a>
                </div>
                <div className="space-y-3">
                  {recentPayments.map((payment) => (
                    <div key={payment.id} className="bg-gradient-to-br from-white to-amber-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {payment.status === 'complete' ? (
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        ) : (
                          <Clock className="h-6 w-6 text-yellow-600" />
                        )}
                        <div>
                          <p className="font-bold text-gray-900">
                            {payment.amount.toLocaleString()} FCFA
                          </p>
                          <p className="text-xs text-gray-600">
                            {new Date(payment.created_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                        payment.status === 'complete'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {payment.status === 'complete' ? 'Payé' : 'En attente'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="card-scrapbook p-6 animate-scale-in">
              <h3 className="text-xl font-bold text-gradient mb-4">Actions Rapides</h3>
              <div className="space-y-3">
                {activeLease && (
                  <>
                    <a href="/effectuer-paiement" className="btn-primary w-full flex items-center justify-center">
                      <DollarSign className="h-5 w-5 mr-2" />
                      Payer mon loyer
                    </a>
                    <a href="/messages" className="btn-secondary w-full flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 mr-2" />
                      Contacter le propriétaire
                    </a>
                    <a href="/maintenance/nouvelle" className="btn-secondary w-full flex items-center justify-center">
                      <Wrench className="h-5 w-5 mr-2" />
                      Demander une réparation
                    </a>
                    <a href={`/contrat/${activeLease.id}`} className="btn-secondary w-full flex items-center justify-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Voir mon bail
                    </a>
                  </>
                )}
                <a href="/score-locataire" className="btn-secondary w-full flex items-center justify-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Mon Score Locataire
                </a>
                <a href="/maintenance/locataire" className="btn-secondary w-full flex items-center justify-center">
                  <Wrench className="h-5 w-5 mr-2" />
                  Mes demandes de maintenance
                </a>
                <a href="/recherche" className="btn-secondary w-full flex items-center justify-center">
                  <Search className="h-5 w-5 mr-2" />
                  Rechercher un logement
                </a>
                <a href="/notifications/preferences" className="btn-secondary w-full flex items-center justify-center text-sm">
                  Préférences de notifications
                </a>
              </div>
            </div>

            <div className="card-scrapbook p-6 animate-scale-in" style={{ animationDelay: '0.1s' }}>
              <h3 className="text-xl font-bold text-gradient mb-4">Notifications</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-3">
                  <MessageSquare className="h-5 w-5 text-amber-600" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">Messages non lus</p>
                    <p className="text-2xl font-bold text-gradient">{stats.unreadMessages}</p>
                  </div>
                </div>
                {stats.maintenanceRequests > 0 && (
                  <div className="flex items-center space-x-3 bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 rounded-lg p-3">
                    <Wrench className="h-5 w-5 text-cyan-600" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900">Demandes en cours</p>
                      <p className="text-2xl font-bold text-gradient">{stats.maintenanceRequests}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {recentFavorites.length > 0 && (
              <div className="card-scrapbook p-6 animate-scale-in" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gradient flex items-center space-x-2">
                    <Heart className="h-5 w-5 text-terracotta-500" />
                    <span>Favoris Récents</span>
                  </h3>
                  <a href="/favoris" className="text-terracotta-600 hover:text-terracotta-700 text-sm font-bold">
                    Voir tout →
                  </a>
                </div>
                <div className="space-y-2">
                  {recentFavorites.map((fav: any) => (
                    <a
                      key={fav.id}
                      href={`/propriete/${fav.property_id}`}
                      className="block bg-gradient-to-br from-white to-red-50 border border-red-200 rounded-lg p-3 hover:border-red-400 transition-all"
                    >
                      <p className="font-bold text-gray-900 text-sm">{fav.properties?.title}</p>
                      <p className="text-xs text-gray-600">{fav.properties?.city}</p>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {savedSearches.length > 0 && (
              <div className="card-scrapbook p-6 animate-scale-in" style={{ animationDelay: '0.3s' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gradient flex items-center space-x-2">
                    <Search className="h-5 w-5 text-terracotta-500" />
                    <span>Recherches Sauvegardées</span>
                  </h3>
                  <a href="/recherches-sauvegardees" className="text-terracotta-600 hover:text-terracotta-700 text-sm font-bold">
                    Voir tout →
                  </a>
                </div>
                <div className="space-y-2">
                  {savedSearches.map((search: any) => (
                    <button
                      key={search.id}
                      onClick={() => window.location.href = `/recherche?saved=${search.id}`}
                      className="w-full text-left bg-gradient-to-br from-white to-cyan-50 border border-cyan-200 rounded-lg p-3 hover:border-cyan-400 transition-all"
                    >
                      <p className="font-bold text-gray-900 text-sm">{search.name}</p>
                      <p className="text-xs text-gray-600">
                        {search.city || 'Toutes les villes'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
