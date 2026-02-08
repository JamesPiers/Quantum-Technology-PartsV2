/**
 * Extraction service - provider-agnostic interface for document extraction
 */

import { ExtractionResult } from '@/lib/schemas/extraction.schema';
import { IExtractionProvider, ExtractionOptions } from './types';
import { OpenAIProvider } from './providers/openai.provider';
import { DocumentAIProvider } from './providers/docai.provider';
import { MockProvider } from './providers/mock.provider';
import { logger } from '@/lib/utils/logger';

export type ProviderType = 'openai' | 'docai' | 'docai-invoice' | 'mock';

export class ExtractionService {
  private providers: Map<ProviderType, IExtractionProvider> = new Map();
  private defaultProvider: ProviderType =
    (process.env.USE_PROVIDER as ProviderType) || 'mock';

  /** Lazy-init providers so build can complete without OPENAI/Google env vars (e.g. on Vercel). */
  private getProvider(type: ProviderType): IExtractionProvider {
    let p = this.providers.get(type);
    if (!p) {
      switch (type) {
        case 'openai':
          p = new OpenAIProvider();
          break;
        case 'docai':
          p = new DocumentAIProvider('general');
          break;
        case 'docai-invoice':
          p = new DocumentAIProvider('invoice');
          break;
        case 'mock':
          p = new MockProvider();
          break;
        default:
          throw new Error(`Unknown provider: ${type}`);
      }
      this.providers.set(type, p);
    }
    return p;
  }

  /**
   * Extract data from a document using the specified or default provider
   */
  async extract(
    options: ExtractionOptions,
    providerType?: ProviderType
  ): Promise<ExtractionResult> {
    const provider = providerType || this.defaultProvider;
    const providerInstance = this.getProvider(provider);

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
    const known: ProviderType[] = ['openai', 'docai', 'docai-invoice', 'mock'];
    if (!known.includes(provider)) {
      throw new Error(`Unknown provider: ${provider}`);
    }
    this.defaultProvider = provider;
  }

  /**
   * Get list of available providers
   */
  getAvailableProviders(): ProviderType[] {
    return ['openai', 'docai', 'docai-invoice', 'mock'];
  }
}

// Export singleton instance
export const extractionService = new ExtractionService();

