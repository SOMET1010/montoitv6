import { useEffect, useRef, useCallback } from 'react';
import { App } from '@capacitor/app';
import { useRouter, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

interface UseBackButtonOptions {
  customHandler?: () => boolean;
  preventDefault?: boolean;
  minHistoryLength?: number;
}

export function useBackButton(options: UseBackButtonOptions = {}) {
  const { customHandler, preventDefault = false, minHistoryLength = 1 } = options;
  const router = useRouter();
  const location = useLocation();
  const handlerRef = useRef(customHandler);

  // Mettre à jour le ref quand customHandler change
  useEffect(() => {
    handlerRef.current = customHandler;
  }, [customHandler]);

  const handleBackButton = useCallback(async () => {
    try {
      // Si un handler personnalisé est défini et retourne true, on arrête là
      if (handlerRef.current?.()) {
        return;
      }

      // Vérifier si on peut revenir en arrière
      const canGoBack = window.history.length > minHistoryLength;

      if (canGoBack) {
        // Navigation web native
        window.history.back();
      } else {
        // Cas natif : minimiser ou quitter l'application
        if (Capacitor.isNativePlatform()) {
          // Sur mobile, minimiser au lieu de quitter brusquement
          await App.minimizeApp?.() || App.exitApp();
        } else {
          // Sur web, on ne fait rien
          console.log('Back button pressed but no history available');
        }
      }
    } catch (error) {
      console.error('Error handling back button:', error);
    }
  }, [minHistoryLength]);

  useEffect(() => {
    // Uniquement sur les plateformes natives
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const backButtonHandler = App.addListener('backButton', handleBackButton);

    return () => {
      backButtonHandler.remove();
    };
  }, [handleBackButton]);

  // Fonction utilitaire pour vérifier si le retour est possible
  const canGoBack = useCallback(() => {
    return window.history.length > minHistoryLength;
  }, [minHistoryLength]);

  return {
    canGoBack,
    currentPath: location.pathname,
    // Pour forcer le retour arrière programmatiquement
    goBack: () => {
      if (canGoBack()) {
        window.history.back();
      }
    }
  };
}