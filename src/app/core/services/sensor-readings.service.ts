import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { timeout, tap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';

import type {
  AirPollutionParams,
  AirPollutionSensorReading,
  AirPollutionStats,
  PaginatedResponse,
  StatsParams,
  StreetLightParams,
  StreetLightSensorReading,
  StreetLightStats,
  TrafficParams,
  TrafficSensorReading,
  TrafficStats,
} from '../models/sensor-reading.models';

import { AlertsService } from './alerts.service';

@Injectable({ providedIn: 'root' })
export class SensorReadingsService {
  private readonly http = inject(HttpClient);
  private readonly alertsService = inject(AlertsService);
  private readonly baseUrl = environment.apiUrl;

  // ── Paginated readings ─────────────────────────────────────────────────────

  getTrafficReadings(params: TrafficParams = {}): Observable<PaginatedResponse<TrafficSensorReading>> {
    return this.http
      .get<PaginatedResponse<TrafficSensorReading>>(`${this.baseUrl}/sensors/traffic`, {
        params: this.toHttpParams(params),
      })
      .pipe(
        timeout(10000),
        tap(() => this.alertsService.refreshAlerts())
      );
  }

  getAirPollutionReadings(
    params: AirPollutionParams = {}
  ): Observable<PaginatedResponse<AirPollutionSensorReading>> {
    return this.http
      .get<PaginatedResponse<AirPollutionSensorReading>>(`${this.baseUrl}/sensors/air-pollution`, {
        params: this.toHttpParams(params),
      })
      .pipe(
        timeout(10000),
        tap(() => this.alertsService.refreshAlerts())
      );
  }

  getStreetLightReadings(
    params: StreetLightParams = {}
  ): Observable<PaginatedResponse<StreetLightSensorReading>> {
    return this.http
      .get<PaginatedResponse<StreetLightSensorReading>>(`${this.baseUrl}/sensors/street-lights`, {
        params: this.toHttpParams(params),
      })
      .pipe(
        timeout(10000),
        tap(() => this.alertsService.refreshAlerts())
      );
  }

  // ── Stats ──────────────────────────────────────────────────────────────────

  getTrafficStats(params: StatsParams = {}): Observable<TrafficStats> {
    return this.http
      .get<TrafficStats>(`${this.baseUrl}/sensors/traffic/stats`, {
        params: this.toHttpParams(params),
      })
      .pipe(timeout(10000));
  }

  getAirPollutionStats(params: StatsParams = {}): Observable<AirPollutionStats> {
    return this.http
      .get<AirPollutionStats>(`${this.baseUrl}/sensors/air-pollution/stats`, {
        params: this.toHttpParams(params),
      })
      .pipe(timeout(10000));
  }

  getStreetLightStats(params: StatsParams = {}): Observable<StreetLightStats> {
    return this.http
      .get<StreetLightStats>(`${this.baseUrl}/sensors/street-lights/stats`, {
        params: this.toHttpParams(params),
      })
      .pipe(timeout(10000));
  }

  // ── Single reading lookups ─────────────────────────────────────────────────

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

  // Converts a params object into HttpParams, skipping null/undefined/empty values.
  private toHttpParams(params: object): HttpParams {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return httpParams;
  }
}
