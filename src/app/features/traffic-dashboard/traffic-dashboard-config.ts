import type { SensorDashboardConfig } from '../sensor-dashboard/sensor-dashboard.config';
import {
  ALERTS_TRIGGERED_METRIC,
  BACK_ROUTE,
  BASE_SORT_OPTIONS,
  DEFAULT_CHART_COLORS,
} from '../sensor-dashboard/sensor-dashboard.defaults';

export const trafficDashboardConfig: SensorDashboardConfig = {
  sensorType: 'traffic',
  title: 'Traffic dashboard',
  backRoute: BACK_ROUTE,

  columns: [
    { key: 'timestamp', label: 'Timestamp' },
    { key: 'location', label: 'Location' },
    { key: 'trafficDensity', label: 'Density' },
    { key: 'avgSpeed', label: 'Avg speed', unit: 'km/h' },
    { key: 'congestionLevel', label: 'Congestion' },
  ],

  locationOptions: [
    { label: 'Ring Road', value: 'CAIRO_RING_ROAD' },
    { label: 'October Bridge', value: 'OCTOBER_BRIDGE' },
    { label: 'Salah Salem Road', value: 'SALAH_SALEM' },
  ],

  sortOptions: [
    ...BASE_SORT_OPTIONS,
    { label: 'Density (high to low)', value: 'trafficDensity:desc' },
    { label: 'Density (low to high)', value: 'trafficDensity:asc' },
    { label: 'Speed (high to low)', value: 'avgSpeed:desc' },
    { label: 'Speed (low to high)', value: 'avgSpeed:asc' },
  ],

  extraFilterConfig: [
    {
      kind: 'select',
      key: 'congestionLevel',
      label: 'Congestion',
      placeholder: 'All levels',
      testId: 'congestion-select',
      options: [
        { label: 'Low', value: 'LOW' },
        { label: 'Moderate', value: 'MODERATE' },
        { label: 'High', value: 'HIGH' },
        { label: 'Severe', value: 'SEVERE' },
      ],
    },
  ],

  statsConfig: {
    metrics: [
      { key: 'avgTrafficDensity', label: 'Avg density' },
      { key: 'avgSpeed', label: 'Avg speed', unit: 'km/h' },
      ALERTS_TRIGGERED_METRIC,
    ],
  },

  charts: {
    metric1: { key: 'avgSpeed', label: 'Avg speed over time', color: DEFAULT_CHART_COLORS.primary },
    metric2: { key: 'avgTrafficDensity', label: 'Vehicle density over time', color: DEFAULT_CHART_COLORS.secondary },
    distributionChart: {
      field: 'congestionLevelDistribution',
      label: 'Congestion distribution',
      colorMap: {
        LOW: '#4ade80',
        MODERATE: '#facc15',
        HIGH: '#fb923c',
        SEVERE: '#f87171',
      },
    },
  },

  testIds: {
    page: 'traffic-dashboard-page',
    table: 'traffic-table',
    row: 'traffic-row',
  },
};