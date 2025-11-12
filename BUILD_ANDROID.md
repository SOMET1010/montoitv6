# Guide de Build Android APK - Mon Toit

## 📋 Prérequis

### 1. Java Development Kit (JDK)
```bash
# Installer Java 17 ou supérieur
sudo apt update
sudo apt install openjdk-17-jdk

# Configurer JAVA_HOME
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
echo 'export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64' >> ~/.bashrc
```

### 2. Android SDK (optionnel, pour développement avancé)
```bash
# Ajouter au ~/.bashrc
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

## 🚀 Commandes de Build

### Build standard (Debug APK)
```bash
npm run build:apk
```

### Développement avec Live Reload
```bash
# Lancer le serveur de dev + run Android avec live reload
npm run dev:live

# Build et test sur device/émulateur
npm run dev:android
```

### Build manuel étape par étape
```bash
# 1. Build l'application web
npm run build

# 2. Synchroniser avec Capacitor
npm run cap:sync

# 3. Build APK (debug)
cd android
./gradlew assembleDebug

# 4. Build APK (release - nécessite une clé de signature)
./gradlew assembleRelease

# 5. Installation sur device
npm run android:install-debug
```

### Scripts de développement
```bash
npm run android:logs      # Voir les logs de l'app
npm run android:clear     # Nettoyer le build Android
npm run cap:open:android  # Ouvrir Android Studio
npm run cap:run:android   # Run sur device/émulateur
npm run dev:live          # Développement avec live reload
```

## 🔧 Configuration Capacitor

### Plugins Capacitor configurés
- ✅ `@capacitor/app` - Gestion du cycle de vie de l'application
- ✅ `@capacitor/camera` - Accès à la caméra
- ✅ `@capacitor/filesystem` - Gestion des fichiers
- ✅ `@capacitor/geolocation` - Géolocalisation
- ✅ `@capacitor/network` - État réseau
- ✅ `@capacitor/preferences` - Storage sécurisé
- ✅ `@capacitor/screen-orientation` - Contrôle orientation
- ✅ `@capacitor/splash-screen` - Écran de démarrage
- ✅ `@capacitor/status-bar` - Barre de statut

### Permissions Android configurées
- ✅ `INTERNET` - Accès internet
- ✅ `ACCESS_FINE_LOCATION` - Géolocalisation précise
- ✅ `ACCESS_COARSE_LOCATION` - Géolocalisation approximative
- ✅ `CAMERA` - Accès caméra
- ✅ `READ_EXTERNAL_STORAGE` - Lecture stockage
- ✅ `WRITE_EXTERNAL_STORAGE` - Écriture stockage
- ✅ `MODIFY_AUDIO_SETTINGS` - Orientation contrôle

## 📱 Hooks React pour Capacitor

### `useBackButton` - Gestion du bouton retour
```typescript
import { useBackButton } from '../hooks/useBackButton';

function MyComponent() {
  const { canGoBack, goBack } = useBackButton();

  return <button onClick={goBack} disabled={!canGoBack()}>Retour</button>;
}
```

### `useSecureStorage` - Stockage sécurisé
```typescript
import { useSecureStorage } from '../hooks/useSecureStorage';

function UserProfile() {
  const { value, setValue, loading } = useSecureStorage<User>({
    key: 'user_profile',
    encrypt: true
  });

  // Utiliser value et setValue
}
```

### `useScreenOrientation` - Contrôle orientation
```typescript
import { usePortraitMode } from '../hooks/useScreenOrientation';

function MapComponent() {
  const { forcePortrait, isPortrait } = usePortraitMode();

  return (
    <div>
      <button onClick={forcePortrait}>Forcer Portrait</button>
    </div>
  );
}
```

### `useLiveReload` - Développement avec reload auto
```typescript
import { useLiveReload } from '../hooks/useLiveReload';

function App() {
  const { isActive, isConnected } = useLiveReload({
    enabled: process.env.NODE_ENV === 'development',
    autoRefresh: true
  });

  return <div>{isActive && '🔄 Live reload actif'}</div>;
}
```

## 🎨 Design Mobile

### Splash Screen & Icônes
- ✅ Splash screen personnalisé (vert Mon Toit #86B53E)
- ✅ Icônes adaptatives Android
- ✅ Support du safe area pour notches
- ✅ Status bar personnalisée

### Optimisations Mobile
- Wrapper `MobileWrapper` pour compatibilité
- Styles optimisés pour écrans tactiles
- Gestion du viewport et zoom automatique
- Support de l'orientation portrait/landscape

## 🔐 Sécurité & Performance

### Storage Sécurisé
- Utilisation de `@capacitor/preferences`
- Encryption des données sensibles
- Cache avec TTL pour les performances
- Gestion robuste des erreurs

### Permissions Dynamiques
- Demande de permissions au runtime
- Gestion des refus utilisateur
- Fallback pour fonctionnalités sans permissions

### Performance
- Lazy loading des hooks
- Nettoyage automatique des listeners
- Optimisation du scroll tactile
- Cache intelligent des données

## 🛠 Développement

### Live Reload Configuration
```typescript
// capacitor.config.ts
const config: CapacitorConfig = {
  server: {
    url: process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : undefined,
    cleartext: true
  },
  // ... autres configs
};
```

### Debugging Tools
```bash
# Logs en temps réel
npm run android:logs

