import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ArrowLeft, TrendingUp, Eye, Heart, Calendar, Users, Clock, MapPin, Star, TrendingDown, AlertCircle } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Property = Database['public']['Tables']['properties']['Row'];

export default function PropertyStats() {
  const { user } = useAuth();
  const propertyId = window.location.pathname.split('/')[3];
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalViews: 0,
    uniqueViews: 0,
    favoritesCount: 0,
    visitRequests: 0,
    applications: 0,
    conversionRate: 0,
    avgDuration: 0,
  });
  const [viewsHistory, setViewsHistory] = useState<{ date: string; views: number }[]>([]);
  const [trafficSources, setTrafficSources] = useState<{ source: string; count: number }[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      window.location.href = '/connexion';
      return;
    }
    loadPropertyStats();
  }, [user, propertyId]);

  const loadPropertyStats = async () => {
    try {
      const { data: propData, error: propError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();

      if (propError) throw propError;
      if (propData.owner_id !== user?.id) {
        window.location.href = '/dashboard/proprietaire';
        return;
      }

      setProperty(propData);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: statsData } = await supabase
        .from('property_statistics')
        .select('*')
        .eq('property_id', propertyId)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (statsData) {
        const totalViews = statsData.reduce((sum, day) => sum + day.total_views, 0);
        const uniqueViews = statsData.reduce((sum, day) => sum + day.unique_views, 0);
        const totalApplications = statsData.reduce((sum, day) => sum + day.applications, 0);
        const avgDuration = Math.round(
          statsData.reduce((sum, day) => sum + day.avg_duration_seconds, 0) / (statsData.length || 1)
        );

        const conversionRate = totalViews > 0 ? ((totalApplications / totalViews) * 100) : 0;

        setStats({
          totalViews,
          uniqueViews,
          favoritesCount: propData.favorites_count || 0,
          visitRequests: statsData.reduce((sum, day) => sum + day.visit_requests, 0),
          applications: totalApplications,
          conversionRate: Math.round(conversionRate * 100) / 100,
          avgDuration,
        });

        const chartData = statsData.map(day => ({
          date: new Date(day.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
          views: day.total_views,
        }));
        setViewsHistory(chartData);
      }

      const { data: viewsData } = await supabase
        .from('property_views')
        .select('source')
        .eq('property_id', propertyId)
        .gte('viewed_at', thirtyDaysAgo.toISOString());

      if (viewsData) {
        const sourceCounts: { [key: string]: number } = {};
        viewsData.forEach(view => {
          const source = view.source || 'direct';
          sourceCounts[source] = (sourceCounts[source] || 0) + 1;
        });
        const sourceData = Object.entries(sourceCounts)
          .map(([source, count]) => ({ source, count }))
          .sort((a, b) => b.count - a.count);
        setTrafficSources(sourceData);
      }

      const newSuggestions: string[] = [];

      if ((propData.images as string[])?.length < 5) {
        newSuggestions.push('Ajoutez plus de photos (au moins 5) pour attirer plus de visiteurs');
      }

      if (stats.conversionRate < 2) {
        newSuggestions.push('Votre taux de conversion est faible. Vérifiez que le prix est compétitif');
      }

      if (propData.description.length < 200) {
        newSuggestions.push('Enrichissez votre description avec plus de détails sur le logement');
      }

      if (stats.totalViews < 50) {
        newSuggestions.push('Votre annonce manque de visibilité. Partagez-la sur les réseaux sociaux');
      }

      if (stats.avgDuration < 30) {
        newSuggestions.push('Les visiteurs passent peu de temps sur votre annonce. Améliorez les photos et la description');
      }

      setSuggestions(newSuggestions);

    } catch (error) {
      console.error('Error loading property stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'search': return '🔍';
      case 'map': return '🗺️';
      case 'favorites': return '❤️';
      case 'home': return '🏠';
      case 'recommendation': return '⭐';
      default: return '🔗';
    }
  };

  const getSourceLabel = (source: string) => {
    const labels: { [key: string]: string } = {
      search: 'Recherche',
      map: 'Carte',
      favorites: 'Favoris',
      home: 'Page d\'accueil',
      recommendation: 'Recommandation',
      direct: 'Lien direct',
    };
    return labels[source] || source;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-coral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-terracotta-500"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-coral-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Propriété introuvable</h2>
          <a href="/dashboard/proprietaire" className="btn-primary">
            Retour au tableau de bord
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-coral-50">
      <div className="glass-card border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <a
              href="/dashboard/proprietaire"
              className="flex items-center space-x-2 text-terracotta-600 hover:text-terracotta-700 font-bold"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Retour</span>
            </a>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gradient">{property.title}</h1>
              <p className="text-gray-700 mt-1">
                <MapPin className="inline h-4 w-4 mr-1" />
                {property.city} {property.neighborhood && `• ${property.neighborhood}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card-scrapbook p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-gray-700 text-sm font-bold uppercase tracking-wide">Vues totales</h3>
              <div className="bg-gradient-to-br from-amber-100 to-orange-100 p-3 rounded-2xl">
                <Eye className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gradient">{stats.totalViews}</p>
            <p className="text-xs text-gray-600 mt-1">{stats.uniqueViews} visiteurs uniques</p>
          </div>

          <div className="card-scrapbook p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-gray-700 text-sm font-bold uppercase tracking-wide">Favoris</h3>
              <div className="bg-gradient-to-br from-red-100 to-pink-100 p-3 rounded-2xl">
                <Heart className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gradient">{stats.favoritesCount}</p>
            <p className="text-xs text-gray-600 mt-1">ajoutés en favoris</p>
          </div>

          <div className="card-scrapbook p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-gray-700 text-sm font-bold uppercase tracking-wide">Demandes de visite</h3>
              <div className="bg-gradient-to-br from-cyan-100 to-blue-100 p-3 rounded-2xl">
                <Calendar className="h-6 w-6 text-cyan-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gradient">{stats.visitRequests}</p>
            <p className="text-xs text-gray-600 mt-1">{stats.applications} candidatures</p>
          </div>

          <div className="card-scrapbook p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-gray-700 text-sm font-bold uppercase tracking-wide">Taux de conversion</h3>
              <div className="bg-gradient-to-br from-olive-100 to-green-100 p-3 rounded-2xl">
                <TrendingUp className="h-6 w-6 text-olive-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gradient">{stats.conversionRate}%</p>
            <p className="text-xs text-gray-600 mt-1">vues → candidatures</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="card-scrapbook p-6">
              <h3 className="text-xl font-bold text-gradient mb-4 flex items-center space-x-2">
                <TrendingUp className="h-6 w-6 text-terracotta-500" />
                <span>Vues des 30 derniers jours</span>
              </h3>
              {viewsHistory.length > 0 ? (
                <div className="space-y-2">
                  {viewsHistory.slice(-10).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 font-medium w-20">{item.date}</span>
                      <div className="flex items-center space-x-2 flex-1 mx-4">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-terracotta-500 to-coral-500 h-full rounded-full"
                            style={{
                              width: `${Math.min((item.views / Math.max(...viewsHistory.map(v => v.views))) * 100, 100)}%`
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-bold text-terracotta-600 w-12 text-right">{item.views}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">Aucune donnée de vues disponible</p>
              )}
            </div>

            <div className="card-scrapbook p-6">
              <h3 className="text-xl font-bold text-gradient mb-4 flex items-center space-x-2">
                <Users className="h-6 w-6 text-terracotta-500" />
                <span>Sources de trafic</span>
              </h3>
              {trafficSources.length > 0 ? (
                <div className="space-y-3">
                  {trafficSources.map((source, idx) => {
                    const percentage = (source.count / stats.totalViews) * 100;
                    return (
                      <div key={idx} className="bg-gradient-to-br from-white to-amber-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold text-gray-900 flex items-center space-x-2">
                            <span className="text-lg">{getSourceIcon(source.source)}</span>
                            <span>{getSourceLabel(source.source)}</span>
                          </span>
                          <span className="text-sm font-bold text-terracotta-600">{source.count} vues</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-terracotta-500 to-coral-500 h-full rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{Math.round(percentage)}% du trafic total</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">Aucune donnée de trafic disponible</p>
              )}
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="card-scrapbook p-6">
              <h3 className="text-xl font-bold text-gradient mb-4 flex items-center space-x-2">
                <Clock className="h-6 w-6 text-terracotta-500" />
                <span>Engagement</span>
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-700 mb-1">Temps moyen sur la page</p>
                  <p className="text-2xl font-bold text-gradient">
                    {Math.floor(stats.avgDuration / 60)}:{(stats.avgDuration % 60).toString().padStart(2, '0')}
                  </p>
                  <p className="text-xs text-gray-600">minutes</p>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-700 mb-1">Ratio vues/favoris</p>
                  <p className="text-2xl font-bold text-gradient">
                    {stats.totalViews > 0 ? Math.round((stats.favoritesCount / stats.totalViews) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>

            <div className="card-scrapbook p-6 bg-gradient-to-br from-amber-50 to-orange-50">
              <h3 className="text-xl font-bold text-gradient mb-4 flex items-center space-x-2">
                <Star className="h-6 w-6 text-terracotta-500" />
                <span>Suggestions</span>
              </h3>
              {suggestions.length > 0 ? (
                <div className="space-y-3">
                  {suggestions.map((suggestion, idx) => (
                    <div key={idx} className="flex items-start space-x-3 bg-white border border-terracotta-200 rounded-lg p-3">
                      <AlertCircle className="h-5 w-5 text-terracotta-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-800">{suggestion}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="bg-gradient-to-br from-olive-100 to-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="h-8 w-8 text-olive-600" />
                  </div>
                  <p className="text-sm text-gray-700 font-medium">Excellent travail!</p>
                  <p className="text-xs text-gray-600 mt-1">Votre annonce est optimale</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
