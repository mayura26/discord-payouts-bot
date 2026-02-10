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

/** Convert milliseconds to a human-readable duration (e.g. "1h 23m 45s" or "2m 22s") */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
  return parts.join(' ');
}
