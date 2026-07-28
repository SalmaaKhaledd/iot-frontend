import { describe, it, expect } from 'vitest';
import {
  buildAlertSummary,
  formatAlertDate,
  alertRangeText,
  enumFilter,
} from './alert-modal-utils';
import type { ApiAlert } from '../../../core/services/alerts.service';

const baseAlert: ApiAlert = {
  id: '1',
  sensorType: 'TRAFFIC',
  location: 'Ring Road',
  metric: 'TRAFFIC_DENSITY',
  triggeredValue: 450,
  thresholdValue: 400,
  alertType: 'ABOVE',
  triggeredAt: '2026-05-08T10:30:00.000Z',
  readingId: '123',
};

describe('buildAlertSummary', () => {
  it('builds correct summary for ABOVE alert', () => {
    const result = buildAlertSummary(baseAlert);
    expect(result.direction).toBe('ABOVE');
    expect(result.message).toContain('exceeded threshold');
    expect(result.message).toContain('Ring Road');
    expect(result.report).toContain('450');
    expect(result.report).toContain('400');
    expect(result.title).toContain('TRAFFIC DENSITY');
  });

  it('builds correct summary for BELOW alert', () => {
    const result = buildAlertSummary({ ...baseAlert, alertType: 'BELOW' });
    expect(result.direction).toBe('BELOW');
    expect(result.message).toContain('dropped below threshold');
  });

  it('handles missing metric gracefully', () => {
    const result = buildAlertSummary({ ...baseAlert, metric: null as any });
    expect(result.title).toContain('Sensor');
  });

  it('handles missing location gracefully', () => {
    const result = buildAlertSummary({ ...baseAlert, location: null as any });
    expect(result.message).toContain('Unknown Location');
  });

  it('handles missing triggeredValue and thresholdValue', () => {
    const result = buildAlertSummary({
      ...baseAlert,
      triggeredValue: null as any,
      thresholdValue: null as any,
    });
    expect(result.report).toContain('N/A');
  });

  it('uses current time when triggeredAt is missing', () => {
    const result = buildAlertSummary({ ...baseAlert, triggeredAt: null as any });
    expect(result.time).not.toBe('Unknown Time');
  });
});

describe('formatAlertDate', () => {
  it('formats a valid ISO date correctly', () => {
    const result = formatAlertDate('2026-05-08T10:30:00.000Z');
    expect(result).toMatch(/\d+ \w+, \d+:\d+ (AM|PM)/);
  });

  it('returns Unknown Time for empty string', () => {
    expect(formatAlertDate('')).toBe('Unknown Time');
  });

  it('returns Unknown Time for invalid date string', () => {
    expect(formatAlertDate('not-a-date')).toBe('Unknown Time');
  });

  it('handles midnight correctly — 0 hours becomes 12 AM', () => {
    const result = formatAlertDate('2026-05-08T00:00:00.000Z');
    expect(result).toContain('AM');
  });

  it('handles noon correctly — 12 hours stays 12 PM', () => {
    const result = formatAlertDate('2026-05-08T12:00:00.000Z');
    expect(result).toContain('PM');
  });
});

describe('alertRangeText', () => {
  it('returns correct range for first page', () => {
    expect(alertRangeText(1, 10, 25)).toBe('1-10 of 25');
  });

  it('returns correct range for last page with partial results', () => {
    expect(alertRangeText(3, 10, 25)).toBe('21-25 of 25');
  });

  it('returns 0 of 0 when total is 0', () => {
    expect(alertRangeText(1, 10, 0)).toBe('0 of 0');
  });

  it('returns correct range for single item', () => {
    expect(alertRangeText(1, 10, 1)).toBe('1-1 of 1');
  });
});

describe('enumFilter', () => {
  const values = { low: 'LOW', high: 'HIGH', moderate: 'MODERATE' } as const;

  it('returns undefined when filter is all', () => {
    expect(enumFilter('all', values)).toBeUndefined();
  });

  it('returns mapped value for known filter', () => {
    expect(enumFilter('low', values)).toBe('LOW');
    expect(enumFilter('high', values)).toBe('HIGH');
  });

  it('returns undefined for unknown filter key', () => {
    expect(enumFilter('unknown', values)).toBeUndefined();
  });
});