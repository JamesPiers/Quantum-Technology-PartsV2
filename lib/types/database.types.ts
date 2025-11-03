/**
 * Database types matching the Supabase schema
 */

export interface Supplier {
  id: string;
  name: string;
  email: string | null;
  currency: string;
  created_at: string;
}

export interface Part {
  id: string;
  sku: string;
  supplier_part_number: string;
  name: string;
  description: string | null;
  attributes: Record<string, any>;
  drawing_url: string | null;
  created_at: string;
}

export interface PartPrice {
  id: string;
  part_id: string;
  supplier_id: string;
  currency: string;
  unit_price: number;
  moq: number | null;
  lead_time_days: number | null;
  valid_from: string;
  valid_through: string | null;
  created_at: string;
}

export interface Document {
  id: string;
  supplier_id: string;
  doc_type: string;
  file_path: string;
  status: 'uploaded' | 'processing' | 'completed' | 'error';
  created_at: string;
}

export interface Extraction {
  id: string;
  document_id: string;
  provider: 'docai' | 'openai';
  raw_json: Record<string, any>;
  normalized_json: NormalizedExtraction;
  accuracy: AccuracyMetrics;
  status: 'pending_review' | 'approved' | 'rejected';
  created_at: string;
}

export interface Order {
  id: string;
  type: 'quote' | 'purchase_order';
  customer_name: string | null;
  status: 'draft' | 'submitted' | 'approved' | 'completed' | 'cancelled';
  currency: string;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  part_id: string;
  supplier_id: string;
  quantity: number;
  unit_price: number;
  currency: string;
  created_at: string;
}

/**
 * Normalized extraction schema
 */
export interface NormalizedExtraction {
  supplier_name: string;
  quote_number?: string;
  quote_date?: string;
  currency?: string;
  valid_until?: string;
  notes?: string;
  line_items: LineItem[];
}

export interface LineItem {
  supplier_part_number: string;
  description: string;
  uom?: string;
  qty_breaks: QtyBreak[];
  lead_time_days?: number;
  moq?: number;
}

export interface QtyBreak {
  min_qty: number;
  unit_price: number;
}

/**
 * Extraction accuracy metrics
 */
export interface AccuracyMetrics {
  fields_present: number;
  total_fields: number;
  completeness_score: number;
  line_items_count: number;
  response_time_ms: number;
  token_usage?: number;
}

/**
 * Extraction result from providers
 */
export interface ExtractionResult {
  raw: Record<string, any>;
  normalized: NormalizedExtraction;
  metrics: AccuracyMetrics;
}

