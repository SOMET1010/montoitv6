import { useState, useEffect } from 'react';
import { Search, MapPin, Home as HomeIcon, ArrowRight, Sparkles, Zap, Shield, Clock, Phone, Mail, Star, Award, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { PropertyWithOwner } from '../types';

export default function Home() {
  const [properties, setProperties] = useState<PropertyWithOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [activeSlide, setActiveSlide] = useState(0);

  const cities = ['Ouagadougou', 'Bobo-Dioulasso', 'Koudougou', 'Ouahigouya', 'Banfora'];

  const heroSlides = [
    {
      title: 'Trouvez votre MZAKA idéale',
      subtitle: 'À Ouagadougou et dans tout le Burkina Faso',
      image: 'https://images.pexels.com/photos/1546168/pexels-photo-1546168.jpeg?auto=compress&cs=tinysrgb&w=1920',
      overlay: 'from-primary-900/80 via-primary-800/70 to-transparent'
    },
    {
      title: 'Logements modernes et confortables',
      subtitle: 'Studios, appartements, villas à votre portée',
      image: 'https://images.pexels.com/photos/1648776/pexels-photo-1648776.jpeg?auto=compress&cs=tinysrgb&w=1920',
      overlay: 'from-secondary-900/80 via-secondary-800/70 to-transparent'
    },
    {
      title: 'Location simple et sécurisée',
      subtitle: 'Contactez directement les propriétaires',
      image: 'https://images.pexels.com/photos/1029599/pexels-photo-1029599.jpeg?auto=compress&cs=tinysrgb&w=1920',
      overlay: 'from-accent-900/80 via-accent-800/70 to-transparent'
    },
  ];

  useEffect(() => {
    loadFeaturedProperties();
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const loadFeaturedProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`*, owner:profiles(*)`)
        .eq('status', 'available')
        .order('created_at', { ascending: false })
        .limit(6);
      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Erreur:', error);
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
      {/* Hero avec images contextuelles */}
      <section className="relative h-[95vh] flex items-center overflow-hidden">
        {/* Images de fond en slider */}
        {heroSlides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === activeSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Image de fond */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${slide.image})` }}
            >
              {/* Overlay gradient */}
              <div className={`absolute inset-0 bg-gradient-to-r ${slide.overlay}`}></div>
              {/* Overlay pattern */}
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: `repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 10px,
                  rgba(255,255,255,0.05) 10px,
                  rgba(255,255,255,0.05) 20px
                )`
              }}></div>
            </div>
          </div>
        ))}

        {/* Contenu Hero */}
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            {/* Badge avec animation */}
            <div className="text-center mb-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-6 py-3 rounded-full border border-white/30 shadow-2xl">
                <Star className="w-5 h-5 text-secondary-300 fill-current" />
                <span className="text-white font-bold text-lg">N°1 au Burkina Faso</span>
              </div>
            </div>

            {/* Logo MZAKA géant */}
            <div className="text-center mb-10">
              <div className="inline-block mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 blur-3xl"></div>
                  <div className="relative flex items-center justify-center gap-4 bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-xl px-12 py-6 rounded-3xl border-2 border-white/40 shadow-2xl">
                    <HomeIcon className="w-14 h-14 text-white" strokeWidth={2.5} />
                    <h1 className="text-7xl md:text-8xl font-black text-white tracking-tight drop-shadow-2xl">
                      MZAKA
                    </h1>
                  </div>
                </div>
              </div>

              {/* Titres avec transitions */}
              <div className="min-h-[120px] relative">
                {heroSlides.map((slide, index) => (
                  <div
                    key={index}
                    className={`absolute inset-x-0 transition-all duration-700 ${
                      index === activeSlide
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-8 pointer-events-none'
                    }`}
                  >
                    <h2 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
                      {slide.title}
                    </h2>
                    <p className="text-xl md:text-2xl text-white/95 drop-shadow-lg">
                      {slide.subtitle}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Indicateurs de slide */}
            <div className="flex justify-center gap-3 mb-10">
              {heroSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveSlide(index)}
                  className={`transition-all duration-300 rounded-full ${
                    index === activeSlide
                      ? 'w-12 h-2 bg-white shadow-lg'
                      : 'w-8 h-2 bg-white/40 hover:bg-white/60'
                  }`}
                  aria-label={`Slide ${index + 1}`}
                />
              ))}
            </div>

            {/* Barre de recherche avec glass effect */}
            <form onSubmit={handleSearch} className="relative animate-slide-up">
              <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 md:p-8 border border-white/20">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Recherche */}
                  <div className="flex-1 relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6 transition-colors group-focus-within:text-primary-600" />
                    <input
                      type="text"
                      placeholder="Appartement, villa, studio..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-14 pr-6 py-5 text-lg border-2 border-gray-200 rounded-2xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all bg-white"
                    />
                  </div>

                  {/* Ville */}
                  <div className="md:w-72 relative group">
                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6 transition-colors group-focus-within:text-primary-600" />
                    <select
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      className="w-full pl-14 pr-6 py-5 text-lg border-2 border-gray-200 rounded-2xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all appearance-none cursor-pointer bg-white"
                    >
                      <option value="">Toutes les villes</option>
                      {cities.map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>

                  {/* Bouton */}
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold py-5 px-10 rounded-2xl text-lg flex items-center justify-center gap-3 transform hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-xl"
                  >
                    <Search className="w-6 h-6" />
                    <span className="hidden sm:inline">Rechercher</span>
                  </button>
                </div>

                {/* Tags rapides */}
                <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-gray-200">
                  <span className="text-sm text-gray-600 font-medium">Populaire :</span>
                  {['Studio Ouaga', 'Villa 2Zone', 'Appart Bobo'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSearchQuery(tag)}
                      className="px-4 py-1.5 bg-gray-100 hover:bg-primary-50 hover:text-primary-700 text-gray-700 rounded-full text-sm font-medium transition-all hover:scale-105"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-white/80 rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Stats rapides */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: HomeIcon, value: '500+', label: 'Logements', color: 'primary' },
              { icon: CheckCircle, value: '98%', label: 'Satisfaits', color: 'secondary' },
              { icon: Clock, value: '< 5min', label: 'Réponse', color: 'accent' },
              { icon: Shield, value: '100%', label: 'Sécurisé', color: 'primary' },
            ].map((stat, index) => (
              <div key={index} className="text-center group cursor-default">
                <div className={`inline-flex items-center justify-center w-16 h-16 bg-${stat.color}-100 text-${stat.color}-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-8 h-8" strokeWidth={2} />
                </div>
                <div className="text-3xl font-black text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Avantages avec icônes */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Pourquoi <span className="text-primary-600">MZAKA</span> ?
            </h2>
            <p className="text-xl text-gray-600">La solution la plus simple pour trouver votre logement</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: 'Ultra rapide',
                description: 'Trouvez votre logement en moins de 5 minutes grâce à notre recherche intelligente',
                color: 'primary',
              },
              {
                icon: Shield,
                title: 'Sécurisé',
                description: 'Profils vérifiés, paiements sécurisés et support client disponible 24/7',
                color: 'secondary',
              },
              {
                icon: Award,
                title: 'De confiance',
                description: 'La plateforme n°1 au Burkina Faso avec des milliers d\'utilisateurs satisfaits',
                color: 'accent',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group relative bg-white rounded-3xl p-8 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-gray-100"
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 bg-${feature.color}-100 text-${feature.color}-600 rounded-2xl mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-8 h-8" strokeWidth={2} />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Propriétés */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-primary-600 font-bold mb-2 text-sm uppercase tracking-wide">Nos Annonces</p>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900">Dernières offres</h2>
            </div>
            <Link
              to="/recherche"
              className="hidden md:flex items-center gap-2 text-primary-600 font-bold text-lg hover:gap-4 transition-all group"
            >
              <span>Tout voir</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-3xl overflow-hidden animate-pulse">
                  <div className="h-64 bg-gray-200"></div>
                  <div className="p-6 space-y-3">
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {properties.map((property) => (
                <Link
                  key={property.id}
                  to={`/propriete/${property.id}`}
                  className="group bg-white rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100"
                >
                  <div className="relative h-64 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    {property.images?.[0] ? (
                      <img
                        src={property.images[0]}
                        alt={property.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <HomeIcon className="w-20 h-20 text-gray-300" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full font-bold text-primary-600 shadow-lg">
                      {formatPrice(property.price)}/mois
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-xl mb-2 text-gray-900 line-clamp-1 group-hover:text-primary-600 transition-colors">
                      {property.title}
                    </h3>
                    <p className="text-gray-500 text-sm mb-4 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary-500" />
                      {property.city} {property.neighborhood && `• ${property.neighborhood}`}
                    </p>
                    <div className="flex gap-4 text-sm text-gray-600 pt-4 border-t border-gray-100">
                      {property.bedrooms > 0 && <span className="font-medium">{property.bedrooms} ch</span>}
                      {property.bathrooms > 0 && <span className="font-medium">{property.bathrooms} sdb</span>}
                      {property.area && <span className="font-medium">{property.area}m²</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA final */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary-500 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-accent-500 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-6xl font-black mb-6">
              Vous êtes propriétaire ?
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 mb-10 leading-relaxed">
              Publiez votre annonce <span className="text-secondary-400 font-bold">gratuitement</span> et trouvez des locataires qualifiés en quelques jours
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/publier"
                className="inline-flex items-center justify-center gap-3 bg-white text-gray-900 font-bold py-5 px-10 rounded-2xl hover:bg-gray-100 transition-all shadow-2xl hover:shadow-xl transform hover:scale-105 text-lg"
              >
                <HomeIcon className="w-6 h-6" />
                Publier gratuitement
              </Link>
              <Link
                to="/connexion"
                className="inline-flex items-center justify-center gap-3 bg-white/10 backdrop-blur-sm text-white font-bold py-5 px-10 rounded-2xl hover:bg-white/20 transition-all border-2 border-white/30 text-lg"
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
