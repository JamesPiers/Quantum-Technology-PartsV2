/**
 * OpenAI extraction provider using GPT-4 with structured outputs
 */

import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { ExtractionResult, NormalizedExtraction, normalizedExtractionSchema } from '@/lib/schemas/extraction.schema';
import { IExtractionProvider, ExtractionOptions } from '../types';
import { logger } from '@/lib/utils/logger';
import { calculateAccuracyMetrics } from '@/lib/utils/metrics';
import { openAIJsonSchema } from '@/lib/schemas/extraction.schema';
import { normalizeDate, normalizeCurrency, computeValidUntil } from '@/lib/utils/normalize';

// Dynamic import for pdf-parse (only needed server-side)
let pdfParse: any;

export class OpenAIProvider implements IExtractionProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  getName(): string {
    return 'openai';
  }

  /**
   * Download PDF from URL to temporary location
   */
  private async downloadPdf(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download PDF: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const tmpPath = path.join('/tmp', `pdf-${Date.now()}.pdf`);
    fs.writeFileSync(tmpPath, Buffer.from(buffer));
    return tmpPath;
  }

  /**
   * Extract text from PDF using pdf-parse
   */
  private async extractTextFromPdf(pdfPath: string): Promise<string> {
    // Lazy load pdf-parse
    if (!pdfParse) {
      pdfParse = (await import('pdf-parse')).default;
    }

    const dataBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdfParse(dataBuffer);
    return pdfData.text;
  }

  /**
   * Normalize extracted data (dates, currency, nulls)
   */
  private normalizeExtraction(raw: any): NormalizedExtraction {
    // Convert null to undefined for optional fields
    const cleaned: any = {
      supplier_name: raw.supplier_name,
      quote_number: raw.quote_number || undefined,
      notes: raw.notes || undefined,
      line_items: raw.line_items,
    };

    // Normalize dates
    cleaned.quote_date = normalizeDate(raw.quote_date) || undefined;
    
    // Normalize currency (prefer CAD if mentioned)
    cleaned.currency = normalizeCurrency(raw.currency) || undefined;
    
    // Compute or normalize valid_until
    if (raw.valid_until) {
      cleaned.valid_until = computeValidUntil(cleaned.quote_date, raw.valid_until) || normalizeDate(raw.valid_until) || undefined;
    }

    return cleaned;
  }

  /**
   * Extract structured data using OpenAI API
   */
  async extract(options: ExtractionOptions): Promise<ExtractionResult> {
    const startTime = Date.now();
    let pdfPath: string | null = null;

    try {
      logger.info('Starting OpenAI extraction', {
        documentId: options.documentId,
        provider: 'openai',
      });

      // Download and extract text from PDF
      pdfPath = await this.downloadPdf(options.pdfUrl);
      const pdfText = await this.extractTextFromPdf(pdfPath);

      // Guard: Check text size
      if (pdfText.length > 500000) {
        throw new Error(`PDF text too large: ${pdfText.length} chars (max 500k)`);
      }

      // Attempt extraction with retry on validation failure
      let lastError: Error | null = null;
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const completion = await this.client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `Extract supplier quote data. Rules:
- Return ONLY valid JSON matching the schema. No prose, no commentary.
- Omit fields not found in the document (use null for optionals).
- Dates: ISO 8601 format (YYYY-MM-DD).
- Currency: 3-letter uppercase code (CAD, USD, EUR, etc.). Prefer CAD if explicitly stated.
- qty_breaks: Extract all quantity price tiers. Each line_item must have at least one qty_break.
- Never invent values. If uncertain, omit the field.`,
              },
              {
                role: 'user',
                content: attempt === 1 
                  ? `Extract data from this supplier quote:\n\n${pdfText}`
                  : `Previous attempt failed validation: ${lastError?.message}\n\nRetry extraction from:\n\n${pdfText}`,
              },
            ],
            response_format: {
              type: 'json_schema',
              json_schema: {
                name: 'supplier_quote',
                strict: true,
                schema: openAIJsonSchema,
              },
            },
            temperature: 0,
          });

          const rawResponse = completion.choices[0].message.content;
          if (!rawResponse) {
            throw new Error('Empty response from OpenAI');
          }

          // Parse and normalize
          const parsed = JSON.parse(rawResponse);
          const normalized = this.normalizeExtraction(parsed);

          // Validate with Zod
          const validated = normalizedExtractionSchema.parse(normalized);

          // Success
          const responseTimeMs = Date.now() - startTime;
          const tokenUsage = completion.usage?.total_tokens;
          const metrics = calculateAccuracyMetrics(validated, responseTimeMs, tokenUsage);

          logger.info('OpenAI extraction completed', {
            documentId: options.documentId,
            attempt,
            responseTimeMs,
            tokenUsage,
            lineItemsCount: validated.line_items.length,
          });

          return {
            raw: {
              model: completion.model,
              usage: completion.usage,
              response: rawResponse.substring(0, 2000), // Limit stored response
            },
            normalized: validated,
            metrics,
          };
        } catch (validationError) {
          lastError = validationError instanceof Error ? validationError : new Error(String(validationError));
          logger.warn('OpenAI extraction validation failed', {
            documentId: options.documentId,
            attempt,
            error: lastError.message,
          });
          if (attempt === 2) throw lastError;
        }
      }

      throw new Error('Extraction failed after retries');
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;
      logger.error('OpenAI extraction failed', {
        documentId: options.documentId,
        error: error instanceof Error ? error.message : String(error),
        responseTimeMs,
      });
      throw error;
    } finally {
      // Clean up temp file
      if (pdfPath) {
        try {
          fs.unlinkSync(pdfPath);
        } catch {}
      }
    }
  }
}

