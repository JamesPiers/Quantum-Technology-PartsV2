-- Make supplier_id nullable in documents table
-- This allows documents to be created before supplier is identified from extraction

ALTER TABLE documents ALTER COLUMN supplier_id DROP NOT NULL;

