/*
  # Fix Properties Schema and Add Demo Data
  
  ## Overview
  Correction critique de la structure de la table properties et ajout de données de démonstration.
  
  ## Changes
  1. Ajout des colonnes manquantes à properties
  2. Insertion de 15 propriétés de démonstration pour Abidjan
  3. Configuration RLS pour accès anonyme
*/

-- Add missing columns to properties table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'monthly_rent') THEN
    ALTER TABLE properties ADD COLUMN monthly_rent NUMERIC(10,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'deposit_amount') THEN
    ALTER TABLE properties ADD COLUMN deposit_amount NUMERIC(10,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'charges_amount') THEN
    ALTER TABLE properties ADD COLUMN charges_amount NUMERIC(10,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'main_image') THEN
    ALTER TABLE properties ADD COLUMN main_image TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'has_parking') THEN
    ALTER TABLE properties ADD COLUMN has_parking BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'has_garden') THEN
    ALTER TABLE properties ADD COLUMN has_garden BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'has_ac') THEN
    ALTER TABLE properties ADD COLUMN has_ac BOOLEAN DEFAULT true;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'area') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'surface_area') THEN
    ALTER TABLE properties RENAME COLUMN area TO surface_area;
  END IF;
END $$;

-- Get or create a demo owner (use first existing profile or create placeholder)
DO $$
DECLARE
  demo_owner_id UUID;
