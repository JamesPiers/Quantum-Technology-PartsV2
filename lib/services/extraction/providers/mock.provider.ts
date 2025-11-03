/**
 * Mock extraction provider for testing and development
 */

import { ExtractionResult, NormalizedExtraction } from '@/lib/schemas/extraction.schema';
import { IExtractionProvider, ExtractionOptions } from '../types';
import { logger } from '@/lib/utils/logger';
import { calculateAccuracyMetrics } from '@/lib/utils/metrics';

export class MockProvider implements IExtractionProvider {
  getName(): string {
    return 'mock';
  }

  /**
   * Return mock extraction data for testing
   */
  async extract(options: ExtractionOptions): Promise<ExtractionResult> {
    const startTime = Date.now();

    logger.info('Starting mock extraction', {
      documentId: options.documentId,
      supplierId: options.supplierId,
      provider: 'mock',
    });

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const normalized: NormalizedExtraction = {
      supplier_name: 'Mock Supplier Inc.',
      quote_number: 'Q-2024-001',
      quote_date: '2024-01-15',
      currency: 'USD',
      valid_until: '2024-02-15',
      notes: 'This is a mock extraction for testing purposes.',
      line_items: [
        {
          supplier_part_number: 'MOCK-001',
          description: 'Mock Part 1 - Aluminum Widget',
          uom: 'EA',
          qty_breaks: [
            { min_qty: 1, unit_price: 10.5 },
            { min_qty: 100, unit_price: 9.25 },
            { min_qty: 500, unit_price: 8.0 },
          ],
          lead_time_days: 14,
          moq: 10,
        },
        {
          supplier_part_number: 'MOCK-002',
          description: 'Mock Part 2 - Steel Bracket',
          uom: 'EA',
          qty_breaks: [
            { min_qty: 1, unit_price: 5.75 },
            { min_qty: 250, unit_price: 4.5 },
          ],
          lead_time_days: 7,
          moq: 5,
        },
        {
          supplier_part_number: 'MOCK-003',
          description: 'Mock Part 3 - Plastic Connector',
          uom: 'EA',
          qty_breaks: [
            { min_qty: 1, unit_price: 2.25 },
            { min_qty: 1000, unit_price: 1.75 },
          ],
          lead_time_days: 21,
          moq: 50,
        },
      ],
    };

    const responseTimeMs = Date.now() - startTime;
    const metrics = calculateAccuracyMetrics(normalized, responseTimeMs);

    logger.info('Mock extraction completed', {
      documentId: options.documentId,
      provider: 'mock',
      responseTimeMs,
      lineItemsCount: normalized.line_items.length,
    });

    return {
      raw: {
        mock: true,
        message: 'This is mock data for testing',
      },
      normalized,
      metrics,
    };
  }
}

