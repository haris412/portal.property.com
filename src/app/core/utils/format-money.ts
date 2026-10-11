/**
 * Same rounding as LocateHome.api currencyService.convertFromPkr:
 * amountMinor = round(pkr * rate * 10^exponent), then snap 3-decimal currencies.
 */
export function convertPkrAmount(amountPkr: number, rate: number, exponent: number): number {
  const baseAmount = Math.round(Number(amountPkr) || 0);
  const scale = 10 ** exponent;
  let amountMinor = Math.round(baseAmount * rate * scale);
  if (exponent === 3) {
    amountMinor = Math.round(amountMinor / 10) * 10;
  }
  if (!Number.isFinite(amountMinor) || amountMinor < 0) return 0;
  return amountMinor / scale;
}

function defaultLocale(): string {
  return typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'en';
}

/** Format an amount that is already in `currency` (no further conversion). */
export function formatMoney(
  amount: number | null | undefined,
  currency: string | null | undefined,
  locale: string = defaultLocale(),
): string {
  const code = String(currency || 'PKR').trim().toUpperCase() || 'PKR';
  const value = Number(amount);
  const safe = Number.isFinite(value) ? value : 0;

  for (const tag of [locale, 'en']) {
    try {
      return new Intl.NumberFormat(tag, {
        style: 'currency',
        currency: code,
        currencyDisplay: 'narrowSymbol',
      }).format(safe);
    } catch {
      // Try the next locale, then a plain code prefix.
    }
  }

  return `${code} ${safe}`;
}
