/**
 * Normalization utilities for extraction data
 */

/**
 * Normalize date string to ISO 8601 format (YYYY-MM-DD)
 * Handles various input formats and returns ISO string or undefined
 */
export function normalizeDate(dateStr: string | undefined): string | undefined {
  if (!dateStr || typeof dateStr !== 'string') return undefined;

  const cleaned = dateStr.trim();
  if (!cleaned) return undefined;

  // Already ISO format
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return cleaned;
  }

  // Try parsing with Date constructor
  try {
    const parsed = new Date(cleaned);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  } catch {
    // Invalid date
  }

  return undefined;
}

/**
 * Normalize currency to 3-letter uppercase code
 * Detects common currency names and symbols
 */
export function normalizeCurrency(currencyStr: string | undefined): string | undefined {
  if (!currencyStr || typeof currencyStr !== 'string') return undefined;

  const cleaned = currencyStr.trim().toUpperCase();
  if (!cleaned) return undefined;

  // Already 3-letter code
  if (/^[A-Z]{3}$/.test(cleaned)) {
    return cleaned;
  }

  // Common mappings
  const currencyMap: Record<string, string> = {
    'CAD': 'CAD',
    'CANADIAN': 'CAD',
    'CANADIAN DOLLAR': 'CAD',
    'CANADIAN DOLLARS': 'CAD',
    'C$': 'CAD',
    'USD': 'USD',
    'US DOLLAR': 'USD',
    'US DOLLARS': 'USD',
    '$': 'USD',
    'EUR': 'EUR',
    'EURO': 'EUR',
    'EUROS': 'EUR',
    '€': 'EUR',
    'GBP': 'GBP',
    'POUND': 'GBP',
    'POUNDS': 'GBP',
    '£': 'GBP',
  };

  // Check for exact match
  if (currencyMap[cleaned]) {
    return currencyMap[cleaned];
  }

  // Check if any key is contained in the string
  for (const [key, value] of Object.entries(currencyMap)) {
    if (cleaned.includes(key)) {
      return value;
    }
  }

  return undefined;
}

/**
 * Compute valid_until date from quote_date and relative expression
 * Examples: "30 days", "valid 30 days", "net 30"
 */
export function computeValidUntil(
  quoteDate: string | undefined,
  validUntilStr: string | undefined
): string | undefined {
  if (!quoteDate || !validUntilStr) return undefined;

  // Try to parse as absolute date first
  const absoluteDate = normalizeDate(validUntilStr);
  if (absoluteDate) return absoluteDate;

  // Extract number of days from relative expression
  const daysMatch = validUntilStr.match(/(\d+)\s*days?/i);
  if (!daysMatch) return undefined;

  const days = parseInt(daysMatch[1], 10);
  if (isNaN(days)) return undefined;

  try {
    const baseDate = new Date(quoteDate);
    if (isNaN(baseDate.getTime())) return undefined;

    baseDate.setDate(baseDate.getDate() + days);
    return baseDate.toISOString().split('T')[0];
  } catch {
    return undefined;
  }
}

