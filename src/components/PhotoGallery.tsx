import { useState } from 'react';
import { Heart, Download, Share2, Trash2, Eye } from 'lucide-react';
import { Photo } from '../services/photoService';

interface PhotoGalleryProps {
  photos: Photo[];
  onPhotoClick: (photo: Photo) => void;
  onToggleFavorite?: (photoId: string, isFavorite: boolean) => void;
  onDelete?: (photoId: string) => void;
  loading?: boolean;
}

export default function PhotoGallery({
  photos,
  onPhotoClick,
  onToggleFavorite,
  onDelete,
  loading = false,
}: PhotoGalleryProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="aspect-square bg-gray-200 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No photos yet</p>
        <p className="text-gray-400 mt-2">Upload your first photo to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {photos.map((photo) => (
        <div
          key={photo.id}
          className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-105"
          onMouseEnter={() => setHoveredId(photo.id)}
          onMouseLeave={() => setHoveredId(null)}
          onClick={() => onPhotoClick(photo)}
        >
          <img
            src={photo.thumbnail_url || photo.file_url}
            alt={photo.title || 'Photo'}
            className="w-full h-full object-cover"
            loading="lazy"
          />

          <div
            className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-opacity ${
              hoveredId === photo.id ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="absolute bottom-0 left-0 right-0 p-4">
              {photo.title && (
                <h3 className="text-white font-semibold truncate mb-2">
                  {photo.title}
                </h3>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite?.(photo.id, !photo.is_favorite);
                    }}
                    className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                  >
                    <Heart
                      size={18}
                      className={photo.is_favorite ? 'fill-red-500 text-red-500' : 'text-white'}
                    />
                  </button>

                  <a
                    href={photo.file_url}
                    download
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                  >
                    <Download size={18} className="text-white" />
                  </a>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                  >
                    <Share2 size={18} className="text-white" />
                  </button>
                </div>

                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Are you sure you want to delete this photo?')) {
                        onDelete(photo.id);
                      }
                    }}
                    className="p-2 bg-red-500/80 backdrop-blur-sm rounded-full hover:bg-red-600 transition-colors"
                  >
                    <Trash2 size={18} className="text-white" />
                  </button>
                )}
              </div>
            </div>

            <div className="absolute top-4 right-4 flex items-center gap-1 text-white text-sm bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full">
              <Eye size={14} />
              <span>{photo.view_count}</span>
            </div>
          </div>

          {photo.is_favorite && hoveredId !== photo.id && (
            <div className="absolute top-4 right-4">
              <Heart size={20} className="fill-red-500 text-red-500 drop-shadow-lg" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
