-- Enable public access (anon role) for development/demo purposes

-- Suppliers
CREATE POLICY "Allow public read access" ON suppliers
  FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public insert access" ON suppliers
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow public update access" ON suppliers
  FOR UPDATE TO anon USING (true);

-- Parts
CREATE POLICY "Allow public read access" ON parts
  FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public insert access" ON parts
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow public update access" ON parts
  FOR UPDATE TO anon USING (true);

-- Part Prices
CREATE POLICY "Allow public read access" ON part_prices
  FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public insert access" ON part_prices
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow public update access" ON part_prices
  FOR UPDATE TO anon USING (true);

-- Documents
CREATE POLICY "Allow public read access" ON documents
  FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public insert access" ON documents
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow public update access" ON documents
  FOR UPDATE TO anon USING (true);

-- Extractions
CREATE POLICY "Allow public read access" ON extractions
  FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public insert access" ON extractions
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow public update access" ON extractions
  FOR UPDATE TO anon USING (true);

-- Orders
CREATE POLICY "Allow public read access" ON orders
  FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public insert access" ON orders
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow public update access" ON orders
  FOR UPDATE TO anon USING (true);

-- Order Items
CREATE POLICY "Allow public read access" ON order_items
  FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public insert access" ON order_items
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow public update access" ON order_items
  FOR UPDATE TO anon USING (true);

