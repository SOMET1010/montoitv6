import React, { useState } from 'react';
import { Home, Users, FileText, MessageSquare, DollarSign, Loader2, Check, Image } from 'lucide-react';
import { TestDataGeneratorService } from '../../services/ai/testDataGeneratorService';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { getPropertyImages, getRandomIvoirianPropertyImage } from '../../constants/ivoirianImages';

export default function AdminQuickDemo() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatedProperties, setGeneratedProperties] = useState<any[]>([]);

  const generateQuickDemo = async () => {
    if (!user) {
      setError('Vous devez être connecté');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Générer 5 propriétés de test avec images ivoiriennes
      const properties = [];
      const quartiers = ['Cocody', 'Plateau', 'Marcory', 'Yopougon', 'Treichville'];
      const types = ['Villa 4 pièces', 'Appartement F3', 'Studio moderne', 'Duplex', 'Maison familiale'];

      for (let i = 0; i < 5; i++) {
        const quartier = quartiers[i];
        const propertyType = types[i];

        const property = await TestDataGeneratorService.generateTestProperty(user.id);

        // Générer des images représentatives
        const images = getPropertyImages(quartier, propertyType, 5);

        // Insérer dans la base de données
        const { data: insertedProperty, error: insertError } = await supabase
          .from('properties')
          .insert({
            owner_id: user.id,
            title: property.title,
            description: property.description,
            property_type: property.property_type,
            address: property.address,
            neighborhood: property.neighborhood,
            monthly_rent: property.monthly_rent,
            surface_area: property.surface_area,
            rooms: property.rooms,
            status: 'available',
            amenities: property.amenities,
            nearby_places: property.nearby_places,
            latitude: 5.3599517 + (Math.random() - 0.5) * 0.1,
            longitude: -4.0082563 + (Math.random() - 0.5) * 0.1,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Ajouter les photos
        if (insertedProperty && images.length > 0) {
          const photosToInsert = images.map((url, index) => ({
            property_id: insertedProperty.id,
            url: url,
            caption: `Photo ${index + 1} - ${property.neighborhood}`,
            display_order: index,
          }));

          await supabase.from('property_photos').insert(photosToInsert);
        }

        properties.push({
          ...insertedProperty,
          images: images,
        });
      }

      // Générer 2 profils de test (locataire et propriétaire)
      const tenant = await TestDataGeneratorService.generateTestProfile(user.id, null);
      const landlord = await TestDataGeneratorService.generateTestProfile(user.id, null);

      setGeneratedProperties(properties);
      setResults({
        properties: properties.length,
        tenant: tenant.personal_info.full_name,
        landlord: landlord.personal_info.full_name,
        message: 'Données de démonstration générées avec succès !',
      });
    } catch (err: any) {
      console.error('Erreur lors de la génération:', err);
      setError(err.message || 'Erreur lors de la génération des données');
    } finally {
      setLoading(false);
    }
  };

  const cleanupDemo = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Supprimer les propriétés de test créées par cet utilisateur
      const { error: deleteError } = await supabase
        .from('properties')
        .delete()
        .eq('owner_id', user.id);

      if (deleteError) throw deleteError;

      setGeneratedProperties([]);
      setResults(null);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du nettoyage');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-orange-500 rounded-xl">
              <Image className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Générateur de Démo Rapide
              </h1>
              <p className="text-gray-600">
                Créez instantanément des données de test avec des images représentatives de la Côte d'Ivoire
              </p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4">
            <p className="text-sm text-amber-800">
              <strong>Pour la démo uniquement</strong> - Les images proviennent de banques d'images gratuites.
              En production, utilisez vos propres photos de propriétés ivoiriennes.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={generateQuickDemo}
            disabled={loading}
            className="bg-gradient-to-r from-orange-500 to-amber-600 text-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              {loading ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <Home className="w-8 h-8 group-hover:scale-110 transition-transform" />
              )}
            </div>
            <h3 className="text-2xl font-bold mb-2">Générer la Démo</h3>
            <p className="text-orange-100">
              5 propriétés + 2 profils avec images ivoiriennes
            </p>
          </button>

          <button
            onClick={cleanupDemo}
            disabled={loading}
            className="bg-gray-600 text-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              {loading ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <FileText className="w-8 h-8" />
              )}
            </div>
            <h3 className="text-2xl font-bold mb-2">Nettoyer</h3>
            <p className="text-gray-200">
              Supprimer les données de test
            </p>
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-500 rounded-lg">
                <Check className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{results.message}</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-orange-50 p-4 rounded-xl text-center">
                <Home className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-orange-900">{results.properties}</p>
                <p className="text-sm text-orange-700">Propriétés créées</p>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl text-center">
                <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-blue-900">{results.tenant}</p>
                <p className="text-xs text-blue-700">Profil Locataire</p>
              </div>

              <div className="bg-purple-50 p-4 rounded-xl text-center">
                <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-purple-900">{results.landlord}</p>
                <p className="text-xs text-purple-700">Profil Propriétaire</p>
              </div>
            </div>
          </div>
        )}

        {/* Generated Properties Preview */}
        {generatedProperties.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Propriétés Générées avec Images Ivoiriennes
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {generatedProperties.map((property, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative h-48">
                    {property.images && property.images[0] ? (
                      <img
                        src={property.images[0]}
                        alt={property.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = getRandomIvoirianPropertyImage();
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                        <Home className="w-16 h-16 text-orange-300" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full text-sm font-semibold text-orange-600">
                      {property.neighborhood}
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-1">
                      {property.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {property.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-orange-600 font-bold">
                        {property.monthly_rent?.toLocaleString()} FCFA
                      </span>
                      <span className="text-sm text-gray-500">
                        {property.rooms} pièces
                      </span>
                    </div>
                    <div className="mt-3 flex gap-1">
                      {property.images?.slice(1, 4).map((img: string, imgIndex: number) => (
                        <div
                          key={imgIndex}
                          className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200"
                        >
                          <img
                            src={img}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = getRandomIvoirianPropertyImage();
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Comment ça marche ?</h2>
          <div className="space-y-4 text-gray-700">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <p className="font-semibold">Génération Automatique</p>
                <p className="text-sm">
                  Crée 5 propriétés dans différents quartiers d'Abidjan avec des images réelles
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <p className="font-semibold">Images Représentatives</p>
                <p className="text-sm">
                  Utilise des photos de quartiers ivoiriens (Cocody, Plateau, Marcory, etc.)
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <p className="font-semibold">Prêt pour la Démo</p>
                <p className="text-sm">
                  Les propriétés sont créées dans la base et visibles immédiatement
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> Pour la production, remplacez ces images par vos propres photos
                de propriétés réelles en Côte d'Ivoire. Vous pouvez uploader vos photos dans Supabase Storage
                et modifier les URLs dans le fichier <code className="bg-blue-100 px-2 py-1 rounded">ivoirianImages.ts</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
