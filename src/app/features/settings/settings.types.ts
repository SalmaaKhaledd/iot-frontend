export type SettingsTab = 'thresholds' | 'configuration';

export interface SettingsTabOption {
  id: SettingsTab;
  title: string;
  description: string;
  icon: string;
}

export type ThresholdCondition = 'above' | 'below';

export interface Threshold {
  id: string;
  condition: ThresholdCondition;
  value: number | null;
}

export interface SensorMetric {
  id: string;
  label: string;
  unit: string;
  placeholder: string;
  min: number;
  max: number;
  thresholds: Threshold[];
}

export interface SensorCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  colorClass: 'blue' | 'green' | 'yellow';
  metrics: SensorMetric[];
}

export interface SensorConfiguration {
  trafficReadingInterval: number;
  airQualityReadingInterval: number;
  streetLightReadingInterval: number;
}

export const SETTINGS_TABS: SettingsTabOption[] = [
  {
    id: 'thresholds',
    title: 'Thresholds',
    description: 'Tune alert boundaries for every sensor group',
    icon: 'tune',
  },
  {
    id: 'configuration',
    title: 'Configuration',
    description: 'Set how often each sensor reports data',
    icon: 'schedule',
  },
];

export const DEFAULT_SENSOR_CATEGORIES: SensorCategory[] = [
  {
    id: 'traffic',
    title: 'Traffic Threshold',
    description: 'Set limits for traffic monitoring',
    icon: 'directions_car',
    colorClass: 'blue',
    metrics: [
      {
        id: 'density',
        label: 'Traffic Density',
        unit: 'Vehicles per minute',
        placeholder: 'Enter a value between 0 to 500',
        min: 0,
        max: 500,
        thresholds: [{ id: 't1', condition: 'above', value: null }],
      },
      {
        id: 'speed',
        label: 'Average Speed',
        unit: 'Kilometers per hour',
        placeholder: 'Enter a value between 0 to 120',
        min: 0,
        max: 120,
        thresholds: [{ id: 't3', condition: 'above', value: null }],
      },
    ],
  },
  {
    id: 'air',
    title: 'Air Pollution Threshold',
    description: 'Set limits for air quality monitoring',
    icon: 'air',
    colorClass: 'green',
    metrics: [
      {
        id: 'co',
        label: 'CO (Carbon Monoxide)',
        unit: 'Parts per million (ppm)',
        placeholder: 'Enter a value between 0 to 50',
        min: 0,
        max: 50,
        thresholds: [{ id: 't4', condition: 'above', value: null }],
      },
      {
        id: 'ozone',
        label: 'Ozone (O₃)',
        unit: 'Parts per billion (ppb)',
        placeholder: 'Enter a value between 0 to 300',
        min: 0,
        max: 300,
        thresholds: [{ id: 't6', condition: 'above', value: null }],
      },
    ],
  },
  {
    id: 'street',
    title: 'Street Light Threshold',
    description: 'Set limits for street light monitoring',
    icon: 'lightbulb',
    colorClass: 'yellow',
    metrics: [
      {
        id: 'brightness',
        label: 'Brightness Level',
        unit: 'Percentage (0-100%)',
        placeholder: 'Enter a value between 0 to 100',
        min: 0,
        max: 100,
        thresholds: [{ id: 't7', condition: 'above', value: null }],
      },
      {
        id: 'power',
        label: 'Power Consumption',
        unit: 'Watts (W)',
        placeholder: 'Enter a value between 0 to 5000',
        min: 0,
        max: 5000,
        thresholds: [{ id: 't9', condition: 'above', value: null }],
      },
    ],
  },
];

export const DEFAULT_SENSOR_CONFIGURATION: SensorConfiguration = {
  trafficReadingInterval: 5,
  airQualityReadingInterval: 10,
  streetLightReadingInterval: 15,
};

export function createDefaultSensorCategories(): SensorCategory[] {
  return DEFAULT_SENSOR_CATEGORIES.map((category) => ({
    ...category,
    metrics: category.metrics.map((metric) => ({
      ...metric,
      thresholds: metric.thresholds.map((threshold) => ({ ...threshold })),
    })),
  }));
}

export function createDefaultSensorConfiguration(): SensorConfiguration {
  return { ...DEFAULT_SENSOR_CONFIGURATION };
}