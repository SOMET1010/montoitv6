-- ==============================================================================
-- 🌍 SEED DATA - PROPRIÉTÉS IMMOBILIÈRES MONTOIT
-- ==============================================================================
-- Données d'exemples réalistes pour le marché ivoirien
-- Créé le: 2025-11-10
-- ==============================================================================

-- Désactiver les triggers RLS temporairement pour l'insertion
SET session_replication_role = 'replica';

-- Insertion de propriétaires de test (si nécessaire)
INSERT INTO auth.users (
  id,
  email,
  email_confirmed_at,
  phone,
  created_at,
  updated_at,
  raw_user_meta_data
) VALUES
  (
    gen_random_uuid(),
    'proprietaire1@exemple.ci',
    now(),
    '+2250700000001',
    now(),
    now(),
    '{"full_name": "Kouadio Konan", "user_type": "proprietaire"}'
  ),
  (
    gen_random_uuid(),
    'proprietaire2@exemple.ci',
    now(),
    '+2250700000002',
    now(),
    now(),
    '{"full_name": "Awa Bamba", "user_type": "proprietaire"}'
  ),
  (
    gen_random_uuid(),
    'agence1@exemple.ci',
    now(),
    '+2250700000003',
    now(),
    now(),
    '{"full_name": "Agence Immobilière Cocody", "user_type": "agence"}'
  )
ON CONFLICT (id) DO NOTHING;

-- Insertion des profils correspondants
INSERT INTO profiles (
  id,
  full_name,
  user_type,
  is_verified,
  profile_setup_completed,
  created_at,
  updated_at
)
SELECT
  u.id,
  u.raw_user_meta_data->>'full_name',
  (u.raw_user_meta_data->>'user_type')::user_type,
  true,
  true,
  u.created_at,
  u.updated_at
FROM auth.users u
WHERE u.email LIKE '%@exemple.ci'
ON CONFLICT (id) DO NOTHING;

-- Insertion des propriétés
INSERT INTO properties (
  id,
  owner_id,
  title,
  description,
  address,
  city,
  neighborhood,
  latitude,
  longitude,
  property_type,
  status,
  bedrooms,
  bathrooms,
  surface_area,
  has_parking,
  has_garden,
  is_furnished,
  has_ac,
  monthly_rent,
  deposit_amount,
  charges_amount,
  images,
  main_image,
  created_at,
  updated_at
) VALUES

-- ==============================================================================
-- APPARTEMENTS À COCODY (Zone résidentielle haut de gamme)
-- ==============================================================================

(
  gen_random_uuid(),
  (SELECT id FROM profiles WHERE full_name = 'Kouadio Konan' LIMIT 1),
  'Bel Appartement F3 - Cocody Riviera',
  'Magnifique appartement F3 de luxe dans la résidence primée "Les Jardins de Riviera". Très lumineux avec vue dégagée sur la lagune. Idéalement situé à proximité des écoles internationales, du Centre Commercial Cap Sud et des bureaux du Plateau. Séjour spacieux de 45m² avec balcon, cuisine moderne entièrement équipée, 3 chambres climatisées dont une suite parentale avec dressing, 2 salles de bain modernes. Parking privé sécurisé. Disponible immédiatement.',
  'Rue des Jardins, Riviera Palmeraie',
  'Abidjan',
  'Riviera Palmeraie',
  5.3614,
  -3.9973,
  'appartement'::property_type,
  'disponible'::property_status,
  3,
  2,
  120.0,
  true,
  false,
  true,
  true,
  350000.00,
  700000.00,
  25000.00,
  ARRAY[
    'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/276724/pexels-photo-276724.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1642128/pexels-photo-1642128.jpeg?auto=compress&cs=tinysrgb&w=800'
  ],
  'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800',
  now(),
  now()
),

