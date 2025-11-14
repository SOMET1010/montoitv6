/*
  # Propriétés de démonstration Mon Toit
  
  Crée 12 propriétés de test à Abidjan avec images et données réalistes
*/

-- Types enum
DO $$ BEGIN CREATE TYPE user_type AS ENUM ('locataire', 'proprietaire', 'agence', 'admin_ansut', 'trust_agent'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE property_type AS ENUM ('appartement', 'villa', 'studio', 'chambre', 'bureau', 'commerce'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE property_status AS ENUM ('disponible', 'loue', 'en_attente', 'retire'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Table properties
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  property_type property_type NOT NULL,
  status property_status DEFAULT 'disponible',
  city TEXT NOT NULL,
  neighborhood TEXT,
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  bedrooms INTEGER DEFAULT 0,
  bathrooms INTEGER DEFAULT 0,
  surface_area DECIMAL(10, 2),
  monthly_rent DECIMAL(12, 2) NOT NULL,
  security_deposit DECIMAL(12, 2),
  main_image TEXT,
  images TEXT[],
  amenities TEXT[],
  available_from DATE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Properties viewable" ON properties;
CREATE POLICY "Properties viewable" ON properties FOR SELECT USING (status = 'disponible');

-- Propriétés de démonstration
INSERT INTO properties (title, description, property_type, status, city, neighborhood, address, latitude, longitude, bedrooms, bathrooms, surface_area, monthly_rent, security_deposit, main_image, amenities, available_from) VALUES
('Appartement moderne à Cocody Riviera', 'Magnifique appartement de 3 chambres avec vue panoramique, résidence sécurisée avec piscine.', 'appartement', 'disponible', 'Abidjan', 'Cocody-Riviera', 'Riviera Bonoumin', 5.3599, -3.9600, 3, 2, 120.00, 350000, 700000, 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['Climatisation', 'Piscine', 'Parking', 'Sécurité 24/7'], CURRENT_DATE),
('Villa luxueuse à Cocody 2 Plateaux', 'Villa de standing avec 5 chambres, jardin, garage double. Quartier calme et résidentiel.', 'villa', 'disponible', 'Abidjan', '2 Plateaux', 'Rue des Jardins', 5.3700, -3.9800, 5, 4, 280.00, 800000, 1600000, 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['Jardin', 'Garage', 'Piscine privée', 'Climatisation'], CURRENT_DATE),
('Studio moderne au Plateau', 'Studio meublé au coeur du Plateau. Idéal pour jeune professionnel.', 'studio', 'disponible', 'Abidjan', 'Plateau', 'Avenue Chardy', 5.3167, -4.0167, 1, 1, 35.00, 150000, 300000, 'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['Meublé', 'Climatisation', 'Wi-Fi'], CURRENT_DATE),
('Appartement familial à Marcory Zone 4', 'Grand appartement 4 pièces lumineux. Parfait pour une famille.', 'appartement', 'disponible', 'Abidjan', 'Marcory Zone 4', 'Boulevard VGE', 5.2800, -3.9900, 4, 2, 150.00, 280000, 560000, 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['Balcon', 'Parking', 'Sécurité'], CURRENT_DATE),
('Chambre à Yopougon', 'Chambre meublée dans maison familiale. Eau et électricité comprises.', 'chambre', 'disponible', 'Abidjan', 'Yopougon', 'Niangon Nord', 5.3333, -4.0833, 1, 1, 20.00, 60000, 60000, 'https://images.pexels.com/photos/271795/pexels-photo-271795.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['Meublé', 'Eau incluse', 'Wi-Fi'], CURRENT_DATE),
('Bureau moderne à Plateau Dokui', 'Espace de bureau 80m² dans immeuble récent. Climatisé et sécurisé.', 'bureau', 'disponible', 'Abidjan', 'Plateau Dokui', 'Boulevard Clozel', 5.3200, -4.0150, 0, 2, 80.00, 400000, 800000, 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['Climatisation', 'Ascenseur', 'Parking'], CURRENT_DATE),
('Appartement standing à Cocody Angré', 'Appartement haut standing avec terrasse, résidence avec salle de sport.', 'appartement', 'disponible', 'Abidjan', 'Cocody-Angré', 'Angré 7e Tranche', 5.3800, -3.9500, 3, 3, 140.00, 450000, 900000, 'https://images.pexels.com/photos/2251247/pexels-photo-2251247.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['Salle de sport', 'Terrasse', 'Piscine'], CURRENT_DATE),
('Villa bord de mer à Bassam', 'Magnifique villa avec vue mer. 4 chambres, piscine, accès plage.', 'villa', 'disponible', 'Grand-Bassam', 'Plage', 'Boulevard de la Plage', 5.2000, -3.7333, 4, 3, 250.00, 600000, 1200000, 'https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['Vue mer', 'Piscine', 'Jardin', 'Accès plage'], CURRENT_DATE),
('Studio étudiant à Abobo', 'Petit studio pour étudiant. Proche université, commerces et transports.', 'studio', 'disponible', 'Abidjan', 'Abobo', 'Abobo Gare', 5.4167, -4.0167, 1, 1, 25.00, 80000, 80000, 'https://images.pexels.com/photos/1428348/pexels-photo-1428348.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['Meublé', 'Proche université'], CURRENT_DATE),
('Commerce au Cap Sud', 'Local commercial 100m² dans centre commercial. Idéal boutique ou restaurant.', 'commerce', 'disponible', 'Abidjan', 'Marcory', 'Cap Sud', 5.2700, -3.9800, 0, 2, 100.00, 500000, 1000000, 'https://images.pexels.com/photos/2467506/pexels-photo-2467506.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['Centre commercial', 'Parking', 'Climatisation'], CURRENT_DATE),
('Appartement duplex à Cocody Vallon', 'Splendide duplex avec salon double hauteur. Quartier calme et verdoyant.', 'appartement', 'disponible', 'Abidjan', 'Cocody-Vallon', 'Vallon', 5.3650, -3.9700, 4, 3, 200.00, 550000, 1100000, 'https://images.pexels.com/photos/1648776/pexels-photo-1648776.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['Duplex', 'Jardin', 'Parking', 'Terrasse'], CURRENT_DATE),
('Villa moderne à Bingerville', 'Villa neuve avec finitions de qualité. 4 chambres, jardin paysagé.', 'villa', 'disponible', 'Bingerville', 'Centre', 'Rue Principale', 5.3550, -3.8900, 4, 3, 220.00, 480000, 960000, 'https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['Neuf', 'Jardin', 'Garage', 'Climatisation'], CURRENT_DATE);

UPDATE properties SET view_count = floor(random() * 500 + 50)::int WHERE status = 'disponible';
