import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Heart, MapPin, Home, Bed, Bath, X, Edit2, Save, Trash2 } from 'lucide-react';

interface Favorite {
  id: string;
  property_id: string;
  notes: string | null;
  created_at: string;
  property: {
    id: string;
    title: string;
    address: string;
    city: string;
    neighborhood: string;
    property_type: string;
    bedrooms: number;
    bathrooms: number;
    surface_area: number;
    monthly_rent: number;
    status: string;
    main_image: string;
  };
}

export default function Favorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    if (user) {
      loadFavorites();
    }
  }, [user]);

  const loadFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from('property_favorites')
        .select(`
          id,
          property_id,
          notes,
          created_at,
          properties!inner(
            id,
            title,
            address,
            city,
            neighborhood,
            property_type,
            bedrooms,
            bathrooms,
            surface_area,
            monthly_rent,
            status,
            main_image
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedFavorites = (data || []).map((fav: any) => ({
        id: fav.id,
        property_id: fav.property_id,
        notes: fav.notes,
        created_at: fav.created_at,
        property: fav.properties
      }));

      setFavorites(formattedFavorites);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (favoriteId: string) => {
    if (!confirm('Retirer cette propriété de vos favoris ?')) return;

    try {
      const { error } = await supabase
        .from('property_favorites')
        .delete()
        .eq('id', favoriteId);

      if (error) throw error;

      setFavorites(favorites.filter(f => f.id !== favoriteId));
    } catch (error) {
      console.error('Error removing favorite:', error);
      alert('Erreur lors de la suppression du favori');
    }
  };

  const startEditNote = (favorite: Favorite) => {
    setEditingNote(favorite.id);
    setNoteText(favorite.notes || '');
  };

  const saveNote = async (favoriteId: string) => {
    try {
      const { error } = await supabase
        .from('property_favorites')
        .update({ notes: noteText.trim() || null })
        .eq('id', favoriteId);

      if (error) throw error;

      setFavorites(favorites.map(f =>
        f.id === favoriteId ? { ...f, notes: noteText.trim() || null } : f
      ));
      setEditingNote(null);
      setNoteText('');
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Erreur lors de la sauvegarde de la note');
    }
  };

  const cancelEdit = () => {
    setEditingNote(null);
    setNoteText('');
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Connexion requise
          </h2>
          <p className="text-gray-600">
            Veuillez vous connecter pour voir vos favoris
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Heart className="w-8 h-8 text-red-500 fill-current" />
            <h1 className="text-3xl font-bold text-gray-900">Mes favoris</h1>
          </div>
          <p className="text-gray-600">
            {favorites.length} {favorites.length === 1 ? 'propriété sauvegardée' : 'propriétés sauvegardées'}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          </div>
        ) : favorites.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Aucun favori
            </h3>
            <p className="text-gray-600 mb-6">
              Explorez nos propriétés et ajoutez vos préférées à vos favoris
            </p>
            <a
              href="/recherche"
              className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
            >
              Rechercher des propriétés
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((favorite) => (
              <div key={favorite.id} className="bg-white rounded-lg shadow-lg overflow-hidden group">
                <div className="relative">
                  <img
                    src={favorite.property.main_image || 'https://via.placeholder.com/400x300'}
                    alt={favorite.property.title}
                    className="w-full h-48 object-cover"
                  />
                  <button
                    onClick={() => removeFavorite(favorite.id)}
                    className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full text-red-500 hover:bg-red-500 hover:text-white transition shadow-lg"
                    title="Retirer des favoris"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold">
                    {favorite.property.status}
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">
                    {favorite.property.title}
                  </h3>

                  <div className="flex items-start space-x-2 text-gray-600 mb-3">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p className="text-sm line-clamp-2">
                      {favorite.property.address}, {favorite.property.city}
                      {favorite.property.neighborhood && ` - ${favorite.property.neighborhood}`}
                    </p>
                  </div>

                  <div className="flex items-center space-x-4 mb-3 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Home className="w-4 h-4" />
                      <span>{favorite.property.property_type}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Bed className="w-4 h-4" />
                      <span>{favorite.property.bedrooms}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Bath className="w-4 h-4" />
                      <span>{favorite.property.bathrooms}</span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-2xl font-bold text-orange-500">
                      {favorite.property.monthly_rent.toLocaleString()} FCFA
                      <span className="text-sm text-gray-500 font-normal">/mois</span>
                    </p>
                  </div>

                  {editingNote === favorite.id ? (
                    <div className="border-t pt-3">
                      <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Ajoutez une note personnelle..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent mb-2"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => saveNote(favorite.id)}
                          className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm flex items-center justify-center space-x-1"
                        >
                          <Save className="w-4 h-4" />
                          <span>Sauvegarder</span>
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {favorite.notes && (
                        <div className="border-t pt-3 mb-3">
                          <p className="text-xs text-gray-500 mb-1 font-semibold">Vos notes :</p>
                          <p className="text-sm text-gray-700 line-clamp-2">{favorite.notes}</p>
                        </div>
                      )}
                      <div className="border-t pt-3 flex items-center justify-between text-xs text-gray-500">
                        <span>Ajouté le {formatDate(favorite.created_at)}</span>
                        <button
                          onClick={() => startEditNote(favorite)}
                          className="flex items-center space-x-1 text-orange-500 hover:text-orange-600 font-semibold"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>{favorite.notes ? 'Modifier' : 'Ajouter'} note</span>
                        </button>
                      </div>
                    </>
                  )}

                  <div className="border-t pt-3 mt-3">
                    <a
                      href={`/propriete/${favorite.property.id}`}
                      className="block w-full py-2 bg-orange-500 text-white text-center rounded-lg hover:bg-orange-600 transition font-semibold"
                    >
                      Voir les détails
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
