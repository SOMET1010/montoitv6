import { useState, useEffect } from 'react';
import { MapPin, Bed, Bath, Home, ParkingCircle, Wind, Sofa, Calendar, Eye, ArrowLeft, Send, Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../lib/database.types';

type Property = Database['public']['Tables']['properties']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

export default function PropertyDetail() {
  const { user } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [owner, setOwner] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showContactForm, setShowContactForm] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);

  useEffect(() => {
    const propertyId = window.location.pathname.split('/').pop();
    if (propertyId) {
      loadProperty(propertyId);
      incrementViewCount(propertyId);
      if (user) {
        checkFavoriteStatus(propertyId);
      }
    }
  }, [user]);

  const loadProperty = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        window.location.href = '/recherche';
        return;
      }

      setProperty(data);
      loadOwner(data.owner_id);
    } catch (error) {
      console.error('Error loading property:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOwner = async (ownerId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', ownerId)
        .maybeSingle();

      if (error) throw error;
      setOwner(data);
    } catch (error) {
      console.error('Error loading owner:', error);
    }
  };

  const incrementViewCount = async (id: string) => {
    try {
      await supabase.rpc('increment_view_count', {
        property_id: id
      });
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  };

  const checkFavoriteStatus = async (propertyId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('property_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('property_id', propertyId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setIsFavorite(true);
        setFavoriteId(data.id);
      }
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!user || !property) {
      alert('Veuillez vous connecter pour ajouter des favoris');
      return;
    }

    try {
      if (isFavorite && favoriteId) {
        const { error } = await supabase
          .from('property_favorites')
          .delete()
          .eq('id', favoriteId);

        if (error) throw error;

        setIsFavorite(false);
        setFavoriteId(null);
      } else {
        const { data, error } = await supabase
          .from('property_favorites')
          .insert({
            user_id: user.id,
            property_id: property.id
          })
          .select()
          .single();

        if (error) throw error;

        setIsFavorite(true);
        setFavoriteId(data.id);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('Erreur lors de la modification des favoris');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !property) return;

    setSending(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: property.owner_id,
          content: message,
        });

      if (error) throw error;

      setSuccess('Message envoyé avec succès');
      setMessage('');
      setTimeout(() => {
        setShowContactForm(false);
        setSuccess('');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'envoi du message');
    } finally {
      setSending(false);
    }
  };

  const handleApply = () => {
    if (!user) {
      window.location.href = '/connexion';
      return;
    }
    window.location.href = `/candidature/${property?.id}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-coral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-terracotta-500"></div>
      </div>
    );
  }

  if (!property) return null;

  const images = property.main_image
    ? [property.main_image, ...property.images.filter(img => img !== property.main_image)]
    : property.images.length > 0
    ? property.images
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-coral-50 custom-cursor">
      <div className="glass-card border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => window.history.back()}
            className="flex items-center space-x-2 text-terracotta-600 hover:text-terracotta-700 transition-all duration-300 transform hover:scale-105 font-medium"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Retour</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="card-scrapbook overflow-hidden mb-6 animate-slide-down">
              {images.length > 0 ? (
                <>
                  <div className="relative h-96 bg-gray-200">
                    <img
                      src={images[selectedImage]}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-terracotta-500 to-coral-500 text-white px-6 py-3 rounded-2xl text-lg font-bold shadow-glow-lg animate-glow">
                      {property.monthly_rent.toLocaleString()} FCFA/mois
                    </div>
                  </div>
                  {images.length > 1 && (
                    <div className="grid grid-cols-4 gap-2 p-4">
                      {images.slice(0, 4).map((img, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImage(index)}
                          className={`relative h-20 rounded-lg overflow-hidden transition-all duration-300 transform hover:scale-105 ${
                            selectedImage === index ? 'ring-4 ring-terracotta-500 shadow-glow' : 'opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={img} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="h-96 bg-gray-200 flex items-center justify-center">
                  <Home className="h-24 w-24 text-gray-400" />
                </div>
              )}
            </div>

            <div className="card-scrapbook p-8 mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-gradient mb-3">{property.title}</h1>
                  <p className="text-gray-700 flex items-center space-x-2 text-lg">
                    <MapPin className="h-6 w-6 text-terracotta-500" />
                    <span>{property.address}, {property.city}{property.neighborhood ? `, ${property.neighborhood}` : ''}</span>
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={toggleFavorite}
                    className={`p-3 rounded-full transition-all duration-300 transform hover:scale-110 ${
                      isFavorite
                        ? 'bg-red-500 text-white shadow-lg'
                        : 'bg-white text-gray-400 hover:text-red-500 border-2 border-gray-200'
                    }`}
                    title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  >
                    <Heart className={`h-6 w-6 ${isFavorite ? 'fill-current' : ''}`} />
                  </button>
                  <div className="flex items-center space-x-2 bg-amber-100 px-4 py-2 rounded-full text-amber-800 font-medium">
                    <Eye className="h-5 w-5" />
                    <span>{property.view_count} vues</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center space-x-3 bg-gradient-to-br from-terracotta-50 to-coral-50 px-5 py-3 rounded-2xl border border-terracotta-200 transform hover:scale-105 transition-all duration-300">
                  <Bed className="h-6 w-6 text-terracotta-600" />
                  <span className="text-gray-900 font-semibold">{property.bedrooms} chambres</span>
                </div>
                <div className="flex items-center space-x-3 bg-gradient-to-br from-cyan-50 to-blue-50 px-5 py-3 rounded-2xl border border-cyan-200 transform hover:scale-105 transition-all duration-300">
                  <Bath className="h-6 w-6 text-cyan-600" />
                  <span className="text-gray-900 font-semibold">{property.bathrooms} salles de bain</span>
                </div>
                {property.surface_area && (
                  <div className="flex items-center space-x-3 bg-gradient-to-br from-olive-50 to-green-50 px-5 py-3 rounded-2xl border border-olive-200 transform hover:scale-105 transition-all duration-300">
                    <Home className="h-6 w-6 text-olive-600" />
                    <span className="text-gray-900 font-semibold">{property.surface_area}m²</span>
                  </div>
                )}
                <div className="bg-gradient-to-r from-terracotta-500 to-coral-500 px-5 py-3 rounded-2xl shadow-glow transform hover:scale-105 transition-all duration-300">
                  <span className="text-white font-semibold capitalize">{property.property_type}</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-2xl font-bold text-gradient mb-4 flex items-center space-x-2">
                  <Home className="h-6 w-6 text-terracotta-500" />
                  <span>Description</span>
                </h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line text-lg">
                  {property.description || 'Aucune description disponible.'}
                </p>
              </div>

              <div className="border-t pt-6 mt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Équipements</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {property.is_furnished && (
                    <div className="flex items-center space-x-2">
                      <Sofa className="h-5 w-5 text-green-600" />
                      <span className="text-gray-700">Meublé</span>
                    </div>
                  )}
                  {property.has_parking && (
                    <div className="flex items-center space-x-2">
                      <ParkingCircle className="h-5 w-5 text-green-600" />
                      <span className="text-gray-700">Parking</span>
                    </div>
                  )}
                  {property.has_ac && (
                    <div className="flex items-center space-x-2">
                      <Wind className="h-5 w-5 text-green-600" />
                      <span className="text-gray-700">Climatisation</span>
                    </div>
                  )}
                  {property.has_garden && (
                    <div className="flex items-center space-x-2">
                      <Home className="h-5 w-5 text-green-600" />
                      <span className="text-gray-700">Jardin</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-6 mt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Informations financières</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Loyer mensuel</span>
                    <span className="font-semibold text-gray-900">{property.monthly_rent.toLocaleString()} FCFA</span>
                  </div>
                  {property.deposit_amount && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dépôt de garantie</span>
                      <span className="font-semibold text-gray-900">{property.deposit_amount.toLocaleString()} FCFA</span>
                    </div>
                  )}
                  {property.charges_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Charges mensuelles</span>
                      <span className="font-semibold text-gray-900">{property.charges_amount.toLocaleString()} FCFA</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
              {owner && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Propriétaire</h3>
                  <div className="flex items-center space-x-3 mb-4">
                    {owner.avatar_url ? (
                      <img src={owner.avatar_url} alt={owner.full_name || 'Propriétaire'} className="h-12 w-12 rounded-full" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-lg">
                        {owner.full_name?.[0] || 'P'}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{owner.full_name || 'Propriétaire'}</p>
                      <p className="text-sm text-gray-600 capitalize">{owner.user_type}</p>
                    </div>
                  </div>
                  {owner.is_verified && (
                    <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg mb-4">
                      <span className="font-medium">✓ Compte vérifié ANSUT</span>
                    </div>
                  )}
                </div>
              )}

              {user?.id !== property.owner_id ? (
                <div className="space-y-3">
                  <button
                    onClick={handleApply}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center space-x-2"
                  >
                    <Calendar className="h-5 w-5" />
                    <span>Postuler</span>
                  </button>
                  <a
                    href={`/visiter/${property.id}`}
                    className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition font-medium flex items-center justify-center space-x-2"
                  >
                    <Calendar className="h-5 w-5" />
                    <span>Planifier une visite</span>
                  </a>
                  <button
                    onClick={() => setShowContactForm(!showContactForm)}
                    className="w-full bg-white border-2 border-blue-600 text-blue-600 py-3 rounded-lg hover:bg-blue-50 transition font-medium flex items-center justify-center space-x-2"
                  >
                    <Send className="h-5 w-5" />
                    <span>Contacter</span>
                  </button>

                  {showContactForm && (
                    <form onSubmit={handleSendMessage} className="mt-4 p-4 bg-gray-50 rounded-lg">
                      {error && (
                        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                          {error}
                        </div>
                      )}
                      {success && (
                        <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
                          {success}
                        </div>
                      )}
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Votre message..."
                        rows={4}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-2"
                      />
                      <button
                        type="submit"
                        disabled={sending || !user}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-400"
                      >
                        {sending ? 'Envoi...' : 'Envoyer'}
                      </button>
                      {!user && (
                        <p className="text-xs text-gray-600 mt-2 text-center">
                          Connectez-vous pour envoyer un message
                        </p>
                      )}
                    </form>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl border border-amber-300">
                  <p className="text-gray-700 font-medium mb-3">🏠 Ceci est votre propriété</p>
                  <a href="/dashboard/proprietaire" className="inline-block btn-primary">
                    Gérer mes propriétés
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