# Remote debugging (Chrome/Edge)
chrome://inspect
edge://inspect

# Débogage iOS (Safari)
Développer > [Nom du device]
```

### Environment Variables
```bash
# .env
NODE_ENV=development
VITE_DEV_MODE=true
VITE_LIVE_RELOAD_PORT=5173
```

## 📦 Emplacement des Fichiers

### APK Builds
- **Debug**: `android/app/build/outputs/apk/debug/app-debug.apk`
- **Release**: `android/app/build/outputs/apk/release/app-release.apk`

### Sources Android
- **MainActivity**: `android/app/src/main/java/com/mon/toit/MainActivity.java`
- **Manifest**: `android/app/src/main/AndroidManifest.xml`
- **Resources**: `android/app/src/main/res/`

### Hooks React
- **Back Button**: `src/hooks/useBackButton.ts`
- **Storage**: `src/hooks/useSecureStorage.ts`
- **Orientation**: `src/hooks/useScreenOrientation.ts`
- **Live Reload**: `src/hooks/useLiveReload.ts`

## 🔧 Dépannage

### Problèmes courants

1. **Java non trouvé**
   ```bash
   java -version  # Vérifier l'installation
   echo $JAVA_HOME # Vérifier la variable
   ```

2. **Live reload ne fonctionne pas**
   ```bash
   # Vérifier que le serveur de dev tourne
   npm run dev

   # Redémarrer l'app
   npm run cap:run:android --livereload
   ```

3. **Permissions refusées**
   - Vérifier AndroidManifest.xml
   - Installer manuellement avec `adb install app-debug.apk`
   - Vérifier les permissions système

4. **Erreur de build**
   ```bash
   npm run cap:sync  # Resynchroniser
   cd android && ./gradlew clean
   npm run build:apk
   ```

### Outils de debug

```bash
# Vérifier la configuration
node scripts/build-check.js

# Logs détaillés
adb logcat | grep -E "(MonToit|Capacitor)"

# Installation forcer
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

## 🔄 Automatisation

### Script CI/CD (GitHub Actions)
```yaml
name: Build Android
on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    - name: Setup Java
      uses: actions/setup-java@v3
      with:
        distribution: 'temurin'
        java-version: '17'
    - name: Install dependencies
      run: npm ci
    - name: Build web
      run: npm run build
    - name: Sync Capacitor
      run: npm run cap:sync
    - name: Build APK
      run: |
        cd android
        ./gradlew assembleDebug
    - name: Upload APK
      uses: actions/upload-artifact@v3
      with:
        name: app-debug
        path: android/app/build/outputs/apk/debug/app-debug.apk
```

## 📱 Tests sur Device

### Installation directe
```bash
# Connecter device via USB
adb devices

# Installer APK
npm run android:install-debug

# Lancer l'app
adb shell am start -n com.mon.toit/.MainActivity
```

### Tests d'orientation
```typescript
// Dans vos composants
const { currentOrientation, lock } = useScreenOrientation();

// Forcer landscape pour les cartes
lock('landscape');

// Revenir en portrait pour les formulaires
lock('portrait');
```

### Tests de storage
```typescript
// Vérifier le storage sécurisé
const { value, setValue } = useSecureStorage({
  key: 'test_data',
  encrypt: true
});

await setValue({ secret: 'donnée sensible' });
```

## 🔐 Signature de l'APK (Release)

Pour la production, générer une clé de signature :

```bash
keytool -genkey -v -keystore mon-toit-release-key.keystore \
  -alias mon-toit -keyalg RSA -keysize 2048 -validity 10000
```

Configurer dans `android/app/build.gradle` pour signer les releases.

## 📦 Publication

### Google Play Store
- Créer un compte développeur
- Préparer les assets (icônes, captures)
- Remplir le questionnaire
- Uploader l'APK signé

### Distribution directe
- Partager le fichier APK
- Utiliser Firebase App Distribution
- HockeyApp / TestFlight

## 📞 Support

En cas de problème :
1. Vérifier la configuration avec `node scripts/build-check.js`
2. Consulter les logs de build Android
3. Vérifier la documentation Capacitor
4. Tester sur différents appareils/emulateurs
5. Utiliser les hooks de débogage intégrés

## 🔄 Mises à jour

### Mise à jour des plugins
```bash
# Mettre à jour Capacitor
npm install @capacitor/cli@latest @capacitor/core@latest

# Mettre à jour les plugins
npm install @capacitor/android@latest

# Resynchroniser
npm run cap:sync
```

### Mise à jour des hooks
Les hooks sont versionnés avec l'application. Vérifier `src/hooks/README.md` pour les dernières fonctionnalités.

---

Cette configuration complète offre une expérience mobile robuste avec :
- 🚀 Performance optimisée
- 🔐 Sécurité renforcée
- 📱 UX mobile native
- 🛠 Outils de développement avancés
- 🔄 Live reload pour développement rapide