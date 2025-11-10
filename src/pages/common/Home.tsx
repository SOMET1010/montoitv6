import { useState, useEffect } from 'react';
import { Search, MapPin, Shield, FileSignature, Smartphone, TrendingUp, Building2, Sparkles, Home as HomeIcon, Users, Map } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';
import QuickSearch from '../../components/QuickSearch';
import { FormatService } from '../../services/format/formatService';
import MapWrapper from '../../components/MapWrapper';

type Property = Database['public']['Tables']['properties']['Row'];

export default function Home() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [totalProperties, setTotalProperties] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchCity, setSearchCity] = useState('');
  const [scrollY, setScrollY] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      image: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=1920',
      title: 'Famille heureuse dans leur nouveau logement',
      alt: 'Famille africaine souriante dans un salon moderne'
    },
    {
      image: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1920',
      title: 'Signature électronique sécurisée',
      alt: 'Personne signant un contrat sur tablette'
    },
    {
      image: 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=1920',
      title: 'Logements modernes et accessibles',
      alt: 'Immeubles résidentiels modernes'
    },
    {
      image: 'https://images.pexels.com/photos/7641824/pexels-photo-7641824.jpeg?auto=compress&cs=tinysrgb&w=1920',
      title: 'Paiement mobile sécurisé',
      alt: 'Personne utilisant Mobile Money sur smartphone'
    }
  ];

  useEffect(() => {
    loadProperties();

    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);

    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(slideInterval);
    };
  }, []);

  const loadProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'disponible')
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      setProperties(data || []);

      const { count } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'disponible');

      setTotalProperties(count || 0);
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchCity) {
      window.location.href = `/recherche?city=${encodeURIComponent(searchCity)}`;
    } else {
      window.location.href = '/recherche';
    }
  };

  return (
    <div className="min-h-screen custom-cursor">
      <section className="relative overflow-hidden bg-gradient-to-br from-terracotta-400 via-coral-400 to-amber-400 text-white py-32">
        <div className="absolute inset-0">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide ? 'opacity-30' : 'opacity-0'
              }`}
            >
              <img
                src={slide.image}
                alt={slide.alt}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>

        <div className="absolute inset-0 bg-gradient-to-br from-terracotta-500/80 via-coral-500/80 to-amber-500/80" />

        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            transform: `translateY(${scrollY * 0.3}px)`,
          }}
        />

        <div className="absolute top-10 left-10 w-32 h-32 bg-amber-300/30 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-coral-300/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12 animate-slide-down">
            <div className="inline-flex items-center space-x-2 mb-6 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <Sparkles className="h-5 w-5 text-amber-300" />
              <span className="text-sm font-medium">Plateforme certifiée ANSUT</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="inline-block animate-scale-in">Trouvez votre </span>
              <span className="inline-block animate-scale-in text-amber-200" style={{ animationDelay: '0.1s' }}>logement idéal</span>
              <br />
              <span className="inline-block animate-scale-in" style={{ animationDelay: '0.2s' }}>en toute </span>
              <span className="inline-block animate-scale-in text-cyan-200" style={{ animationDelay: '0.3s' }}>confiance</span>
            </h1>

            <p className="text-xl md:text-2xl text-amber-100 mb-8 max-w-3xl mx-auto animate-slide-up">
              L'immobilier accessible à tous avec signature électronique et paiement sécurisé
            </p>
          </div>

          <form onSubmit={handleSearch} className="max-w-4xl mx-auto animate-scale-in" style={{ animationDelay: '0.4s' }}>
            <div className="glass-card rounded-3xl p-3 flex flex-col md:flex-row items-center gap-3 transform hover:scale-105 transition-all duration-300">
              <div className="flex-1 w-full flex items-center bg-white/50 rounded-2xl px-4 py-3">
                <MapPin className="h-6 w-6 text-terracotta-500 mr-3 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Où souhaitez-vous habiter ? (Abidjan, Cocody, Plateau...)"
                  className="flex-1 bg-transparent text-gray-900 placeholder-gray-600 focus:outline-none text-lg"
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="w-full md:w-auto btn-primary flex items-center justify-center space-x-2"
              >
                <Search className="h-6 w-6" />
                <span className="text-lg">Rechercher</span>
              </button>
            </div>
          </form>

          <div className="flex justify-center mt-8 space-x-3 animate-slide-up" style={{ animationDelay: '0.5s' }}>
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentSlide
                    ? 'w-12 h-3 bg-white shadow-glow'
                    : 'w-3 h-3 bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`Aller à la diapositive ${index + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="absolute -bottom-1 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#fffbeb"/>
          </svg>
        </div>
      </section>

      <section className="py-12 bg-amber-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <QuickSearch />
        </div>
      </section>

      <section className="py-20 bg-gradient-to-b from-amber-50 to-white relative">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 text-terracotta-200 opacity-50 transform -rotate-12 text-9xl font-bold">★</div>
          <div className="absolute bottom-20 right-20 text-coral-200 opacity-50 transform rotate-12 text-7xl font-bold">♥</div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Pourquoi <span className="text-gradient">Mon Toit</span> ?
            </h2>
            <p className="text-xl text-gray-600">Un logement pour tous, accessible et sécurisé</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card-scrapbook p-8 text-center bg-gradient-to-br from-white to-olive-50 border-4 border-olive-200/50">
              <div className="w-20 h-20 bg-gradient-to-br from-olive-400 to-olive-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg transform -rotate-6 hover:rotate-0 transition-transform duration-300">
                <Shield className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Certification ANSUT</h3>
              <p className="text-gray-700 leading-relaxed">
                Vérification d'identité ONECI et CNAM pour une sécurité maximale de tous nos utilisateurs
              </p>
              <div className="mt-4 inline-block bg-olive-100 text-olive-800 px-4 py-2 rounded-full text-sm font-semibold transform rotate-2">
                100% Vérifié
              </div>
            </div>

            <div className="card-scrapbook p-8 text-center bg-gradient-to-br from-white to-cyan-50 border-4 border-cyan-200/50">
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg transform rotate-6 hover:rotate-0 transition-transform duration-300">
                <FileSignature className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Signature électronique</h3>
              <p className="text-gray-700 leading-relaxed">
                Signez vos contrats de location en ligne via CryptoNeo, simple et rapide
              </p>
              <div className="mt-4 inline-block bg-cyan-100 text-cyan-800 px-4 py-2 rounded-full text-sm font-semibold transform -rotate-2">
                100% Digital
              </div>
            </div>

            <div className="card-scrapbook p-8 text-center bg-gradient-to-br from-white to-coral-50 border-4 border-coral-200/50">
              <div className="w-20 h-20 bg-gradient-to-br from-coral-400 to-coral-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg transform -rotate-6 hover:rotate-0 transition-transform duration-300">
                <Smartphone className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Paiement Mobile Money</h3>
              <p className="text-gray-700 leading-relaxed">
                Payez facilement avec Orange Money, MTN Money et Moov Money
              </p>
              <div className="mt-4 inline-block bg-coral-100 text-coral-800 px-4 py-2 rounded-full text-sm font-semibold transform rotate-2">
                Facile & Rapide
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-terracotta-300 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-300 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center mb-12">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
                <span className="text-gradient">Propriétés</span> récentes
              </h2>
              <p className="text-gray-600 text-lg">Découvrez les dernières offres disponibles</p>
            </div>
            <a
              href="/recherche"
              className="mt-4 md:mt-0 btn-secondary flex items-center space-x-2"
            >
              <span>Voir les {totalProperties} propriétés</span>
              <TrendingUp className="h-5 w-5" />
            </a>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {properties.map((property, index) => (
                <a
                  key={property.id}
                  href={`/propriete/${property.id}`}
                  className="card-scrapbook overflow-hidden group"
                  style={{
                    transform: `rotate(${index % 2 === 0 ? '-1deg' : '1deg'})`,
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
                      {FormatService.formatCurrency(property.monthly_rent)}/mois
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
                      <span className="line-clamp-1">{property.city}, {property.neighborhood || 'Côte d\'Ivoire'}</span>
                    </p>

                    <div className="flex items-center justify-between text-sm text-gray-600 border-t border-gray-200 pt-4">
                      <div className="flex items-center space-x-1">
                        <HomeIcon className="h-4 w-4 text-olive-600" />
                        <span className="font-semibold">{property.bedrooms} ch.</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4 text-cyan-600" />
                        <span className="font-semibold">{property.bathrooms} SDB</span>
                      </div>
                      {property.surface_area && (
                        <div className="flex items-center space-x-1">
                          <span className="font-semibold text-coral-600">{property.surface_area}m²</span>
                        </div>
                      )}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gradient-to-br from-amber-50 to-coral-50 rounded-3xl">
              <Building2 className="h-20 w-20 text-terracotta-300 mx-auto mb-4" />
              <p className="text-xl text-gray-600">Aucune propriété disponible pour le moment.</p>
            </div>
          )}
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-amber-50 to-coral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              <span className="text-gradient">Explorez</span> par Quartier
            </h2>
            <p className="text-gray-600 text-lg">
              Découvrez la localisation des propriétés disponibles à Abidjan
            </p>
          </div>

          <div className="card-scrapbook overflow-hidden">
              <MapWrapper
                properties={properties
                  .filter(p => p.longitude && p.latitude)
                  .map(p => ({
                    id: p.id,
                    title: p.title,
                    monthly_rent: p.monthly_rent,
                    longitude: p.longitude!,
                    latitude: p.latitude!,
                  status: p.status,
                  images: p.images as string[],
                  city: p.city,
                  neighborhood: p.neighborhood,
                }))}
                zoom={12}
                height="500px"
                fitBounds={properties.length > 0}
                onMarkerClick={(property) => {
                  window.location.href = `/propriete/${property.id}`;
                }}
              />
          </div>

          <div className="mt-8 text-center">
            <a
              href="/recherche"
              className="btn-primary inline-flex items-center space-x-2"
            >
              <Map className="h-5 w-5" />
              <span>Explorer toutes les propriétés</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
