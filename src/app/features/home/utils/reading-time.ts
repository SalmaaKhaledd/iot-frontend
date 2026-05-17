/** Parse API timestamps (ISO or `yyyy-MM-ddTHH:mm:ss`). */
export function parseReadingTimestamp(timestamp: string): Date | null {
  const parsed = new Date(timestamp);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** e.g. `11:25 AM` in the user's local timezone. */
export function formatClockTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Relative label for history dropdowns, e.g. `5 mins ago (11:25 AM)`.
 */
export function formatRelativeWithClock(date: Date, now: Date = new Date()): string {
  const clock = formatClockTime(date);
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) {
    return `Just now (${clock})`;
  }
  if (diffMins < 60) {
    return `${diffMins} min${diffMins > 1 ? 's' : ''} ago (${clock})`;
  }
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago (${clock})`;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/** Full stamp for the selected reading chip, e.g. `May 17, 2026, 11:25 AM`. */
export function formatReadingMetaTimestamp(timestamp: string): string {
  const parsed = parseReadingTimestamp(timestamp);
  if (!parsed) {
    return timestamp;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(parsed);
}

/** Short clock label for trend chart bars. */
export function formatTrendBarTime(timestamp: string): string {
  const parsed = parseReadingTimestamp(timestamp);
  if (!parsed) {
    return timestamp;
  }
  return formatClockTime(parsed);
}
