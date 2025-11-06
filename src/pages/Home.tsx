import { useState, useEffect } from 'react';
import { Search, MapPin, Home as HomeIcon, Heart, MessageCircle, ArrowRight, Star, TrendingUp, Users, Shield } from 'lucide-react';
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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section avec drapeau Burkina */}
      <section className="relative overflow-hidden bg-gradient-burkina py-24 md:py-32">
        {/* Pattern d'arrière-plan */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto">
            {/* Badge */}
            <div className="flex justify-center mb-6 animate-slide-down">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white">
                <Star className="w-4 h-4 fill-current" />
                <span className="font-semibold">Plateforme N°1 au Burkina Faso</span>
              </div>
            </div>

            {/* Titre principal */}
            <div className="text-center mb-12">
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 animate-slide-up">
                Trouvez votre <span className="text-burkina-yellow-300">logement idéal</span>
              </h1>
              <p className="text-xl md:text-2xl text-white/90 mb-2">
                La marketplace immobilière du Burkina Faso
              </p>
              <p className="text-lg text-white/80">
                <span className="font-semibold">MZAKA</span> - Votre maison vous attend
              </p>
            </div>

            {/* Formulaire de recherche moderne */}
            <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-strong p-6 md:p-8 backdrop-blur-xl animate-scale-in">
              <div className="grid md:grid-cols-[2fr,1fr,auto] gap-4">
                {/* Recherche par mots-clés */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Studio, appartement, maison..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all"
                  />
                </div>

                {/* Sélection ville */}
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 appearance-none cursor-pointer transition-all bg-white"
                  >
                    <option value="">Toutes les villes</option>
                    {cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Bouton recherche */}
                <button
                  type="submit"
                  className="bg-gradient-primary hover:shadow-strong text-white font-bold py-4 px-8 rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap transform hover:scale-105"
                >
                  <Search className="w-5 h-5" />
                  <span className="hidden md:inline">Rechercher</span>
                </button>
              </div>

              {/* Tags de recherche rapide */}
              <div className="flex flex-wrap gap-2 mt-6">
                <span className="text-sm text-gray-600 mr-2">Recherches populaires:</span>
                {['Studio Ouaga', 'Villa Bobo', 'Appartement Zone 1'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSearchQuery(tag)}
                    className="px-3 py-1 bg-gray-100 hover:bg-primary-50 hover:text-primary-700 text-gray-700 rounded-full text-sm transition-all"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </form>
          </div>
        </div>

        {/* Vague décorative */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#F9FAFB"/>
          </svg>
        </div>
      </section>

      {/* Statistiques */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: HomeIcon, value: '500+', label: 'Propriétés' },
              { icon: Users, value: '1000+', label: 'Utilisateurs' },
              { icon: MessageCircle, value: '5000+', label: 'Messages' },
              { icon: TrendingUp, value: '98%', label: 'Satisfaction' },
            ].map((stat, index) => (
              <div key={index} className="bg-white rounded-xl p-6 text-center shadow-soft hover:shadow-medium transition-all">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-primary rounded-full mb-3">
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fonctionnalités principales */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Pourquoi choisir <span className="text-primary-600">MZAKA</span> ?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              La solution simple et sécurisée pour trouver ou louer un logement au Burkina Faso
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: HomeIcon,
                title: 'Large choix de propriétés',
                description: 'Des centaines de logements vérifiés à Ouagadougou, Bobo-Dioulasso et dans tout le pays',
                color: 'primary',
              },
              {
                icon: MessageCircle,
                title: 'Contact direct instantané',
                description: 'Discutez en temps réel avec les propriétaires via notre messagerie intégrée',
                color: 'secondary',
              },
              {
                icon: Shield,
                title: 'Sécurisé et fiable',
                description: 'Profils vérifiés, paiements sécurisés et support client réactif',
                color: 'accent',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group relative bg-gray-50 rounded-2xl p-8 hover:shadow-strong transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-${feature.color} rounded-2xl mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Propriétés à la une */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl font-bold mb-2">Dernières annonces</h2>
              <p className="text-gray-600">Découvrez les propriétés récemment ajoutées</p>
            </div>
            <Link
              to="/recherche"
              className="hidden md:flex items-center gap-2 bg-gradient-primary text-white font-semibold py-3 px-6 rounded-xl hover:shadow-medium transition-all transform hover:scale-105"
            >
              Voir tout
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-soft">
                  <div className="h-56 bg-gray-200 animate-pulse"></div>
                  <div className="p-6 space-y-3">
                    <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-soft">
              <HomeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Aucune propriété disponible pour le moment</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {properties.map((property) => (
                <Link
                  key={property.id}
                  to={`/propriete/${property.id}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-soft hover:shadow-strong transition-all duration-300 transform hover:-translate-y-2"
                >
                  {/* Image */}
                  <div className="relative h-56 bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
                    {property.images && property.images.length > 0 ? (
                      <img
                        src={property.images[0]}
                        alt={property.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <HomeIcon className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                    {/* Badge prix */}
                    <div className="absolute top-4 right-4 bg-gradient-primary text-white px-4 py-2 rounded-xl font-bold shadow-medium">
                      {formatPrice(property.price)}/mois
                    </div>
                  </div>

                  {/* Contenu */}
                  <div className="p-6">
                    <h3 className="font-bold text-xl mb-3 text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1">
                      {property.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary-500" />
                      <span className="font-medium">{property.city}</span>
                      {property.neighborhood && <span className="text-gray-400">• {property.neighborhood}</span>}
                    </p>

                    {/* Caractéristiques */}
                    <div className="flex items-center gap-4 text-sm text-gray-600 border-t border-gray-100 pt-4">
                      {property.bedrooms > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-gray-900">{property.bedrooms}</span>
                          <span>ch.</span>
                        </div>
                      )}
                      {property.bathrooms > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-gray-900">{property.bathrooms}</span>
                          <span>sdb</span>
                        </div>
                      )}
                      {property.area && (
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-gray-900">{property.area}</span>
                          <span>m²</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Bouton mobile */}
          <div className="mt-8 text-center md:hidden">
            <Link
              to="/recherche"
              className="inline-flex items-center gap-2 bg-gradient-primary text-white font-semibold py-3 px-6 rounded-xl hover:shadow-medium transition-all"
            >
              Voir toutes les annonces
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-burkina relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Vous êtes propriétaire ?
            </h2>
            <p className="text-xl mb-8 text-white/90">
              Publiez votre annonce gratuitement et trouvez des locataires qualifiés rapidement
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/publier"
                className="inline-flex items-center justify-center gap-2 bg-white text-primary-600 font-bold py-4 px-8 rounded-xl hover:bg-gray-50 transition-all shadow-strong hover:shadow-medium transform hover:scale-105"
              >
                <HomeIcon className="w-5 h-5" />
                Publier une annonce
              </Link>
              <Link
                to="/connexion"
                className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm text-white font-bold py-4 px-8 rounded-xl hover:bg-white/20 transition-all border-2 border-white/30"
              >
                Se connecter
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
