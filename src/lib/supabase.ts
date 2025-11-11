import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env['VITE_SUPABASE_URL'];
const supabaseAnonKey = import.meta.env['VITE_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes:');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl || 'NON DÉFINI');
  console.error('   VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '***DÉFINI***' : 'NON DÉFINI');
  console.error('   Veuillez vérifier votre fichier .env.local');
  throw new Error('Variables d\'environnement Supabase manquantes. Vérifiez le fichier .env.local');
}

// Valider le format de l'URL Supabase
// En développement, autoriser les URLs locales, sinon exiger le format Supabase
const isDevelopment = import.meta.env.DEV;
const isLocalUrl = supabaseUrl.startsWith('http://127.0.0.1:') || supabaseUrl.startsWith('http://localhost:');

if (!isDevelopment && (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co'))) {
  console.error('❌ URL Supabase invalide:', supabaseUrl);
  console.error('   L\'URL doit être au format: https://votre-projet.supabase.co');
  throw new Error(`URL Supabase invalide: ${supabaseUrl}`);
}

if (isDevelopment && !isLocalUrl && (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co'))) {
  console.error('❌ URL Supabase invalide:', supabaseUrl);
  console.error('   En développement, utilisez http://127.0.0.1:54321 pour Supabase local ou https://votre-projet.supabase.co');
  throw new Error(`URL Supabase invalide: ${supabaseUrl}`);
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
