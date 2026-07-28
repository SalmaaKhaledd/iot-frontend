import type { SensorDashboardConfig } from '../sensor-dashboard/sensor-dashboard.config';
import {
  ALERTS_TRIGGERED_METRIC,
  BACK_ROUTE,
  BASE_SORT_OPTIONS,
  DEFAULT_CHART_COLORS,
} from '../sensor-dashboard/sensor-dashboard.defaults';

export const airQualityConfig: SensorDashboardConfig = {
  sensorType: 'air-pollution',
  title: 'Air quality dashboard',
  backRoute: BACK_ROUTE,

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
    ...BASE_SORT_OPTIONS,
    { label: 'CO (high to low)', value: 'co:desc' },
    { label: 'CO (low to high)', value: 'co:asc' },
    { label: 'Ozone (high to low)', value: 'ozone:desc' },
    { label: 'Ozone (low to high)', value: 'ozone:asc' },
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
      ALERTS_TRIGGERED_METRIC,
    ],
  },

  charts: {
    metric1: { key: 'avgCo', label: 'Avg CO over time', color: DEFAULT_CHART_COLORS.primary },
    metric2: { key: 'avgOzone', label: 'Avg ozone over time', color: DEFAULT_CHART_COLORS.secondary },
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