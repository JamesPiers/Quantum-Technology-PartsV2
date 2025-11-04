/**
 * Google Document AI extraction provider
 */

import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import { ExtractionResult, NormalizedExtraction, LineItem, normalizedExtractionSchema } from '@/lib/schemas/extraction.schema';
import { IExtractionProvider, ExtractionOptions } from '../types';
import { logger } from '@/lib/utils/logger';
import { calculateAccuracyMetrics } from '@/lib/utils/metrics';
import { normalizeDate, normalizeCurrency, computeValidUntil } from '@/lib/utils/normalize';

export class DocumentAIProvider implements IExtractionProvider {
  private client: DocumentProcessorServiceClient;
  private projectId: string;
  private location: string;
  private processorId: string;
  private processorType: string;

  constructor(processorType: 'general' | 'invoice' = 'general') {
    this.projectId = process.env.GOOGLE_PROJECT_ID!;
    this.location = process.env.GOOGLE_LOCATION || 'us';
    this.processorType = processorType;

    // Select processor ID based on type
    if (processorType === 'invoice') {
      this.processorId = process.env.GOOGLE_PROCESSOR_ID_INVOICE || process.env.GOOGLE_PROCESSOR_ID!;
    } else {
      this.processorId = process.env.GOOGLE_PROCESSOR_ID!;
    }

    // Initialize client with credentials
    this.client = new DocumentProcessorServiceClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });
  }

  getName(): string {
    return this.processorType === 'invoice' ? 'docai-invoice' : 'docai';
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
    
    // Log available entity types for debugging
    const entityTypes = entities.map((e: any) => e.type).filter(Boolean);
    logger.info('DocAI entities found', {
      provider: this.getName(),
      entityTypes: [...new Set(entityTypes)],
      totalEntities: entities.length,
    });
    
    // Extract header-level information
    const supplierName = this.findEntityValue(entities, 'supplier_name') || 'Unknown Supplier';
    const quoteNumber = this.findEntityValue(entities, 'quote_number');
    const rawQuoteDate = this.findEntityValue(entities, 'quote_date');
    const rawCurrency = this.findEntityValue(entities, 'currency');
    const rawValidUntil = this.findEntityValue(entities, 'valid_until');
    const notes = this.findEntityValue(entities, 'notes');

    // Normalize dates and currency
    const quoteDate = normalizeDate(rawQuoteDate);
    const currency = normalizeCurrency(rawCurrency);
    const validUntil = computeValidUntil(quoteDate, rawValidUntil) || normalizeDate(rawValidUntil);

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

    // If no line items found, throw descriptive error
    if (lineItems.length === 0) {
      const errorMsg = this.processorType === 'invoice' 
        ? 'DocAI Invoice Processor found no line items. This processor is designed for invoices, not supplier quotes. Use OpenAI or a custom-trained DocAI processor for supplier quotes.'
        : 'DocAI General Processor found no line items. Generic processors require custom training for supplier quote entity extraction (line_item, supplier_part_number, qty_breaks, etc.). Use OpenAI for supplier quotes.';
      
      throw new Error(errorMsg);
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
        provider: this.getName(),
      });

      // Download PDF
      const pdfBuffer = await this.downloadPdf(options.pdfUrl);

      // Guard: Check PDF size
      if (pdfBuffer.length > 10 * 1024 * 1024) {
        throw new Error(`PDF too large: ${(pdfBuffer.length / 1024 / 1024).toFixed(1)} MB (max 10 MB)`);
      }

      // Construct the processor name
      const name = `projects/${this.projectId}/locations/${this.location}/processors/${this.processorId}`;

      // Build process options (ocrConfig not supported for invoice processor)
      const processOptions: any = {};
      if (this.processorType === 'general') {
        processOptions.ocrConfig = {
          languageHints: ['en'],
        };
      }

      // Process the document with fieldMask to reduce response size
      const [result] = await this.client.processDocument({
        name,
        rawDocument: {
          content: pdfBuffer,
          mimeType: 'application/pdf',
        },
        // Reduce payload: only request entities, text, and tables
        fieldMask: {
          paths: ['entities', 'text', 'pages.tables'],
        },
        ...(Object.keys(processOptions).length > 0 ? { processOptions } : {}),
      });

      const responseTimeMs = Date.now() - startTime;

      if (!result.document) {
        throw new Error('No document returned from Document AI');
      }

      // Normalize the response
      const normalized = this.normalizeResponse(result.document);

      // Validate with Zod
      const validated = normalizedExtractionSchema.parse(normalized);

      // Calculate accuracy metrics
      const metrics = calculateAccuracyMetrics(validated, responseTimeMs);

      logger.info('Document AI extraction completed', {
        documentId: options.documentId,
        provider: this.getName(),
        responseTimeMs,
        lineItemsCount: validated.line_items.length,
      });

      // Build compact raw response (trim to essentials)
      const tablesCSV = (result.document.pages || []).flatMap((page: any) =>
        (page.tables || []).map((table: any) => {
          // Simple CSV representation of table rows
          return (table.headerRows || []).concat(table.bodyRows || [])
            .map((row: any) => (row.cells || []).map((cell: any) => cell.layout?.textAnchor?.content || '').join(','))
            .join('\n');
        })
      );

      return {
        raw: {
          text: result.document.text?.substring(0, 2000), // Limit stored text
          tablesCSV: tablesCSV.slice(0, 5), // Max 5 tables
          entitiesCount: result.document.entities?.length || 0,
        },
        normalized: validated,
        metrics,
      };
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;
      logger.error('Document AI extraction failed', {
        documentId: options.documentId,
        provider: this.getName(),
        error: error instanceof Error ? error.message : String(error),
        responseTimeMs,
      });
      throw error;
    }
  }
}

