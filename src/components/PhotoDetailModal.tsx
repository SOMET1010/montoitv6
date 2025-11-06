import { useState } from 'react';
import {
  X,
  Heart,
  Download,
  Share2,
  Edit2,
  Trash2,
  MapPin,
  Calendar,
  Tag,
  Eye,
} from 'lucide-react';
import { Photo } from '../services/photoService';

interface PhotoDetailModalProps {
  photo: Photo | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleFavorite: (photoId: string, isFavorite: boolean) => void;
  onDelete: (photoId: string) => void;
  onUpdate: (photoId: string, updates: Partial<Photo>) => void;
}

export default function PhotoDetailModal({
  photo,
  isOpen,
  onClose,
  onToggleFavorite,
  onDelete,
  onUpdate,
}: PhotoDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedTags, setEditedTags] = useState('');
  const [editedLocation, setEditedLocation] = useState('');

  if (!isOpen || !photo) return null;

  const startEditing = () => {
    setEditedTitle(photo.title || '');
    setEditedDescription(photo.description || '');
    setEditedTags(photo.tags.join(', '));
    setEditedLocation(photo.location || '');
    setIsEditing(true);
  };

  const handleSave = () => {
    onUpdate(photo.id, {
      title: editedTitle || undefined,
      description: editedDescription || undefined,
      tags: editedTags ? editedTags.split(',').map((t) => t.trim()) : [],
      location: editedLocation || undefined,
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this photo?')) {
      onDelete(photo.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="max-w-7xl w-full h-full max-h-[95vh] flex flex-col md:flex-row gap-6 overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <img
            src={photo.file_url}
            alt={photo.title || 'Photo'}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>

        <div className="w-full md:w-96 bg-white rounded-xl overflow-y-auto">
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Photo Details</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleFavorite(photo.id, !photo.is_favorite)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  photo.is_favorite
                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Heart
                  size={20}
                  className={photo.is_favorite ? 'fill-current' : ''}
                />
                {photo.is_favorite ? 'Favorited' : 'Favorite'}
              </button>

              <a
                href={photo.file_url}
                download
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Download size={20} />
              </a>

              <button className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                <Share2 size={20} />
              </button>

              {!isEditing ? (
                <button
                  onClick={startEditing}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <Edit2 size={20} />
                </button>
              ) : null}

              <button
                onClick={handleDelete}
                className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
              >
                <Trash2 size={20} />
              </button>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={editedTags}
                    onChange={(e) => setEditedTags(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="vacation, family, summer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={editedLocation}
                    onChange={(e) => setEditedLocation(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                {photo.title && (
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {photo.title}
                    </h3>
                  </div>
                )}

                {photo.description && (
                  <div>
                    <p className="text-gray-600 leading-relaxed">
                      {photo.description}
                    </p>
                  </div>
                )}

                <div className="space-y-3 pt-4 border-t">
                  {photo.location && (
                    <div className="flex items-start gap-3">
                      <MapPin size={20} className="text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Location</p>
                        <p className="text-sm text-gray-600">{photo.location}</p>
                      </div>
                    </div>
                  )}

                  {photo.taken_at && (
                    <div className="flex items-start gap-3">
                      <Calendar size={20} className="text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Taken</p>
                        <p className="text-sm text-gray-600">
                          {new Date(photo.taken_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {photo.tags.length > 0 && (
                    <div className="flex items-start gap-3">
                      <Tag size={20} className="text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Tags</p>
                        <div className="flex flex-wrap gap-2">
                          {photo.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <Eye size={20} className="text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Views</p>
                      <p className="text-sm text-gray-600">{photo.view_count}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2 text-sm text-gray-500">
                  <div className="flex justify-between">
                    <span>File size</span>
                    <span className="font-medium">
                      {(photo.file_size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                  {photo.width && photo.height && (
                    <div className="flex justify-between">
                      <span>Dimensions</span>
                      <span className="font-medium">
                        {photo.width} × {photo.height}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Uploaded</span>
                    <span className="font-medium">
                      {new Date(photo.uploaded_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
