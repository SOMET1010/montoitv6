import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Bookmark, Bell, BellOff, Search, Trash2, Eye, Calendar } from 'lucide-react';

interface SavedSearch {
  id: string;
  name: string;
  city: string | null;
  property_type: string | null;
  min_price: number | null;
  max_price: number | null;
  min_bedrooms: number | null;
  is_furnished: boolean | null;
  alert_enabled: boolean;
  alert_frequency: string;
  search_count: number;
  last_checked_at: string | null;
  created_at: string;
}

interface PropertyAlert {
  id: string;
  property_id: string;
  viewed: boolean;
  dismissed: boolean;
  created_at: string;
  properties: {
    title: string;
    city: string;
    monthly_rent: number;
    images: string[];
  };
}

export default function SavedSearches() {
  const { user } = useAuth();
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [alerts, setAlerts] = useState<PropertyAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      window.location.href = '/connexion';
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      const { data: searchesData } = await supabase
        .from('saved_searches')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setSearches(searchesData || []);

      const { data: alertsData } = await supabase
        .from('property_alerts')
        .select('*, properties(title, city, monthly_rent, images)')
        .eq('user_id', user.id)
        .eq('dismissed', false)
        .order('created_at', { ascending: false })
        .limit(20);

      setAlerts(alertsData || []);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAlert = async (searchId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('saved_searches')
        .update({ alert_enabled: !currentStatus })
        .eq('id', searchId);

      if (error) throw error;

      setSearches(prev =>
        prev.map(s => s.id === searchId ? { ...s, alert_enabled: !currentStatus } : s)
      );
    } catch (err) {
      console.error('Error toggling alert:', err);
    }
  };

  const handleDeleteSearch = async (searchId: string) => {
    if (!confirm('Supprimer cette recherche sauvegardée ?')) return;

    try {
      const { error } = await supabase
        .from('saved_searches')
        .delete()
        .eq('id', searchId);

      if (error) throw error;

      setSearches(prev => prev.filter(s => s.id !== searchId));
    } catch (err) {
      console.error('Error deleting search:', err);
    }
  };

  const handleDismissAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('property_alerts')
        .update({ dismissed: true, dismissed_at: new Date().toISOString() })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => prev.filter(a => a.id !== alertId));
    } catch (err) {
      console.error('Error dismissing alert:', err);
    }
  };

  const handleExecuteSearch = (search: SavedSearch) => {
    const params = new URLSearchParams();
    if (search.city) params.set('city', search.city);
    if (search.property_type) params.set('type', search.property_type);
    if (search.min_price) params.set('minPrice', search.min_price.toString());
    if (search.max_price) params.set('maxPrice', search.max_price.toString());
    if (search.min_bedrooms) params.set('bedrooms', search.min_bedrooms.toString());
    if (search.is_furnished !== null) params.set('furnished', search.is_furnished.toString());

    supabase.rpc('increment_search_count', { p_search_id: search.id });

    window.location.href = `/recherche?${params.toString()}`;
  };

  const getSearchSummary = (search: SavedSearch) => {
    const parts: string[] = [];

    if (search.property_type) {
      const types: Record<string, string> = {
        'appartement': 'Appartement',
        'maison': 'Maison',
        'studio': 'Studio',
        'villa': 'Villa'
      };
      parts.push(types[search.property_type] || search.property_type);
    }

    if (search.city) parts.push(search.city);

    if (search.min_bedrooms) parts.push(`${search.min_bedrooms}+ chambres`);

    if (search.min_price || search.max_price) {
      if (search.min_price && search.max_price) {
        parts.push(`${search.min_price.toLocaleString()} - ${search.max_price.toLocaleString()} FCFA`);
      } else if (search.min_price) {
        parts.push(`À partir de ${search.min_price.toLocaleString()} FCFA`);
      } else if (search.max_price) {
        parts.push(`Jusqu'à ${search.max_price.toLocaleString()} FCFA`);
      }
    }

    if (search.is_furnished) parts.push('Meublé');

    return parts.join(' • ') || 'Recherche personnalisée';
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center space-x-3">
            <Bookmark className="w-10 h-10 text-terracotta-600" />
            <span>Recherches sauvegardées</span>
          </h1>
          <p className="text-xl text-gray-600">
            Gérez vos recherches et recevez des alertes pour les nouvelles propriétés
          </p>
        </div>

        {alerts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <Bell className="w-6 h-6 text-terracotta-600" />
              <span>Nouvelles propriétés ({alerts.length})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {alerts.slice(0, 6).map(alert => (
                <div key={alert.id} className="card-scrapbook p-4 relative">
                  <button
                    onClick={() => handleDismissAlert(alert.id)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="mb-3">
                    {alert.properties.images[0] && (
                      <img
                        src={alert.properties.images[0]}
                        alt={alert.properties.title}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    )}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{alert.properties.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{alert.properties.city}</p>
                  <p className="text-lg font-bold text-terracotta-600 mb-3">
                    {alert.properties.monthly_rent.toLocaleString('fr-FR')} FCFA/mois
                  </p>
                  <a
                    href={`/propriete/${alert.property_id}`}
                    className="btn-primary w-full text-center text-sm"
                  >
                    Voir la propriété
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Mes recherches ({searches.length})</h2>
          <a href="/recherche" className="btn-secondary flex items-center space-x-2">
            <Search className="w-4 h-4" />
            <span>Nouvelle recherche</span>
          </a>
        </div>

        <div className="space-y-4">
          {searches.map(search => (
            <div key={search.id} className="card-scrapbook p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{search.name}</h3>
                  <p className="text-gray-600 mb-2">{getSearchSummary(search)}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{search.search_count} recherches</span>
                    </span>
                    {search.last_checked_at && (
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Dernière: {new Date(search.last_checked_at).toLocaleDateString('fr-FR')}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleToggleAlert(search.id, search.alert_enabled)}
                    className={`p-2 rounded-lg transition-colors ${
                      search.alert_enabled
                        ? 'bg-green-100 text-green-600 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                    title={search.alert_enabled ? 'Alertes activées' : 'Alertes désactivées'}
                  >
                    {search.alert_enabled ? (
                      <Bell className="w-5 h-5" />
                    ) : (
                      <BellOff className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteSearch(search.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {search.alert_enabled && (
                <div className="p-3 bg-green-50 rounded-lg mb-4 flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-800 font-medium">
                    Alertes {search.alert_frequency === 'instant' ? 'instantanées' :
                     search.alert_frequency === 'daily' ? 'quotidiennes' : 'hebdomadaires'}
                  </span>
                </div>
              )}

              <button
                onClick={() => handleExecuteSearch(search)}
                className="btn-primary w-full flex items-center justify-center space-x-2"
              >
                <Search className="w-4 h-4" />
                <span>Lancer la recherche</span>
              </button>
            </div>
          ))}

          {searches.length === 0 && (
            <div className="text-center py-12">
              <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-xl text-gray-600 mb-2">Aucune recherche sauvegardée</p>
              <p className="text-gray-500 mb-6">
                Sauvegardez vos recherches pour recevoir des alertes automatiques
              </p>
              <a href="/recherche" className="btn-primary inline-flex items-center space-x-2">
                <Search className="w-4 h-4" />
                <span>Commencer une recherche</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