(
  gen_random_uuid(),
  (SELECT id FROM profiles WHERE full_name = 'Kouadio Konan' LIMIT 1),
  'Studio Meublé - Cocody Centre',
  'Studio moderne et fonctionnel en plein cœur de Cocody Centre. Parfait pour jeune professionnel ou étudiant. Proche de toutes commodités: Super U, pharmacies, banques, restaurants. Transport facile vers le Plateau et autres quartiers. Studio de 28m² avec kitchenette, salle de bain avec WC, espace bureau climatisé. Immeuble avec gardien et interphone. Charges comprises: eau, électricité (plafonnée), internet.',
  'Avenue Jean-Paul II, près du Lycée Classique',
  'Abidjan',
  'Cocody Centre',
  5.3499,
  -4.0083,
  'appartement'::property_type,
  'disponible'::property_status,
  1,
  1,
  28.0,
  false,
  false,
  true,
  true,
  120000.00,
  240000.00,
  15000.00,
  ARRAY[
    'https://images.pexels.com/photos/2581922/pexels-photo-2581922.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/358529/pexels-photo-358529.jpeg?auto=compress&cs=tinysrgb&w=800'
  ],
  'https://images.pexels.com/photos/2581922/pexels-photo-2581922.jpeg?auto=compress&cs=tinysrgb&w=800',
  now(),
  now()
),

-- ==============================================================================
-- VILLAS À MARCORY (Zone résidentielle familiale)
-- ==============================================================================

(
  gen_random_uuid(),
  (SELECT id FROM profiles WHERE full_name = 'Awa Bamba' LIMIT 1),
  'Villa 4 Chambres avec Piscine - Marcory Zone 4',
  'Superbe villa de standing de 320m² sur terrain de 500m² dans un quartier calme et résidentiel de Marcory. Architecture moderne avec grand salon double séjour ouvert sur terrasse et jardin avec piscine privée. 4 spacieuses chambres dont une suite parentale avec terrasse privée, 3 salles de bain, bureau, cuisine équipée avec îlot central. Dépendances: chambre de domestique avec SDB, garage pour 2 voitures, local de stockage. Quartier sécurisé avec voies privées. Proximity: Ecole Jacques Prévert, Centre Commercial Le Palmarium, Marché de Marcory.',
  'Voie Privée A, Quartier Résidentiel',
  'Abidjan',
  'Marcory Zone 4',
  5.2907,
  -4.0086,
  'villa'::property_type,
  'disponible'::property_status,
  4,
  3,
  320.0,
  true,
  true,
  true,
  true,
  800000.00,
  1600000.00,
  50000.00,
  ARRAY[
    'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/2102585/pexels-photo-2102585.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1579705/pexels-photo-1579705.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/2119713/pexels-photo-2119713.jpeg?auto=compress&cs=tinysrgb&w=800'
  ],
  'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800',
  now(),
  now()
),

