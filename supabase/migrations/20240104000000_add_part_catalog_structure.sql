-- Add catalog fields to parts table
ALTER TABLE parts 
ADD COLUMN IF NOT EXISTS catalog_code TEXT,
ADD COLUMN IF NOT EXISTS sub_catalog_code TEXT;

-- Create an index for faster filtering by catalog
CREATE INDEX IF NOT EXISTS idx_parts_catalog_code ON parts(catalog_code);
CREATE INDEX IF NOT EXISTS idx_parts_sub_catalog_code ON parts(sub_catalog_code);

