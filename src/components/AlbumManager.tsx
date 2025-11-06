import { useState } from 'react';
import { Plus, FolderOpen, Globe, Lock, Edit2, Trash2, Image as ImageIcon } from 'lucide-react';
import { Album } from '../services/photoService';

interface AlbumManagerProps {
  albums: Album[];
  onCreateAlbum: (name: string, description: string, isPublic: boolean) => void;
  onUpdateAlbum: (id: string, updates: Partial<Album>) => void;
  onDeleteAlbum: (id: string) => void;
  onSelectAlbum: (album: Album | null) => void;
  selectedAlbumId?: string;
}

export default function AlbumManager({
  albums,
  onCreateAlbum,
  onUpdateAlbum,
  onDeleteAlbum,
  onSelectAlbum,
  selectedAlbumId,
}: AlbumManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreateAlbum(name, description, isPublic);
    setName('');
    setDescription('');
    setIsPublic(false);
    setIsCreating(false);
  };

  const handleUpdate = (album: Album) => {
    onUpdateAlbum(editingId!, {
      name,
      description,
      is_public: isPublic,
    });
    setEditingId(null);
    setName('');
    setDescription('');
    setIsPublic(false);
  };

  const startEditing = (album: Album) => {
    setEditingId(album.id);
    setName(album.name);
    setDescription(album.description || '');
    setIsPublic(album.is_public);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Albums</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          New Album
        </button>
      </div>

      {isCreating && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Album name"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="public-checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="public-checkbox" className="text-sm text-gray-700">
              Make this album public
            </label>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={!name.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Create
            </button>
            <button
              onClick={() => {
                setIsCreating(false);
                setName('');
                setDescription('');
                setIsPublic(false);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => onSelectAlbum(null)}
        className={`w-full flex items-center gap-3 p-4 rounded-lg transition-colors ${
          !selectedAlbumId
            ? 'bg-blue-50 border-2 border-blue-500'
            : 'bg-white border border-gray-200 hover:bg-gray-50'
        }`}
      >
        <ImageIcon size={24} className="text-gray-600" />
        <div className="flex-1 text-left">
          <h3 className="font-semibold text-gray-900">All Photos</h3>
          <p className="text-sm text-gray-500">View all your photos</p>
        </div>
      </button>

      <div className="space-y-2">
        {albums.map((album) => (
          <div key={album.id}>
            {editingId === album.id ? (
              <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Album name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description (optional)"
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`edit-public-${album.id}`}
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label
                    htmlFor={`edit-public-${album.id}`}
                    className="text-sm text-gray-700"
                  >
                    Public album
                  </label>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdate(album)}
                    disabled={!name.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setName('');
                      setDescription('');
                      setIsPublic(false);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={`flex items-center gap-3 p-4 rounded-lg transition-colors ${
                  selectedAlbumId === album.id
                    ? 'bg-blue-50 border-2 border-blue-500'
                    : 'bg-white border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <button
                  onClick={() => onSelectAlbum(album)}
                  className="flex-1 flex items-center gap-3 text-left"
                >
                  <FolderOpen size={24} className="text-gray-600" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {album.name}
                      </h3>
                      {album.is_public ? (
                        <Globe size={16} className="text-green-600" />
                      ) : (
                        <Lock size={16} className="text-gray-400" />
                      )}
                    </div>
                    {album.description && (
                      <p className="text-sm text-gray-500 truncate">
                        {album.description}
                      </p>
                    )}
                  </div>
                </button>
                <div className="flex gap-1">
                  <button
                    onClick={() => startEditing(album)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          'Are you sure you want to delete this album? Photos will not be deleted.'
                        )
                      ) {
                        onDeleteAlbum(album.id);
                      }
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {albums.length === 0 && !isCreating && (
        <div className="text-center py-8 text-gray-500">
          <FolderOpen size={48} className="mx-auto mb-3 opacity-50" />
          <p>No albums yet</p>
          <p className="text-sm mt-1">Create your first album to organize photos</p>
        </div>
      )}
    </div>
  );
}
