-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create parts table
CREATE TABLE IF NOT EXISTS parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL UNIQUE,
  supplier_part_number TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  attributes JSONB DEFAULT '{}',
  drawing_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create part_prices table
CREATE TABLE IF NOT EXISTS part_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id UUID NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  currency TEXT NOT NULL DEFAULT 'USD',
  unit_price NUMERIC(12,4) NOT NULL,
  moq INT,
  lead_time_days INT,
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_through DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL DEFAULT 'quote',
  file_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'uploaded',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create extractions table
CREATE TABLE IF NOT EXISTS extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  raw_json JSONB NOT NULL DEFAULT '{}',
  normalized_json JSONB NOT NULL DEFAULT '{}',
  accuracy JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending_review',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'quote',
  customer_name TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES parts(id) ON DELETE RESTRICT,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  quantity NUMERIC(12,3) NOT NULL,
  unit_price NUMERIC(12,4) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_parts_sku ON parts(sku);
CREATE INDEX idx_parts_supplier_part_number ON parts(supplier_part_number);
CREATE INDEX idx_part_prices_part_id ON part_prices(part_id);
CREATE INDEX idx_part_prices_supplier_id ON part_prices(supplier_id);
CREATE INDEX idx_part_prices_valid_from ON part_prices(valid_from);
CREATE INDEX idx_part_prices_valid_through ON part_prices(valid_through);
CREATE INDEX idx_documents_supplier_id ON documents(supplier_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_extractions_document_id ON extractions(document_id);
CREATE INDEX idx_extractions_status ON extractions(status);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_part_id ON order_items(part_id);

-- Enable Row Level Security
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE part_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create policies (for now, allow all authenticated users)
-- In production, you would create more granular policies based on user roles

-- Suppliers policies
CREATE POLICY "Allow authenticated read access" ON suppliers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert access" ON suppliers
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update access" ON suppliers
  FOR UPDATE TO authenticated USING (true);

-- Parts policies
CREATE POLICY "Allow authenticated read access" ON parts
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert access" ON parts
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update access" ON parts
  FOR UPDATE TO authenticated USING (true);

-- Part prices policies
CREATE POLICY "Allow authenticated read access" ON part_prices
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert access" ON part_prices
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update access" ON part_prices
  FOR UPDATE TO authenticated USING (true);

-- Documents policies
CREATE POLICY "Allow authenticated read access" ON documents
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert access" ON documents
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update access" ON documents
  FOR UPDATE TO authenticated USING (true);

-- Extractions policies
CREATE POLICY "Allow authenticated read access" ON extractions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert access" ON extractions
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update access" ON extractions
  FOR UPDATE TO authenticated USING (true);

-- Orders policies
CREATE POLICY "Allow authenticated read access" ON orders
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert access" ON orders
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update access" ON orders
  FOR UPDATE TO authenticated USING (true);

-- Order items policies
CREATE POLICY "Allow authenticated read access" ON order_items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert access" ON order_items
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update access" ON order_items
  FOR UPDATE TO authenticated USING (true);

