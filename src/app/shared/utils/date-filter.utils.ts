/**
 * Helpers for turning the date/time values produced by `app-date-time-picker`
 * into backend-ready ISO timestamps, and for validating date-range filters.
 */

/**
 * Combines a date string (e.g. `"2026-06-27"`) with an optional time string
 * (e.g. `"14:30"` or `"14:30:00"`) into a full ISO-like timestamp such as
 * `"2026-06-27T14:30:00"`.
 *
 * When no time is supplied, the time defaults to the start of the day
 * (`00:00:00`), or to the end of the day (`23:59:59`) when `endOfDay` is true.
 */
export function buildIsoTimestamp(date: string, time?: string, endOfDay = false): string {
  const resolvedTime = time
    ? normalizeTime(time)
    : endOfDay
      ? '23:59:59'
      : '00:00:00';

  return `${date}T${resolvedTime}`;
}

export interface DateFilterError {
  message: string;
}

/**
 * Validates a date range coming from the filter UI.
 *
 * Returns a `DateFilterError` describing the first problem found, or `null`
 * when the range is valid (including the case where neither date is set).
 *
 * Only the date portion is considered for the "future" check, so selecting
 * today is always allowed even if the current time has not yet passed.
 *
 * @param isStats when true, the range is additionally capped at 90 days.
 */
export function validateDateRange(
  start?: string,
  end?: string,
  isStats?: boolean,
): DateFilterError | null {
  const hasStart = !!start;
  const hasEnd = !!end;

  if (hasStart !== hasEnd) {
    return { message: 'Please provide both a start date and an end date, or clear both' };
  }

  if (!hasStart && !hasEnd) {
    return null;
  }

  const startDate = toLocalMidnight(start as string);
  const endDate = toLocalMidnight(end as string);

  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (startDate.getTime() > todayMidnight.getTime()) {
    return { message: 'Start date cannot be in the future' };
  }

  if (endDate.getTime() < startDate.getTime()) {
    return { message: 'End date must be after the start date' };
  }

  if (isStats) {
    const msPerDay = 24 * 60 * 60 * 1000;
    const diffDays = Math.round((endDate.getTime() - startDate.getTime()) / msPerDay);
    if (diffDays > 90) {
      return { message: 'Date range for analytics cannot exceed 90 days' };
    }
  }

  return null;
}

/** Normalizes a `HH:mm` or `HH:mm:ss` time string to `HH:mm:ss`. */
function normalizeTime(time: string): string {
  const [hours = '0', minutes = '0', seconds = '0'] = time.split(':');
  return [hours, minutes, seconds].map((part) => part.padStart(2, '0')).join(':');
}

/** Parses the date portion of a value into a local-midnight `Date`. */
function toLocalMidnight(value: string): Date {
  const [year, month, day] = value.split('T')[0].split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}
