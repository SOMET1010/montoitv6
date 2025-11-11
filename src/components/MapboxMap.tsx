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

  const MAPBOX_TOKEN = import.meta.env['VITE_MAPBOX_PUBLIC_TOKEN'] || 'pk.eyJ1IjoicHNvbWV0IiwiYSI6ImNtYTgwZ2xmMzEzdWcyaXM2ZG45d3A4NmEifQ.MYXzdc5CREmcvtBLvfV0Lg';

  const getMarkerColor = (property: Property) => {
    if (property.status === 'disponible') return '#10B981';
    if (property.status === 'loue') return '#EF4444';
    if (property.status === 'en_attente') return '#F59E0B';
    return '#FF6B35';
  };

  const validateCoordinates = (lng: number, lat: number): [number, number] => {
    // Validation stricte des coordonnées pour un positionnement précis
    if (typeof lng !== 'number' || typeof lat !== 'number' || isNaN(lng) || isNaN(lat)) {
      console.warn(`Invalid coordinates detected: lng=${lng}, lat=${lat}, using default center`, center);
      return center;
    }

    // Vérification des bornes valides pour la Côte d'Ivoire (avec un peu de marge)
    if (lng < -10 || lng > -1 || lat < 3 || lat > 12) {
      console.warn(`Coordinates outside Ivory Coast bounds: lng=${lng}, lat=${lat}, using default center`, center);
      return center;
    }

    // S'assurer que les coordonnées ont une précision suffisante
    const preciseLng = parseFloat(lng.toFixed(6));
    const preciseLat = parseFloat(lat.toFixed(6));

    return [preciseLng, preciseLat];
  };

  useEffect(() => {
    // Initialiser la fonction globale pour les clics depuis les popups
    (window as Record<string, unknown>).mapPropertyClick = (propertyId: string) => {
      const property = properties.find(p => p.id === propertyId);
      if (property && onMarkerClick) {
        onMarkerClick(property);
      }
    };

    return () => {
      delete (window as Record<string, unknown>).mapPropertyClick;
    };
  }, [properties, onMarkerClick]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    const mapboxWithTelemetry = mapboxgl as typeof mapboxgl & Record<string, unknown>;
    mapboxWithTelemetry.setTelemetryDisabled?.(true); // Prevent blocked event calls on privacy tools

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
            if (bounds) {
              onBoundsChange(bounds);
            }
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
  }, [MAPBOX_TOKEN, center, onBoundsChange, onMapClick, zoom]);

  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    Object.values(markers.current).forEach((marker) => marker.remove());
    markers.current = {};

    if (properties.length === 0) return;

    if (singleMarker && properties.length > 0) {
      const property = properties[0];
      if (!property) return;
      const color = getMarkerColor(property);
      const validCoords = validateCoordinates(property.longitude, property.latitude);

      const marker = new mapboxgl.Marker({
        color: color,
        draggable: draggableMarker,
        anchor: 'center', // Ancrage au centre pour une précision optimale
      })
        .setLngLat(validCoords)
        .addTo(map.current!);

      if (onMarkerDrag) {
        marker.on('dragend', () => {
          const lngLat = marker.getLngLat();
          onMarkerDrag({ lng: lngLat.lng, lat: lngLat.lat });
        });
      }

      markers.current[property.id] = marker;
      map.current?.setCenter(validCoords);
    } else {
      properties.forEach((property) => {
        if (!property) return;
        const color = getMarkerColor(property);
        const validCoords = validateCoordinates(property.longitude, property.latitude);

        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.style.width = '44px';
        el.style.height = '44px';
        el.style.borderRadius = '50% 50% 50% 0';
        el.style.transform = 'rotate(-45deg)';
        el.style.backgroundColor = color;
        el.style.border = '4px solid white';
        el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4), 0 0 0 2px rgba(255,255,255,0.5)';
        el.style.cursor = 'pointer';
        el.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.pointerEvents = 'auto';
        el.style.position = 'relative';
        el.style.zIndex = '10';
        el.tabIndex = 0;
        el.setAttribute('role', 'button');
        el.setAttribute('aria-label', `Voir ${property.title}`);

        // Ajouter l'icône de la maison
        const iconEl = document.createElement('div');
        iconEl.innerHTML = '🏠';
        iconEl.style.transform = 'rotate(45deg)';
        iconEl.style.fontSize = '18px';
        iconEl.style.position = 'absolute';
        iconEl.style.top = '50%';
        iconEl.style.left = '50%';
        iconEl.style.marginTop = '-2px';
        iconEl.style.marginLeft = '-2px';
        el.appendChild(iconEl);

        // Amélioration de la gestion des événements pour une meilleure interactivité
        el.addEventListener('mouseenter', () => {
          el.style.transform = 'rotate(-45deg) scale(1.15)';
          el.style.boxShadow = '0 8px 20px rgba(0,0,0,0.5), 0 0 0 3px rgba(255,255,255,0.7)';
          el.style.zIndex = '1000';
          el.style.cursor = 'pointer';
        });

        el.addEventListener('mouseleave', () => {
          el.style.transform = 'rotate(-45deg) scale(1)';
          el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4), 0 0 0 2px rgba(255,255,255,0.5)';
          el.style.zIndex = '10';
          el.style.cursor = 'pointer';
        });

        const popupContent = `
          <div style="padding: 16px; min-width: 250px; font-family: system-ui, -apple-system, sans-serif;">
            ${property.images && property.images.length > 0 ?
              `<img src="${property.images[0]}" alt="${property.title}" style="width: 100%; height: 140px; object-fit: cover; border-radius: 12px; margin-bottom: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />`
              : '<div style="width: 100%; height: 80px; background: linear-gradient(135deg, #f3f4f6, #e5e7eb); border-radius: 12px; margin-bottom: 12px; display: flex; align-items: center; justify-content: center; color: #6b7280; font-size: 14px;">🏠 Aucune image</div>'}
            <h3 style="font-weight: bold; font-size: 18px; margin-bottom: 8px; color: #1f2937; line-height: 1.3;">${property.title}</h3>
            ${property.city || property.neighborhood ?
              `<p style="color: #6b7280; font-size: 14px; margin-bottom: 12px; display: flex; align-items: center; gap: 4px;">
                📍 ${property.city || ''}${property.neighborhood ? ' • ' + property.neighborhood : ''}
              </p>`
              : ''}
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <p style="color: #ff6b35; font-weight: bold; font-size: 20px; margin: 0;">${property.monthly_rent.toLocaleString()} FCFA</p>
              <p style="color: #6b7280; font-size: 12px; margin: 0;">/mois</p>
            </div>
            ${property.status ?
              `<div style="margin-bottom: 12px;">
                <span style="background: ${property.status === 'disponible' ? '#10B981' : property.status === 'loue' ? '#EF4444' : '#F59E0B'}; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; display: inline-block;">
                  ${property.status === 'disponible' ? '✅ Disponible' : property.status === 'loue' ? '🔴 Loué' : '⏳ En attente'}
                </span>
              </div>`
              : ''}
            <button
              onclick="window.mapPropertyClick && window.mapPropertyClick('${property.id}')"
              style="width: 100%; background: linear-gradient(135deg, #ff6b35, #f97316); color: white; border: none; padding: 12px; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer; transition: all 0.2s ease; margin-top: 8px;"
              onmouseover="this.style.background='linear-gradient(135deg, #f97316, #ea580c)'; this.style.transform='translateY(-1px)';"
              onmouseout="this.style.background='linear-gradient(135deg, #ff6b35, #f97316)'; this.style.transform='translateY(0)';"
            >
              Voir les détails →
            </button>
          </div>
        `;

        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: true,
          closeOnClick: false,
          maxWidth: '300px',
        }).setHTML(popupContent);

        const marker = new mapboxgl.Marker({
          element: el,
          anchor: 'center', // Ancrage au centre pour un positionnement précis
          offset: [0, 0] // Pas de décalage pour un positionnement exact
        })
          .setLngLat(validCoords)
          .setPopup(popup)
          .addTo(map.current!);

        const handleMarkerClick = (event: Event) => {
          event.preventDefault();
          event.stopPropagation();

          // Ajouter un effet visuel immédiat avec rotation
          el.style.transform = 'rotate(-45deg) scale(1.25)';
          el.style.boxShadow = '0 10px 25px rgba(255, 107, 53, 0.7), 0 0 0 4px rgba(255, 107, 53, 0.3)';
          el.style.backgroundColor = '#ff6b35';

          // Appeler le callback externe
          if (onMarkerClick) {
            onMarkerClick(property);
          }

          // Ouvrir le popup avec une animation fluide
          setTimeout(() => {
            marker.togglePopup();
            // Réinitialiser l'effet visuel après un délai
            setTimeout(() => {
              el.style.transform = 'rotate(-45deg) scale(1)';
              el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4), 0 0 0 2px rgba(255,255,255,0.5)';
              el.style.backgroundColor = color;
            }, 300);
          }, 100);
        };

        el.addEventListener('click', handleMarkerClick);
        el.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleMarkerClick(event);
          }
        });

        markers.current[property.id] = marker;
      });

      if (fitBounds && properties.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        properties.forEach((property) => {
          const validCoords = validateCoordinates(property.longitude, property.latitude);
          bounds.extend(validCoords);
        });
        map.current?.fitBounds(bounds, {
          padding: { top: 50, bottom: 50, left: 50, right: 50 },
          maxZoom: 15,
        });
      }
    }

    if (showRadius && properties.length > 0 && map.current) {
      const property = properties[0];
      if (!property) return;
      const validCoords = validateCoordinates(property.longitude, property.latitude);
      const radiusInMeters = radiusKm * 1000;

      const circle = {
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: validCoords,
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
  }, [properties, mapLoaded, singleMarker, draggableMarker, fitBounds, showRadius, radiusKm, onMarkerClick, onMarkerDrag, validateCoordinates]);

  useEffect(() => {
    if (!highlightedPropertyId) {
      Object.values(markers.current).forEach((marker) => {
        const el = marker.getElement();
        el.style.transform = 'rotate(-45deg) scale(1)';
        el.style.zIndex = '10';
        el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4), 0 0 0 2px rgba(255,255,255,0.5)';
        el.style.opacity = '1';
        el.style.filter = 'none';
      });
      return;
    }

    Object.entries(markers.current).forEach(([id, marker]) => {
      const el = marker.getElement();
      if (id === highlightedPropertyId) {
        el.style.transform = 'rotate(-45deg) scale(1.3)';
        el.style.zIndex = '1000';
        el.style.boxShadow = '0 12px 30px rgba(255, 107, 53, 0.8), 0 0 0 5px rgba(255, 107, 53, 0.4)';
        el.style.backgroundColor = '#ff6b35';
      } else {
        el.style.transform = 'rotate(-45deg) scale(0.85)';
        el.style.zIndex = '1';
        el.style.opacity = '0.6';
        el.style.filter = 'grayscale(0.5)';
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
