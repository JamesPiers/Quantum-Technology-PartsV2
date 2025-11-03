/**
 * Unit tests for extraction service normalization
 */

import { calculateAccuracyMetrics, validateLineItems } from '@/lib/utils/metrics'
import { NormalizedExtraction } from '@/lib/types/database.types'

describe('Extraction Metrics', () => {
  describe('calculateAccuracyMetrics', () => {
    it('should calculate completeness score correctly', () => {
      const normalized: NormalizedExtraction = {
        supplier_name: 'Test Supplier',
        quote_number: 'Q-123',
        quote_date: '2024-01-15',
        currency: 'USD',
        valid_until: '2024-02-15',
        notes: 'Test notes',
        line_items: [
          {
            supplier_part_number: 'PART-001',
            description: 'Test Part',
            qty_breaks: [{ min_qty: 1, unit_price: 10.0 }],
          },
        ],
      }

      const metrics = calculateAccuracyMetrics(normalized, 1000, 500)

      expect(metrics.fields_present).toBeGreaterThan(0)
      expect(metrics.completeness_score).toBeGreaterThan(0)
      expect(metrics.completeness_score).toBeLessThanOrEqual(1)
      expect(metrics.line_items_count).toBe(1)
      expect(metrics.response_time_ms).toBe(1000)
      expect(metrics.token_usage).toBe(500)
    })

    it('should handle missing optional fields', () => {
      const normalized: NormalizedExtraction = {
        supplier_name: 'Test Supplier',
        line_items: [
          {
            supplier_part_number: 'PART-001',
            description: 'Test Part',
            qty_breaks: [{ min_qty: 1, unit_price: 10.0 }],
          },
        ],
      }

      const metrics = calculateAccuracyMetrics(normalized, 1000)

      expect(metrics.fields_present).toBeGreaterThan(0)
      expect(metrics.completeness_score).toBeGreaterThan(0)
      expect(metrics.token_usage).toBeUndefined()
    })
  })

  describe('validateLineItems', () => {
    it('should validate correct line items', () => {
      const normalized: NormalizedExtraction = {
        supplier_name: 'Test Supplier',
        line_items: [
          {
            supplier_part_number: 'PART-001',
            description: 'Test Part',
            qty_breaks: [
              { min_qty: 1, unit_price: 10.0 },
              { min_qty: 100, unit_price: 9.0 },
            ],
          },
        ],
      }

      expect(validateLineItems(normalized)).toBe(true)
    })

    it('should reject line items without supplier_part_number', () => {
      const normalized: NormalizedExtraction = {
        supplier_name: 'Test Supplier',
        line_items: [
          {
            supplier_part_number: '',
            description: 'Test Part',
            qty_breaks: [{ min_qty: 1, unit_price: 10.0 }],
          },
        ],
      }

      expect(validateLineItems(normalized)).toBe(false)
    })

    it('should reject line items without qty_breaks', () => {
      const normalized: NormalizedExtraction = {
        supplier_name: 'Test Supplier',
        line_items: [
          {
            supplier_part_number: 'PART-001',
            description: 'Test Part',
            qty_breaks: [],
          },
        ],
      }

      expect(validateLineItems(normalized)).toBe(false)
    })

    it('should reject negative prices or quantities', () => {
      const normalized: NormalizedExtraction = {
        supplier_name: 'Test Supplier',
        line_items: [
          {
            supplier_part_number: 'PART-001',
            description: 'Test Part',
            qty_breaks: [{ min_qty: -1, unit_price: 10.0 }],
          },
        ],
      }

      expect(validateLineItems(normalized)).toBe(false)
    })
  })
})

