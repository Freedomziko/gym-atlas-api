-- Create brands table
CREATE TABLE brands (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  slug       TEXT NOT NULL UNIQUE,
  logo_url   TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed from existing equipment brand strings
INSERT INTO brands (name, slug)
SELECT DISTINCT brand, LOWER(REGEXP_REPLACE(brand, '\s+', '-', 'g'))
FROM equipment
WHERE brand IS NOT NULL
ON CONFLICT DO NOTHING;

-- Add FK column to equipment and backfill
ALTER TABLE equipment ADD COLUMN brand_id INTEGER REFERENCES brands(id);
UPDATE equipment e SET brand_id = b.id FROM brands b WHERE e.brand = b.name;
