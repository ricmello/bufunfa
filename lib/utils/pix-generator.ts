// @ts-ignore - qrcode-pix has incorrect type definitions
import { QrCodePix } from 'qrcode-pix';
import type { PIXPaymentInfo } from '@/lib/types/shareable-event';

/**
 * Generates PIX payment QR code payload (BR Code)
 * Follows Brazilian Central Bank standards
 */
export function generatePIXPayload(info: PIXPaymentInfo): string {
  try {
    const qrCodePix = QrCodePix({
      version: '01',
      key: info.pixKey,
      name: info.recipientName,
      city: info.city || 'Sao Paulo',
      transactionId: info.transactionId || generateTransactionId(),
      message: info.description,
      value: info.amount,
    });

    return qrCodePix.payload();
  } catch (error) {
    console.error('Error generating PIX payload:', error);
    throw new Error('Failed to generate PIX QR code');
  }
}

/**
 * Formats amount for PIX (always 2 decimal places)
 */
export function formatPIXAmount(amount: number): string {
  return amount.toFixed(2);
}

/**
 * Generates a unique transaction ID for PIX
 * Format: timestamp + random chars (max 25 chars)
 */
function generateTransactionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}${random}`.substring(0, 25);
}

/**
 * Validates PIX key format
 * Supports: CPF, CNPJ, email, phone, random key
 */
export function validatePIXKey(key: string): {
  isValid: boolean;
  type?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  error?: string;
} {
  if (!key || key.trim().length === 0) {
    return { isValid: false, error: 'PIX key is required' };
  }

  const trimmedKey = key.trim();

  // CPF: 11 digits (with or without formatting)
  const cpfRegex = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;
  if (cpfRegex.test(trimmedKey)) {
    return { isValid: true, type: 'cpf' };
  }

  // CNPJ: 14 digits (with or without formatting)
  const cnpjRegex = /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/;
  if (cnpjRegex.test(trimmedKey)) {
    return { isValid: true, type: 'cnpj' };
  }

  // Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(trimmedKey)) {
    return { isValid: true, type: 'email' };
  }

  // Phone: Brazilian format +55 (11) 98765-4321 or variants
  const phoneRegex = /^\+?55\s?(\(?\d{2}\)?)?\s?\d{4,5}-?\d{4}$/;
  if (phoneRegex.test(trimmedKey)) {
    return { isValid: true, type: 'phone' };
  }

  // Random key: 32 alphanumeric characters (UUID-like)
  const randomKeyRegex = /^[a-f0-9]{8}-?[a-f0-9]{4}-?[a-f0-9]{4}-?[a-f0-9]{4}-?[a-f0-9]{12}$/i;
  if (randomKeyRegex.test(trimmedKey)) {
    return { isValid: true, type: 'random' };
  }

  return {
    isValid: false,
    error: 'Invalid PIX key format. Use CPF, CNPJ, email, phone, or random key.',
  };
}
