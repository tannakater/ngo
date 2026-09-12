/**
 * Helper utilities for public verification URLs and QR code payloads
 */

export function getMemberVerificationUrl(
  member: { id: string; memberId?: string },
  organization?: { qrVerificationUrl?: string }
): string {
  const identifier = (member.memberId || member.id || '').trim();
  const rawBase = organization?.qrVerificationUrl?.trim();

  // If a custom verification template or URL is provided
  if (rawBase) {
    if (rawBase.includes('{{memberId}}') || rawBase.includes('{{id}}')) {
      return rawBase
        .replace(/\{\{memberId\}\}/g, encodeURIComponent(identifier))
        .replace(/\{\{id\}\}/g, encodeURIComponent(identifier));
    }

    // Clean up if the base already ends with ?id= or ?id=
    if (rawBase.endsWith('?id=') || rawBase.endsWith('&id=') || rawBase.endsWith('=')) {
      return `${rawBase}${encodeURIComponent(identifier)}`;
    }

    // If it already has query parameters
    if (rawBase.includes('?')) {
      return `${rawBase}&id=${encodeURIComponent(identifier)}`;
    }

    // Standard base URL without query parameters
    const cleanBase = rawBase.replace(/\/+$/, '');
    return `${cleanBase}/verify?id=${encodeURIComponent(identifier)}`;
  }

  // Default to current host's /verify endpoint
  const origin = typeof window !== 'undefined' && window.location?.origin 
    ? window.location.origin 
    : '';

  return `${origin}/verify?id=${encodeURIComponent(identifier)}`;
}

export function getDonationVerificationUrl(receiptNumber: string): string {
  const origin = typeof window !== 'undefined' && window.location?.origin 
    ? window.location.origin 
    : '';
  return `${origin}/verify?receipt=${encodeURIComponent(receiptNumber)}`;
}
