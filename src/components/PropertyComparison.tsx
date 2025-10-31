import { useState } from 'react';
import { X, Check, Minus, TrendingUp, MapPin, Home, Bed, Bath, Maximize } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Property = Database['public']['Tables']['properties']['Row'];

interface PropertyComparisonProps {
  properties: Property[];
  onClose: () => void;
  onRemoveProperty: (id: string) => void;
}

export default function PropertyComparison({ properties, onClose, onRemoveProperty }: PropertyComparisonProps) {
  const [selectedCriteria, setSelectedCriteria] = useState<string[]>([
    'price',
    'type',
    'rooms',
    'bathrooms',
    'surface',
    'location',
  ]);

  const criteria = [
    { id: 'price', label: 'Prix', icon: TrendingUp },
    { id: 'type', label: 'Type', icon: Home },
    { id: 'rooms', label: 'Chambres', icon: Bed },
    { id: 'bathrooms', label: 'Salles de bain', icon: Bath },
    { id: 'surface', label: 'Surface', icon: Maximize },
    { id: 'location', label: 'Emplacement', icon: MapPin },
  ];

  const getCriteriaValue = (property: Property, criteriaId: string): string => {
    switch (criteriaId) {
      case 'price':
        return `${property.monthly_rent.toLocaleString()} FCFA/mois`;
      case 'type':
        return property.property_type;
      case 'rooms':
        return `${property.bedrooms} chambres`;
      case 'bathrooms':
        return `${property.bathrooms} SDB`;
      case 'surface':
        return `${property.surface_area} m²`;
      case 'location':
        return `${property.neighborhood}, ${property.city}`;
      default:
        return '-';
    }
  };

  const getBestValue = (criteriaId: string): number => {
    if (criteriaId === 'price') {
      const prices = properties.map(p => p.monthly_rent);
      return Math.min(...prices);
    }
    if (criteriaId === 'surface') {
      const surfaces = properties.map(p => p.surface_area || 0);
      return Math.max(...surfaces);
    }
    if (criteriaId === 'rooms') {
      const rooms = properties.map(p => p.bedrooms);
      return Math.max(...rooms);
    }
    return -1;
  };

  const isBestValue = (property: Property, criteriaId: string): boolean => {
    const bestValue = getBestValue(criteriaId);
    if (bestValue === -1) return false;

    if (criteriaId === 'price') {
      return property.monthly_rent === bestValue;
    }
    if (criteriaId === 'surface') {
      return (property.surface_area || 0) === bestValue;
    }
    if (criteriaId === 'rooms') {
      return property.bedrooms === bestValue;
    }
    return false;
  };

  if (properties.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Comparaison de propriétés</h2>
            <p className="text-cyan-100 text-sm mt-1">
              {properties.length} propriété{properties.length > 1 ? 's' : ''} sélectionnée{properties.length > 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Fermer"
          >
            <X className="h-6 w-6 text-white" />
          </button>
        </div>

        {/* Criteria Selector */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Critères à comparer :
          </p>
          <div className="flex flex-wrap gap-2">
            {criteria.map((criterion) => {
              const Icon = criterion.icon;
              const isSelected = selectedCriteria.includes(criterion.id);
              return (
                <button
                  key={criterion.id}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedCriteria(selectedCriteria.filter(c => c !== criterion.id));
                    } else {
                      setSelectedCriteria([...selectedCriteria, criterion.id]);
                    }
                  }}
                  className={`
                    flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all
                    ${isSelected
                      ? 'bg-cyan-500 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <span>{criterion.label}</span>
                  {isSelected && <Check className="h-3 w-3" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Comparison Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Critère
                </th>
                {properties.map((property) => (
                  <th key={property.id} className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <img
                        src={property.images?.[0] || '/placeholder.jpg'}
                        alt={property.title}
                        className="w-24 h-16 object-cover rounded-lg mb-2"
                      />
                      <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 max-w-[200px]">
                        {property.title}
                      </p>
                      <button
                        onClick={() => onRemoveProperty(property.id)}
                        className="mt-2 text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center space-x-1"
                      >
                        <X className="h-3 w-3" />
                        <span>Retirer</span>
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {selectedCriteria.map((criteriaId) => {
                const criterion = criteria.find(c => c.id === criteriaId);
                if (!criterion) return null;
                const Icon = criterion.icon;

                return (
                  <tr key={criteriaId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                          <Icon className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {criterion.label}
                        </span>
                      </div>
                    </td>
                    {properties.map((property) => {
                      const value = getCriteriaValue(property, criteriaId);
                      const best = isBestValue(property, criteriaId);

                      return (
                        <td key={property.id} className="px-6 py-4 text-center">
                          <div className={`
                            inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg
                            ${best
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 font-semibold'
                              : 'text-gray-700 dark:text-gray-300'
                            }
                          `}>
                            {best && <Check className="h-4 w-4 flex-shrink-0" />}
                            <span>{value}</span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-green-800 dark:text-green-300 font-medium">Meilleure valeur</span>
              </div>
              <Minus className="h-4 w-4" />
              <span>Les valeurs surlignées sont les meilleures pour chaque critère</span>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all shadow-md font-medium"
            >
              Terminer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
