import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { recommendationEngine } from '../../services/ai/recommendationEngine';
import { Sparkles, TrendingUp, Clock, Heart, MessageCircle, Eye, ChevronRight } from 'lucide-react';
import type { Database } from '../../lib/database.types';

type Property = Database['public']['Tables']['properties']['Row'];

interface PropertyScore {
  property: Property;
  score: number;
  reasons: string[];
}

export default function Recommendations() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<PropertyScore[]>([]);
  const [trendingProperties, setTrendingProperties] = useState<Property[]>([]);
  const [newProperties, setNewProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'for-you' | 'trending' | 'new'>('for-you');

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [recs, trending, newProps] = await Promise.all([
        recommendationEngine.getRecommendations({ userId: user.id, limit: 12 }),
        recommendationEngine.getTrendingProperties(12),
        recommendationEngine.getNewProperties(12),
      ]);

      setRecommendations(recs);
      setTrendingProperties(trending);
      setNewProperties(newProps);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const PropertyCard = ({ property, score, reasons }: { property: Property; score?: number; reasons?: string[] }) => (
    <div className="group bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
      <div className="relative">
        <img
          src={property.images?.[0] || '/placeholder.jpg'}
          alt={property.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {score && score > 70 && (
          <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
            <Sparkles className="h-3 w-3" />
            <span>{Math.round(score)}% match</span>
          </div>
        )}
        {property.status === 'disponible' && (
          <div className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">
            Disponible
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-2 mb-2">
          {property.title}
        </h3>

        <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm mb-3">
          <MapPin className="h-4 w-4 mr-1" />
          <span>{property.neighborhood}, {property.city}</span>
        </div>

        <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400 mb-3">
          {property.monthly_rent.toLocaleString()} FCFA<span className="text-sm font-normal text-gray-500">/mois</span>
        </div>

        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
          <span>{property.bedrooms} chambres</span>
          <span>•</span>
          <span>{property.bathrooms} SDB</span>
          <span>•</span>
          <span>{property.surface_area} m²</span>
        </div>

        {reasons && reasons.length > 0 && (
          <div className="mb-3">
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Pourquoi cette recommandation :
            </div>
            <ul className="space-y-1">
              {reasons.slice(0, 2).map((reason, idx) => (
                <li key={idx} className="text-xs text-gray-600 dark:text-gray-400 flex items-start">
                  <ChevronRight className="h-3 w-3 mr-1 flex-shrink-0 mt-0.5 text-cyan-500" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 text-xs text-gray-500">
            <span className="flex items-center">
              <Eye className="h-3 w-3 mr-1" />
              {property.views_count || 0}
            </span>
            {property.rating && (
              <span className="flex items-center">
                ⭐ {property.rating.toFixed(1)}
              </span>
            )}
          </div>
          <button className="text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 text-sm font-medium">
            Voir détails →
          </button>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'for-you', label: 'Pour vous', icon: Sparkles, count: recommendations.length },
    { id: 'trending', label: 'Tendances', icon: TrendingUp, count: trendingProperties.length },
    { id: 'new', label: 'Nouveautés', icon: Clock, count: newProperties.length },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3 mb-4">
            <Sparkles className="h-10 w-10" />
            <h1 className="text-4xl font-bold">Recommandations personnalisées</h1>
          </div>
          <p className="text-cyan-100 text-lg max-w-2xl">
            Découvrez les propriétés parfaites pour vous, sélectionnées par notre intelligence artificielle
            en fonction de vos préférences et de votre historique.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    flex items-center space-x-2 px-4 py-4 border-b-2 transition-colors font-medium
                    ${isActive
                      ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                  <span className={`
                    px-2 py-0.5 rounded-full text-xs font-semibold
                    ${isActive
                      ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }
                  `}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl shadow-md h-96 animate-pulse">
                <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-t-xl"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {activeTab === 'for-you' && (
              <>
                {recommendations.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recommendations.map((rec) => (
                      <PropertyCard
                        key={rec.property.id}
                        property={rec.property}
                        score={rec.score}
                        reasons={rec.reasons}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Sparkles className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      Aucune recommandation pour le moment
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                      Commencez à explorer des propriétés et ajoutez des favoris pour que nous puissions
                      vous recommander les meilleures options.
                    </p>
                  </div>
                )}
              </>
            )}

            {activeTab === 'trending' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trendingProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            )}

            {activeTab === 'new' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {newProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
