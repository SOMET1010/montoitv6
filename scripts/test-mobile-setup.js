#!/usr/bin/env node

import http from 'http';
import { execSync } from 'child_process';

console.log('🧪 Test de configuration mobile Mon Toit\n');

// Test 1: Vérifier que le serveur de développement est accessible
console.log('📡 Test 1: Connectivité du serveur de développement');
try {
  const response = await fetch('http://172.18.0.142:5173/');
  if (response.ok) {
    console.log('✅ Serveur accessible sur http://172.18.0.142:5173/');
  } else {
    console.log('❌ Serveur non accessible');
  }
} catch (error) {
  console.log('❌ Erreur de connexion au serveur:', error.message);
}

// Test 2: Vérifier la configuration Capacitor
console.log('\n⚙️ Test 2: Configuration Capacitor');
try {
  execSync('npm run cap:sync', { stdio: 'pipe' });
  console.log('✅ Synchronisation Capacitor réussie');
} catch (error) {
  console.log('❌ Erreur lors de la synchronisation Capacitor');
}

// Test 3: Vérifier les plugins
console.log('\n🔌 Test 3: Plugins Capacitor');
try {
  const fs = await import('fs');
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const plugins = [
    '@capacitor/app',
    '@capacitor/camera',
    '@capacitor/filesystem',
    '@capacitor/geolocation',
    '@capacitor/network',
    '@capacitor/preferences',
    '@capacitor/screen-orientation',
    '@capacitor/splash-screen',
    '@capacitor/status-bar'
  ];

  let allPluginsInstalled = true;
  plugins.forEach(plugin => {
    const isInstalled = packageJson.dependencies[plugin];
    console.log(`  ${isInstalled ? '✅' : '❌'} ${plugin}`);
    if (!isInstalled) allPluginsInstalled = false;
  });

  if (allPluginsInstalled) {
    console.log('✅ Tous les plugins requis sont installés');
  } else {
    console.log('❌ Certains plugins manquent');
  }
} catch (error) {
  console.log('❌ Erreur lors de la vérification des plugins');
}

// Test 4: Vérifier Supabase
console.log('\n🗄️ Test 4: Connexion Supabase');
try {
  const response = await fetch('http://127.0.0.1:54321/rest/v1/', {
    headers: {
      'apikey': 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH',
      'Authorization': 'Bearer sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'
    }
  });
  if (response.ok) {
    console.log('✅ Supabase accessible');
  } else {
    console.log('❌ Supabase non accessible');
  }
} catch (error) {
  console.log('❌ Erreur de connexion Supabase:', error.message);
}

// Instructions pour le test mobile
console.log('\n📱 Instructions pour tester sur mobile:');
console.log('1. Connectez votre appareil Android via USB');
console.log('2. Activez le débogage USB');
console.log('3. Vérifiez que l\'appareil est reconnu:');
console.log('   adb devices');
console.log('4. Lancez l\'application avec live reload:');
console.log('   npm run cap:run:android --livereload');
console.log('5. Modifiez un fichier dans src/ pour tester le reload automatique');

console.log('\n🚀 Configuration prête !');