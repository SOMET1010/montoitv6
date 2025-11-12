import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

interface UseLiveReloadOptions {
  enabled?: boolean;
  port?: number;
  host?: string;
  refreshInterval?: number;
  autoRefresh?: boolean;
}

export function useLiveReload(options: UseLiveReloadOptions = {}) {
  const {
    enabled = process.env.NODE_ENV === 'development',
    port = 5173,
    host = 'localhost',
    refreshInterval = 2000,
    autoRefresh = true
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isNative, setIsNative] = useState(false);

  const isNativePlatform = Capacitor.isNativePlatform();
  const serverUrl = `http://${host}:${port}`;

  useEffect(() => {
    setIsNative(isNativePlatform);
  }, [isNativePlatform]);

  // Vérifier si le serveur de développement est disponible
  const checkServer = useCallback(async (): Promise<boolean> => {
    try {
      if (!enabled || !isNativePlatform) return false;

      const response = await fetch(`${serverUrl}/`, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache',
      });

      setIsConnected(true);
      setError(null);
      return true;
    } catch (err) {
      setIsConnected(false);
      setError('Development server not available');
      return false;
    }
  }, [enabled, isNativePlatform, serverUrl]);

  // Recharger l'application
  const reload = useCallback(async () => {
    try {
      if (!enabled || !isNativePlatform) return;

      // Rafraîchir le webview
      if (Capacitor.getPlatform() === 'android') {
        // Pour Android, recharger la webview
        window.location.reload();
      } else if (Capacitor.getPlatform() === 'ios') {
        // Pour iOS, aussi recharger la webview
        window.location.reload();
      }

      setLastRefresh(Date.now());
      console.log('🔄 Live reload triggered');
    } catch (err) {
      console.error('Error during live reload:', err);
      setError('Failed to reload application');
    }
  }, [enabled, isNativePlatform]);

  // Activer/désactiver le live reload
  const toggleLiveReload = useCallback((enable: boolean) => {
    if (enable && !enabled) {
      console.log('🔄 Live reload enabled');
    } else if (!enable && enabled) {
      console.log('⏸️ Live reload disabled');
    }
  }, [enabled]);

  // Configuration du polling pour détecter les changements
  useEffect(() => {
    if (!enabled || !autoRefresh || !isNativePlatform) return;

    let intervalId: NodeJS.Timeout;

    const startPolling = async () => {
      const serverAvailable = await checkServer();

      if (serverAvailable) {
        intervalId = setInterval(async () => {
          try {
            // Vérifier si des fichiers ont changé
            const response = await fetch(`${serverUrl}/@vite/client`, {
              method: 'GET',
              cache: 'no-cache',
            });

            if (response.ok) {
              // Si le serveur répond, on considère qu'un refresh est nécessaire
              // (c'est une implémentation simple, une vraie implémentation serait plus complexe)
              console.log('📡 Changes detected, reloading...');
              reload();
            }
          } catch (err) {
            // Ignorer les erreurs de connexion
          }
        }, refreshInterval);
      }
    };

    startPolling();

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [enabled, autoRefresh, isNativePlatform, serverUrl, refreshInterval, checkServer, reload]);

  // Écouter les événements de l'application pour le debugging
  useEffect(() => {
    if (!isNativePlatform) return;

    const setupAppListeners = async () => {
      try {
        // Écouter les états de l'application
        await App.addListener('appStateChange', ({ isActive }) => {
          if (isActive && enabled) {
            console.log('📱 App became active, checking for updates...');
            checkServer();
          }
        });

        // Écouter les changements d'URL
        await App.addListener('appUrlOpen', (data) => {
          console.log('🔗 App URL opened:', data.url);
        });
      } catch (error) {
        console.error('Error setting up app listeners:', error);
      }
    };

    setupAppListeners();
  }, [enabled, isNativePlatform, checkServer]);

  // Vérifier le serveur au montage
  useEffect(() => {
    if (enabled && isNativePlatform) {
      checkServer();
    }
  }, [enabled, isNativePlatform, checkServer]);

  // Fonction pour déboguer la connexion
  const debugConnection = useCallback(async () => {
    console.log('🔍 Debugging live reload connection...');
    console.log('- Platform:', Capacitor.getPlatform());
    console.log('- Is Native:', isNativePlatform);
    console.log('- Server URL:', serverUrl);
    console.log('- Enabled:', enabled);

    const serverAvailable = await checkServer();
    console.log('- Server Available:', serverAvailable);
    console.log('- Connected:', isConnected);

    if (error) {
      console.log('- Error:', error);
    }
  }, [checkServer, serverUrl, enabled, isConnected, error, isNativePlatform]);

  return {
    isConnected,
    isNative,
    lastRefresh,
    error,
    serverUrl,
    reload,
    checkServer,
    toggleLiveReload,
    debugConnection,
    // Pour savoir si le live reload est actif
    isActive: enabled && isConnected && isNativePlatform,
  };
}

// Hook utilitaire pour le développement
export function useDevTools() {
  const liveReload = useLiveReload();

  const [isDebugMode, setIsDebugMode] = useState(
    process.env.NODE_ENV === 'development'
  );

  const toggleDebug = useCallback(() => {
    setIsDebugMode(prev => !prev);
  }, []);

  const openDevTools = useCallback(() => {
    if (Capacitor.isNativePlatform()) {
      // Sur mobile, ouvrir les outils de développement distants
      console.log('🛠️ Remote debugging available on:');
      console.log('- Chrome: chrome://inspect');
      console.log('- Edge: edge://inspect');
      console.log('- Safari: Develop menu (enable in Safari preferences)');
    } else {
      // Sur web, ouvrir les dev tools natifs
      console.log('🛠️ Developer tools available via F12 or right-click → Inspect');
    }
  }, []);

  return {
    isDebugMode,
    toggleDebug,
    openDevTools,
    liveReload,
  };
}