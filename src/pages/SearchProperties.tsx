import { useState, useEffect, lazy, Suspense } from 'react';
import { Search, MapPin, SlidersHorizontal, Building2, Home, Bed, Bath, X, Sparkles, Map as MapIcon, List, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { recommendationService } from '../services/ai/recommendationService';
import { useAuth } from '../contexts/AuthContext';

const MapboxMap = lazy(() => import('../components/MapboxMap'));

type Property = Database['public']['Tables']['properties']['Row'];
type PropertyType = Database['public']['Tables']['properties']['Row']['property_type'];

export default function SearchProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [recommendedProperties, setRecommendedProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [highlightedPropertyId, setHighlightedPropertyId] = useState<string | undefined>();
  const [viewMode, setViewMode] = useState<'list' | 'map' | 'split'>('split');
  const { user } = useAuth();

  const [searchCity, setSearchCity] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType | ''>('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [isFurnished, setIsFurnished] = useState<boolean | null>(null);
  const [hasParking, setHasParking] = useState<boolean | null>(null);
  const [hasAC, setHasAC] = useState<boolean | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'price_asc' | 'price_desc'>('recent');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const city = params.get('city');
    if (city) setSearchCity(city);

    loadProperties();
    if (user) {
      loadRecommendations();
    }
  }, [user]);

  const loadRecommendations = async () => {
    if (!user) return;

    setLoadingRecommendations(true);
    try {
      const recommended = await recommendationService.getPersonalizedRecommendations(user.id, 6);
      setRecommendedProperties(recommended);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const loadProperties = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('properties')
        .select('*')
        .eq('status', 'available');

      if (searchCity) {
        query = query.or(`city.ilike.%${searchCity}%,neighborhood.ilike.%${searchCity}%`);
      }

      if (propertyType) {
        query = query.eq('property_type', propertyType);
      }

      if (minPrice) {
        query = query.gte('monthly_rent', parseFloat(minPrice));
      }

      if (maxPrice) {
        query = query.lte('monthly_rent', parseFloat(maxPrice));
      }

      if (bedrooms) {
        query = query.gte('bedrooms', parseInt(bedrooms));
      }

      if (bathrooms) {
        query = query.gte('bathrooms', parseInt(bathrooms));
      }

      if (isFurnished !== null) {
        query = query.eq('is_furnished', isFurnished);
      }

      if (hasParking !== null) {
        query = query.eq('has_parking', hasParking);
      }

      if (hasAC !== null) {
        query = query.eq('has_ac', hasAC);
      }

      if (sortBy === 'recent') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'price_asc') {
        query = query.order('monthly_rent', { ascending: true });
      } else if (sortBy === 'price_desc') {
        query = query.order('monthly_rent', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadProperties();
  };

  const clearFilters = () => {
    setSearchCity('');
    setPropertyType('');
    setMinPrice('');
    setMaxPrice('');
    setBedrooms('');
    setBathrooms('');
    setIsFurnished(null);
    setHasParking(null);
    setHasAC(null);
    setSortBy('recent');
  };

  const activeFiltersCount = [
    searchCity,
    propertyType,
    minPrice,
    maxPrice,
    bedrooms,
    bathrooms,
    isFurnished !== null,
    hasParking !== null,
    hasAC !== null,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen custom-cursor bg-gradient-to-b from-amber-50 to-white">
      <div className="bg-white/80 backdrop-blur-xl border-b-2 border-terracotta-100 sticky top-20 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1 w-full relative group">
              <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-terracotta-500 group-hover:scale-110 transition-transform" />
              <input
                type="text"
                placeholder="Où cherchez-vous ? (Cocody, Plateau, Yopougon...)"
                className="w-full pl-14 pr-4 py-4 border-2 border-gray-200 rounded-3xl focus:outline-none focus:ring-4 focus:ring-terracotta-400 focus:border-terracotta-500 transition-all bg-white/90 text-lg font-medium"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                aria-label="Rechercher une ville ou un quartier"
              />
            </div>
            <button
              type="submit"
              className="w-full md:w-auto btn-primary px-8 py-4 text-lg flex items-center justify-center space-x-2"
            >
              <Search className="h-6 w-6" />
              <span>Rechercher</span>
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="w-full md:w-auto flex items-center justify-center space-x-2 px-6 py-4 border-2 border-terracotta-500 text-terracotta-600 rounded-3xl hover:bg-terracotta-50 transition-all font-bold transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-terracotta-400 focus:ring-offset-2"
              aria-label="Afficher les filtres de recherche"
              aria-expanded={showFilters}
            >
              <SlidersHorizontal className="h-6 w-6" />
              <span>Filtres</span>
              {activeFiltersCount > 0 && (
                <span className="bg-gradient-to-r from-coral-500 to-amber-500 text-white text-xs px-3 py-1 rounded-full font-bold shadow-glow" aria-label={`${activeFiltersCount} filtres actifs`}>
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </form>
        </div>
      </div>

      {showFilters && (
        <div className="bg-gradient-to-r from-terracotta-50 via-amber-50 to-coral-50 border-b-2 border-terracotta-200 animate-slide-down">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                <Sparkles className="h-6 w-6 text-amber-500" />
                <span>Affinez votre recherche</span>
              </h3>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-terracotta-600 hover:text-terracotta-700 font-bold flex items-center space-x-2 transform hover:scale-105 transition-all"
                >
                  <X className="h-5 w-5" />
                  <span>Tout effacer</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-card rounded-2xl p-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Type de bien
                </label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value as PropertyType | '')}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-terracotta-200 focus:border-terracotta-500 bg-white appearance-none cursor-pointer font-medium"
                >
                  <option value="">🏘️ Tous les types</option>
                  <option value="appartement">🏢 Appartement</option>
                  <option value="villa">🏡 Villa</option>
                  <option value="studio">🚪 Studio</option>
                  <option value="chambre">🛏️ Chambre</option>
                  <option value="bureau">💼 Bureau</option>
                  <option value="commerce">🏪 Commerce</option>
                </select>
              </div>

              <div className="glass-card rounded-2xl p-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Prix minimum
                </label>
                <input
                  type="number"
                  placeholder="0 FCFA"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-terracotta-200 focus:border-terracotta-500 bg-white font-medium"
                />
              </div>

              <div className="glass-card rounded-2xl p-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Prix maximum
                </label>
                <input
                  type="number"
                  placeholder="Illimité"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-terracotta-200 focus:border-terracotta-500 bg-white font-medium"
                />
              </div>

              <div className="glass-card rounded-2xl p-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Chambres min.
                </label>
                <select
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-terracotta-200 focus:border-terracotta-500 bg-white appearance-none cursor-pointer font-medium"
                >
                  <option value="">Indifférent</option>
                  <option value="1">1+ chambres</option>
                  <option value="2">2+ chambres</option>
                  <option value="3">3+ chambres</option>
                  <option value="4">4+ chambres</option>
                  <option value="5">5+ chambres</option>
                </select>
              </div>

              <div className="glass-card rounded-2xl p-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Salles de bain min.
                </label>
                <select
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-terracotta-200 focus:border-terracotta-500 bg-white appearance-none cursor-pointer font-medium"
                >
                  <option value="">Indifférent</option>
                  <option value="1">1+ salles de bain</option>
                  <option value="2">2+ salles de bain</option>
                  <option value="3">3+ salles de bain</option>
                </select>
              </div>

              <div className="glass-card rounded-2xl p-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Meublé
                </label>
                <select
                  value={isFurnished === null ? '' : isFurnished ? 'yes' : 'no'}
                  onChange={(e) => setIsFurnished(e.target.value === '' ? null : e.target.value === 'yes')}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-terracotta-200 focus:border-terracotta-500 bg-white appearance-none cursor-pointer font-medium"
                >
                  <option value="">Indifférent</option>
                  <option value="yes">Meublé</option>
                  <option value="no">Non meublé</option>
                </select>
              </div>

              <div className="glass-card rounded-2xl p-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Parking
                </label>
                <select
                  value={hasParking === null ? '' : hasParking ? 'yes' : 'no'}
                  onChange={(e) => setHasParking(e.target.value === '' ? null : e.target.value === 'yes')}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-terracotta-200 focus:border-terracotta-500 bg-white appearance-none cursor-pointer font-medium"
                >
                  <option value="">Indifférent</option>
                  <option value="yes">Avec parking</option>
                  <option value="no">Sans parking</option>
                </select>
              </div>

              <div className="glass-card rounded-2xl p-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Climatisation
                </label>
                <select
                  value={hasAC === null ? '' : hasAC ? 'yes' : 'no'}
                  onChange={(e) => setHasAC(e.target.value === '' ? null : e.target.value === 'yes')}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-terracotta-200 focus:border-terracotta-500 bg-white appearance-none cursor-pointer font-medium"
                >
                  <option value="">Indifférent</option>
                  <option value="yes">Avec climatisation</option>
                  <option value="no">Sans climatisation</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={loadProperties}
                className="btn-primary px-8 py-3 flex items-center space-x-2"
              >
                <Sparkles className="h-5 w-5" />
                <span>Appliquer les filtres ({activeFiltersCount})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {user && recommendedProperties.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-3 shadow-glow">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <span>Recommandé pour vous</span>
              </h2>
              <span className="text-sm text-gray-500 font-medium">Propulsé par IA</span>
            </div>

            {loadingRecommendations ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="glass-card rounded-2xl overflow-hidden animate-pulse">
                    <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded-lg w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded-lg w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendedProperties.map((property) => (
                  <a
                    key={property.id}
                    href={`/propriete/${property.id}`}
                    onClick={() => {
                      recommendationService.trackRecommendationClick(user.id, property.id);
                    }}
                    className="glass-card rounded-2xl overflow-hidden hover:shadow-glow transition-all duration-300 group relative"
                  >
                    <div className="absolute top-2 right-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg z-10 flex items-center space-x-1">
                      <Star className="h-3 w-3 fill-current" />
                      <span>Recommandé</span>
                    </div>

                    <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                      {property.main_image ? (
                        <img
                          src={property.main_image}
                          alt={property.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Building2 className="h-16 w-16" />
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg text-xs font-bold text-gray-800 capitalize">
                        {property.property_type}
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-terracotta-600 transition-colors line-clamp-2">
                        {property.title}
                      </h3>

                      <p className="text-gray-600 flex items-center space-x-2 text-sm mb-3">
                        <MapPin className="h-4 w-4 text-terracotta-500 flex-shrink-0" />
                        <span className="line-clamp-1">{property.city}</span>
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Bed className="h-4 w-4" />
                            <span>{property.bedrooms}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Bath className="h-4 w-4" />
                            <span>{property.bathrooms}</span>
                          </div>
                        </div>
                        <div className="text-terracotta-600 font-bold text-lg">
                          {property.monthly_rent.toLocaleString()} FCFA
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}

            <div className="mt-6 pt-6 border-t-2 border-gray-200"></div>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              <span className="text-gradient">{properties.length}</span> propriété{properties.length > 1 ? 's' : ''} trouvée{properties.length > 1 ? 's' : ''}
            </h1>
            {searchCity && (
              <p className="text-gray-600 text-lg">à <span className="font-bold text-terracotta-600">{searchCity}</span></p>
            )}
            {properties.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full font-semibold">
                  {properties.filter(p => p.status === 'available').length} disponibles
                </span>
                {propertyType && (
                  <span className="text-xs bg-terracotta-100 text-terracotta-800 px-3 py-1 rounded-full font-semibold">
                    Type: {propertyType}
                  </span>
                )}
                {maxPrice && (
                  <span className="text-xs bg-coral-100 text-coral-800 px-3 py-1 rounded-full font-semibold">
                    Max: {parseFloat(maxPrice).toLocaleString()} FCFA
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3 glass-card rounded-2xl px-4 py-3">
            <span className="text-sm font-bold text-gray-700">Trier:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as any);
                loadProperties();
              }}
              className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-terracotta-200 focus:border-terracotta-500 bg-white cursor-pointer font-bold text-terracotta-600"
            >
              <option value="recent">✨ Plus récent</option>
              <option value="price_asc">💰 Prix croissant</option>
              <option value="price_desc">💎 Prix décroissant</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card-scrapbook overflow-hidden animate-pulse">
                <div className="h-64 bg-gradient-to-br from-gray-200 to-gray-300"></div>
                <div className="p-6 space-y-4">
                  <div className="h-6 bg-gray-200 rounded-lg w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded-lg w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded-lg w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : properties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map((property, index) => (
              <a
                key={property.id}
                href={`/propriete/${property.id}`}
                className="card-scrapbook overflow-hidden group"
                style={{
                  transform: `rotate(${(index % 3 === 0) ? '-1deg' : (index % 3 === 1) ? '0deg' : '1deg'})`,
                }}
              >
                <div className="relative h-64 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                  {property.main_image ? (
                    <img
                      src={property.main_image}
                      alt={property.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Building2 className="h-20 w-20" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-gradient-to-r from-terracotta-500 to-coral-500 text-white px-4 py-2 rounded-2xl text-sm font-bold shadow-glow transform -rotate-3 group-hover:rotate-0 transition-transform">
                    {property.monthly_rent.toLocaleString()} FCFA/mois
                  </div>
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-xl text-xs font-bold text-gray-800 capitalize shadow-lg">
                    {property.property_type}
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-br from-white to-amber-50/30">
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-terracotta-600 transition-colors line-clamp-2">
                    {property.title}
                  </h3>

                  <p className="text-gray-600 flex items-center space-x-2 text-sm mb-4">
                    <MapPin className="h-4 w-4 text-terracotta-500 flex-shrink-0" />
                    <span className="line-clamp-1">{property.city}{property.neighborhood ? `, ${property.neighborhood}` : ''}</span>
                  </p>

                  <div className="flex items-center justify-between text-sm text-gray-600 border-t border-gray-200 pt-4">
                    <div className="flex items-center space-x-1">
                      <Bed className="h-4 w-4 text-olive-600" />
                      <span className="font-bold">{property.bedrooms} ch.</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Bath className="h-4 w-4 text-cyan-600" />
                      <span className="font-bold">{property.bathrooms} SDB</span>
                    </div>
                    {property.surface_area && (
                      <div className="flex items-center space-x-1">
                        <Home className="h-4 w-4 text-coral-600" />
                        <span className="font-bold">{property.surface_area}m²</span>
                      </div>
                    )}
                  </div>

                  {(property.is_furnished || property.has_parking || property.has_ac) && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {property.is_furnished && (
                        <span className="text-xs bg-olive-100 text-olive-800 px-3 py-1 rounded-full font-bold">Meublé</span>
                      )}
                      {property.has_parking && (
                        <span className="text-xs bg-cyan-100 text-cyan-800 px-3 py-1 rounded-full font-bold">Parking</span>
                      )}
                      {property.has_ac && (
                        <span className="text-xs bg-coral-100 text-coral-800 px-3 py-1 rounded-full font-bold">Clim</span>
                      )}
                    </div>
                  )}
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gradient-to-br from-amber-50 to-coral-50 rounded-3xl border-4 border-dashed border-terracotta-200">
            <Building2 className="h-24 w-24 text-terracotta-300 mx-auto mb-6 animate-bounce-subtle" />
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Aucune propriété trouvée</h3>
            <p className="text-gray-600 mb-6 text-lg">
              Essayez d'ajuster vos critères de recherche
            </p>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="btn-primary"
              >
                Effacer les filtres
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
