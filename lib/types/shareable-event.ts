/**
 * Shareable Split Event Types
 *
 * Optimized for URL compression using short keys:
 * - n: name
 * - d: description
 * - dt: date
 * - p: participants
 * - r: receipts (optional)
 * - px: PIX key
 * - pn: PIX name
 * - pd: paid participant IDs
 */

export interface ShareableParticipant {
  i: string;           // id
  n: string;           // name
  w: number;           // weight
  ap: number;          // amountPaid
}

export interface ShareableReceipt {
  d: string;           // description
  m: string | null;    // merchantName
  a: number;           // amount
  pb: string[];        // paidBy (participant ids)
}

export interface ShareableEventData {
  n: string;                      // name
  d: string | null;               // description
  dt: string;                     // eventDate (ISO string)
  p: ShareableParticipant[];      // participants
  r?: ShareableReceipt[];         // receipts (optional)
  px?: string;                    // pixKey
  pn?: string;                    // pixName
  pd?: string[];                  // paidParticipantIds
}

/**
 * PIX Payment Information for QR code generation
 */
export interface PIXPaymentInfo {
  pixKey: string;
  recipientName: string;
  amount: number;
  description: string;
  city?: string;
  transactionId?: string;
}

/**
 * Settlement with PIX information
 */
export interface SettlementWithPIX {
  from: string;          // participant name
  to: string;            // participant name
  amount: number;
  pixPayload?: string;   // Generated PIX QR code payload
}
