import { useState, useEffect } from 'react';
import { Search, MapPin, Home as HomeIcon, Heart, MessageCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { PropertyWithOwner } from '../types';

export default function Home() {
  const [properties, setProperties] = useState<PropertyWithOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  const cities = [
    'Ouagadougou',
    'Bobo-Dioulasso',
    'Koudougou',
    'Ouahigouya',
    'Banfora',
  ];

  useEffect(() => {
    loadFeaturedProperties();
  }, []);

  const loadFeaturedProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          owner:profiles(*)
        `)
        .eq('status', 'available')
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Erreur chargement propriétés:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedCity) params.set('city', selectedCity);
    window.location.href = `/recherche?${params.toString()}`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="absolute inset-0 bg-black/20"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Bienvenue sur <span className="text-yellow-400">MZAKA</span>
            </h1>
            <p className="text-xl md:text-2xl mb-12 text-blue-100">
              Votre marketplace immobilière au Burkina Faso
            </p>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="bg-white rounded-lg shadow-2xl p-4 md:p-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Rechercher un logement..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                </div>

                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 appearance-none"
                  >
                    <option value="">Toutes les villes</option>
                    {cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Search className="w-5 h-5" />
                Rechercher
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <HomeIcon className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Large choix</h3>
              <p className="text-gray-600">
                Des centaines de logements à Ouagadougou, Bobo-Dioulasso et partout au Burkina
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Contact direct</h3>
              <p className="text-gray-600">
                Communiquez directement avec les propriétaires via notre messagerie
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Simple et rapide</h3>
              <p className="text-gray-600">
                Trouvez votre logement idéal en quelques clics
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Annonces récentes</h2>
            <Link
              to="/recherche"
              className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2"
            >
              Voir toutes les annonces
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-80"></div>
              ))}
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Aucune propriété disponible pour le moment</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <Link
                  key={property.id}
                  to={`/propriete/${property.id}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="relative h-48 bg-gray-200">
                    {property.images && property.images.length > 0 ? (
                      <img
                        src={property.images[0]}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <HomeIcon className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      {formatPrice(property.price)}/mois
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-2 line-clamp-1">{property.title}</h3>
                    <p className="text-gray-600 text-sm mb-2 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {property.city}
                      {property.neighborhood && `, ${property.neighborhood}`}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {property.bedrooms > 0 && (
                        <span>{property.bedrooms} ch.</span>
                      )}
                      {property.bathrooms > 0 && (
                        <span>{property.bathrooms} sdb</span>
                      )}
                      {property.area && (
                        <span>{property.area}m²</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Vous avez un logement à louer ?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Publiez votre annonce gratuitement et trouvez des locataires rapidement
          </p>
          <Link
            to="/publier"
            className="inline-flex items-center gap-2 bg-white text-blue-600 font-bold py-3 px-8 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <HomeIcon className="w-5 h-5" />
            Publier une annonce
          </Link>
        </div>
      </section>
    </div>
  );
}
