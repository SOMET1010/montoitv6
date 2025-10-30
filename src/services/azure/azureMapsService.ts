import { serviceProviderFactory, ServiceResponse } from '../providers/serviceProviderFactory';

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  address: string;
  confidence: string;
}

export interface RouteResult {
  distance: number;
  duration: number;
  instructions: Array<{
    instruction: string;
    distance: number;
    duration: number;
  }>;
  coordinates: Array<[number, number]>;
}

export interface PlaceSearchResult {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  category: string;
  distance?: number;
}

class AzureMapsService {
  async geocode(address: string): Promise<ServiceResponse<GeocodingResult>> {
    return serviceProviderFactory.callWithFallback(
      'maps',
      'geocode',
      async (provider) => {
        const subscriptionKey = provider.keys.subscription_key;

        const response = await fetch(
          `https://atlas.microsoft.com/search/address/json?api-version=1.0&subscription-key=${subscriptionKey}&query=${encodeURIComponent(address)}`,
          {
            method: 'GET',
          }
        );

        if (!response.ok) {
          throw new Error(`Azure Maps geocoding error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.results || data.results.length === 0) {
          throw new Error('Adresse non trouvée');
        }

        const result = data.results[0];

        await serviceProviderFactory.logProviderCost(
          provider.providerId,
          'maps',
          'geocode',
          1,
          2.25,
          0.0045,
          { address }
        );

        return {
          latitude: result.position.lat,
          longitude: result.position.lon,
          address: result.address.freeformAddress,
          confidence: result.score.toString(),
        };
      }
    );
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<ServiceResponse<GeocodingResult>> {
    return serviceProviderFactory.callWithFallback(
      'maps',
      'reverse_geocode',
      async (provider) => {
        const subscriptionKey = provider.keys.subscription_key;

        const response = await fetch(
          `https://atlas.microsoft.com/search/address/reverse/json?api-version=1.0&subscription-key=${subscriptionKey}&query=${latitude},${longitude}`,
          {
            method: 'GET',
          }
        );

        if (!response.ok) {
          throw new Error(`Azure Maps reverse geocoding error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.addresses || data.addresses.length === 0) {
          throw new Error('Adresse non trouvée');
        }

        const result = data.addresses[0];

        await serviceProviderFactory.logProviderCost(
          provider.providerId,
          'maps',
          'reverse_geocode',
          1,
          2.25,
          0.0045,
          { latitude, longitude }
        );

        return {
          latitude,
          longitude,
          address: result.address.freeformAddress,
          confidence: result.confidence,
        };
      }
    );
  }

  async calculateRoute(
    origin: [number, number],
    destination: [number, number]
  ): Promise<ServiceResponse<RouteResult>> {
    return serviceProviderFactory.callWithFallback(
      'maps',
      'calculate_route',
      async (provider) => {
        const subscriptionKey = provider.keys.subscription_key;

        const originStr = `${origin[0]},${origin[1]}`;
        const destinationStr = `${destination[0]},${destination[1]}`;

        const response = await fetch(
          `https://atlas.microsoft.com/route/directions/json?api-version=1.0&subscription-key=${subscriptionKey}&query=${originStr}:${destinationStr}`,
          {
            method: 'GET',
          }
        );

        if (!response.ok) {
          throw new Error(`Azure Maps routing error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.routes || data.routes.length === 0) {
          throw new Error('Aucun itinéraire trouvé');
        }

        const route = data.routes[0];
        const summary = route.summary;
        const legs = route.legs[0];

        await serviceProviderFactory.logProviderCost(
          provider.providerId,
          'maps',
          'calculate_route',
          1,
          2.25,
          0.0045,
          { origin, destination }
        );

        return {
          distance: summary.lengthInMeters,
          duration: summary.travelTimeInSeconds,
          instructions: legs.points.map((point: any) => ({
            instruction: point.instruction || '',
            distance: point.routeOffsetInMeters || 0,
            duration: point.travelTimeInSeconds || 0,
          })),
          coordinates: legs.points.map((point: any) => [
            point.latitude,
            point.longitude,
          ]),
        };
      }
    );
  }

  async searchNearby(
    latitude: number,
    longitude: number,
    query: string,
    radius: number = 5000
  ): Promise<ServiceResponse<PlaceSearchResult[]>> {
    return serviceProviderFactory.callWithFallback(
      'maps',
      'search_nearby',
      async (provider) => {
        const subscriptionKey = provider.keys.subscription_key;

        const response = await fetch(
          `https://atlas.microsoft.com/search/nearby/json?api-version=1.0&subscription-key=${subscriptionKey}&lat=${latitude}&lon=${longitude}&radius=${radius}&query=${encodeURIComponent(query)}`,
          {
            method: 'GET',
          }
        );

        if (!response.ok) {
          throw new Error(`Azure Maps search error: ${response.status}`);
        }

        const data = await response.json();

        await serviceProviderFactory.logProviderCost(
          provider.providerId,
          'maps',
          'search_nearby',
          1,
          2.25,
          0.0045,
          { latitude, longitude, query, radius }
        );

        return (data.results || []).map((result: any) => ({
          name: result.poi?.name || 'Unknown',
          address: result.address?.freeformAddress || '',
          latitude: result.position.lat,
          longitude: result.position.lon,
          category: result.poi?.categories?.[0] || '',
          distance: result.dist,
        }));
      }
    );
  }

  async searchAddress(query: string, countryCode: string = 'CI'): Promise<ServiceResponse<PlaceSearchResult[]>> {
    return serviceProviderFactory.callWithFallback(
      'maps',
      'search_address',
      async (provider) => {
        const subscriptionKey = provider.keys.subscription_key;

        const response = await fetch(
          `https://atlas.microsoft.com/search/address/json?api-version=1.0&subscription-key=${subscriptionKey}&query=${encodeURIComponent(query)}&countrySet=${countryCode}&limit=10`,
          {
            method: 'GET',
          }
        );

        if (!response.ok) {
          throw new Error(`Azure Maps search error: ${response.status}`);
        }

        const data = await response.json();

        await serviceProviderFactory.logProviderCost(
          provider.providerId,
          'maps',
          'search_address',
          1,
          2.25,
          0.0045,
          { query, countryCode }
        );

        return (data.results || []).map((result: any) => ({
          name: result.address.freeformAddress,
          address: result.address.freeformAddress,
          latitude: result.position.lat,
          longitude: result.position.lon,
          category: result.type || '',
        }));
      }
    );
  }
}

export const azureMapsService = new AzureMapsService();
