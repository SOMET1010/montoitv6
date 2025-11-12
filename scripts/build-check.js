#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🔍 Vérification de la configuration APK...\n');

// Vérifier les fichiers essentiels
const requiredFiles = [
  'android/app/src/main/AndroidManifest.xml',
  'android/app/src/main/java/com/mon/toit/MainActivity.java',
  'android/build.gradle',
  'android/app/build.gradle',
  'android/gradle.properties',
  'capacitor.config.ts'
];

let allFilesExist = true;

console.log('📂 Vérification des fichiers essentiels:');
requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
});

// Vérifier les plugins dans capacitor.config.ts
console.log('\n🔌 Vérification des plugins Capacitor:');
try {
  const configContent = fs.readFileSync('capacitor.config.ts', 'utf8');
  const plugins = ['SplashScreen', 'StatusBar', 'Geolocation', 'Camera', 'Filesystem', 'Network', 'App'];

  plugins.forEach(plugin => {
    const hasPlugin = configContent.includes(plugin);
    console.log(`  ${hasPlugin ? '✅' : '❌'} ${plugin}`);
  });
} catch (error) {
  console.log('❌ Erreur lors de la lecture de capacitor.config.ts');
}

// Vérifier les permissions dans AndroidManifest.xml
console.log('\n🔐 Vérification des permissions Android:');
try {
  const manifestContent = fs.readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8');
  const requiredPermissions = [
    'INTERNET',
    'ACCESS_FINE_LOCATION',
    'ACCESS_COARSE_LOCATION',
    'CAMERA',
    'READ_EXTERNAL_STORAGE'
  ];

  requiredPermissions.forEach(permission => {
    const hasPermission = manifestContent.includes(permission);
    console.log(`  ${hasPermission ? '✅' : '❌'} ${permission}`);
  });
} catch (error) {
  console.log('❌ Erreur lors de la lecture d\'AndroidManifest.xml');
}

// Vérifier package.json pour les scripts
console.log('\n📜 Vérification des scripts de build:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredScripts = ['cap:sync', 'cap:open:android', 'cap:run:android', 'build:apk'];

  requiredScripts.forEach(script => {
    const hasScript = packageJson.scripts[script];
    console.log(`  ${hasScript ? '✅' : '❌'} ${script}`);
  });
} catch (error) {
  console.log('❌ Erreur lors de la lecture de package.json');
}

// Vérifier le dossier dist
console.log('\n📦 Vérification du build web:');
const distExists = fs.existsSync('dist');
console.log(`  ${distExists ? '✅' : '❌'} Dossier dist existe`);

if (distExists) {
  const indexHtmlExists = fs.existsSync('dist/index.html');
  console.log(`  ${indexHtmlExists ? '✅' : '❌'} index.html présent dans dist`);
}

console.log('\n📋 Résumé:');
console.log(`  ${allFilesExist ? '✅' : '❌'} Configuration de base: ${allFilesExist ? 'OK' : 'Manquante'}`);
console.log('  ℹ️  Pour générer l\'APK, installez Java JDK 17+:');
console.log('     sudo apt update && sudo apt install openjdk-17-jdk');
console.log('     export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64');
console.log('\n  🚀 Commandes de build:');
console.log('     npm run build:apk');

if (allFilesExist && distExists) {
  console.log('\n🎉 Configuration prêt pour la génération d\'APK !');
} else {
  console.log('\n⚠️  Configuration incomplète - vérifiez les erreurs ci-dessus');
}