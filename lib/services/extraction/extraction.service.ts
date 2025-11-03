/**
 * Extraction service - provider-agnostic interface for document extraction
 */

import { ExtractionResult } from '@/lib/schemas/extraction.schema';
import { IExtractionProvider, ExtractionOptions } from './types';
import { OpenAIProvider } from './providers/openai.provider';
import { DocumentAIProvider } from './providers/docai.provider';
import { MockProvider } from './providers/mock.provider';
import { logger } from '@/lib/utils/logger';

export type ProviderType = 'openai' | 'docai' | 'mock';

export class ExtractionService {
  private providers: Map<ProviderType, IExtractionProvider>;
  private defaultProvider: ProviderType;

  constructor() {
    // Initialize providers
    this.providers = new Map();
    this.providers.set('openai', new OpenAIProvider());
    this.providers.set('docai', new DocumentAIProvider());
    this.providers.set('mock', new MockProvider());

    // Set default provider from env or fallback to mock
    this.defaultProvider = (process.env.USE_PROVIDER as ProviderType) || 'mock';
  }

  /**
   * Extract data from a document using the specified or default provider
   */
  async extract(
    options: ExtractionOptions,
    providerType?: ProviderType
  ): Promise<ExtractionResult> {
    const provider = providerType || this.defaultProvider;
    const providerInstance = this.providers.get(provider);

    if (!providerInstance) {
      throw new Error(`Unknown provider: ${provider}`);
    }

    logger.info('Starting extraction', {
      documentId: options.documentId,
      provider: providerInstance.getName(),
    });

    try {
      const result = await providerInstance.extract(options);
      return result;
    } catch (error) {
      logger.error('Extraction failed', {
        documentId: options.documentId,
        provider: providerInstance.getName(),
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get the default provider
   */
  getDefaultProvider(): ProviderType {
    return this.defaultProvider;
  }

  /**
   * Set the default provider
   */
  setDefaultProvider(provider: ProviderType): void {
    if (!this.providers.has(provider)) {
      throw new Error(`Unknown provider: ${provider}`);
    }
    this.defaultProvider = provider;
  }

  /**
   * Get list of available providers
   */
  getAvailableProviders(): ProviderType[] {
    return Array.from(this.providers.keys());
  }
}

// Export singleton instance
export const extractionService = new ExtractionService();

