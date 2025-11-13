import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

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

interface MapboxMapProps {
  center?: [number, number];
  zoom?: number;
  properties: Property[];
  highlightedPropertyId?: string;
  onMarkerClick?: (property: Property) => void;
  onBoundsChange?: (bounds: mapboxgl.LngLatBounds) => void;
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

export default function MapboxMap({
  center = [-4.0083, 5.3600],
  zoom = 12,
  properties,
  highlightedPropertyId,
  onMarkerClick,
  onBoundsChange,
  clustering = false,
  draggableMarker = false,
  showRadius = false,
  radiusKm = 1,
  fitBounds = false,
  height = '100%',
  onMapClick,
  onMarkerDrag,
  singleMarker = false,
}: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const [mapLoaded, setMapLoaded] = useState(false);

  const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN || 'pk.eyJ1IjoicHNvbWV0IiwiYSI6ImNtYTgwZ2xmMzEzdWcyaXM2ZG45d3A4NmEifQ.MYXzdc5CREmcvtBLvfV0Lg';

  const getMarkerColor = (property: Property) => {
    if (property.status === 'disponible') return '#10B981';
    if (property.status === 'loue') return '#EF4444';
    if (property.status === 'en_attente') return '#F59E0B';
    return '#FF6B35';
  };

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: center,
        zoom: zoom,
        attributionControl: false,
      });

      map.current.addControl(
        new mapboxgl.NavigationControl({
          showCompass: true,
          showZoom: true,
        }),
        'top-right'
      );

      map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

      if (onBoundsChange) {
        map.current.on('moveend', () => {
          if (map.current) {
            const bounds = map.current.getBounds();
            onBoundsChange(bounds);
          }
        });
      }

      if (onMapClick) {
        map.current.on('click', (e) => {
          onMapClick({ lng: e.lngLat.lng, lat: e.lngLat.lat });
        });
      }

      map.current.on('load', () => {
        setMapLoaded(true);
      });
    } catch (error) {
      console.error('Error initializing map:', error);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    Object.values(markers.current).forEach((marker) => marker.remove());
    markers.current = {};

    if (properties.length === 0) return;

    if (singleMarker && properties.length > 0) {
      const property = properties[0];
      const color = getMarkerColor(property);

      const marker = new mapboxgl.Marker({
        color: color,
        draggable: draggableMarker,
      })
        .setLngLat([property.longitude, property.latitude])
        .addTo(map.current!);

      if (onMarkerDrag) {
        marker.on('dragend', () => {
          const lngLat = marker.getLngLat();
          onMarkerDrag({ lng: lngLat.lng, lat: lngLat.lat });
        });
      }

      markers.current[property.id] = marker;
      map.current?.setCenter([property.longitude, property.latitude]);
    } else {
      properties.forEach((property) => {
        const color = getMarkerColor(property);

        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.style.width = '36px';
        el.style.height = '36px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = color;
        el.style.border = '3px solid white';
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        el.style.cursor = 'pointer';
        el.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
        el.style.transformOrigin = 'center center';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.color = 'white';
        el.style.fontSize = '16px';
        el.style.fontWeight = 'bold';
        el.innerHTML = '🏠';

        el.addEventListener('mouseenter', () => {
          el.style.transform = 'scale(1.2)';
          el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
          el.style.zIndex = '1000';
        });

        el.addEventListener('mouseleave', () => {
          el.style.transform = 'scale(1)';
          el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
          el.style.zIndex = '1';
        });

        const popupContent = `
          <div style="padding: 12px; min-width: 200px;">
            ${property.images && property.images.length > 0 ?
              `<img src="${property.images[0]}" alt="${property.title}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;" />`
              : ''}
            <h3 style="font-weight: bold; font-size: 16px; margin-bottom: 4px; color: #1f2937;">${property.title}</h3>
            ${property.city || property.neighborhood ?
              `<p style="color: #6b7280; font-size: 14px; margin-bottom: 8px;">${property.city || ''}${property.neighborhood ? ' • ' + property.neighborhood : ''}</p>`
              : ''}
            <p style="color: #ff6b35; font-weight: bold; font-size: 18px; margin-bottom: 8px;">${property.monthly_rent.toLocaleString()} FCFA/mois</p>
            ${property.status ?
              `<span style="background: ${property.status === 'disponible' ? '#10B981' : '#EF4444'}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
                ${property.status === 'disponible' ? 'Disponible' : property.status === 'loue' ? 'Loué' : 'En attente'}
              </span>`
              : ''}
          </div>
        `;

        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: true,
          closeOnClick: false,
          maxWidth: '300px',
        }).setHTML(popupContent);

        const marker = new mapboxgl.Marker(el)
          .setLngLat([property.longitude, property.latitude])
          .setPopup(popup)
          .addTo(map.current!);

        el.addEventListener('click', () => {
          if (onMarkerClick) {
            onMarkerClick(property);
          }
          marker.togglePopup();
        });

        markers.current[property.id] = marker;
      });

      if (fitBounds && properties.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        properties.forEach((property) => {
          bounds.extend([property.longitude, property.latitude]);
        });
        map.current?.fitBounds(bounds, {
          padding: { top: 50, bottom: 50, left: 50, right: 50 },
          maxZoom: 15,
        });
      }
    }

    if (showRadius && properties.length > 0 && map.current) {
      const property = properties[0];
      const radiusInMeters = radiusKm * 1000;

      const circle = {
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [property.longitude, property.latitude],
        },
        properties: {
          radius: radiusInMeters,
        },
      };

      if (!map.current.getSource('radius')) {
        map.current.addSource('radius', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [circle],
          },
        });

        map.current.addLayer({
          id: 'radius-fill',
          type: 'circle',
          source: 'radius',
          paint: {
            'circle-radius': {
              stops: [
                [0, 0],
                [20, radiusInMeters / 0.075],
              ],
              base: 2,
            },
            'circle-color': '#FF6B35',
            'circle-opacity': 0.1,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#FF6B35',
            'circle-stroke-opacity': 0.5,
          },
        });
      }
    }
  }, [properties, mapLoaded, singleMarker, draggableMarker, fitBounds, showRadius, radiusKm]);

  useEffect(() => {
    if (!highlightedPropertyId) {
      Object.values(markers.current).forEach((marker) => {
        const el = marker.getElement();
        el.style.transform = 'scale(1)';
        el.style.zIndex = '1';
      });
      return;
    }

    Object.entries(markers.current).forEach(([id, marker]) => {
      const el = marker.getElement();
      if (id === highlightedPropertyId) {
        el.style.transform = 'scale(1.3)';
        el.style.zIndex = '1000';
        el.style.boxShadow = '0 6px 16px rgba(255, 107, 53, 0.6)';
      } else {
        el.style.transform = 'scale(0.9)';
        el.style.zIndex = '1';
        el.style.opacity = '0.5';
      }
    });
  }, [highlightedPropertyId]);

  return (
    <div
      ref={mapContainer}
      style={{ width: '100%', height }}
      className="rounded-lg overflow-hidden"
      role="application"
      aria-label="Carte interactive des propriétés"
    />
  );
}
