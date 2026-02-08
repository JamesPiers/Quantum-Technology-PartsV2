/**
 * Zod schemas for API request/response validation
 */

import { z } from 'zod';

// Upload API
export const uploadRequestSchema = z.object({
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  supplierId: z.string().uuid().optional(), // Optional - will be determined from PDF
});

export const uploadResponseSchema = z.object({
  uploadUrl: z.string().url(),
  documentId: z.string().uuid(),
  filePath: z.string(),
});

// Extract API
export const extractRequestSchema = z.object({
  documentId: z.string().uuid(),
  provider: z.enum(['docai', 'docai-invoice', 'openai', 'mock']).optional(),
});

export const extractResponseSchema = z.object({
  extractionId: z.string().uuid(),
  status: z.string(),
});

// Approve API
export const approveRequestSchema = z.object({
  extractionId: z.string().uuid(),
});

export const approveResponseSchema = z.object({
  success: z.boolean(),
  partsCreated: z.number(),
  pricesCreated: z.number(),
});

// Parts API
export const createPartSchema = z.object({
  sku: z.string().min(1),
  supplier_part_number: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  catalog_code: z.string().nullable().optional(),
  sub_catalog_code: z.string().nullable().optional(),
  manufacturer_id: z.string().uuid().nullable().optional(),
  attributes: z.record(z.any()).nullable().optional(),
  drawing_url: z.string().url().nullable().optional(),
  // Optional initial price/document details
  initial_price: z.object({
    unit_price: z.number().nonnegative(),
    currency: z.string(),
    supplier_id: z.string().uuid(),
  }).optional(),
  document_id: z.string().uuid().nullable().optional(),
});

export const updatePartSchema = createPartSchema.partial();

// Orders API
export const createOrderSchema = z.object({
  type: z.enum(['quote', 'purchase_order']),
  customer_name: z.string().optional(),
  currency: z.string().default('USD'),
});

export const updateOrderSchema = createOrderSchema.partial().extend({
  status: z.enum(['draft', 'submitted', 'approved', 'completed', 'cancelled']).optional(),
});

export const createOrderItemSchema = z.object({
  order_id: z.string().uuid(),
  part_id: z.string().uuid(),
  supplier_id: z.string().uuid(),
  quantity: z.number().positive(),
  unit_price: z.number().positive(),
  currency: z.string().default('USD'),
});

export const updateOrderItemSchema = createOrderItemSchema.partial().omit({ order_id: true });

export type UploadRequest = z.infer<typeof uploadRequestSchema>;
export type UploadResponse = z.infer<typeof uploadResponseSchema>;
export type ExtractRequest = z.infer<typeof extractRequestSchema>;
export type ExtractResponse = z.infer<typeof extractResponseSchema>;
export type ApproveRequest = z.infer<typeof approveRequestSchema>;
export type ApproveResponse = z.infer<typeof approveResponseSchema>;
export type CreatePart = z.infer<typeof createPartSchema>;
export type UpdatePart = z.infer<typeof updatePartSchema>;
export type CreateOrder = z.infer<typeof createOrderSchema>;
export type UpdateOrder = z.infer<typeof updateOrderSchema>;
export type CreateOrderItem = z.infer<typeof createOrderItemSchema>;
export type UpdateOrderItem = z.infer<typeof updateOrderItemSchema>;

