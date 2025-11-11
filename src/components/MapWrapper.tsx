import { useState, useEffect, lazy, Suspense } from 'react';
import { Map, AlertCircle, MapPin } from 'lucide-react';

const MapboxMap = lazy(() => import('./MapboxMap'));

// Composant simple pour gérer les erreurs de Mapbox
function MapboxErrorBoundary({
  children,
  onError
}: {
  children: React.ReactNode;
  onError: () => void;
}) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.message && (
        event.message.includes('mapbox') ||
        event.message.includes('Map') ||
        event.filename && event.filename.includes('mapbox')
      )) {
        setHasError(true);
        onError();
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [onError]);

  if (hasError) {
    return null; // Le composant parent gérera l'affichage du fallback
  }

  return <>{children}</>;
}

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  const [useAzureFallback, setUseAzureFallback] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [errorDetails, setErrorDetails] = useState<string>('');

  useEffect(() => {
    const checkMapboxToken = () => {
      const token = import.meta.env['VITE_MAPBOX_PUBLIC_TOKEN'] || import.meta.env['VITE_MAPBOX_TOKEN'];
      if (!token || token === '' || token === 'undefined') {
        console.warn('Mapbox token not configured, using Azure Maps fallback');
        setUseAzureFallback(true);
        setErrorDetails('Token Mapbox non configuré');
      }
    };

    const handleMapError = (event?: Event) => {
      console.error('Mapbox failed to load, switching to Azure Maps');
      setUseAzureFallback(true);
      setErrorDetails(event ? 'Erreur de chargement de Mapbox' : 'Erreur inconnue');
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && typeof event.reason === 'string' && event.reason.includes('mapbox')) {
        handleMapError();
      }
    };

    checkMapboxToken();

    window.addEventListener('mapbox-error', handleMapError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('mapbox-error', handleMapError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setUseAzureFallback(false);
    setErrorDetails('');
    
    // Forcer le rechargement du composant
    const token = import.meta.env['VITE_MAPBOX_PUBLIC_TOKEN'] || import.meta.env['VITE_MAPBOX_TOKEN'];
    if (!token || token === '' || token === 'undefined') {
      setTimeout(() => {
        setUseAzureFallback(true);
        setErrorDetails('Token Mapbox toujours non configuré');
      }, 1000);
    }
  };

  if (useAzureFallback) {
    return (
      <AzureMapsComponent
        {...props}
        errorDetails={errorDetails}
        onRetry={handleRetry}
        retryCount={retryCount}
      />
    );
  }

  return (
    <Suspense
      fallback={
        <div
          style={{ height: props.height || '500px' }}
          className="relative bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden animate-pulse flex items-center justify-center"
        >
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-terracotta-300 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-cyan-300 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-olive-300 rounded-full blur-3xl"></div>
          </div>
          <div className="relative z-10 text-center space-y-4">
            <div className="w-20 h-20 bg-gradient-to-br from-terracotta-400 to-coral-400 rounded-2xl flex items-center justify-center mx-auto animate-bounce-subtle shadow-lg">
              <Map className="h-10 w-10 text-white" />
            </div>
            <div className="space-y-2">
              <p className="text-gray-700 font-bold text-lg">Chargement de la carte...</p>
              <p className="text-gray-600 text-sm">Préparation de vos propriétés</p>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <MapPin className="h-4 w-4 text-terracotta-500 animate-pulse" />
              <MapPin className="h-4 w-4 text-cyan-500 animate-pulse" style={{ animationDelay: '0.2s' }} />
              <MapPin className="h-4 w-4 text-olive-500 animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
          <div className="absolute top-4 right-4 space-y-2">
            <div className="w-10 h-10 bg-white/80 rounded-lg"></div>
            <div className="w-10 h-10 bg-white/80 rounded-lg"></div>
          </div>
        </div>
      }
    >
      <MapboxErrorBoundary
        onError={() => {
          setUseAzureFallback(true);
          setErrorDetails('Erreur de rendu du composant Mapbox');
        }}
      >
        <MapboxMap {...props} key={`mapbox-${retryCount}`} />
      </MapboxErrorBoundary>
    </Suspense>
  );
}

function AzureMapsComponent({
  properties,
  height = '500px',
  onMarkerClick,
  errorDetails = '',
  onRetry,
  retryCount = 0,
}: MapWrapperProps & {
  errorDetails?: string;
  onRetry?: () => void;
  retryCount?: number;
}) {
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
              Mapbox n'est pas disponible. Utilisation du mode de secours.
            </p>
            {errorDetails && (
              <div className="flex items-center justify-center space-x-2 text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg mb-4">
                <AlertCircle className="h-4 w-4" />
                <span>{errorDetails}</span>
              </div>
            )}
            {onRetry && retryCount < 3 && (
              <button
                onClick={onRetry}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mb-4"
              >
                Réessayer Mapbox ({3 - retryCount} tentative{3 - retryCount > 1 ? 's' : ''} restante{3 - retryCount > 1 ? 's' : ''})
              </button>
            )}
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

          <div className="mt-6 text-sm text-gray-500 space-y-2">
            <p>
              💡 <strong>Note:</strong> Pour activer Mapbox, ajoutez votre token dans les variables d'environnement
            </p>
            {retryCount >= 3 && (
              <p className="text-red-600">
                ⚠️ Nombre maximum de tentatives atteint. Veuillez vérifier votre configuration.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
