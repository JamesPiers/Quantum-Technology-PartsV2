-- Add columns to track the source document and extraction for each part price
ALTER TABLE part_prices
ADD COLUMN document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
ADD COLUMN extraction_id UUID REFERENCES extractions(id) ON DELETE SET NULL;

-- Create indexes for the new foreign keys
CREATE INDEX idx_part_prices_document_id ON part_prices(document_id);
CREATE INDEX idx_part_prices_extraction_id ON part_prices(extraction_id);

-- Add a comment to explain the relationship
COMMENT ON COLUMN part_prices.document_id IS 'Reference to the document (quote) that this price came from';
COMMENT ON COLUMN part_prices.extraction_id IS 'Reference to the extraction that created this price record';

