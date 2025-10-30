import { useState, useEffect, lazy, Suspense } from 'react';
import { Map, AlertCircle } from 'lucide-react';

const MapboxMap = lazy(() => import('./MapboxMap'));

interface Property {
  id: string;
  title: string;
  monthly_rent: number;
  longitude: number;
  latitude: number;
  status?: string;
  images?: string[];
  city?: string;
  neighborhood?: string;
}

interface MapWrapperProps {
  center?: [number, number];
  zoom?: number;
  properties: Property[];
  highlightedPropertyId?: string;
  onMarkerClick?: (property: Property) => void;
  onBoundsChange?: (bounds: any) => void;
  clustering?: boolean;
  draggableMarker?: boolean;
  showRadius?: boolean;
  radiusKm?: number;
  fitBounds?: boolean;
  height?: string;
  onMapClick?: (lngLat: { lng: number; lat: number }) => void;
  onMarkerDrag?: (lngLat: { lng: number; lat: number }) => void;
  searchEnabled?: boolean;
  singleMarker?: boolean;
}

export default function MapWrapper(props: MapWrapperProps) {
  const [mapError, setMapError] = useState(false);
  const [useAzureFallback, setUseAzureFallback] = useState(false);

  useEffect(() => {
    const checkMapboxToken = () => {
      const token = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN || import.meta.env.VITE_MAPBOX_TOKEN;
      if (!token || token === '' || token === 'undefined') {
        console.warn('Mapbox token not configured, using Azure Maps fallback');
        setUseAzureFallback(true);
      }
    };

    checkMapboxToken();

    const handleMapError = () => {
      console.error('Mapbox failed to load, switching to Azure Maps');
      setMapError(true);
      setUseAzureFallback(true);
    };

    window.addEventListener('mapbox-error', handleMapError);
    return () => window.removeEventListener('mapbox-error', handleMapError);
  }, []);

  if (useAzureFallback) {
    return <AzureMapsComponent {...props} />;
  }

  return (
    <Suspense
      fallback={
        <div
          style={{ height: props.height || '500px' }}
          className="bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded-lg"
        >
          <div className="text-center">
            <Map className="h-16 w-16 text-terracotta-400 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600 font-medium">Chargement de la carte...</p>
          </div>
        </div>
      }
    >
      <div
        onError={() => {
          console.error('Mapbox component error, using fallback');
          setMapError(true);
          setUseAzureFallback(true);
        }}
      >
        <MapboxMap {...props} />
      </div>
    </Suspense>
  );
}

function AzureMapsComponent({
  properties,
  height = '500px',
  center = [-4.0083, 5.36],
  zoom = 12,
  onMarkerClick,
}: MapWrapperProps) {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const handleMarkerClick = (property: Property) => {
    setSelectedProperty(property);
    if (onMarkerClick) {
      onMarkerClick(property);
    }
  };

  return (
    <div
      style={{ height }}
      className="relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg overflow-hidden border-2 border-blue-200"
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center p-8 max-w-2xl">
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <Map className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Azure Maps - Mode de Secours
            </h3>
            <p className="text-gray-600 mb-4">
              Mapbox n'est pas disponible. Utilisation d'Azure Maps comme solution alternative.
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm text-blue-600 bg-blue-50 px-4 py-2 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span>Configuration Azure Maps en cours...</span>
            </div>
          </div>

          {properties.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h4 className="font-bold text-lg mb-4 text-gray-900">
                {properties.length} propriété{properties.length > 1 ? 's' : ''} disponible{properties.length > 1 ? 's' : ''}
              </h4>
              <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">
                {properties.slice(0, 5).map((property) => (
                  <button
                    key={property.id}
                    onClick={() => handleMarkerClick(property)}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${
                      selectedProperty?.id === property.id
                        ? 'border-blue-500 bg-blue-50 shadow-lg'
                        : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg p-2 flex-shrink-0">
                        <Map className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-gray-900 truncate mb-1">
                          {property.title}
                        </h5>
                        <p className="text-sm text-gray-600 mb-2">
                          {property.city}
                          {property.neighborhood && `, ${property.neighborhood}`}
                        </p>
                        <p className="text-lg font-bold text-blue-600">
                          {property.monthly_rent.toLocaleString()} FCFA/mois
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              {properties.length > 5 && (
                <p className="text-sm text-gray-500 mt-4 text-center">
                  + {properties.length - 5} autre{properties.length - 5 > 1 ? 's' : ''} propriété{properties.length - 5 > 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}

          <div className="mt-6 text-sm text-gray-500">
            <p>
              💡 <strong>Note:</strong> Pour activer Mapbox, ajoutez votre token dans les variables d'environnement
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
