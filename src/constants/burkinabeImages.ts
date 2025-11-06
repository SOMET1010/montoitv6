/**
 * 🇧🇫 Images pour MZAKA - Burkina Faso
 *
 * ⚠️ IMPORTANT: Remplacez ces URLs par vos propres photos du Burkina Faso
 *
 * Photos recommandées à prendre:
 * 1. Villa moderne à Ouaga 2000 ou Zone 1
 * 2. Immeuble résidentiel à Ouagadougou (style local)
 * 3. Quartier résidentiel de Bobo-Dioulasso
 *
 * Format: 1920x1080px minimum, JPG optimisé
 * Hébergement: Uploadez dans /public/images/ ou utilisez Supabase Storage
 */

// Images hero - REMPLACEZ PAR VOS VRAIES PHOTOS DU BURKINA FASO
export const BURKINA_HERO_IMAGES = [
  {
    title: 'Trouvez votre MZAKA idéale',
    subtitle: 'À Ouagadougou et dans tout le Burkina Faso',
    // TODO: Remplacer par photo de villa/logement moderne à Ouagadougou
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80',
    overlay: 'from-primary-900/85 via-primary-800/75 to-transparent'
  },
  {
    title: 'Logements modernes et authentiques',
    subtitle: 'Studios, appartements, villas à Ouaga et Bobo',
    // TODO: Remplacer par photo d'immeuble résidentiel burkinabé
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1920&q=80',
    overlay: 'from-secondary-900/85 via-secondary-800/75 to-transparent'
  },
  {
    title: 'Location simple et sécurisée',
    subtitle: 'Contactez directement les propriétaires',
    // TODO: Remplacer par photo de quartier résidentiel (Zone 1, 2Plateaux, etc.)
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80',
    overlay: 'from-accent-900/85 via-accent-800/75 to-transparent'
  },
];

// Quartiers de Ouagadougou avec images représentatives
export const OUAGA_NEIGHBORHOODS = {
  '2Plateaux': 'https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'Zone1': 'https://images.pexels.com/photos/1370704/pexels-photo-1370704.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'Ouaga2000': 'https://images.pexels.com/photos/1115804/pexels-photo-1115804.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'Gounghin': 'https://images.pexels.com/photos/1647053/pexels-photo-1647053.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'Cissin': 'https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'Dassasgho': 'https://images.pexels.com/photos/1370704/pexels-photo-1370704.jpeg?auto=compress&cs=tinysrgb&w=1200',
};

// Villes du Burkina Faso
export const BURKINA_CITIES = {
  'Ouagadougou': 'https://images.pexels.com/photos/1370704/pexels-photo-1370704.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'Bobo-Dioulasso': 'https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'Koudougou': 'https://images.pexels.com/photos/1647053/pexels-photo-1647053.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'Ouahigouya': 'https://images.pexels.com/photos/1115804/pexels-photo-1115804.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'Banfora': 'https://images.pexels.com/photos/2102587/pexels-photo-2102587.jpeg?auto=compress&cs=tinysrgb&w=1200',
};

// Types de propriétés avec images contextuelles
export const BURKINA_PROPERTY_TYPES = {
  villa: [
    'https://images.pexels.com/photos/1370704/pexels-photo-1370704.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1115804/pexels-photo-1115804.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  appartement: [
    'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/2724749/pexels-photo-2724749.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  studio: [
    'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1648776/pexels-photo-1648776.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  maison: [
    'https://images.pexels.com/photos/1647053/pexels-photo-1647053.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1370704/pexels-photo-1370704.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
};

// Intérieurs modernes adaptés
export const BURKINA_INTERIORS = {
  salon: [
    'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1648776/pexels-photo-1648776.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  cuisine: [
    'https://images.pexels.com/photos/1599791/pexels-photo-1599791.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/2724749/pexels-photo-2724749.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  chambre: [
    'https://images.pexels.com/photos/1743231/pexels-photo-1743231.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
};

/**
 * Récupère les images du hero slider
 */
export function getHeroImages() {
  return BURKINA_HERO_IMAGES;
}

/**
 * Récupère une image pour une ville donnée
 */
export function getCityImage(city: string): string {
  return BURKINA_CITIES[city as keyof typeof BURKINA_CITIES] || BURKINA_CITIES['Ouagadougou'];
}

/**
 * Récupère des images pour un type de propriété
 */
export function getPropertyTypeImages(propertyType: string, count: number = 3): string[] {
  const typeKey = propertyType.toLowerCase();

  if (typeKey.includes('villa')) {
    return BURKINA_PROPERTY_TYPES.villa.slice(0, count);
  } else if (typeKey.includes('appartement')) {
    return BURKINA_PROPERTY_TYPES.appartement.slice(0, count);
  } else if (typeKey.includes('studio')) {
    return BURKINA_PROPERTY_TYPES.studio.slice(0, count);
  } else if (typeKey.includes('maison')) {
    return BURKINA_PROPERTY_TYPES.maison.slice(0, count);
  }

  return BURKINA_PROPERTY_TYPES.appartement.slice(0, count);
}

/**
 * Récupère une image aléatoire de propriété burkinabé
 */
export function getRandomBurkinabePropertyImage(): string {
  const allImages = Object.values(BURKINA_PROPERTY_TYPES).flat();
  return allImages[Math.floor(Math.random() * allImages.length)];
}
