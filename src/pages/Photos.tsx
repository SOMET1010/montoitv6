import { useState, useEffect } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';
import PhotoGallery from '../components/PhotoGallery';
import PhotoDetailModal from '../components/PhotoDetailModal';
import PhotoUploadModal from '../components/PhotoUploadModal';
import PhotoSearchBar, { PhotoFilters } from '../components/PhotoSearchBar';
import AlbumManager from '../components/AlbumManager';
import { photoService, Photo, Album } from '../services/photoService';

export default function Photos() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<PhotoFilters>({
    showFavorites: false,
    sortBy: 'newest',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [photos, searchQuery, filters, selectedAlbum]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [photosData, albumsData] = await Promise.all([
        photoService.getPhotos(),
        photoService.getAlbums(),
      ]);
      setPhotos(photosData);
      setAlbums(albumsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...photos];

    if (selectedAlbum) {
      result = result.filter((p) => p.album_id === selectedAlbum.id);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title?.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    if (filters.showFavorites) {
      result = result.filter((p) => p.is_favorite);
    }

    if (filters.dateFrom) {
      result = result.filter(
        (p) =>
          new Date(p.uploaded_at) >= new Date(filters.dateFrom!)
      );
    }

    if (filters.dateTo) {
      result = result.filter(
        (p) =>
          new Date(p.uploaded_at) <= new Date(filters.dateTo!)
      );
    }

    switch (filters.sortBy) {
      case 'oldest':
        result.sort(
          (a, b) =>
            new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime()
        );
        break;
      case 'views':
        result.sort((a, b) => b.view_count - a.view_count);
        break;
      case 'newest':
      default:
        result.sort(
          (a, b) =>
            new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
        );
        break;
    }

    setFilteredPhotos(result);
  };

  const handlePhotoClick = (photo: Photo) => {
    setSelectedPhoto(photo);
    setShowDetailModal(true);
  };

  const handleToggleFavorite = async (photoId: string, isFavorite: boolean) => {
    try {
      await photoService.toggleFavorite(photoId, isFavorite);
      setPhotos((prev) =>
        prev.map((p) => (p.id === photoId ? { ...p, is_favorite: isFavorite } : p))
      );
      if (selectedPhoto?.id === photoId) {
        setSelectedPhoto({ ...selectedPhoto, is_favorite: isFavorite });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      await photoService.deletePhoto(photoId);
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Failed to delete photo. Please try again.');
    }
  };

  const handleUpdatePhoto = async (
    photoId: string,
    updates: Partial<Photo>
  ) => {
    try {
      const updated = await photoService.updatePhoto(photoId, updates);
      setPhotos((prev) => prev.map((p) => (p.id === photoId ? updated : p)));
      if (selectedPhoto?.id === photoId) {
        setSelectedPhoto(updated);
      }
    } catch (error) {
      console.error('Error updating photo:', error);
      alert('Failed to update photo. Please try again.');
    }
  };

  const handleCreateAlbum = async (
    name: string,
    description: string,
    isPublic: boolean
  ) => {
    try {
      const album = await photoService.createAlbum(name, description, isPublic);
      setAlbums((prev) => [album, ...prev]);
    } catch (error) {
      console.error('Error creating album:', error);
      alert('Failed to create album. Please try again.');
    }
  };

  const handleUpdateAlbum = async (id: string, updates: Partial<Album>) => {
    try {
      const updated = await photoService.updateAlbum(id, updates);
      setAlbums((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch (error) {
      console.error('Error updating album:', error);
      alert('Failed to update album. Please try again.');
    }
  };

  const handleDeleteAlbum = async (id: string) => {
    try {
      await photoService.deleteAlbum(id);
      setAlbums((prev) => prev.filter((a) => a.id !== id));
      if (selectedAlbum?.id === id) {
        setSelectedAlbum(null);
      }
    } catch (error) {
      console.error('Error deleting album:', error);
      alert('Failed to delete album. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
              <ImageIcon size={40} className="text-blue-600" />
              My Photos
            </h1>
            <p className="text-gray-600 mt-2">
              Manage and organize your photo collection
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
          >
            <Upload size={20} />
            Upload Photos
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <AlbumManager
              albums={albums}
              onCreateAlbum={handleCreateAlbum}
              onUpdateAlbum={handleUpdateAlbum}
              onDeleteAlbum={handleDeleteAlbum}
              onSelectAlbum={setSelectedAlbum}
              selectedAlbumId={selectedAlbum?.id}
            />
          </div>

          <div className="lg:col-span-3 space-y-6">
            <PhotoSearchBar
              onSearch={setSearchQuery}
              onFilterChange={setFilters}
            />

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedAlbum ? selectedAlbum.name : 'All Photos'}
                  <span className="text-gray-500 text-base ml-2">
                    ({filteredPhotos.length})
                  </span>
                </h2>
              </div>

              <PhotoGallery
                photos={filteredPhotos}
                onPhotoClick={handlePhotoClick}
                onToggleFavorite={handleToggleFavorite}
                onDelete={handleDeletePhoto}
                loading={loading}
              />
            </div>
          </div>
        </div>
      </div>

      <PhotoUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={loadData}
        albums={albums}
      />

      <PhotoDetailModal
        photo={selectedPhoto}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onToggleFavorite={handleToggleFavorite}
        onDelete={handleDeletePhoto}
        onUpdate={handleUpdatePhoto}
      />
    </div>
  );
}
