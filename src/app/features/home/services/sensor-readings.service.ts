import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import type {
  AirPollutionSensorReading,
  StreetLightSensorReading,
  TrafficSensorReading,
} from '../models/sensor-reading.models';

@Injectable({ providedIn: 'root' })
export class SensorReadingsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getTrafficReadings(): Observable<TrafficSensorReading[]> {
    return this.http
      .get<TrafficSensorReading[]>(`${this.baseUrl}/sensors/traffic`)
      .pipe(timeout(10000));
  }

  getAirPollutionReadings(): Observable<AirPollutionSensorReading[]> {
    return this.http
      .get<AirPollutionSensorReading[]>(`${this.baseUrl}/sensors/air-pollution`)
      .pipe(timeout(10000));
  }

  getStreetLightReadings(): Observable<StreetLightSensorReading[]> {
    return this.http
      .get<StreetLightSensorReading[]>(`${this.baseUrl}/sensors/street-lights`)
      .pipe(timeout(10000));
  }
}