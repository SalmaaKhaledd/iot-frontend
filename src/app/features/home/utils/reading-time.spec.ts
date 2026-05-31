import {
  formatClockTime,
  formatRelativeWithClock,
  formatReadingMetaTimestamp,
} from './reading-time';

describe('reading-time', () => {
  it('formatRelativeWithClock includes clock time for recent readings', () => {
    const now = new Date('2026-05-17T12:00:00');
    const reading = new Date('2026-05-17T11:25:00');
    const label = formatRelativeWithClock(reading, now);
    expect(label).toContain('ago');
    expect(label).toMatch(/11:25\s*AM/i);
  });

  it('formatClockTime uses 12-hour clock', () => {
    const date = new Date('2026-05-17T14:30:00');
    expect(formatClockTime(date)).toMatch(/2:30\s*PM/i);
  });

  it('formatReadingMetaTimestamp includes date and AM/PM', () => {
    const formatted = formatReadingMetaTimestamp('2026-05-17T11:25:00');
    expect(formatted).toMatch(/May/i);
    expect(formatted).toMatch(/11:25\s*AM/i);
  });
});
