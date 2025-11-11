import { useState, useEffect } from 'react';

interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface GeolocationError {
  code: number;
  message: string;
}

interface GeolocationState {
  position: GeolocationPosition | null;
  error: GeolocationError | null;
  loading: boolean;
  supported: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    loading: false,
    supported: 'geolocation' in navigator,
  });

  const requestLocation = () => {
    if (!state.supported) {
      setState(prev => ({
        ...prev,
        error: {
          code: 0,
          message: 'La géolocalisation n\'est pas supportée par votre navigateur'
        }
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          position: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          },
          error: null,
          loading: false,
          supported: true,
        });
      },
      (error) => {
        let message = 'Erreur lors de la récupération de votre position';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Accès à la localisation refusé. Veuillez autoriser l\'accès dans les paramètres de votre navigateur.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Position non disponible. Vérifiez votre connexion GPS.';
            break;
          case error.TIMEOUT:
            message = 'La demande de localisation a expiré. Veuillez réessayer.';
            break;
        }

        setState(prev => ({
          ...prev,
          error: { code: error.code, message },
          loading: false,
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  return {
    ...state,
    requestLocation,
    clearError,
  };
}
