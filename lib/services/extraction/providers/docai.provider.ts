/**
 * Google Document AI extraction provider
 */

import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import { ExtractionResult, NormalizedExtraction, LineItem } from '@/lib/schemas/extraction.schema';
import { IExtractionProvider, ExtractionOptions } from '../types';
import { logger } from '@/lib/utils/logger';
import { calculateAccuracyMetrics } from '@/lib/utils/metrics';

export class DocumentAIProvider implements IExtractionProvider {
  private client: DocumentProcessorServiceClient;
  private projectId: string;
  private location: string;
  private processorId: string;

  constructor() {
    this.projectId = process.env.GOOGLE_PROJECT_ID!;
    this.location = process.env.GOOGLE_LOCATION || 'us';
    this.processorId = process.env.GOOGLE_PROCESSOR_ID!;

    // Initialize client with credentials
    this.client = new DocumentProcessorServiceClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });
  }

  getName(): string {
    return 'docai';
  }

  /**
   * Download PDF from URL
   */
  private async downloadPdf(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download PDF: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Normalize Document AI response to our schema
   */
  private normalizeResponse(docAIResponse: any): NormalizedExtraction {
    const entities = docAIResponse.entities || [];
    
    // Extract header-level information
    const supplierName = this.findEntityValue(entities, 'supplier_name') || 'Unknown Supplier';
    const quoteNumber = this.findEntityValue(entities, 'quote_number');
    const quoteDate = this.findEntityValue(entities, 'quote_date');
    const currency = this.findEntityValue(entities, 'currency');
    const validUntil = this.findEntityValue(entities, 'valid_until');
    const notes = this.findEntityValue(entities, 'notes');

    // Extract line items
    const lineItems: LineItem[] = [];
    const lineItemEntities = entities.filter((e: any) => e.type === 'line_item');

    for (const lineItemEntity of lineItemEntities) {
      const properties = lineItemEntity.properties || [];
      
      const supplierPartNumber = this.findPropertyValue(properties, 'supplier_part_number');
      const description = this.findPropertyValue(properties, 'description');
      const uom = this.findPropertyValue(properties, 'uom');
      const leadTimeDays = this.findPropertyValue(properties, 'lead_time_days');
      const moq = this.findPropertyValue(properties, 'moq');

      // Extract quantity breaks
      const qtyBreaks = [];
      const qtyBreakProps = properties.filter((p: any) => p.type === 'qty_break');
      
      for (const qtyBreakProp of qtyBreakProps) {
        const minQty = parseFloat(this.findPropertyValue(qtyBreakProp.properties, 'min_qty') || '0');
        const unitPrice = parseFloat(this.findPropertyValue(qtyBreakProp.properties, 'unit_price') || '0');
        qtyBreaks.push({ min_qty: minQty, unit_price: unitPrice });
      }

      // If no qty breaks found, create a default one
      if (qtyBreaks.length === 0) {
        const unitPrice = parseFloat(this.findPropertyValue(properties, 'unit_price') || '0');
        qtyBreaks.push({ min_qty: 1, unit_price: unitPrice });
      }

      if (supplierPartNumber && description) {
        lineItems.push({
          supplier_part_number: supplierPartNumber,
          description,
          uom,
          qty_breaks: qtyBreaks,
          lead_time_days: leadTimeDays ? parseInt(leadTimeDays) : undefined,
          moq: moq ? parseInt(moq) : undefined,
        });
      }
    }

    return {
      supplier_name: supplierName,
      quote_number: quoteNumber,
      quote_date: quoteDate,
      currency,
      valid_until: validUntil,
      notes,
      line_items: lineItems,
    };
  }

  /**
   * Find entity value by type
   */
  private findEntityValue(entities: any[], type: string): string | undefined {
    const entity = entities.find((e: any) => e.type === type);
    return entity?.mentionText || entity?.normalizedValue?.text;
  }

  /**
   * Find property value by type
   */
  private findPropertyValue(properties: any[], type: string): string | undefined {
    const prop = properties?.find((p: any) => p.type === type);
    return prop?.mentionText || prop?.normalizedValue?.text;
  }

  /**
   * Extract structured data using Document AI
   */
  async extract(options: ExtractionOptions): Promise<ExtractionResult> {
    const startTime = Date.now();

    try {
      logger.info('Starting Document AI extraction', {
        documentId: options.documentId,
        supplierId: options.supplierId,
        provider: 'docai',
      });

      // Download PDF
      const pdfBuffer = await this.downloadPdf(options.pdfUrl);

      // Construct the processor name
      const name = `projects/${this.projectId}/locations/${this.location}/processors/${this.processorId}`;

      // Process the document
      const [result] = await this.client.processDocument({
        name,
        rawDocument: {
          content: pdfBuffer,
          mimeType: 'application/pdf',
        },
      });

      const responseTimeMs = Date.now() - startTime;

      if (!result.document) {
        throw new Error('No document returned from Document AI');
      }

      // Normalize the response
      const normalized = this.normalizeResponse(result.document);

      // Calculate accuracy metrics
      const metrics = calculateAccuracyMetrics(normalized, responseTimeMs);

      logger.info('Document AI extraction completed', {
        documentId: options.documentId,
        provider: 'docai',
        responseTimeMs,
        lineItemsCount: normalized.line_items?.length || 0,
      });

      return {
        raw: {
          document: result.document,
          text: result.document.text,
        },
        normalized,
        metrics,
      };
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;
      logger.error('Document AI extraction failed', {
        documentId: options.documentId,
        provider: 'docai',
        error: error instanceof Error ? error.message : String(error),
        responseTimeMs,
      });
      throw error;
    }
  }
}

