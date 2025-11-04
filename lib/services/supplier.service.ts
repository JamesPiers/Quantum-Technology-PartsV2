/**
 * Supplier service - handles supplier matching and creation
 */

import { supabaseAdmin } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';

export interface FindOrCreateSupplierOptions {
  supplierName: string;
  email?: string;
  currency?: string;
}

/**
 * Find an existing supplier by name (case-insensitive) or create a new one
 */
export async function findOrCreateSupplier(
  options: FindOrCreateSupplierOptions
): Promise<string> {
  const { supplierName, email, currency = 'USD' } = options;

  // Normalize the supplier name for matching
  const normalizedName = supplierName.trim();

  try {
    // Try to find existing supplier by name (case-insensitive)
    const { data: existingSuppliers, error: findError } = await supabaseAdmin
      .from('suppliers')
      .select('id, name')
      .ilike('name', normalizedName)
      .limit(1);

    if (findError) {
      logger.error('Error searching for supplier', {
        error: findError.message,
        supplierName: normalizedName,
      });
      throw findError;
    }

    // If supplier exists, return its ID
    if (existingSuppliers && existingSuppliers.length > 0) {
      logger.info('Found existing supplier', {
        supplierId: existingSuppliers[0].id,
        supplierName: existingSuppliers[0].name,
      });
      return existingSuppliers[0].id;
    }

    // Create new supplier
    const { data: newSupplier, error: createError } = await supabaseAdmin
      .from('suppliers')
      .insert({
        name: normalizedName,
        email,
        currency,
      })
      .select()
      .single();

    if (createError) {
      logger.error('Error creating new supplier', {
        error: createError.message,
        supplierName: normalizedName,
      });
      throw createError;
    }

    logger.info('Created new supplier', {
      supplierId: newSupplier.id,
      supplierName: newSupplier.name,
    });

    return newSupplier.id;
  } catch (error) {
    logger.error('Supplier service error', {
      error: error instanceof Error ? error.message : String(error),
      supplierName: normalizedName,
    });
    throw error;
  }
}

/**
 * Get supplier by ID
 */
export async function getSupplierById(supplierId: string) {
  const { data, error } = await supabaseAdmin
    .from('suppliers')
    .select('*')
    .eq('id', supplierId)
    .single();

  if (error) {
    logger.error('Error fetching supplier', {
      error: error.message,
      supplierId,
    });
    throw error;
  }

  return data;
}

