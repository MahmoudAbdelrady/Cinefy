const SUBTYPE_CHIP: Record<string, string> = {
  mastercard: 'MC',
  visa: 'VISA',
  amex: 'AMEX',
  americanexpress: 'AMEX',
};

export function brandChip(cardBrand: string): string {
  const key = cardBrand.toLowerCase().replace(/\s+/g, '');
  return SUBTYPE_CHIP[key] ?? cardBrand.slice(0, 4).toUpperCase();
}