BEGIN
  -- Try to get first existing profile
  SELECT id INTO demo_owner_id FROM profiles LIMIT 1;
  
  -- If no profile exists, use a placeholder UUID (properties will be ownerless temporarily)
  IF demo_owner_id IS NULL THEN
    demo_owner_id := '00000000-0000-0000-0000-000000000001';
  END IF;

  -- Insert demo properties with realistic Abidjan data
  INSERT INTO properties (
    owner_id, title, description, property_type, city, neighborhood, address,
    latitude, longitude, monthly_rent, deposit_amount, charges_amount,
    bedrooms, bathrooms, surface_area, is_furnished, has_parking, has_garden, has_ac,
    status, main_image, images, price
  ) VALUES
  (
    demo_owner_id,
    'Appartement moderne 3 pièces à Cocody Riviera',
    'Magnifique appartement de standing avec vue dégagée, dans une résidence sécurisée 24h/24. Proche de toutes commodités: supermarchés, écoles internationales, restaurants.',
    'apartment',
    'Abidjan',
    'Cocody',
    'Riviera Palmeraie, près de la pharmacie',
    5.3599, -3.9874,
    250000, 500000, 25000,
    3, 2, 85.5, true, true, false, true,
    'available',
    'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg',
    ARRAY['https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg', 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg'],
    250000
  ),
  (
    demo_owner_id,
    'Villa de luxe 5 chambres à Cocody Angré',
    'Superbe villa dans le quartier prisé d''Angré. Grand jardin, piscine, garage 2 voitures. Quartier calme et résidentiel avec gardiennage permanent.',
    'house',
    'Abidjan',
    'Cocody',
    'Angré 8ème tranche',
    5.3798, -3.9654,
    850000, 1700000, 85000,
    5, 4, 320, true, true, true, true,
    'available',
    'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg',
    ARRAY['https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg', 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg'],
    850000
  ),
  (
    demo_owner_id,
    'Studio meublé à Cocody 2 Plateaux',
    'Joli studio tout équipé dans immeuble récent. Idéal pour étudiant ou jeune professionnel. Climatisation, eau chaude, internet inclus.',
    'studio',
    'Abidjan',
    'Cocody',
    '2 Plateaux Vallon',
    5.3656, -4.0123,
    120000, 240000, 15000,
    1, 1, 32, true, false, false, true,
    'available',
    'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg',
    ARRAY['https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg'],
    120000
  ),
  (
    demo_owner_id,
    'Bureau moderne au Plateau',
    'Espace de bureau climatisé de 120m² au cœur du quartier des affaires. Accès sécurisé, parking privé, connexion fibre optique.',
    'commercial',
    'Abidjan',
    'Plateau',
    'Avenue Franchet d''Esperey',
    5.3264, -4.0267,
    450000, 900000, 50000,
    0, 2, 120, false, true, false, true,
    'available',
    'https://images.pexels.com/photos/380768/pexels-photo-380768.jpeg',
    ARRAY['https://images.pexels.com/photos/380768/pexels-photo-380768.jpeg'],
    450000
  ),
  (
    demo_owner_id,
    'Appartement 2 pièces au Plateau',
    'Bel appartement rénové proche de tous services. Vue sur le centre-ville. Immeuble avec ascenseur et gardien.',
    'apartment',
    'Abidjan',
    'Plateau',
    'Rue du Commerce',
    5.3198, -4.0312,
    280000, 560000, 30000,
    2, 1, 65, true, true, false, true,
    'available',
    'https://images.pexels.com/photos/2724749/pexels-photo-2724749.jpeg',
    ARRAY['https://images.pexels.com/photos/2724749/pexels-photo-2724749.jpeg'],
    280000
  ),
  (
    demo_owner_id,
    'Maison familiale 4 chambres à Marcory Zone 4',
    'Belle maison dans quartier résidentiel calme. Cour spacieuse, garage, cuisine moderne. Proche écoles et marchés.',
    'house',
    'Abidjan',
    'Marcory',
    'Marcory Zone 4',
    5.3089, -4.0098,
    320000, 640000, 35000,
    4, 3, 180, false, true, true, true,
    'available',
    'https://images.pexels.com/photos/1396132/pexels-photo-1396132.jpeg',
    ARRAY['https://images.pexels.com/photos/1396132/pexels-photo-1396132.jpeg'],
    320000
  ),
  (
    demo_owner_id,
    'Appartement standing 3 pièces Marcory Biétry',
    'Résidence moderne avec piscine et salle de sport. Appartement lumineux avec balcon. Vue sur la lagune Ébrié.',
    'apartment',
    'Abidjan',
    'Marcory',
    'Marcory Biétry',
    5.2987, -4.0234,
    275000, 550000, 30000,
    3, 2, 95, true, true, false, true,
    'available',
    'https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg',
    ARRAY['https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg'],
    275000
  ),
  (
    demo_owner_id,
    'Villa 4 chambres à Yopougon Niangon',
    'Grande villa familiale dans quartier populaire et animé. Cour intérieure, garage. Proche transport et commerces.',
    'house',
    'Abidjan',
    'Yopougon',
    'Niangon Nord',
    5.3456, -4.0876,
    180000, 360000, 20000,
    4, 2, 150, false, true, true, false,
    'available',
    'https://images.pexels.com/photos/1974596/pexels-photo-1974596.jpeg',
    ARRAY['https://images.pexels.com/photos/1974596/pexels-photo-1974596.jpeg'],
    180000
  ),
  (
    demo_owner_id,
    'Appartement 2 pièces Yopougon Sicogi',
    'Appartement simple et fonctionnel dans cité Sicogi. Bien desservi par transports. Eau et électricité inclus.',
    'apartment',
    'Abidjan',
    'Yopougon',
    'Sicogi',
    5.3512, -4.0698,
    85000, 170000, 10000,
    2, 1, 55, false, false, false, false,
    'available',
    'https://images.pexels.com/photos/1918291/pexels-photo-1918291.jpeg',
    ARRAY['https://images.pexels.com/photos/1918291/pexels-photo-1918291.jpeg'],
    85000
  ),
  (
    demo_owner_id,
    'Maison 3 chambres à Abobo Gare',
    'Maison bien située proche de la gare d''Abobo. Quartier commerçant et vivant. Accès facile au transport.',
    'house',
    'Abidjan',
    'Abobo',
    'Abobo Gare',
    5.4234, -4.0234,
    150000, 300000, 15000,
    3, 2, 110, false, true, true, false,
    'available',
    'https://images.pexels.com/photos/2102587/pexels-photo-2102587.jpeg',
    ARRAY['https://images.pexels.com/photos/2102587/pexels-photo-2102587.jpeg'],
    150000
  ),
  (
    demo_owner_id,
    'Villa bord de mer à Port-Bouët',
    'Magnifique villa avec accès direct à la plage. Vue mer exceptionnelle. Jardin tropical, terrasse panoramique.',
    'house',
    'Abidjan',
    'Port-Bouët',
    'Port-Bouët plage',
    5.2654, -3.9234,
    680000, 1360000, 70000,
    4, 3, 250, true, true, true, true,
    'available',
    'https://images.pexels.com/photos/1643389/pexels-photo-1643389.jpeg',
    ARRAY['https://images.pexels.com/photos/1643389/pexels-photo-1643389.jpeg'],
    680000
  ),
  (
    demo_owner_id,
    'Local commercial Treichville centre',
    'Espace commercial stratégique en plein cœur de Treichville. Vitrine sur grande avenue passante.',
    'commercial',
    'Abidjan',
    'Treichville',
    'Boulevard de Marseille',
    5.2876, -4.0145,
    380000, 760000, 40000,
    0, 1, 85, false, false, false, true,
    'available',
    'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg',
    ARRAY['https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg'],
    380000
  ),
  (
    demo_owner_id,
    'Appartement duplex 4 pièces Koumassi',
    'Duplex spacieux dans résidence calme. 2 étages, balcons, cuisine équipée. Parking sécurisé.',
    'apartment',
    'Abidjan',
    'Koumassi',
    'Koumassi Grand carrefour',
    5.2956, -3.9567,
    195000, 390000, 20000,
    4, 2, 120, true, true, false, true,
    'available',
    'https://images.pexels.com/photos/2121121/pexels-photo-2121121.jpeg',
    ARRAY['https://images.pexels.com/photos/2121121/pexels-photo-2121121.jpeg'],
    195000
  ),
  (
    demo_owner_id,
    'Studio meublé à Adjamé',
    'Studio fonctionnel dans quartier dynamique d''Adjamé. Tout équipé. Transport facile vers toute la ville.',
    'studio',
    'Abidjan',
    'Adjamé',
    'Adjamé Commerce',
    5.3498, -4.0298,
    75000, 150000, 8000,
    1, 1, 28, true, false, false, false,
    'available',
    'https://images.pexels.com/photos/1648776/pexels-photo-1648776.jpeg',
    ARRAY['https://images.pexels.com/photos/1648776/pexels-photo-1648776.jpeg'],
    75000
  ),
  (
    demo_owner_id,
    'Maison 3 chambres Attécoubé',
    'Maison familiale dans quartier populaire. Cour privée. Proche marché et écoles primaires.',
    'house',
    'Abidjan',
    'Attécoubé',
    'Attécoubé Agban',
    5.3298, -4.0456,
    135000, 270000, 15000,
    3, 2, 95, false, false, true, false,
    'available',
    'https://images.pexels.com/photos/2079234/pexels-photo-2079234.jpeg',
    ARRAY['https://images.pexels.com/photos/2079234/pexels-photo-2079234.jpeg'],
    135000
  );
END $$;

-- Ensure RLS policies allow anonymous access  
DROP POLICY IF EXISTS "Allow anonymous read on available properties" ON properties;
CREATE POLICY "Allow anonymous read on available properties"
  ON properties FOR SELECT
  TO anon, authenticated
  USING (status = 'available');

GRANT SELECT ON properties TO anon;
GRANT SELECT ON properties TO authenticated;

NOTIFY pgrst, 'reload schema';
