const AMOUNT = /^\d+([.,]\d{1,2})?$/;
const MAX_CENTS = 2_147_483_647;

export function parseAmountToCents(input: string): number | null {
  const value = input.trim();
  if (!AMOUNT.test(value)) {
    return null;
  }
  const [whole, fraction = ''] = value.replace(',', '.').split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return cents > MAX_CENTS ? null : cents;
}

export function formatCents(cents: number): string {
  const rest = String(cents % 100).padStart(2, '0');
  return `${Math.floor(cents / 100)}.${rest}`;
}

/** Hermes on iOS often formats with the code, so the common symbols are known here. */
const SYMBOLS: Record<string, string> = { USD: '$', EUR: '€', GBP: '£' };

export function currencySymbol(code: string): string {
  const known = SYMBOLS[code.toUpperCase()];
  if (known) return known;
  try {
    const parts = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
    }).formatToParts(0);
    return parts.find((part) => part.type === 'currency')?.value ?? code;
  } catch {
    return code;
  }
}
