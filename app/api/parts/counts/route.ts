import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Fetch all parts with only catalog info to minimize data transfer
    // In a larger system, this should be replaced with a database view or RPC
    const { data, error } = await supabaseAdmin
      .from('parts')
      .select('catalog_code, sub_catalog_code');

    if (error) {
      logger.error('Failed to fetch part counts', { error: error.message });
      return NextResponse.json({ error: 'Failed to fetch counts' }, { status: 500 });
    }

    // Calculate counts
    const catalogCounts: Record<string, number> = {};
    const subCatalogCounts: Record<string, number> = {};

    data.forEach(part => {
      // Count for catalog
      if (part.catalog_code) {
        catalogCounts[part.catalog_code] = (catalogCounts[part.catalog_code] || 0) + 1;

        // Count for sub-catalog (key: "CATALOG:SUBCATALOG" to ensure uniqueness)
        if (part.sub_catalog_code) {
          const key = `${part.catalog_code}:${part.sub_catalog_code}`;
          subCatalogCounts[key] = (subCatalogCounts[key] || 0) + 1;
        }
      }
    });

    return NextResponse.json({
      catalogCounts,
      subCatalogCounts
    });

  } catch (error) {
    logger.error('Part counts API error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

