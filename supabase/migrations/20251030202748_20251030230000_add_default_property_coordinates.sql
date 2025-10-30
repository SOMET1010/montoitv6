/*
  # Add Default Coordinates to Properties

  ## Description
  Adds default latitude/longitude coordinates to properties that don't have them yet.
  Uses Abidjan coordinates and distributes properties across popular neighborhoods.

  ## Changes
  - Updates existing properties with NULL coordinates
  - Sets default coordinates based on cities and neighborhoods
  - Ensures all properties are visible on the map

  ## Neighborhoods with Coordinates
  - Cocody: -3.9860, 5.3535
  - Plateau: -4.0241, 5.3267
  - Yopougon: -4.0892, 5.3364
  - Marcory: -4.0053, 5.2922
  - Treichville: -4.0144, 5.3018
  - Adjamé: -4.0236, 5.3483
  - Abobo: -4.0230, 5.4237
  - Koumassi: -3.9567, 5.2892
*/

-- Update properties in Cocody
UPDATE properties
SET
  latitude = 5.3535 + (RANDOM() * 0.02 - 0.01),
  longitude = -3.9860 + (RANDOM() * 0.02 - 0.01)
WHERE (latitude IS NULL OR longitude IS NULL)
  AND (city ILIKE '%cocody%' OR neighborhood ILIKE '%cocody%');

-- Update properties in Plateau
UPDATE properties
SET
  latitude = 5.3267 + (RANDOM() * 0.02 - 0.01),
  longitude = -4.0241 + (RANDOM() * 0.02 - 0.01)
WHERE (latitude IS NULL OR longitude IS NULL)
  AND (city ILIKE '%plateau%' OR neighborhood ILIKE '%plateau%');

-- Update properties in Yopougon
UPDATE properties
SET
  latitude = 5.3364 + (RANDOM() * 0.02 - 0.01),
  longitude = -4.0892 + (RANDOM() * 0.02 - 0.01)
WHERE (latitude IS NULL OR longitude IS NULL)
  AND (city ILIKE '%yopougon%' OR neighborhood ILIKE '%yopougon%');

-- Update properties in Marcory
UPDATE properties
SET
  latitude = 5.2922 + (RANDOM() * 0.02 - 0.01),
  longitude = -4.0053 + (RANDOM() * 0.02 - 0.01)
WHERE (latitude IS NULL OR longitude IS NULL)
  AND (city ILIKE '%marcory%' OR neighborhood ILIKE '%marcory%');

-- Update properties in Treichville
UPDATE properties
SET
  latitude = 5.3018 + (RANDOM() * 0.02 - 0.01),
  longitude = -4.0144 + (RANDOM() * 0.02 - 0.01)
WHERE (latitude IS NULL OR longitude IS NULL)
  AND (city ILIKE '%treichville%' OR neighborhood ILIKE '%treichville%');

-- Update properties in Adjamé
UPDATE properties
SET
  latitude = 5.3483 + (RANDOM() * 0.02 - 0.01),
  longitude = -4.0236 + (RANDOM() * 0.02 - 0.01)
WHERE (latitude IS NULL OR longitude IS NULL)
  AND (city ILIKE '%adjamé%' OR neighborhood ILIKE '%adjamé%' OR neighborhood ILIKE '%adjame%');

-- Update properties in Abobo
UPDATE properties
SET
  latitude = 5.4237 + (RANDOM() * 0.02 - 0.01),
  longitude = -4.0230 + (RANDOM() * 0.02 - 0.01)
WHERE (latitude IS NULL OR longitude IS NULL)
  AND (city ILIKE '%abobo%' OR neighborhood ILIKE '%abobo%');

-- Update properties in Koumassi
UPDATE properties
SET
  latitude = 5.2892 + (RANDOM() * 0.02 - 0.01),
  longitude = -3.9567 + (RANDOM() * 0.02 - 0.01)
WHERE (latitude IS NULL OR longitude IS NULL)
  AND (city ILIKE '%koumassi%' OR neighborhood ILIKE '%koumassi%');

-- Update properties in Abidjan (generic)
UPDATE properties
SET
  latitude = 5.3600 + (RANDOM() * 0.05 - 0.025),
  longitude = -4.0083 + (RANDOM() * 0.05 - 0.025)
WHERE (latitude IS NULL OR longitude IS NULL)
  AND city ILIKE '%abidjan%';

-- Update remaining properties without coordinates (default to central Abidjan)
UPDATE properties
SET
  latitude = 5.3600 + (RANDOM() * 0.1 - 0.05),
  longitude = -4.0083 + (RANDOM() * 0.1 - 0.05)
WHERE latitude IS NULL OR longitude IS NULL;

-- Add comment
COMMENT ON COLUMN properties.latitude IS 'Latitude coordinate for map display. Defaults to Abidjan area if not specified.';
COMMENT ON COLUMN properties.longitude IS 'Longitude coordinate for map display. Defaults to Abidjan area if not specified.';

-- Create function to set default coordinates on INSERT
CREATE OR REPLACE FUNCTION set_default_property_coordinates()
RETURNS TRIGGER AS $$
BEGIN
  -- If coordinates are not provided, set defaults based on city/neighborhood
  IF NEW.latitude IS NULL OR NEW.longitude IS NULL THEN
    -- Cocody
    IF NEW.city ILIKE '%cocody%' OR NEW.neighborhood ILIKE '%cocody%' THEN
      NEW.latitude := 5.3535 + (RANDOM() * 0.02 - 0.01);
      NEW.longitude := -3.9860 + (RANDOM() * 0.02 - 0.01);
    -- Plateau
    ELSIF NEW.city ILIKE '%plateau%' OR NEW.neighborhood ILIKE '%plateau%' THEN
      NEW.latitude := 5.3267 + (RANDOM() * 0.02 - 0.01);
      NEW.longitude := -4.0241 + (RANDOM() * 0.02 - 0.01);
    -- Yopougon
    ELSIF NEW.city ILIKE '%yopougon%' OR NEW.neighborhood ILIKE '%yopougon%' THEN
      NEW.latitude := 5.3364 + (RANDOM() * 0.02 - 0.01);
      NEW.longitude := -4.0892 + (RANDOM() * 0.02 - 0.01);
    -- Default to central Abidjan
    ELSE
      NEW.latitude := 5.3600 + (RANDOM() * 0.05 - 0.025);
      NEW.longitude := -4.0083 + (RANDOM() * 0.05 - 0.025);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new properties
DROP TRIGGER IF EXISTS trigger_set_default_property_coordinates ON properties;
CREATE TRIGGER trigger_set_default_property_coordinates
  BEFORE INSERT ON properties
  FOR EACH ROW
  EXECUTE FUNCTION set_default_property_coordinates();
