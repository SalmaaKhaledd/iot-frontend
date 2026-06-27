/**
 * Configuration contract for the generic `SensorDashboard` component.
 *
 * Everything that differs between the Traffic, Air Quality and Street Light
 * dashboards is described here, so a single component can render all three by
 * being handed a different `SensorDashboardConfig`.
 */

export type SensorType = 'traffic' | 'air-pollution' | 'street-lights';

/** A single option for a dropdown (`app-custom-select`). */
export interface SelectOption {
  /** Display text, e.g. "Cairo Maadi". */
  label: string;
  /** Backend value, e.g. "CAIRO_MAADI". */
  value: string;
}

/** Describes one column of the readings table. */
export interface ColumnDef {
  /** Field name on the reading object, e.g. "avgSpeed". */
  key: string;
  /** Header text, e.g. "Avg speed". */
  label: string;
  /** Optional unit appended to cell values, e.g. "ppm" or "%". */
  unit?: string;
}

/** A sensor-specific dropdown filter, e.g. pollution level or ON/OFF status. */
export interface ExtraSelectFilter {
  kind: 'select';
  /** Param key sent to the backend, e.g. "pollutionLevel" or "status". */
  key: string;
  label: string;
  placeholder?: string;
  options: SelectOption[];
  /** Optional data-testid override (defaults to `extra-filter-<key>`). */
  testId?: string;
}

/** A sensor-specific numeric min/max range filter, e.g. PM2.5 or brightness. */
export interface ExtraRangeFilter {
  kind: 'range';
  label: string;
  /** Param key for the lower bound, e.g. "minPm2_5". */
  minKey: string;
  /** Param key for the upper bound, e.g. "maxPm2_5". */
  maxKey: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export type ExtraFilterDef = ExtraSelectFilter | ExtraRangeFilter;

/** One analytics summary metric, read off the stats response by `key`. */
export interface StatMetricDef {
  /** Field on the stats response, e.g. "avgCo" or "alertsTriggered". */
  key: string;
  label: string;
  unit?: string;
}

/** Describes the analytics section. */
export interface StatsConfig {
  metrics: StatMetricDef[];
}

/**
 * A line-chart series driven by the `dailyAverages` array on the stats response.
 * `key` is the field on each daily-average entry, e.g. "avgSpeed".
 */
export interface LineChartMetric {
  key: string;
  label: string;
  /** Line/point color as a hex string, e.g. "#378add". */
  color: string;
}

/**
 * A doughnut chart driven by a distribution object on the stats response
 * (e.g. `congestionLevelDistribution`).
 */
export interface DistributionChartConfig {
  /** Field on the stats response holding the distribution object. */
  field: string;
  /** Chart title, e.g. "Congestion distribution". */
  label: string;
  /** Maps each category/level name to a hex color, e.g. { LOW: "#4ade80" }. */
  colorMap: Record<string, string>;
}

/**
 * Optional analytics charts. Any subset may be provided; dashboards with no
 * `charts` block render the stat cards only and show no chart section.
 */
export interface ChartsConfig {
  metric1?: LineChartMetric;
  metric2?: LineChartMetric;
  distributionChart?: DistributionChartConfig;
}

/**
 * Per-dashboard data-testid overrides for the elements whose ids historically
 * differed between dashboards (e.g. traffic's legacy Selenium ids). When a value
 * is omitted, the generic default is used.
 */
export interface DashboardTestIds {
  /** Root page element. Default: "sensor-dashboard-page". */
  page?: string;
  /** Readings table element. Default: "sensor-table". */
  table?: string;
  /** Readings table row. Default: "sensor-row". */
  row?: string;
}

export interface SensorDashboardConfig {
  /** Drives which service / stats method is called. */
  sensorType: SensorType;
  /** Page title, e.g. "Air quality dashboard". */
  title: string;
  /** Route the back button / breadcrumb navigates to, e.g. "/home". */
  backRoute: string;
  /** Table columns, rendered dynamically (headers + rows). */
  columns: ColumnDef[];
  /** Options for the location dropdown. */
  locationOptions: SelectOption[];
  /** Options for the sort dropdown (value formatted like "timestamp:desc"). */
  sortOptions: SelectOption[];
  /** Optional sensor-specific filters (selects and/or numeric ranges). */
  extraFilterConfig?: ExtraFilterDef[];
  /** Analytics summary-card configuration. */
  statsConfig: StatsConfig;
  /** Optional analytics charts (two line charts + a distribution doughnut). */
  charts?: ChartsConfig;
  /** Optional per-dashboard data-testid overrides. */
  testIds?: DashboardTestIds;
}
