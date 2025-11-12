# Hooks React pour Capacitor - Mon Toit

Ce dossier contient les hooks React optimisés pour l'application mobile Mon Toit avec Capacitor.

## 📱 Hooks disponibles

### `useBackButton` - Gestion du bouton retour

Gère le comportement du bouton retour sur les appareils mobiles.

```typescript
import { useBackButton } from '../hooks/useBackButton';

function MyComponent() {
  const { canGoBack, goBack } = useBackButton();

  return (
    <div>
      <button onClick={goBack} disabled={!canGoBack()}>
        Retour
      </button>
    </div>
  );
}

// Avec handler personnalisé
const { canGoBack } = useBackButton({
  customHandler: () => {
    // Logique personnalisée
    if (shouldShowDialog) {
      showDialog();
      return true; // Empêche le retour par défaut
    }
    return false; // Continue le retour normal
  }
});
```

### `useSecureStorage` - Stockage sécurisé

Stockage persistant et sécurisé des données utilisateur.

```typescript
import { useSecureStorage } from '../hooks/useSecureStorage';

function UserProfile() {
  const { value, setValue, loading, error } = useSecureStorage<UserProfile>({
    key: 'user_profile',
    defaultValue: null,
    encrypt: true
  });

  const updateProfile = async (newProfile: UserProfile) => {
    await setValue(newProfile);
  };

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;

  return <div>{JSON.stringify(value)}</div>;
}
```

#### `useUserPreferences` - Préférences utilisateur

Gestion des préférences de l'application.

```typescript
import { useUserPreferences } from '../hooks/useSecureStorage';

function Settings() {
  const { value, updatePreference } = useUserPreferences();

  const toggleTheme = () => {
    updatePreference('theme', value.theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div>
      <button onClick={toggleTheme}>
        Thème: {value.theme}
      </button>
    </div>
  );
}
```

#### `useSecureCache` - Cache sécurisé

Cache avec TTL (Time To Live) pour les données temporaires.

```typescript
import { useSecureCache } from '../hooks/useSecureStorage';

function PropertyList() {
  const { data, isValid, setCache, clearCache } = useSecureCache('properties', 3600000); // 1h

  const loadProperties = async () => {
    if (isValid) {
      return data; // Utiliser le cache
    }

    const properties = await fetchProperties();
    await setCache(properties);
    return properties;
  };

  return <div>{/* ... */}</div>;
}
```

### `useScreenOrientation` - Gestion de l'orientation

Contrôle de l'orientation de l'écran.

```typescript
import { useScreenOrientation, usePortraitMode } from '../hooks/useScreenOrientation';

function MapComponent() {
  const {
    currentOrientation,
    isLocked,
    lock,
    unlock,
    forcePortrait
  } = usePortraitMode();

  const enableLandscape = async () => {
    await lock('landscape');
  };

  return (
    <div>
      <p>Orientation: {currentOrientation}</p>
      <p>Verrouillé: {isLocked ? 'Oui' : 'Non'}</p>
      <button onClick={forcePortrait}>Forcer Portrait</button>
    </div>
  );
}
```

### `useLiveReload` - Développement avec live reload

Reload automatique pendant le développement.

```typescript
import { useLiveReload } from '../hooks/useLiveReload';

function App() {
  const { isActive, isConnected, reload, debugConnection } = useLiveReload({
    enabled: process.env.NODE_ENV === 'development',
    autoRefresh: true,
    refreshInterval: 2000
  });

  useEffect(() => {
    if (!isConnected) {
      console.log('Serveur de développement non connecté');
    }
  }, [isConnected]);

  return (
    <div>
      {isActive && <div>🔄 Live reload actif</div>}
      <button onClick={debugConnection}>Debugger</button>
    </div>
  );
}
```

### `useDevTools` - Outils de développement

Outils de débogage pour le développement mobile.

```typescript
import { useDevTools } from '../hooks/useLiveReload';

function DevPanel() {
  const { isDebugMode, toggleDebug, openDevTools, liveReload } = useDevTools();

  if (!isDebugMode) return null;

  return (
    <div className="dev-panel">
      <button onClick={toggleDebug}>Cacher debug</button>
      <button onClick={openDevTools}>Ouvrir DevTools</button>
      <div>Live reload: {liveReload.isActive ? 'ON' : 'OFF'}</div>
    </div>
  );
}
```

## 🔧 Configuration

### Variables d'environnement

```bash
# .env
NODE_ENV=development
VITE_DEV_MODE=true
VITE_LIVE_RELOAD_PORT=5173
```

### Scripts de développement

```bash
# Développement avec live reload
npm run dev:live

# Build et test sur Android
npm run dev:android

# Logs de l'application
npm run android:logs
```

## 📋 Bonnes pratiques

### 1. Gestion des erreurs

Tous les hooks incluent une gestion d'erreurs robuste :

```typescript
const { value, error, loading } = useSecureStorage({ key: 'data' });

if (error) {
  // Gérer l'erreur de manière appropriée
  console.error('Storage error:', error);
  // Afficher un message à l'utilisateur
}
```

### 2. Performance

Utilisez les hooks avec parcimonie et nettoyez les effets :

```typescript
function MyComponent() {
  const { setValue } = useSecureStorage({ key: 'settings' });

  useEffect(() => {
    // Le cleanup est géré automatiquement par les hooks
  }, []);

  return <div>...</div>;
}
```

### 3. Sécurité

- Utilisez toujours `encrypt: true` pour les données sensibles
- Validez les données avant de les stocker
- Utilisez des TTL appropriés pour le cache

```typescript
const secureData = useSecureStorage({
  key: 'sensitive_data',
  encrypt: true, // Important pour les données sensibles
});
```

### 4. Compatibilité

Les hooks gèrent automatiquement la détection de plateforme :

```typescript
const { isNative } = useSecureStorage({ key: 'data' });

if (isNative) {
  // Fonctionnalités natives disponibles
} else {
  // Fallback web
}
```

## 🚀 Exemples d'utilisation

### Profil utilisateur avec storage

```typescript
function UserProfile() {
  const { value: profile, setValue, loading } = useSecureStorage<User>({
    key: 'user_profile',
    defaultValue: { name: '', email: '' }
  });

  const updateProfile = async (updates: Partial<User>) => {
    const newProfile = { ...profile, ...updates };
    await setValue(newProfile);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <input
        value={profile.name}
        onChange={(e) => updateProfile({ name: e.target.value })}
        placeholder="Nom"
      />
      <input
        value={profile.email}
        onChange={(e) => updateProfile({ email: e.target.value })}
        placeholder="Email"
      />
    </div>
  );
}
```

### Carte avec orientation controlée

```typescript
function PropertyMap() {
  const {
    currentOrientation,
    lock,
    unlock,
    isLandscape
  } = useScreenOrientation({
    defaultOrientation: 'portrait',
    autoRotate: true
  });

  const handleFullscreen = async () => {
    if (isLandscape) {
      await lock('portrait');
    } else {
      await unlock(); // Permettre la rotation
    }
  };

  return (
    <div>
      <PropertyMapComponent />
      <button onClick={handleFullscreen}>
        {isLandscape ? 'Mode Portrait' : 'Mode Paysage'}
      </button>
      <p>Orientation actuelle: {currentOrientation}</p>
    </div>
  );
}
```

Ces hooks sont optimisés pour l'application Mon Toit et fournissent une expérience mobile robuste et performante.