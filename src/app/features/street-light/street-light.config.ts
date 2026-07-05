import type { SensorDashboardConfig } from '../sensor-dashboard/sensor-dashboard.config';

export const streetLightConfig: SensorDashboardConfig = {
  sensorType: 'street-lights',
  title: 'Street light dashboard',
  backRoute: '/home',

  columns: [
    { key: 'timestamp', label: 'Timestamp' },
    { key: 'location', label: 'Location' },
    { key: 'brightnessLevel', label: 'Brightness', unit: '%' },
    { key: 'powerConsumption', label: 'Power consumption', unit: 'W' },
    { key: 'status', label: 'Status' },
  ],

  locationOptions: [
    { label: 'Cairo Zamalek', value: 'CAIRO_ZAMALEK' },
    { label: 'Cairo Downtown', value: 'CAIRO_DOWNTOWN' },
    { label: 'Cairo New Cairo', value: 'CAIRO_NEW_CAIRO' },
  ],

  sortOptions: [
    { label: 'Most recent first', value: 'timestamp:desc' },
    { label: 'Oldest first', value: 'timestamp:asc' },
    { label: 'Brightness (high to low)', value: 'brightnessLevel:desc' },
    { label: 'Brightness (low to high)', value: 'brightnessLevel:asc' },
    { label: 'Power (high to low)', value: 'powerConsumption:desc' },
    { label: 'Power (low to high)', value: 'powerConsumption:asc' },
  ],

  extraFilterConfig: [
    {
      kind: 'select',
      key: 'status',
      label: 'Status',
      placeholder: 'All statuses',
      options: [
        { label: 'On', value: 'ON' },
        { label: 'Off', value: 'OFF' },
      ],
    },
  ],

  statsConfig: {
    metrics: [
      { key: 'avgBrightness', label: 'Avg brightness', unit: '%' },
      { key: 'avgPowerConsumption', label: 'Avg power', unit: 'W' },
      { key: 'alertsTriggered', label: 'Alerts triggered' },
    ],
  },

  charts: {
    metric1: { key: 'avgBrightness', label: 'Avg brightness over time', color: '#378add' },
    metric2: { key: 'avgPowerConsumption', label: 'Avg power over time', color: '#1d9e75' },
    distributionChart: {
      field: 'statusDistribution',
      label: 'Status distribution',
      colorMap: {
        ON: '#facc15',
        OFF: '#94a3b8',
      },
    },
  },
};
