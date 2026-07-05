import type { SensorDashboardConfig } from '../sensor-dashboard/sensor-dashboard.config';

export const trafficDashboardConfig: SensorDashboardConfig = {
  sensorType: 'traffic',
  title: 'Traffic dashboard',
  backRoute: '/home',

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
    { label: 'Most recent first', value: 'timestamp:desc' },
    { label: 'Oldest first', value: 'timestamp:asc' },
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
      { key: 'alertsTriggered', label: 'Alerts triggered' },
    ],
  },

  charts: {
    metric1: { key: 'avgSpeed', label: 'Avg speed over time', color: '#378add' },
    metric2: { key: 'avgTrafficDensity', label: 'Vehicle density over time', color: '#1d9e75' },
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
