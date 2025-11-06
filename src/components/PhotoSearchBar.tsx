import { useState } from 'react';
import { Search, X, Filter, Heart, Calendar, Tag } from 'lucide-react';

interface PhotoSearchBarProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: PhotoFilters) => void;
}

export interface PhotoFilters {
  showFavorites: boolean;
  sortBy: 'newest' | 'oldest' | 'views';
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
}

export default function PhotoSearchBar({ onSearch, onFilterChange }: PhotoSearchBarProps) {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<PhotoFilters>({
    showFavorites: false,
    sortBy: 'newest',
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleFilterUpdate = (updates: Partial<PhotoFilters>) => {
    const newFilters = { ...filters, ...updates };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1 relative">
          <Search
            size={20}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search photos by title, description, or tags..."
            className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                onSearch('');
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-3 border rounded-lg font-medium transition-colors flex items-center gap-2 ${
            showFilters
              ? 'bg-blue-50 border-blue-500 text-blue-700'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Filter size={20} />
          Filters
        </button>
      </form>

      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort by
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) =>
                  handleFilterUpdate({
                    sortBy: e.target.value as PhotoFilters['sortBy'],
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="views">Most viewed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date from
              </label>
              <div className="relative">
                <Calendar
                  size={18}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => handleFilterUpdate({ dateFrom: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date to
              </label>
              <div className="relative">
                <Calendar
                  size={18}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => handleFilterUpdate({ dateTo: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2 border-t">
            <button
              onClick={() =>
                handleFilterUpdate({ showFavorites: !filters.showFavorites })
              }
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                filters.showFavorites
                  ? 'bg-red-50 text-red-700 border-2 border-red-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Heart
                size={18}
                className={filters.showFavorites ? 'fill-current' : ''}
              />
              Favorites only
            </button>

            <button
              onClick={() => {
                setFilters({
                  showFavorites: false,
                  sortBy: 'newest',
                });
                onFilterChange({
                  showFavorites: false,
                  sortBy: 'newest',
                });
              }}
              className="text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Clear filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
