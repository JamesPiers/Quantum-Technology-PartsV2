/**
 * Utility functions for calculating extraction accuracy metrics
 */

import { NormalizedExtraction, AccuracyMetrics } from '@/lib/types/database.types';

/**
 * Calculate accuracy metrics for an extraction
 */
export function calculateAccuracyMetrics(
  normalized: NormalizedExtraction,
  responseTimeMs: number,
  tokenUsage?: number
): AccuracyMetrics {
  const allFields = [
    'supplier_name',
    'quote_number',
    'quote_date',
    'currency',
    'valid_until',
    'notes',
  ];

  let fieldsPresent = 0;
  for (const field of allFields) {
    if (normalized[field as keyof NormalizedExtraction]) {
      fieldsPresent++;
    }
  }

  // supplier_name and line_items are required
  if (normalized.supplier_name) fieldsPresent += 1;
  if (normalized.line_items && normalized.line_items.length > 0) fieldsPresent += 1;

  const totalFields = allFields.length + 2; // +2 for required fields
  const completenessScore = fieldsPresent / totalFields;

  return {
    fields_present: fieldsPresent,
    total_fields: totalFields,
    completeness_score: Math.round(completenessScore * 100) / 100,
    line_items_count: normalized.line_items?.length || 0,
    response_time_ms: responseTimeMs,
    token_usage: tokenUsage,
  };
}

/**
 * Validate that line items have proper structure
 */
export function validateLineItems(normalized: NormalizedExtraction): boolean {
  if (!normalized.line_items || normalized.line_items.length === 0) {
    return false;
  }

  return normalized.line_items.every((item) => {
    return (
      item.supplier_part_number &&
      item.description &&
      item.qty_breaks &&
      item.qty_breaks.length > 0 &&
      item.qty_breaks.every((qb) => qb.min_qty >= 0 && qb.unit_price >= 0)
    );
  });
}

