import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { MapPin, Loader, AlertCircle } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mapboxgl: any;
  }
}

interface Property {
  id: string;
  title: string;
  location: string;
  price: number;
  latitude?: number;
  longitude?: number;
}

interface PropertyMapProps {
  properties: Property[];
  center?: { lat: number; lng: number };
  zoom?: number;
  onMarkerClick?: (property: Property) => void;
}

export default function PropertyMap({
  properties,
  center = { lat: 5.3600, lng: -4.0083 },
  zoom = 12,
  onMarkerClick
}: PropertyMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const map = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markers = useRef<any[]>([]);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    loadMapboxToken();
  }, []);

  useEffect(() => {
    if (!mapboxToken || !mapContainer.current || map.current || !scriptLoaded) return;

    initializeMap();
  }, [mapboxToken, scriptLoaded]);

  useEffect(() => {
    if (map.current && mapboxToken) {
      updateMarkers();
    }
  }, [properties, mapboxToken]);

  const loadMapboxToken = async () => {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('keys')
        .eq('service_name', 'mapbox')
        .eq('is_active', true)
        .single();

      if (error) throw error;

      // Type assertion pour éviter les erreurs TypeScript
      const dataRecord = data as Record<string, unknown>;
      if (dataRecord && typeof dataRecord === 'object' && 'keys' in dataRecord) {
        const keys = dataRecord['keys'] as Record<string, unknown>;
        if (keys && typeof keys === 'object' && 'access_token' in keys) {
          setMapboxToken(String(keys['access_token']));
        } else {
          setError('Mapbox token not configured');
        }
      } else {
        setError('Mapbox token not configured');
      }
    } catch (err: unknown) {
      console.error('Error loading Mapbox token:', err);
      setError('Failed to load map');
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = () => {
    if (!mapContainer.current || !mapboxToken) return;

    // Vérifier si le script est déjà chargé
    if (window.mapboxgl) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
    script.async = true;
    script.onerror = () => {
      console.error('Failed to load Mapbox script');
      setError('Impossible de charger la carte');
      setLoading(false);
    };
    
    script.onload = () => {
      // Vérifier si le CSS est déjà chargé
      if (!document.querySelector('link[href*="mapbox-gl.css"]')) {
        const link = document.createElement('link');
        link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
        link.rel = 'stylesheet';
        link.onerror = () => {
          console.warn('Failed to load Mapbox CSS');
        };
        document.head.appendChild(link);
      }

      setScriptLoaded(true);
    };

    document.head.appendChild(script);
  };

  useEffect(() => {
    if (!scriptLoaded || !mapboxToken || map.current) return;

    try {
      const mapboxgl = window.mapboxgl;
      mapboxgl.accessToken = mapboxToken;

      map.current = new mapboxgl.Map({
        container: mapContainer.current!,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [center.lng, center.lat],
        zoom: zoom
      });

      if (map.current) {
        map.current.addControl(new window.mapboxgl.NavigationControl(), 'top-right');

        map.current.on('load', () => {
          updateMarkers();
        });

        map.current.on('error', (e: { error: Error }) => {
          console.error('Mapbox error:', e.error);
          setError('Erreur lors du chargement de la carte');
        });
      }
    } catch (error) {
      console.error('Error initializing map:', error);
      setError('Impossible d\'initialiser la carte');
    }
  }, [scriptLoaded, mapboxToken, center, zoom]);

  const validateCoordinates = (lng: number, lat: number): [number, number] | null => {
    if (isNaN(lng) || isNaN(lat)) return null;
    if (lng < -9 || lng > -2 || lat < 4 || lat > 11) return null;
    return [lng, lat];
  };

  const updateMarkers = () => {
    if (!map.current) return;

    const mapboxgl = window.mapboxgl;
    if (!mapboxgl) return;

    // Nettoyer les marqueurs existants
    markers.current.forEach(marker => {
      if (marker && typeof marker.remove === 'function') {
        marker.remove();
      }
    });
    markers.current = [];

    const validProperties = properties.filter(property => {
      if (!property.latitude || !property.longitude) return false;
      return validateCoordinates(property.longitude, property.latitude) !== null;
    });

    if (validProperties.length === 0) {
      console.warn('No valid properties with coordinates to display');
      return;
    }

    validProperties.forEach(property => {
      const validCoords = validateCoordinates(
        property.longitude || 0,
        property.latitude || 0
      );
      if (!validCoords) return;

      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.cssText = `
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #f97316, #ea580c);
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        position: relative;
        transition: transform 0.2s ease;
        z-index: 10;
      `;

      const icon = document.createElement('div');
      icon.innerHTML = '🏠';
      icon.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(45deg);
        font-size: 20px;
      `;
      el.appendChild(icon);

      // Améliorer l'interactivité
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'rotate(-45deg) scale(1.1)';
        el.style.zIndex = '1000';
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = 'rotate(-45deg) scale(1)';
        el.style.zIndex = '10';
      });

      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'bottom',
        offset: [0, 20]
      })
        .setLngLat(validCoords)
        .addTo(map.current!);

      const popup = new mapboxgl.Popup({
        offset: 30,
        closeButton: true,
        closeOnClick: false
      }).setHTML(`
        <div style="padding: 12px; min-width: 220px;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #1f2937;">
            ${property.title}
          </h3>
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">
            📍 ${property.location}
          </p>
          <p style="margin: 0; font-size: 16px; font-weight: bold; color: #f97316;">
            ${property.price.toLocaleString('fr-FR')} FCFA/mois
          </p>
        </div>
      `);

      marker.setPopup(popup);

      const handleClick = (event: Event) => {
        event.preventDefault();
        event.stopPropagation();
        if (onMarkerClick) {
          onMarkerClick(property);
        }
        // Ouvrir le popup avec un léger délai
        setTimeout(() => {
          marker.togglePopup();
        }, 50);
      };

      el.addEventListener('click', handleClick);
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e);
        }
      });

      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', `Voir ${property.title}`);
      el.tabIndex = 0;

      markers.current.push(marker);
    });

    // Ajuster la vue pour inclure tous les marqueurs
    if (validProperties.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      validProperties.forEach(property => {
        const validCoords = validateCoordinates(
          property.longitude || 0,
          property.latitude || 0
        );
        if (validCoords) {
          bounds.extend(validCoords);
        }
      });
      if (map.current) {
        map.current.fitBounds(bounds, { padding: 50, maxZoom: 15 });
      }
    }
  };

  if (loading) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-orange-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement de la carte...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-xl flex items-center justify-center">
        <div className="text-center max-w-md p-6">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError('');
              setLoading(true);
              loadMapboxToken();
            }}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={mapContainer}
        className="w-full h-96 rounded-xl shadow-lg"
        style={{ minHeight: '400px' }}
      />
      {properties.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-xl">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucune propriété à afficher sur la carte</p>
          </div>
        </div>
      )}
    </div>
  );
}
