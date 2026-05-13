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