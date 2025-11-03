/**
 * Zod schemas for runtime validation of extraction data
 */

import { z } from 'zod';

export const qtyBreakSchema = z.object({
  min_qty: z.number().min(0),
  unit_price: z.number().min(0),
});

export const lineItemSchema = z.object({
  supplier_part_number: z.string().min(1),
  description: z.string().min(1),
  uom: z.string().optional(),
  qty_breaks: z.array(qtyBreakSchema).min(1),
  lead_time_days: z.number().int().min(0).optional(),
  moq: z.number().int().min(0).optional(),
});

export const normalizedExtractionSchema = z.object({
  supplier_name: z.string().min(1),
  quote_number: z.string().optional(),
  quote_date: z.string().optional(),
  currency: z.string().optional(),
  valid_until: z.string().optional(),
  notes: z.string().optional(),
  line_items: z.array(lineItemSchema).min(1),
});

export const accuracyMetricsSchema = z.object({
  fields_present: z.number().int(),
  total_fields: z.number().int(),
  completeness_score: z.number().min(0).max(1),
  line_items_count: z.number().int(),
  response_time_ms: z.number(),
  token_usage: z.number().int().optional(),
});

export const extractionResultSchema = z.object({
  raw: z.record(z.any()),
  normalized: normalizedExtractionSchema,
  metrics: accuracyMetricsSchema,
});

/**
 * JSON Schema for OpenAI structured output (strict mode)
 */
export const openAIJsonSchema = {
  type: 'object',
  properties: {
    supplier_name: { type: 'string' },
    quote_number: { type: 'string' },
    quote_date: { type: 'string', format: 'date' },
    currency: { type: 'string' },
    valid_until: { type: 'string', format: 'date' },
    notes: { type: 'string' },
    line_items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          supplier_part_number: { type: 'string' },
          description: { type: 'string' },
          uom: { type: 'string' },
          qty_breaks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                min_qty: { type: 'number' },
                unit_price: { type: 'number' },
              },
              required: ['min_qty', 'unit_price'],
              additionalProperties: false,
            },
          },
          lead_time_days: { type: 'integer' },
          moq: { type: 'integer' },
        },
        required: ['supplier_part_number', 'description'],
        additionalProperties: false,
      },
    },
  },
  required: ['supplier_name', 'line_items'],
  additionalProperties: false,
} as const;

export type NormalizedExtraction = z.infer<typeof normalizedExtractionSchema>;
export type LineItem = z.infer<typeof lineItemSchema>;
export type QtyBreak = z.infer<typeof qtyBreakSchema>;
export type ExtractionResult = z.infer<typeof extractionResultSchema>;

