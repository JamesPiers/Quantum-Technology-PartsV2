-- Seed data for testing and development

-- Insert sample suppliers
INSERT INTO suppliers (id, name, email, currency) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Acme Manufacturing', 'quotes@acme.com', 'USD'),
  ('00000000-0000-0000-0000-000000000002', 'Global Parts Co.', 'sales@globalparts.com', 'EUR'),
  ('00000000-0000-0000-0000-000000000003', 'Precision Machining', 'info@precision.com', 'USD')
ON CONFLICT (id) DO NOTHING;

-- Insert sample parts
INSERT INTO parts (id, sku, supplier_part_number, name, description, attributes) VALUES
  ('10000000-0000-0000-0000-000000000001', 'SKU-ALU-001', 'ACME-ALU-100', 'Aluminum Widget', 'High-quality aluminum widget for industrial use', '{"material": "aluminum", "weight": "0.5kg"}'),
  ('10000000-0000-0000-0000-000000000002', 'SKU-STL-001', 'ACME-STL-200', 'Steel Bracket', 'Durable steel mounting bracket', '{"material": "steel", "weight": "1.2kg"}'),
  ('10000000-0000-0000-0000-000000000003', 'SKU-PLS-001', 'GLOB-PLS-001', 'Plastic Connector', 'Industrial-grade plastic connector', '{"material": "plastic", "color": "black"}')
ON CONFLICT (sku) DO NOTHING;

-- Insert sample part prices
INSERT INTO part_prices (part_id, supplier_id, currency, unit_price, moq, lead_time_days, valid_from, valid_through) VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'USD', 10.50, 10, 14, '2024-01-01', '2024-12-31'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'USD', 9.25, 100, 14, '2024-01-01', '2024-12-31'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'USD', 5.75, 5, 7, '2024-01-01', '2024-12-31'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'EUR', 2.25, 50, 21, '2024-01-01', '2024-12-31')
ON CONFLICT DO NOTHING;

