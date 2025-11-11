-- ==============================================================================
-- 🌍 SEED DATA SIMPLE - PROPRIÉTÉS IMMOBILIÈRES MONTOIT
-- ==============================================================================

-- Insertion de propriétaires de test
INSERT INTO profiles (id, full_name, user_type, is_verified, profile_setup_completed, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Kouadio Konan', 'proprietaire'::user_type, true, true, now(), now()),
  (gen_random_uuid(), 'Awa Bamba', 'proprietaire'::user_type, true, true, now(), now()),
  (gen_random_uuid(), 'Agence Immobilière Cocody', 'agence'::user_type, true, true, now(), now())
ON CONFLICT (id) DO NOTHING;

-- Insertion des propriétés
INSERT INTO properties (
  id, owner_id, title, description, address, city, neighborhood,
  latitude, longitude, property_type, status, bedrooms, bathrooms,
  surface_area, has_parking, has_garden, is_furnished, has_ac,
  monthly_rent, deposit_amount, charges_amount, images, main_image,
  created_at, updated_at
) VALUES

-- Appartements de luxe à Cocody
(
  gen_random_uuid(),
  (SELECT id FROM profiles WHERE full_name = 'Kouadio Konan' LIMIT 1),
  'Bel Appartement F3 - Cocody Riviera',
  'Magnifique appartement F3 de luxe dans la residence primee Les Jardins de Riviera. Tres lumineux avec vue degagee sur la lagune. Sejour spacieux, cuisine moderne, 3 chambres climatisees.',
  'Rue des Jardins, Riviera Palmeraie',
  'Abidjan',
  'Riviera Palmeraie',
  5.3614, -3.9973,
  'appartement'::property_type,
  'disponible'::property_status,
  3, 2, 120.0, true, false, true, true,
  350000.00, 700000.00, 25000.00,
  ARRAY['https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg', 'https://images.pexels.com/photos/276724/pexels-photo-276724.jpeg'],
  'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg',
  now(), now()
),

(
  gen_random_uuid(),
  (SELECT id FROM profiles WHERE full_name = 'Kouadio Konan' LIMIT 1),
  'Studio Meuble - Cocody Centre',
  'Studio moderne et fonctionnel en plein coeur de Cocody Centre. Parfait pour jeune professionnel ou etudiant. Proche de toutes commodites.',
  'Avenue Jean-Paul II, pres du Lycee Classique',
  'Abidjan',
  'Cocody Centre',
  5.3499, -4.0083,
  'appartement'::property_type,
  'disponible'::property_status,
  1, 1, 28.0, false, false, true, true,
  120000.00, 240000.00, 15000.00,
  ARRAY['https://images.pexels.com/photos/2581922/pexels-photo-2581922.jpeg', 'https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg'],
  'https://images.pexels.com/photos/2581922/pexels-photo-2581922.jpeg',
  now(), now()
),

-- Villa à Marcory
(
  gen_random_uuid(),
  (SELECT id FROM profiles WHERE full_name = 'Awa Bamba' LIMIT 1),
  'Villa 4 Chambres avec Piscine - Marcory Zone 4',
  'Superbe villa de standing de 320m² sur terrain de 500m² dans un quartier calme de Marcory. Architecture moderne avec grand salon ouvert sur terrasse et piscine.',
  'Voie Privee A, Quartier Residentiel',
  'Abidjan',
  'Marcory Zone 4',
  5.2907, -4.0086,
  'villa'::property_type,
  'disponible'::property_status,
  4, 3, 320.0, true, true, true, true,
  800000.00, 1600000.00, 50000.00,
  ARRAY['https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg', 'https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg'],
  'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg',
  now(), now()
),

-- Bureau au Plateau
(
  gen_random_uuid(),
  (SELECT id FROM profiles WHERE full_name = 'Agence Immobilière Cocody' LIMIT 1),
  'Appartement F2 Bureau - Plateau',
  'Appartement F2 transforme en espace de bureau moderne dans le quartier des affaires du Plateau. Ideal pour cabinet, startup ou profession liberale.',
  'Avenue Nogues, Immeuble Le Capricorne',
  'Abidjan',
  'Plateau',
  5.3201, -4.0147,
  'appartement'::property_type,
  'disponible'::property_status,
  2, 2, 65.0, true, false, false, true,
  450000.00, 900000.00, 40000.00,
  ARRAY['https://images.pexels.com/photos/3952272/pexels-photo-3952272.jpeg', 'https://images.pexels.com/photos/271795/pexels-photo-271795.jpeg'],
  'https://images.pexels.com/photos/3952272/pexels-photo-3952272.jpeg',
  now(), now()
),

-- Terrain à Yopougon
(
  gen_random_uuid(),
  (SELECT id FROM profiles WHERE full_name = 'Awa Bamba' LIMIT 1),
  'Terrain a Batir 600m² - Yopougon Selmer',
  'Excellent terrain a batir de 600m² dans le quartier residentiel de Yopougon Selmer. Terrain viabilise avec acces a l''eau courante et a l''electricite.',
  'Lot 152, Quartier Selmer',
  'Abidjan',
  'Yopougon',
  5.2700, -4.0727,
  'commerce'::property_type,
  'disponible'::property_status,
  0, 0, 600.0, true, false, false, false,
  0.00, 0.00, 0.00,
  ARRAY['https://images.pexels.com/photos/186077/pexels-photo-186077.jpeg', 'https://images.pexels.com/photos/1115806/pexels-photo-1115806.jpeg'],
  'https://images.pexels.com/photos/186077/pexels-photo-186077.jpeg',
  now(), now()
),

-- Chambre à Treichville
(
  gen_random_uuid(),
  (SELECT id FROM profiles WHERE full_name = 'Kouadio Konan' LIMIT 1),
  'Chambre Meublee - Treichville',
  'Chambre individuelle meublee dans grand appartement partage. Ideal pour etudiant ou jeune professionnel avec budget modere.',
  'Boulevard de Marseille, pres du lycee',
  'Abidjan',
  'Treichville',
  5.2935, -4.0383,
  'chambre'::property_type,
  'disponible'::property_status,
  1, 1, 14.0, false, false, true, true,
  45000.00, 90000.00, 8000.00,
  ARRAY['https://images.pexels.com/photos/358613/pexels-photo-358613.jpeg', 'https://images.pexels.com/photos/1648776/pexels-photo-1648776.jpeg'],
  'https://images.pexels.com/photos/358613/pexels-photo-358613.jpeg',
  now(), now()
),

-- Maison à Abobo
(
  gen_random_uuid(),
  (SELECT id FROM profiles WHERE full_name = 'Agence Immobilière Cocody' LIMIT 1),
  'Maison 3 Chambres - Abobo Soufflet',
  'Maison familiale de 180m² sur 2 niveaux dans quartier residentiel calme d''Abobo. Parfait pour famille avec enfants.',
  'Rue du Commerce, Lot 45',
  'Abidjan',
  'Abobo',
  5.4200, -4.0400,
  'villa'::property_type,
  'disponible'::property_status,
  3, 2, 180.0, true, true, false, false,
  200000.00, 400000.00, 20000.00,
  ARRAY['https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg', 'https://images.pexels.com/photos/2119713/pexels-photo-2119713.jpeg'],
  'https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg',
  now(), now()
),

-- Vue mer à Grand-Bassam
(
  gen_random_uuid(),
  (SELECT id FROM profiles WHERE full_name = 'Kouadio Konan' LIMIT 1),
  'Appartement Vue Mer - Grand-Bassam',
  'Luxueux appartement F2 avec vue imprenable sur l''ocean Atlantique. Situe dans residence de prestige avec acces direct a la plage.',
  'Boulevard Treich-Laplene, Residence L''Oceane',
  'Grand-Bassam',
  'Centre-Ville',
  5.2119, -3.7435,
  'appartement'::property_type,
  'disponible'::property_status,
  2, 1, 85.0, true, false, true, true,
  550000.00, 1100000.00, 35000.00,
  ARRAY['https://images.pexels.com/photos/1486222/pexels-photo-1486222.jpeg', 'https://images.pexels.com/photos/358607/pexels-photo-358607.jpeg'],
  'https://images.pexels.com/photos/1486222/pexels-photo-1486222.jpeg',
  now(), now()
),

-- Duplex à Attecoubé
(
  gen_random_uuid(),
  (SELECT id FROM profiles WHERE full_name = 'Agence Immobilière Cocody' LIMIT 1),
  'Duplex 5 Chambres - Attecoubé',
  'Magnifique duplex R+2 de 280m² dans nouvelle residence securisee. Architecture moderne avec qualite de finition exceptionnelle.',
  'Residence Les Palmiers, Lot 23',
  'Abidjan',
  'Attecoubé',
  5.3156, -4.1128,
  'villa'::property_type,
  'disponible'::property_status,
  5, 3, 280.0, true, false, true, true,
  650000.00, 1300000.00, 40000.00,
  ARRAY['https://images.pexels.com/photos/2102585/pexels-photo-2102585.jpeg', 'https://images.pexels.com/photos/1642128/pexels-photo-1642128.jpeg'],
  'https://images.pexels.com/photos/2102585/pexels-photo-2102585.jpeg',
  now(), now()
);

-- Statistiques
SELECT
  'Seed data completed successfully!' as status,
  (SELECT COUNT(*) FROM properties) as total_properties,
  (SELECT COUNT(DISTINCT city) FROM properties) as total_cities,
  (SELECT COUNT(DISTINCT property_type) FROM properties) as total_property_types;

-- Afficher les proprietes inserees
SELECT
  title,
  city,
  property_type,
  monthly_rent,
  surface_area,
  bedrooms
FROM properties
ORDER BY monthly_rent DESC;