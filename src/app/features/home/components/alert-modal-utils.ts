import type { ApiAlert } from '../../../core/services/alerts.service';

export interface AlertSummary {
  title: string;
  message: string;
  report: string;
  direction: 'ABOVE' | 'BELOW';
  time: string;
}

export function buildAlertSummary(alert: ApiAlert): AlertSummary {
  const metricName = (alert.metric || 'Sensor').replaceAll('_',  ' ');
  const isBelow = alert.alertType === 'BELOW';
  const direction = isBelow ? 'BELOW' : 'ABOVE';
  const directionVerb = isBelow ? 'dropped below' : 'exceeded';

  return {
    title: `${metricName} Alert`,
    message: `${metricName} in ${alert.location || 'Unknown Location'} ${directionVerb} threshold.`,
    report: `${metricName} reached ${alert.triggeredValue ?? 'N/A'} (Threshold: ${alert.thresholdValue ?? 'N/A'}).`,
    direction,
    time: formatAlertDate(alert.triggeredAt || new Date().toISOString()),
  };
}

export function formatAlertDate(isoString: string): string {
  if (!isoString) return 'Unknown Time';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return 'Unknown Time';

  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'short' });
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours %= 12;
  hours = hours || 12;

  return `${day} ${month}, ${hours}:${minutes} ${ampm}`;
}

export function alertRangeText(currentPage: number, pageSize: number, total: number): string {
  if (total === 0) return '0 of 0';
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, total);
  return `${start}-${end} of ${total}`;
}

export function enumFilter<T extends string>(filter: string, values: Record<string, T>): T | undefined {
  return filter === 'all' ? undefined : values[filter];
}
