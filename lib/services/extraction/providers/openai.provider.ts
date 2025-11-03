/**
 * OpenAI extraction provider using GPT-4 with structured outputs
 */

import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { ExtractionResult, NormalizedExtraction } from '@/lib/schemas/extraction.schema';
import { IExtractionProvider, ExtractionOptions } from '../types';
import { logger } from '@/lib/utils/logger';
import { calculateAccuracyMetrics } from '@/lib/utils/metrics';
import { openAIJsonSchema } from '@/lib/schemas/extraction.schema';

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
   * Extract structured data using OpenAI API
   */
  async extract(options: ExtractionOptions): Promise<ExtractionResult> {
    const startTime = Date.now();

    try {
      logger.info('Starting OpenAI extraction', {
        documentId: options.documentId,
        supplierId: options.supplierId,
        provider: 'openai',
      });

      // Download and extract text from PDF
      const pdfPath = await this.downloadPdf(options.pdfUrl);
      const pdfText = await this.extractTextFromPdf(pdfPath);

      // Clean up temp file
      fs.unlinkSync(pdfPath);

      // Call OpenAI API with structured output
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert at extracting structured data from supplier quote documents.
Extract all relevant information from the provided text and return it in the specified JSON format.
For qty_breaks, extract all quantity price breaks mentioned in the document.
If a field is not present in the document, omit it from the response.`,
          },
          {
            role: 'user',
            content: `Extract structured data from this supplier quote document:\n\n${pdfText}`,
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

      const responseTimeMs = Date.now() - startTime;
      const tokenUsage = completion.usage?.total_tokens;

      // Parse the response
      const rawResponse = completion.choices[0].message.content;
      if (!rawResponse) {
        throw new Error('Empty response from OpenAI');
      }

      const normalized: NormalizedExtraction = JSON.parse(rawResponse);

      // Calculate accuracy metrics
      const metrics = calculateAccuracyMetrics(normalized, responseTimeMs, tokenUsage);

      logger.info('OpenAI extraction completed', {
        documentId: options.documentId,
        provider: 'openai',
        responseTimeMs,
        tokenUsage,
        lineItemsCount: normalized.line_items?.length || 0,
      });

      return {
        raw: {
          model: completion.model,
          usage: completion.usage,
          response: rawResponse,
          extracted_text: pdfText.substring(0, 1000), // Store first 1000 chars for reference
        },
        normalized,
        metrics,
      };
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;
      logger.error('OpenAI extraction failed', {
        documentId: options.documentId,
        provider: 'openai',
        error: error instanceof Error ? error.message : String(error),
        responseTimeMs,
      });
      throw error;
    }
  }
}

