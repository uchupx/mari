/**
 * Global date/time formatting helpers for Unix timestamps (seconds or milliseconds).
 *
 * Timestamps from Suwayomi (`uploadDate`, `lastReadAt`, `fetchedAt`) are Unix seconds;
 * client-generated ones (Date.now()) are milliseconds. All helpers accept both.
 */

/** True when the value is plausibly in milliseconds rather than seconds. */
const isMillis = (timestamp: number): boolean => timestamp > 1e11;

/** Normalize seconds/millis to milliseconds. Values ≤ 0 pass through (callers decide). */
const toMillis = (timestamp: number): number => (isMillis(timestamp) ? timestamp : timestamp * 1000);

/**
 * Convert a Unix timestamp to a localized date-time string.
 * @example formatDateTime(1758249600) → "Sep 19, 2025, 02:30"
 */
export const formatDateTime = (timestamp: number): string =>
  new Date(toMillis(timestamp)).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

/**
 * Relative time from now, e.g. "just now", "5 minutes ago", "3 days ago",
 * "2 months ago". Values in the future clamp to "just now".
 */
export const formatRelativeTime = (timestamp: number): string => {
  const seconds = Math.floor((Date.now() - toMillis(timestamp)) / 1000);
  if (seconds < 60) return 'just now';

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['week', 604_800],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ];

  for (const [unit, secs] of units) {
    if (seconds >= secs) {
      return new Intl.RelativeTimeFormat(undefined, { numeric: 'always', style: 'long' })
        .format(-Math.floor(seconds / secs), unit);
    }
  }
  return 'just now';
};
