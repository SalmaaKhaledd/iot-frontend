export type TrafficCongestionLevel = 'Low' | 'Moderate' | 'High' | 'Severe';
export type PollutionLevel = 'Good' | 'Moderate' | 'Unhealthy' | 'Very Unhealthy';
export type StreetLightStatus = 'ON' | 'OFF';

export interface TrafficSensorReading {
  readonly id: string;
  readonly location: string;
  readonly timestamp: string;
  readonly trafficDensity: number;
  readonly avgSpeed: number;
  readonly congestionLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';
}

export interface AirPollutionSensorReading {
  readonly id: string;
  readonly location: string;
  readonly timestamp: string;
  readonly pm2_5: number;
  readonly pm10: number;
  readonly co: number;
  readonly no2: number;
  readonly so2: number;
  readonly ozone: number;
  readonly pollutionLevel: 'GOOD' | 'MODERATE' | 'UNHEALTHY' | 'VERY_UNHEALTHY' | 'HAZARDOUS';
}

export interface StreetLightSensorReading {
  readonly id: string;
  readonly location: string;
  readonly timestamp: string;
  readonly brightnessLevel: number;
  readonly powerConsumption: number;
  readonly status: StreetLightStatus;
}

export interface PaginatedResponse<T> {
  readonly content: T[];
  readonly totalElements: number;
  readonly totalPages: number;
  /** Current page index, 0-indexed. */
  readonly number: number;
  /** Page size. */
  readonly size: number;
}

export interface TrafficQueryParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  location?: string;
  minDensity?: number;
  maxDensity?: number;
  minSpeed?: number;
  maxSpeed?: number;
  congestionLevel?: 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';
  timestampStart?: string;
  timestampEnd?: string;
}

// ── Sensor reading query params ─────────────────────────────────────────────
// All fields optional: filters are never required.

export interface BaseSensorParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  location?: string;
  timestampStart?: string;
  timestampEnd?: string;
}

export type TrafficParams = BaseSensorParams;

export interface AirPollutionParams extends BaseSensorParams {
  minPm2_5?: number;
  maxPm2_5?: number;
  minPm10?: number;
  maxPm10?: number;
  minCo?: number;
  maxCo?: number;
  minNo2?: number;
  maxNo2?: number;
  minSo2?: number;
  maxSo2?: number;
  minOzone?: number;
  maxOzone?: number;
  pollutionLevel?: 'GOOD' | 'MODERATE' | 'UNHEALTHY' | 'VERY_UNHEALTHY' | 'HAZARDOUS';
}

export interface StreetLightParams extends BaseSensorParams {
  minBrightness?: number;
  maxBrightness?: number;
  minPower?: number;
  maxPower?: number;
  status?: 'ON' | 'OFF';
}

// ── Stats query params and responses ────────────────────────────────────────

export interface StatsParams {
  from?: string;
  to?: string;
  location?: string;
}

export interface TrafficStats {
  readonly avgTrafficDensity: number;
  readonly avgSpeed: number;
  readonly alertsTriggered: number;
  readonly congestionLevelDistribution: Record<string, number>;
  readonly dailyAverages: readonly {
    readonly date: string;
    readonly avgTrafficDensity: number;
    readonly avgSpeed: number;
  }[];
}

export interface AirPollutionStats {
  readonly avgCo: number;
  readonly avgOzone: number;
  readonly alertsTriggered: number;
  readonly pollutionLevelDistribution: Record<string, number>;
  readonly dailyAverages: readonly {
    readonly date: string;
    readonly avgCo: number;
    readonly avgOzone: number;
  }[];
}

export interface StreetLightStats {
  readonly avgBrightness: number;
  readonly avgPowerConsumption: number;
  readonly alertsTriggered: number;
  readonly statusDistribution: { readonly ON: number; readonly OFF: number };
  readonly dailyAverages: readonly {
    readonly date: string;
    readonly avgBrightness: number;
    readonly avgPowerConsumption: number;
  }[];
}
