import { useState, useEffect } from 'react';
import { Search, MapPin, Home as HomeIcon, ArrowRight, Sparkles, Zap, Shield, Clock, Phone, Mail } from 'lucide-react';
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
      title: 'Trouvez votre MZAKA',
      subtitle: 'Des milliers de logements vous attendent',
      bg: 'from-primary-700 via-primary-600 to-secondary-500',
    },
    {
      title: 'Louez en toute confiance',
      subtitle: 'Propriétaires vérifiés, paiements sécurisés',
      bg: 'from-secondary-600 via-accent-500 to-primary-600',
    },
    {
      title: 'Simple. Rapide. Efficace.',
      subtitle: 'Votre nouveau logement en quelques clics',
      bg: 'from-accent-600 via-primary-600 to-secondary-600',
    },
  ];

  useEffect(() => {
    loadFeaturedProperties();
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
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
      {/* Hero avec slider animé */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Slides animés */}
        {heroSlides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 bg-gradient-to-br ${slide.bg} transition-opacity duration-1000 ${
              index === activeSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Pattern géométrique */}
            <div className="absolute inset-0 opacity-10">
              <svg width="100%" height="100%">
                <defs>
                  <pattern id={`pattern-${index}`} x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                    <rect x="0" y="0" width="50" height="50" fill="white" opacity="0.1" />
                    <circle cx="75" cy="75" r="25" fill="white" opacity="0.1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill={`url(#pattern-${index})`} />
              </svg>
            </div>
          </div>
        ))}

        {/* Contenu Hero */}
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            {/* Logo MZAKA stylisé */}
            <div className="text-center mb-12">
              <div className="inline-block mb-6">
                <div className="flex items-center justify-center gap-3 bg-white/20 backdrop-blur-md px-8 py-4 rounded-3xl border-2 border-white/30">
                  <HomeIcon className="w-10 h-10 text-white" strokeWidth={2.5} />
                  <h1 className="text-6xl md:text-7xl font-black text-white tracking-tight">
                    MZAKA
                  </h1>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                {heroSlides.map((slide, index) => (
                  <div
                    key={index}
                    className={`transition-all duration-500 ${
                      index === activeSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 absolute'
                    }`}
                  >
                    <h2 className="text-4xl md:text-6xl font-bold text-white mb-3">
                      {slide.title}
                    </h2>
                    <p className="text-xl md:text-2xl text-white/90">
                      {slide.subtitle}
                    </p>
                  </div>
                ))}
              </div>

              {/* Indicateurs slides */}
              <div className="flex justify-center gap-2 mb-12">
                {heroSlides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveSlide(index)}
                    className={`h-1 rounded-full transition-all ${
                      index === activeSlide ? 'w-12 bg-white' : 'w-8 bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Barre de recherche flottante */}
            <form onSubmit={handleSearch} className="relative">
              <div className="bg-white rounded-3xl shadow-2xl p-4 md:p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
                    <input
                      type="text"
                      placeholder="Quel type de logement cherchez-vous ?"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-14 pr-6 py-5 text-lg border-0 rounded-2xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500 transition-all"
                    />
                  </div>
                  <div className="md:w-64 relative">
                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
                    <select
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      className="w-full pl-14 pr-6 py-5 text-lg border-0 rounded-2xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500 transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Ville</option>
                      {cities.map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold py-5 px-10 rounded-2xl text-lg flex items-center justify-center gap-3 transform hover:scale-105 transition-all shadow-lg"
                  >
                    <Search className="w-6 h-6" />
                    <span>Rechercher</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Forme ondulée en bas */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 200" fill="none" className="w-full">
            <path d="M0,100 Q360,50 720,100 T1440,100 L1440,200 L0,200 Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Section USPs avec design en bento */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-6">
            <div className="md:col-span-2 bg-gradient-to-br from-primary-500 to-primary-700 rounded-3xl p-10 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
              <Zap className="w-16 h-16 mb-6" strokeWidth={1.5} />
              <h3 className="text-3xl font-bold mb-3">Ultra rapide</h3>
              <p className="text-white/90 text-lg">Trouvez votre logement en moins de 5 minutes</p>
            </div>

            <div className="bg-gradient-to-br from-secondary-500 to-secondary-700 rounded-3xl p-10 text-white relative overflow-hidden">
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>
              <Shield className="w-14 h-14 mb-4" strokeWidth={1.5} />
              <h3 className="text-2xl font-bold mb-2">100% sécurisé</h3>
              <p className="text-white/90">Paiements protégés</p>
            </div>

            <div className="bg-gradient-to-br from-accent-500 to-accent-700 rounded-3xl p-10 text-white relative overflow-hidden">
              <div className="absolute top-0 left-0 w-28 h-28 bg-white/10 rounded-full -ml-14 -mt-14"></div>
              <Clock className="w-14 h-14 mb-4" strokeWidth={1.5} />
              <h3 className="text-2xl font-bold mb-2">Dispo 24/7</h3>
              <p className="text-white/90">Support en ligne</p>
            </div>

            <div className="md:col-span-2 bg-gray-900 rounded-3xl p-10 text-white relative overflow-hidden">
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mb-24"></div>
              <Sparkles className="w-16 h-16 mb-6 text-secondary-400" strokeWidth={1.5} />
              <h3 className="text-3xl font-bold mb-3">+500 logements</h3>
              <p className="text-gray-400 text-lg">Dans tout le Burkina Faso</p>
            </div>

            <div className="bg-gradient-to-br from-primary-100 to-secondary-100 rounded-3xl p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-36 h-36 bg-primary-200/50 rounded-full -mr-18 -mt-18"></div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Burkina Faso</h3>
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-primary-600"></div>
                <div className="w-8 h-8 rounded-full bg-secondary-600"></div>
                <div className="w-8 h-8 rounded-full bg-accent-600"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Propriétés en grille moderne */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-primary-600 font-semibold mb-2 text-lg">NOS ANNONCES</p>
              <h2 className="text-5xl font-black text-gray-900">Dernières offres</h2>
            </div>
            <Link
              to="/recherche"
              className="hidden md:flex items-center gap-2 text-primary-600 font-bold text-lg hover:gap-4 transition-all"
            >
              Tout voir
              <ArrowRight className="w-6 h-6" />
            </Link>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-3xl overflow-hidden">
                  <div className="h-64 bg-gray-200 animate-pulse"></div>
                  <div className="p-6 space-y-3">
                    <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {properties.map((property) => (
                <Link
                  key={property.id}
                  to={`/propriete/${property.id}`}
                  className="group bg-white rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-300"
                >
                  <div className="relative h-64 bg-gray-200 overflow-hidden">
                    {property.images?.[0] ? (
                      <img
                        src={property.images[0]}
                        alt={property.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                        <HomeIcon className="w-20 h-20 text-gray-300" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full font-bold text-primary-600 shadow-lg">
                      {formatPrice(property.price)}/mois
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-xl mb-2 text-gray-900 line-clamp-1">
                      {property.title}
                    </h3>
                    <p className="text-gray-500 text-sm mb-4 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {property.city} {property.neighborhood && `• ${property.neighborhood}`}
                    </p>
                    <div className="flex gap-4 text-sm text-gray-600 pt-4 border-t border-gray-100">
                      {property.bedrooms > 0 && <span>{property.bedrooms} ch</span>}
                      {property.bathrooms > 0 && <span>{property.bathrooms} sdb</span>}
                      {property.area && <span>{property.area}m²</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA avec design asymétrique */}
      <section className="py-20 bg-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary-500 rounded-full blur-3xl"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-5xl font-black mb-6">Propriétaire ?</h2>
              <p className="text-xl text-gray-300 mb-8">
                Publiez gratuitement et trouvez des locataires en quelques jours
              </p>
              <Link
                to="/publier"
                className="inline-flex items-center gap-3 bg-white text-gray-900 font-bold py-5 px-10 rounded-2xl hover:bg-gray-100 transition-all shadow-xl text-lg"
              >
                <HomeIcon className="w-6 h-6" />
                Publier mon bien
              </Link>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
              <h3 className="text-2xl font-bold mb-6">Besoin d'aide ?</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Appelez-nous</p>
                    <p className="font-bold text-lg">+226 XX XX XX XX</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-secondary-500 rounded-full flex items-center justify-center">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Écrivez-nous</p>
                    <p className="font-bold text-lg">contact@mzaka.bf</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
