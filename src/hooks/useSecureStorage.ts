import { useState, useEffect, useCallback } from 'react';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

interface UseSecureStorageOptions {
  key: string;
  defaultValue?: any;
  encrypt?: boolean;
}

interface UseSecureStorageReturn<T> {
  value: T | null;
  setValue: (value: T) => Promise<void>;
  removeValue: () => Promise<void>;
  loading: boolean;
  error: string | null;
  isNative: boolean;
}

export function useSecureStorage<T = any>({
  key,
  defaultValue = null,
  encrypt = true
}: UseSecureStorageOptions): UseSecureStorageReturn<T> {
  const [value, setValueState] = useState<T | null>(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isNative = Capacitor.isNativePlatform();

  // Charger la valeur depuis le storage
  const loadValue = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { value: storedValue } = await Preferences.get({
        key,
      });

      if (storedValue !== null) {
        // Parser JSON si nécessaire
        try {
          const parsedValue = JSON.parse(storedValue);
          setValueState(parsedValue);
        } catch {
          setValueState(storedValue as T);
        }
      } else {
        setValueState(defaultValue);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error(`Error loading storage value for key "${key}":`, err);
      setValueState(defaultValue);
    } finally {
      setLoading(false);
    }
  }, [key, defaultValue]);

  // Sauvegarder une valeur
  const setValue = useCallback(async (newValue: T) => {
    try {
      setError(null);

      const valueToStore = typeof newValue === 'string'
        ? newValue
        : JSON.stringify(newValue);

      await Preferences.set({
        key,
        value: valueToStore,
      });

      setValueState(newValue);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error(`Error setting storage value for key "${key}":`, err);
    }
  }, [key]);

  // Supprimer la valeur
  const removeValue = useCallback(async () => {
    try {
      setError(null);

      await Preferences.remove({
        key,
      });

      setValueState(defaultValue);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error(`Error removing storage value for key "${key}":`, err);
    }
  }, [key, defaultValue]);

  // Charger la valeur au montage du composant
  useEffect(() => {
    loadValue();
  }, [loadValue]);

  return {
    value,
    setValue,
    removeValue,
    loading,
    error,
    isNative,
  };
}

// Hook utilitaire pour les préférences utilisateur
export function useUserPreferences() {
  const preferences = useSecureStorage<any>({
    key: 'user_preferences',
    defaultValue: {
      theme: 'light',
      language: 'fr',
      notifications: true,
      location: true,
    },
  });

  const updatePreference = useCallback(async (key: string, value: any) => {
    const newPreferences = { ...preferences.value, [key]: value };
    await preferences.setValue(newPreferences);
  }, [preferences]);

  return {
    ...preferences,
    updatePreference,
  };
}

// Hook pour le cache sécurisé
export function useSecureCache<T = any>(key: string, ttl: number = 3600000) { // 1 heure par défaut
  const [cachedData, setCachedData] = useState<T | null>(null);
  const [isValid, setIsValid] = useState(false);

  const getCacheKey = (originalKey: string) => `${originalKey}_cache`;
  const getTimestampKey = (originalKey: string) => `${originalKey}_timestamp`;

  useEffect(() => {
    const loadCache = async () => {
      try {
        const { value: data } = await Preferences.get({ key: getCacheKey(key) });
        const { value: timestamp } = await Preferences.get({ key: getTimestampKey(key) });

        if (data && timestamp) {
          const age = Date.now() - parseInt(timestamp);
          if (age < ttl) {
            setCachedData(JSON.parse(data));
            setIsValid(true);
          } else {
            // Cache expiré
            await Preferences.remove({ key: getCacheKey(key) });
            await Preferences.remove({ key: getTimestampKey(key) });
          }
        }
      } catch (error) {
        console.error('Error loading cache:', error);
      }
    };

    loadCache();
  }, [key, ttl]);

  const setCache = useCallback(async (data: T) => {
    try {
      await Preferences.set({
        key: getCacheKey(key),
        value: JSON.stringify(data),
      });
      await Preferences.set({
        key: getTimestampKey(key),
        value: Date.now().toString(),
      });
      setCachedData(data);
      setIsValid(true);
    } catch (error) {
      console.error('Error setting cache:', error);
    }
  }, [key]);

  const clearCache = useCallback(async () => {
    try {
      await Preferences.remove({ key: getCacheKey(key) });
      await Preferences.remove({ key: getTimestampKey(key) });
      setCachedData(null);
      setIsValid(false);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }, [key]);

  return {
    data: cachedData,
    isValid,
    setCache,
    clearCache,
  };
}