-- ==============================================================================
-- APPARTEMENTS À PLATEAU (Centre d'affaires)
-- ==============================================================================

(
  gen_random_uuid(),
  (SELECT id FROM profiles WHERE full_name = 'Agence Immobilière Cocody' LIMIT 1),
  'Appartement F2 Bureau - Plateau',
  'Appartement F2 transforme en espace de bureau moderne dans le quartier des affaires du Plateau. Ideal pour cabinet d''avocats, startup ou profession liberale. Localisation exceptionnelle a proximite des ministeres, banques et ambassades. Surface de 65m² avec grand open space, 2 bureaux separes, kitchenette, 2 WC. Climatisation centrale, connexion internet fibre optique, securite 24/24. Immeuble de prestige avec hall d''accueil, service de conciergerie et 4 places de parking.',
  'Avenue Noguès, Immeuble Le Capricorne',
  'Abidjan',
  'Plateau',
  5.3201,
  -4.0147,
  'appartement'::property_type,
  'disponible'::property_status,
  2,
  2,
  65.0,
  true,
  false,
  false,
  true,
  450000.00,
  900000.00,
  40000.00,
  ARRAY[
    'https://images.pexels.com/photos/3952272/pexels-photo-3952272.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/271795/pexels-photo-271795.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/697244/pexels-photo-697244.jpeg?auto=compress&cs=tinysrgb&w=800'
  ],
  'https://images.pexels.com/photos/3952272/pexels-photo-3952272.jpeg?auto=compress&cs=tinysrgb&w=800',
  now(),
  now()
),

-- ==============================================================================
-- TERRAINS À YOPOUGON (Zone en développement)
-- ==============================================================================

(
  gen_random_uuid(),
  (SELECT id FROM profiles WHERE full_name = 'Awa Bamba' LIMIT 1),
  'Terrain à Bâtir 600m² - Yopougon Selmer',
  'Excellent terrain à bâtir de 600m² dans le quartier résidentiel de Yopougon Selmer. Terrain viabilisé avec accès à l''eau courante et à l''électricité. Façade de 20m sur profondeur de 30m. Permis de construire valide pour villa R+1 maximum. Quartier calme et familial avec toutes les commodités à proximité: écoles, marchés, pharmacies, centres commerciaux. Facilité d''accès par le pont de la Riviera et la nouvelle rocade. Idéal pour projet de construction familiale ou investissement locatif.',
  'Lot 152, Quartier Selmer',
  'Abidjan',
  'Yopougon',
  5.2700,
  -4.0727,
  'terrain'::property_type,
  'disponible'::property_status,
  0,
  0,
  600.0,
  true,
  false,
  false,
  false,
  0.00,
  0.00,
  0.00,
  ARRAY[
    'https://images.pexels.com/photos/186077/pexels-photo-186077.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1115806/pexels-photo-1115806.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1060447/pexels-photo-1060447.jpeg?auto=compress&cs=tinysrgb&w=800'
  ],
  'https://images.pexels.com/photos/186077/pexels-photo-186077.jpeg?auto=compress&cs=tinysrgb&w=800',
  now(),
  now()
),

-- ==============================================================================
-- CHAMBRES À TREICHVILLE (Zone abordable)
-- ==============================================================================

(
  gen_random_uuid(),
  (SELECT id FROM profiles WHERE full_name = 'Kouadio Konan' LIMIT 1),
  'Chambre Meublée - Treichville',
  'Chambre individuelle meublée dans grand appartement partagé à Treichville. Idéal pour étudiant ou jeune professionnel avec budget modéré. Chambre de 14m² meublée (lit 140x190, armoire, bureau, chaise). Accès cuisine entièrement équipée, salon, 2 salles de bain partagées. Wifi inclus, machine à laver disponible. Immeuble sécurisé avec gardien. Très bien desservi par les transports en commun: Gare de Treichville à 5min, lignes de gbaka vers toute la ville. Proximité: Marché de Treichville, Banques, Super U.',
  'Boulevard de Marseille, près du lycée',
  'Abidjan',
  'Treichville',
  5.2935,
  -4.0383,
  'chambre'::property_type,
  'disponible'::property_status,
  1,
  1,
  14.0,
  false,
  false,
  true,
  true,
  45000.00,
  90000.00,
  8000.00,
  ARRAY[
    'https://images.pexels.com/photos/358613/pexels-photo-358613.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1648776/pexels-photo-1648776.jpeg?auto=compress&cs=tinysrgb&w=800'
  ],
  'https://images.pexels.com/photos/358613/pexels-photo-358613.jpeg?auto=compress&cs=tinysrgb&w=800',
  now(),
  now()
),

-- ==============================================================================
-- MAISONS À ABOBO (Zone familiale économique)
-- ==============================================================================

(
  gen_random_uuid(),
  (SELECT id FROM profiles WHERE full_name = 'Agence Immobilière Cocody' LIMIT 1),
  'Maison 3 Chambres - Abobo Soufflet',
  'Maison familiale de 180m² sur 2 niveaux dans quartier résidentiel calme d''Abobo Soufflet. Parfait pour famille avec enfants. RDC: grand séjour avec cuisine américaine, chambre, SDB, WC visiteurs, buanderie. Étage: 2 chambres avec dressing, salle de bain, terrasse. Petit jardin à l''arrière avec possibilité de garage. Quartier familial avec écoles primaires et collèges à proximité. Commerces de proximité: marchés, pharmacies, boulangeries. Accès facile vers Yopougon et le centre-ville.',
  'Rue du Commerce, Lot 45',
  'Abidjan',
  'Abobo',
  5.4200,
  -4.0400,
  'maison'::property_type,
  'disponible'::property_status,
  3,
  2,
  180.0,
  true,
  true,
  false,
  false,
  200000.00,
  400000.00,
  20000.00,
  ARRAY[
    'https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/2119713/pexels-photo-2119713.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1579705/pexels-photo-1579705.jpeg?auto=compress&cs=tinysrgb&w=800'
  ],
  'https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=800',
  now(),
  now()
),

-- ==============================================================================
-- BUREAUX À ADJAMÉ (Zone commerciale)
-- ==============================================================================

(
  gen_random_uuid(),
  (SELECT id FROM profiles WHERE full_name = 'Awa Bamba' LIMIT 1),
  'Bureau Commercial - Adjamé',
  'Espace commercial de 45m² dans secteur très passant d''Adjamé. Idéal pour boutique, bureau ou cabinet. Grande vitrine sur rue très commerçante, sol carrelé, climatisation, toilettes privatives. Électricité et eau individuelles. Quartier animé avec forte circulation piétonne et automobile. À proximité: Grand Marché d''Adjamé, gares routières, nombreuses boutiques et services. Facilité de stationnement dans les environs. Contrat de bail 3/6/9 ans possible pour commerçants.',
  'Avenue 3, près du Grand Marché',
  'Abidjan',
  'Adjamé',
  5.3694,
  -4.0272,
  'bureau'::property_type,
  'disponible'::property_status,
  0,
  1,
  45.0,
  false,
  false,
  false,
  true,
  180000.00,
  360000.00,
  15000.00,
  ARRAY[
    'https://images.pexels.com/photos/6476585/pexels-photo-6476585.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/544115/pexels-photo-544115.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/3952272/pexels-photo-3952272.jpeg?auto=compress&cs=tinysrgb&w=800'
  ],
  'https://images.pexels.com/photos/6476585/pexels-photo-6476585.jpeg?auto=compress&cs=tinysrgb&w=800',
  now(),
  now()
),

-- ==============================================================================
-- APPARTEMENTS DE LUXE À BASSAM (Station balnéaire)
-- ==============================================================================

(
  gen_random_uuid(),
  (SELECT id FROM profiles WHERE full_name = 'Kouadio Konan' LIMIT 1),
  'Appartement Vue Mer - Grand-Bassam',
  'Luxueux appartement F2 avec vue imprenable sur l''océan Atlantique à Grand-Bassam. Situé dans résidence de prestige avec accès direct à la plage privée. Appartement de 85m² très lumineux avec terrasse de 25m² face à l''océan. Séjour avec cuisine ouverte américaine équipée, grande chambre climatisée avec dressing et SDB, WC séparé. Résidence sécurisée 24/24 avec piscine, tennis, fitness. À 5min du centre historique de Bassam, restaurants huppés, casinos. Parfait pour week-ends ou résidence secondaire.',
  'Boulevard Treich-Laplène, Résidence L''Océane',
  'Grand-Bassam',
  'Centre-Ville',
  5.2119,
  -3.7435,
  'appartement'::property_type,
  'disponible'::property_status,
  2,
  1,
  85.0,
  true,
  false,
  true,
  true,
  550000.00,
  1100000.00,
  35000.00,
  ARRAY[
    'https://images.pexels.com/photos/1486222/pexels-photo-1486222.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/358607/pexels-photo-358607.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/2883527/pexels-photo-2883527.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/264563/pexels-photo-264563.jpeg?auto=compress&cs=tinysrgb&w=800'
  ],
  'https://images.pexels.com/photos/1486222/pexels-photo-1486222.jpeg?auto=compress&cs=tinysrgb&w=800',
  now(),
  now()
),

-- ==============================================================================
-- DUPLEX À ATTIÉCoubé (Nouvelle zone résidentielle)
-- ==============================================================================

(
  gen_random_uuid(),
  (SELECT id FROM profiles WHERE full_name = 'Agence Immobilière Cocody' LIMIT 1),
  'Duplex 5 Chambres - Attecoubé',
  'Magnifique duplex R+2 de 280m² dans nouvelle résidence sécurisée d''Attecoubé. Architecture moderne avec qualité de finition exceptionnelle. RDC: hall d''entrée, double garage, bureau, SDB, cuisine de service. 1er étage: grand salon double séjour avec terrasse, cuisine équipée moderne, WC visiteurs. 2ème étage: 4 chambres climatisées dont suite parentale avec SDB privative, 2 SDB familiales, terrasse. Résidence avec: piscine, jardin commun, gardien, surveillance, terrain de sport. Proximité: École Primaire Publique, Marché Attecoubé, accès facile vers pont Henri Konan Bédié.',
  'Résidence Les Palmiers, Lot 23',
  'Abidjan',
  'Attecoubé',
  5.3156,
  -4.1128,
  'duplex'::property_type,
  'disponible'::property_status,
  5,
  3,
  280.0,
  true,
  false,
  true,
  true,
  650000.00,
  1300000.00,
  40000.00,
  ARRAY[
    'https://images.pexels.com/photos/2102585/pexels-photo-2102585.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1642128/pexels-photo-1642128.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1579705/pexels-photo-1579705.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/2119713/pexels-photo-2119713.jpeg?auto=compress&cs=tinysrgb&w=800'
  ],
  'https://images.pexels.com/photos/2102585/pexels-photo-2102585.jpeg?auto=compress&cs=tinysrgb&w=800',
  now(),
  now()
),

-- ==============================================================================
-- STUDIO MEUBLÉ À BAMAKO (Pour le Mali - Extension régionale)
-- ==============================================================================

(
  gen_random_uuid(),
  (SELECT id FROM profiles WHERE full_name = 'Kouadio Konan' LIMIT 1),
  'Studio Meublé - Bamako ACI',
  'Studio moderne meublé de 35m² dans quartier d''affaires d''ACI 2000 à Bamako. Parfait pour expatrié ou voyageur d''affaires. Studio climatisé avec kitchenette équipée, salle de bain, espace bureau, connexion internet haut débit. Résidence sécurisée avec piscine, fitness, restaurant service chambre. Proximité: Ambassade de France, Centre International de Conférences, banques internationales, restaurants. Nettoyage hebdomadaire inclus. Services optionnels: blanchisserie, navette aéroport.',
  'Résidence ACI 2000, Tour B',
  'Bamako',
  'ACI 2000',
  12.6392,
  -8.0029,
  'appartement'::property_type,
  'disponible'::property_status,
  1,
  1,
  35.0,
  true,
  false,
  true,
  true,
  280000.00, -- FCFA
  560000.00,
  20000.00,
  ARRAY[
    'https://images.pexels.com/photos/358613/pexels-photo-358613.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/2581922/pexels-photo-2581922.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1648776/pexels-photo-1648776.jpeg?auto=compress&cs=tinysrgb&w=800'
  ],
  'https://images.pexels.com/photos/358613/pexels-photo-358613.jpeg?auto=compress&cs=tinysrgb&w=800',
  now(),
  now()
),

-- ==============================================================================
-- VILLA DE LUXE À ASSINIE (Station balnéaire)
-- ==============================================================================

(
  gen_random_uuid(),
  (SELECT id FROM profiles WHERE full_name = 'Awa Bamba' LIMIT 1),
  'Villa de Prestige avec Piscine - Assinie',
  'Villa exceptionnelle de 450m² sur terrain de 800m² avec plage privée à Assinie. Architecte renommé, matériaux nobles, finitions de luxe. Grand salon double séjour avec baies vitrées donnant sur piscine infini et plage privée. Cuisine professionnelle, 5 suites climatisées avec SDB privatives et terrasses, bureau, hammam, salle de cinéma. Jardin paysagé avec piscine 15x8m, pool-house, bar extérieur. Personnel de maison disponible sur demande.À 45min d''Abidjan, idéal comme résidence principale ou villa de vacances.',
  'Plage Privée d''Assinie',
  'Assinie',
  'Plage Privée',
  5.1389,
  -3.6528,
  'villa'::property_type,
  'disponible'::property_status,
  5,
  5,
  450.0,
  true,
  true,
  true,
  true,
  2500000.00,
  5000000.00,
  150000.00,
  ARRAY[
    'https://images.pexels.com/photos/189296/pexels-photo-189296.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/2119713/pexels-photo-2119713.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1642128/pexels-photo-1642128.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1486222/pexels-photo-1486222.jpeg?auto=compress&cs=tinysrgb&w=800'
  ],
  'https://images.pexels.com/photos/189296/pexels-photo-189296.jpeg?auto=compress&cs=tinysrgb&w=800',
  now(),
  now()
),

-- ==============================================================================
-- IMMEUBLE R+4 À KASSAGRAHAM (Investissement)
-- ==============================================================================

(
  gen_random_uuid(),
  (SELECT id FROM profiles WHERE full_name = 'Agence Immobilière Cocody' LIMIT 1),
  'Immeuble R+4 Complet - Kassagraham',
  'Immeuble de rapport R+4 de 1200m² sur terrain de 400m² dans quartier en plein développement de Kassagraham. Excellent investissement avec rendement locatif attractif. 8 appartements: 4 F2 et 4 F3, tous climatisés avec parkings. RDC: 4 F2 de 65m², 4 parkings. Étages: 4 F3 de 95m² par étage, tous avec terrasse. Construction récente avec matériaux de qualité, ascenseur, gardien, individuelleurs eau/électricité. Potiel de plus-value important avec le développement du quartier. Proximité: Nouvel hôpital, écoles, commerces.',
  'Lot 78, Quartier Administratif',
  'Abidjan',
  'Kassagraham',
  5.3667,
  -4.0833,
  'immeuble'::property_type,
  'disponible'::property_status,
  32,
  16,
  1200.0,
  true,
  false,
  false,
  true,
  3000000.00,
  0.00,
  0.00,
  ARRAY[
    'https://images.pexels.com/photos/1060447/pexels-photo-1060447.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1115806/pexels-photo-1115806.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/6476585/pexels-photo-6476585.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/271795/pexels-photo-271795.jpeg?auto=compress&cs=tinysrgb&w=800'
  ],
  'https://images.pexels.com/photos/1060447/pexels-photo-1060447.jpeg?auto=compress&cs=tinysrgb&w=800',
  now(),
  now()
);

-- Réactiver les triggers RLS
SET session_replication_role = 'DEFAULT';

-- Statistiques
SELECT 'Seed data completed successfully!' as status,
       (SELECT COUNT(*) FROM properties) as total_properties,
       (SELECT COUNT(DISTINCT city) FROM properties) as total_cities,
       (SELECT COUNT(DISTINCT property_type) FROM properties) as total_property_types;

-- Afficher les propriétés insérées
SELECT
  title,
  city,
  neighborhood,
  property_type,
  monthly_rent,
  surface_area,
  bedrooms
FROM properties
ORDER BY monthly_rent DESC;