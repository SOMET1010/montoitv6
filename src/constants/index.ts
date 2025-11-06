/**
 * MZAKA Platform - Application Constants
 * Burkina Faso Real Estate Marketplace
 */

// API & Environment
export const API_URL = import.meta.env.VITE_SUPABASE_URL;
export const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Routes
export const ROUTES = {
  HOME: '/',
  AUTH: {
    LOGIN: '/connexion',
    SIGNUP: '/inscription',
  },
  PROPERTIES: {
    SEARCH: '/recherche',
    DETAIL: '/propriete/:id',
    ADD: '/publier',
  },
  DASHBOARD: {
    OWNER: '/tableau-de-bord/proprietaire',
    TENANT: '/tableau-de-bord/locataire',
  },
  PROFILE: '/profil',
  MESSAGES: '/messages',
  VISITS: {
    SCHEDULE: '/visiter/:id',
    MY_VISITS: '/mes-visites',
  },
  FAVORITES: '/favoris',
} as const;

// Property Types
export const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Appartement' },
  { value: 'house', label: 'Maison' },
  { value: 'studio', label: 'Studio' },
  { value: 'land', label: 'Terrain' },
  { value: 'commercial', label: 'Local Commercial' },
  { value: 'other', label: 'Autre' },
] as const;

// Cities (Burkina Faso)
export const CITIES = [
  'Ouagadougou',
  'Bobo-Dioulasso',
  'Koudougou',
  'Ouahigouya',
  'Banfora',
  'Dédougou',
  'Kaya',
  'Tenkodogo',
  'Fada N\'Gourma',
  'Houndé',
  'Réo',
  'Gaoua',
] as const;

// Ouagadougou Neighborhoods
export const OUAGADOUGOU_NEIGHBORHOODS = [
  'Zone 1',
  'Zone 2',
  'Zone 3',
  'Zone 4',
  'Gounghin',
  'Cissin',
  'Tanghin',
  'Somgandé',
  'Dapoya',
  'Paspanga',
  'Ouaga 2000',
  'Kossodo',
] as const;

// User Types
export const USER_TYPES = [
  { value: 'tenant', label: 'Locataire' },
  { value: 'owner', label: 'Propriétaire' },
  { value: 'both', label: 'Les deux' },
] as const;

// Payment Methods (Burkina Faso)
export const PAYMENT_METHODS = [
  { value: 'orange_money', label: 'Orange Money', prefixes: ['07', '77'] },
  { value: 'moov_money', label: 'Moov Africa', prefixes: ['01', '71'] },
  { value: 'coris_money', label: 'Coris Money', prefixes: [] },
  { value: 'cash', label: 'Espèces', prefixes: [] },
] as const;

// File Upload Limits
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_IMAGES: 8,
  ACCEPTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 12,
  PAGE_SIZE_OPTIONS: [12, 24, 48],
} as const;

// Notification Duration (ms)
export const NOTIFICATION_DURATION = {
  SHORT: 3000,
  MEDIUM: 5000,
  LONG: 8000,
} as const;

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'DD/MM/YYYY',
  DISPLAY_WITH_TIME: 'DD/MM/YYYY HH:mm',
  ISO: 'YYYY-MM-DD',
} as const;

// Regex Patterns
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_BF: /^[0-9]{8}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'Ce champ est obligatoire',
  INVALID_EMAIL: 'Adresse email invalide',
  INVALID_PHONE: 'Numéro de téléphone invalide',
  PASSWORD_TOO_SHORT: 'Le mot de passe doit contenir au moins 8 caractères',
  PASSWORD_MISMATCH: 'Les mots de passe ne correspondent pas',
  FILE_TOO_LARGE: 'Le fichier est trop volumineux (max 5MB)',
  INVALID_FILE_TYPE: 'Type de fichier non autorisé',
  NETWORK_ERROR: 'Erreur de connexion. Veuillez réessayer.',
  UNKNOWN_ERROR: 'Une erreur est survenue. Veuillez réessayer.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Connexion réussie',
  SIGNUP_SUCCESS: 'Inscription réussie',
  PROFILE_UPDATED: 'Profil mis à jour',
  PROPERTY_CREATED: 'Propriété publiée avec succès',
  PROPERTY_UPDATED: 'Propriété mise à jour',
  MESSAGE_SENT: 'Message envoyé',
  VISIT_REQUESTED: 'Demande de visite envoyée',
  FAVORITE_ADDED: 'Ajouté aux favoris',
  FAVORITE_REMOVED: 'Retiré des favoris',
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'mzaka-auth-token',
  USER_PREFERENCES: 'mzaka-preferences',
  SEARCH_HISTORY: 'mzaka-search-history',
} as const;

// API Rate Limits
export const RATE_LIMITS = {
  SEARCH_DEBOUNCE: 300, // ms
  API_RETRY_ATTEMPTS: 3,
  API_RETRY_DELAY: 1000, // ms
} as const;
