import { useState, useEffect, useCallback } from 'react';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { Capacitor } from '@capacitor/core';

type OrientationType = 'portrait' | 'landscape' | 'any';

interface UseScreenOrientationOptions {
  defaultOrientation?: OrientationType;
  lockOnMount?: boolean;
  autoRotate?: boolean;
}

export function useScreenOrientation(options: UseScreenOrientationOptions = {}) {
  const {
    defaultOrientation = 'portrait',
    lockOnMount = false,
    autoRotate = false
  } = options;

  const [currentOrientation, setCurrentOrientation] = useState<OrientationType>(defaultOrientation);
  const [isLocked, setIsLocked] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  // Vérifier si l'orientation est supportée
  useEffect(() => {
    const checkSupport = async () => {
      try {
        if (isNative) {
          await ScreenOrientation.lock({ orientation: 'portrait' });
          await ScreenOrientation.unlock();
          setIsSupported(true);
        } else {
          // Sur web, on utilise l'API Screen Orientation
          setIsSupported('orientation' in screen);
        }
      } catch (error) {
        console.log('Screen orientation not supported:', error);
        setIsSupported(false);
      }
    };

    checkSupport();
  }, [isNative]);

  // Verrouiller l'orientation
  const lock = useCallback(async (orientation: OrientationType) => {
    if (!isSupported) {
      console.warn('Screen orientation not supported');
      return false;
    }

    try {
      if (isNative) {
        await ScreenOrientation.lock({ orientation });
      } else {
        // API web
        await screen.orientation.lock(orientation);
      }
      setIsLocked(true);
      setCurrentOrientation(orientation);
      return true;
    } catch (error) {
      console.error('Error locking orientation:', error);
      return false;
    }
  }, [isSupported, isNative]);

  // Déverrouiller l'orientation
  const unlock = useCallback(async () => {
    if (!isSupported) return false;

    try {
      if (isNative) {
        await ScreenOrientation.unlock();
      } else {
        // API web
        await screen.orientation.unlock();
      }
      setIsLocked(false);
      return true;
    } catch (error) {
      console.error('Error unlocking orientation:', error);
      return false;
    }
  }, [isSupported, isNative]);

  // Obtenir l'orientation actuelle
  const getCurrentOrientation = useCallback(async (): Promise<OrientationType> => {
    if (!isSupported) return 'any';

    try {
      if (isNative) {
        const result = await ScreenOrientation.currentOrientation();
        return mapNativeOrientation(result.type);
      } else {
        // API web
        return mapWebOrientation(screen.orientation.type);
      }
    } catch (error) {
      console.error('Error getting current orientation:', error);
      return 'any';
    }
  }, [isSupported, isNative]);

  // Mapper les orientations natives vers nos types
  const mapNativeOrientation = (nativeOrientation: string): OrientationType => {
    if (nativeOrientation.includes('portrait')) return 'portrait';
    if (nativeOrientation.includes('landscape')) return 'landscape';
    return 'any';
  };

  // Mapper les orientations web vers nos types
  const mapWebOrientation = (webOrientation: string): OrientationType => {
    if (webOrientation.includes('portrait')) return 'portrait';
    if (webOrientation.includes('landscape')) return 'landscape';
    return 'any';
  };

  // Auto-rotation basée sur le type de contenu
  const enableAutoRotation = useCallback(async () => {
    if (!autoRotate || !isSupported) return false;

    try {
      await unlock();
      return true;
    } catch (error) {
      console.error('Error enabling auto rotation:', error);
      return false;
    }
  }, [autoRotate, isSupported, unlock]);

  // Surveiller les changements d'orientation
  useEffect(() => {
    if (!isSupported || !autoRotate) return;

    const handleOrientationChange = async () => {
      const orientation = await getCurrentOrientation();
      setCurrentOrientation(orientation);
    };

    let cleanup: (() => void) | undefined;

    if (isNative) {
      // Utiliser l'écouteur d'événements Capacitor
      ScreenOrientation.addListener('screenOrientationChange', () => {
        handleOrientationChange();
      });
    } else {
      // API web
      screen.orientation.addEventListener('change', handleOrientationChange);
      cleanup = () => {
        screen.orientation.removeEventListener('change', handleOrientationChange);
      };
    }

    return cleanup;
  }, [isSupported, autoRotate, getCurrentOrientation, isNative]);

  // Verrouiller au montage si demandé
  useEffect(() => {
    if (lockOnMount && isSupported) {
      lock(defaultOrientation);
    }

    // Nettoyer au démontage
    return () => {
      if (isLocked) {
        unlock();
      }
    };
  }, [lockOnMount, defaultOrientation, isSupported, isLocked, lock, unlock]);

  // Mettre à jour l'orientation actuelle périodiquement
  useEffect(() => {
    if (!isSupported) return;

    const updateOrientation = async () => {
      const orientation = await getCurrentOrientation();
      setCurrentOrientation(orientation);
    };

    updateOrientation();
    const interval = setInterval(updateOrientation, 1000);

    return () => clearInterval(interval);
  }, [isSupported, getCurrentOrientation]);

  return {
    currentOrientation,
    isLocked,
    isSupported,
    isNative,
    lock,
    unlock,
    getCurrentOrientation,
    enableAutoRotation,
  };
}

// Hook utilitaire pour l'orientation portrait/landscape spécifique
export function usePortraitMode(options?: { lockOnMount?: boolean }) {
  const orientation = useScreenOrientation({
    defaultOrientation: 'portrait',
    lockOnMount: options?.lockOnMount ?? true,
    autoRotate: false,
  });

  return {
    ...orientation,
    isPortrait: orientation.currentOrientation === 'portrait',
    forcePortrait: () => orientation.lock('portrait'),
  };
}

export function useLandscapeMode(options?: { lockOnMount?: boolean }) {
  const orientation = useScreenOrientation({
    defaultOrientation: 'landscape',
    lockOnMount: options?.lockOnMount ?? false,
    autoRotate: true,
  });

  return {
    ...orientation,
    isLandscape: orientation.currentOrientation === 'landscape',
    forceLandscape: () => orientation.lock('landscape'),
  };
}