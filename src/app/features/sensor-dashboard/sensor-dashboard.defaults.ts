import type { SelectOption, StatMetricDef } from './sensor-dashboard.config';

export const BACK_ROUTE = '/home';

export const BASE_SORT_OPTIONS: SelectOption[] = [
  { label: 'Most recent first', value: 'timestamp:desc' },
  { label: 'Oldest first', value: 'timestamp:asc' },
];

export const ALERTS_TRIGGERED_METRIC: StatMetricDef = {
  key: 'alertsTriggered',
  label: 'Alerts triggered',
};

export const DEFAULT_CHART_COLORS = {
  primary: '#378add',
  secondary: '#1d9e75',
}; 