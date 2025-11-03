/**
 * Types for extraction service
 */

import { ExtractionResult } from '@/lib/schemas/extraction.schema';

export interface ExtractionOptions {
  pdfUrl: string;
  supplierId: string;
  documentId: string;
}

export interface IExtractionProvider {
  /**
   * Extract data from a PDF document
   */
  extract(options: ExtractionOptions): Promise<ExtractionResult>;

  /**
   * Get provider name
   */
  getName(): string;
}

