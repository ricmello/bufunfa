import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import type { ShareableEventData } from '@/lib/types/shareable-event';

/**
 * Compresses event data into URL-safe string
 * Uses lz-string for 50-70% compression ratio
 */
export function compressEventData(data: ShareableEventData): string {
  try {
    const json = JSON.stringify(data);
    const compressed = compressToEncodedURIComponent(json);
    return compressed;
  } catch (error) {
    console.error('Error compressing event data:', error);
    throw new Error('Failed to compress event data');
  }
}

/**
 * Decompresses URL-safe string back to event data
 * Returns null if decompression fails
 */
export function decompressEventData(compressed: string): ShareableEventData | null {
  try {
    const json = decompressFromEncodedURIComponent(compressed);
    if (!json) {
      return null;
    }
    const data = JSON.parse(json) as ShareableEventData;

    // Validate required fields
    if (!data.n || !data.dt || !data.p || data.p.length === 0) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error decompressing event data:', error);
    return null;
  }
}

/**
 * Builds full and short shareable URLs with compressed data
 * Returns both full URL and short URL variant
 */
export function buildShareableUrl(
  data: ShareableEventData,
  baseUrl: string
): { fullUrl: string; shortUrl: string; compressedSize: number } {
  const compressed = compressEventData(data);
  const compressedSize = compressed.length;

  // Remove trailing slash from baseUrl
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');

  // Full URL: /split-bills/share#compressed
  const fullUrl = `${cleanBaseUrl}/split-bills/share#${compressed}`;

  // Short URL: /s/{first8chars}#compressed
  const shortId = compressed.substring(0, 8);
  const shortUrl = `${cleanBaseUrl}/s/${shortId}#${compressed}`;

  return { fullUrl, shortUrl, compressedSize };
}

/**
 * Updates payment status in URL hash
 * Modifies the paid participant list and returns new compressed hash
 */
export function updatePaymentStatusInUrl(
  currentData: ShareableEventData,
  participantId: string,
  isPaid: boolean
): string {
  const updatedData = { ...currentData };

  if (!updatedData.pd) {
    updatedData.pd = [];
  }

  if (isPaid) {
    // Add to paid list if not already there
    if (!updatedData.pd.includes(participantId)) {
      updatedData.pd.push(participantId);
    }
  } else {
    // Remove from paid list
    updatedData.pd = updatedData.pd.filter(id => id !== participantId);
  }

  return compressEventData(updatedData);
}

/**
 * Validates URL size is within browser limits
 * Most browsers support 2000+ characters, but we warn at 1800
 */
export function validateUrlSize(url: string): {
  isValid: boolean;
  size: number;
  warning?: string;
} {
  const size = url.length;

  if (size > 2000) {
    return {
      isValid: false,
      size,
      warning: 'URL exceeds browser limits (2000 characters). Consider excluding receipts.',
    };
  }

  if (size > 1800) {
    return {
      isValid: true,
      size,
      warning: 'URL is approaching size limits. Consider excluding receipts to ensure compatibility.',
    };
  }

  return { isValid: true, size };
}
