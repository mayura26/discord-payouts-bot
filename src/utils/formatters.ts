const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Format a number as USD currency (e.g. $1,234.56) */
export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount);
}

/** Convert an ISO date string to a Discord relative timestamp (<t:unix:R>) */
export function formatRelativeTime(isoDate: string): string {
  const unix = Math.floor(new Date(isoDate + 'Z').getTime() / 1000);
  return `<t:${unix}:R>`;
}

/** Convert an ISO date string to a Discord short date timestamp (<t:unix:d>) */
export function formatShortDate(isoDate: string): string {
  const unix = Math.floor(new Date(isoDate + 'Z').getTime() / 1000);
  return `<t:${unix}:d>`;
}
