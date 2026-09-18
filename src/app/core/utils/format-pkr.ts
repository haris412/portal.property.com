/** Format a rupee amount the same way listing prices are shown (PKR 8,900). */
export function formatPkrAmount(amount: number | null | undefined): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) {
    return 'PKR 0';
  }
  return `PKR ${Math.round(n).toLocaleString('en-US')}`;
}
