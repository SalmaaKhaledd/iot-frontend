import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { timeout, tap } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import type {
  AirPollutionSensorReading,
  StreetLightSensorReading,
  TrafficSensorReading,
} from '../models/sensor-reading.models';
import { AlertsService } from '../../../core/services/alerts.service';

@Injectable({ providedIn: 'root' })
export class SensorReadingsService {
  private readonly http = inject(HttpClient);
  private readonly alertsService = inject(AlertsService);
  private readonly baseUrl = environment.apiUrl;

  getTrafficReadings(): Observable<TrafficSensorReading[]> {
    return this.http
      .get<TrafficSensorReading[]>(`${this.baseUrl}/sensors/traffic`)
      .pipe(
        timeout(10000),
        tap(() => this.alertsService.refreshAlerts())
      );
  }

  getAirPollutionReadings(): Observable<AirPollutionSensorReading[]> {
    return this.http
      .get<AirPollutionSensorReading[]>(`${this.baseUrl}/sensors/air-pollution`)
      .pipe(
        timeout(10000),
        tap(() => this.alertsService.refreshAlerts())
      );
  }

  getStreetLightReadings(): Observable<StreetLightSensorReading[]> {
    return this.http
      .get<StreetLightSensorReading[]>(`${this.baseUrl}/sensors/street-lights`)
      .pipe(
        timeout(10000),
        tap(() => this.alertsService.refreshAlerts())
      );
  }

  getTrafficReadingById(id: string): Observable<TrafficSensorReading> {
    return this.http
      .get<TrafficSensorReading>(`${this.baseUrl}/sensors/traffic/${id}`)
      .pipe(timeout(10000));
  }

  getAirPollutionReadingById(id: string): Observable<AirPollutionSensorReading> {
    return this.http
      .get<AirPollutionSensorReading>(`${this.baseUrl}/sensors/air-pollution/${id}`)
      .pipe(timeout(10000));
  }

  getStreetLightReadingById(id: string): Observable<StreetLightSensorReading> {
    return this.http
      .get<StreetLightSensorReading>(`${this.baseUrl}/sensors/street-lights/${id}`)
      .pipe(timeout(10000));
  }
}