import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { MapPin, Loader } from 'lucide-react';

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
  const map = useRef<any>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMapboxToken();
  }, []);

  useEffect(() => {
    if (!mapboxToken || !mapContainer.current || map.current) return;

    initializeMap();
  }, [mapboxToken]);

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

      if (data?.keys?.access_token) {
        setMapboxToken(data.keys.access_token);
      } else {
        setError('Mapbox token not configured');
      }
    } catch (err: any) {
      console.error('Error loading Mapbox token:', err);
      setError('Failed to load map');
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = () => {
    if (!mapContainer.current || !mapboxToken) return;

    const script = document.createElement('script');
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
    script.async = true;
    script.onload = () => {
      const link = document.createElement('link');
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);

      const mapboxgl = (window as any).mapboxgl;
      mapboxgl.accessToken = mapboxToken;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [center.lng, center.lat],
        zoom: zoom
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      updateMarkers();
    };

    document.head.appendChild(script);
  };

  const updateMarkers = () => {
    if (!map.current) return;

    const mapboxgl = (window as any).mapboxgl;
    if (!mapboxgl) return;

    const markers = document.querySelectorAll('.mapboxgl-marker');
    markers.forEach(marker => marker.remove());

    properties.forEach(property => {
      if (!property.latitude || !property.longitude) return;

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

      const marker = new mapboxgl.Marker(el)
        .setLngLat([property.longitude, property.latitude])
        .addTo(map.current);

      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false
      }).setHTML(`
        <div style="padding: 10px; min-width: 200px;">
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

      el.addEventListener('click', () => {
        if (onMarkerClick) {
          onMarkerClick(property);
        }
      });
    });

    if (properties.length > 0 && properties.some(p => p.latitude && p.longitude)) {
      const bounds = new mapboxgl.LngLatBounds();
      properties.forEach(property => {
        if (property.latitude && property.longitude) {
          bounds.extend([property.longitude, property.latitude]);
        }
      });
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 15 });
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
        <div className="text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">{error}</p>
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
