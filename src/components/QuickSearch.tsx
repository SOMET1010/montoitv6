import { useState } from 'react';
import { Search, MapPin, Home as HomeIcon, DollarSign, Plus, CheckCircle, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface QuickSearchProps {
  onSearch?: (filters: SearchFilters) => void;
}

interface SearchFilters {
  city: string;
  propertyType: string;
  maxBudget: string;
}

export default function QuickSearch({ onSearch }: QuickSearchProps) {
  const { user } = useAuth();
  const [city, setCity] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [maxBudget, setMaxBudget] = useState('');

  const cities = [
    'Toutes les villes',
    'Abidjan',
    'Cocody',
    'Plateau',
    'Marcory',
    'Yopougon',
    'Abobo',
    'Adjamé',
    'Koumassi',
    'Treichville',
    'Port-Bouët',
    'Attecoubé',
    'Bouaké',
    'Yamoussoukro',
    'San-Pedro',
    'Daloa',
    'Korhogo',
    'Man'
  ];

  const propertyTypes = [
    'Tous les types',
    'Appartement',
    'Maison',
    'Studio',
    'Villa',
    'Duplex',
    'Bureau',
    'Local commercial',
    'Entrepôt',
    'Terrain'
  ];

  const handleSearch = () => {
    if (onSearch) {
      onSearch({ city, propertyType, maxBudget });
    } else {
      const params = new URLSearchParams();
      if (city && city !== 'Toutes les villes') params.append('city', city);
      if (propertyType && propertyType !== 'Tous les types') params.append('type', propertyType);
      if (maxBudget) params.append('max_price', maxBudget);

      window.location.href = `/search?${params.toString()}`;
    }
  };

  const handlePublish = () => {
    if (!user) {
      window.location.href = '/auth';
    } else {
      window.location.href = '/add-property';
    }
  };

  return (
    <div className="w-full">
      <div className="card-scrapbook p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-terracotta-100 rounded-xl flex items-center justify-center">
              <Search className="w-5 h-5 text-terracotta-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Recherche rapide</h2>
              <p className="text-sm text-gray-600">Simple et efficace</p>
            </div>
          </div>

          {user && (
            <button
              onClick={handlePublish}
              className="hidden md:flex items-center space-x-2 px-6 py-3 bg-terracotta-600 text-white rounded-xl hover:bg-terracotta-700 transition-all hover:scale-105 shadow-lg font-medium"
            >
              <Plus className="w-5 h-5" />
              <span>Publier une annonce</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-2 text-terracotta-600" />
              Ville
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-terracotta-200 focus:border-terracotta-500 transition-all bg-white appearance-none cursor-pointer font-medium"
            >
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <HomeIcon className="w-4 h-4 inline mr-2 text-terracotta-600" />
              Type de bien
            </label>
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-terracotta-200 focus:border-terracotta-500 transition-all bg-white appearance-none cursor-pointer font-medium"
            >
              {propertyTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="w-4 h-4 inline mr-2 text-terracotta-600" />
              Budget max
            </label>
            <input
              type="number"
              value={maxBudget}
              onChange={(e) => setMaxBudget(e.target.value)}
              placeholder="Ex: 200000"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-terracotta-200 focus:border-terracotta-500 transition-all bg-white font-medium"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleSearch}
              className="w-full px-6 py-3 bg-terracotta-600 text-white rounded-xl hover:bg-terracotta-700 transition-all hover:scale-105 shadow-lg font-bold flex items-center justify-center space-x-2"
            >
              <Search className="w-5 h-5" />
              <span>Rechercher</span>
            </button>
          </div>
        </div>

        {user && (
          <button
            onClick={handlePublish}
            className="md:hidden mt-4 w-full flex items-center justify-center space-x-2 px-6 py-3 border-2 border-terracotta-600 text-terracotta-600 rounded-xl hover:bg-terracotta-50 transition-all font-medium"
          >
            <Plus className="w-5 h-5" />
            <span>Publier une annonce</span>
          </button>
        )}

        <div className="mt-6 flex items-center justify-center space-x-2 text-sm">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-gray-700 font-medium">
            100% gratuit • Sécurisé
          </span>
          <Shield className="w-4 h-4 text-olive-600" />
        </div>
      </div>
    </div>
  );
}
