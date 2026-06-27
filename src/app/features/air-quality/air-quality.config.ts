import type { SensorDashboardConfig } from '../sensor-dashboard/sensor-dashboard.config';

export const airQualityConfig: SensorDashboardConfig = {
  sensorType: 'air-pollution',
  title: 'Air quality dashboard',
  backRoute: '/home',

  columns: [
    { key: 'timestamp', label: 'Timestamp' },
    { key: 'location', label: 'Location' },
    { key: 'co', label: 'CO level', unit: 'ppm' },
    { key: 'ozone', label: 'Ozone level', unit: 'ppm' },
    { key: 'no2', label: 'NO2 level', unit: 'ppm' },
    { key: 'so2', label: 'SO2 level', unit: 'ppm' },
    { key: 'pm2_5', label: 'PM2.5', unit: 'µg/m³' },
    { key: 'pm10', label: 'PM10', unit: 'µg/m³' },
    { key: 'pollutionLevel', label: 'Pollution level' },
  ],

  locationOptions: [
    { label: 'Cairo Nasr City', value: 'CAIRO_NASR_CITY' },
    { label: 'Cairo Maadi', value: 'CAIRO_MAADI' },
    { label: 'Cairo Heliopolis', value: 'CAIRO_HELIOPOLIS' },
  ],

  sortOptions: [
    { label: 'Most recent first', value: 'timestamp:desc' },
    { label: 'Highest CO first', value: 'co:desc' },
    { label: 'Highest ozone first', value: 'ozone:desc' },
  ],

  extraFilterConfig: [
    {
      kind: 'select',
      key: 'pollutionLevel',
      label: 'Pollution level',
      placeholder: 'All levels',
      options: [
        { label: 'Good', value: 'GOOD' },
        { label: 'Moderate', value: 'MODERATE' },
        { label: 'Unhealthy', value: 'UNHEALTHY' },
        { label: 'Very unhealthy', value: 'VERY_UNHEALTHY' },
        { label: 'Hazardous', value: 'HAZARDOUS' },
      ],
    },
  ],

  statsConfig: {
    metrics: [
      { key: 'avgCo', label: 'Avg CO', unit: 'ppm' },
      { key: 'avgOzone', label: 'Avg ozone', unit: 'ppm' },
      { key: 'alertsTriggered', label: 'Alerts triggered' },
    ],
  },

  charts: {
    metric1: { key: 'avgCo', label: 'Avg CO over time', color: '#378add' },
    metric2: { key: 'avgOzone', label: 'Avg ozone over time', color: '#1d9e75' },
    distributionChart: {
      field: 'pollutionLevelDistribution',
      label: 'Pollution distribution',
      colorMap: {
        GOOD: '#4ade80',
        MODERATE: '#facc15',
        UNHEALTHY: '#fb923c',
        VERY_UNHEALTHY: '#f87171',
        HAZARDOUS: '#b91c1c',
      },
    },
  },
};
