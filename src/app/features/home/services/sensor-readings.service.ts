import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, finalize, tap, timeout } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import type {
  AirPollutionSensorReading,
  StreetLightSensorReading,
  TrafficSensorReading,
} from '../models/sensor-reading.models';
import { AlertsService, type AlertSensorType } from '../../../core/services/alerts.service';

@Injectable({ providedIn: 'root' })
export class SensorReadingsService {
  private readonly http = inject(HttpClient);
  private readonly alertsService = inject(AlertsService);
  private readonly baseUrl = environment.apiUrl;

  private readonly trafficCache: TrafficSensorReading[] = [];
  private readonly airCache: AirPollutionSensorReading[] = [];
  private readonly streetCache: StreetLightSensorReading[] = [];

  private trafficFetchInFlight: Observable<TrafficSensorReading[]> | null = null;
  private airFetchInFlight: Observable<AirPollutionSensorReading[]> | null = null;
  private streetFetchInFlight: Observable<StreetLightSensorReading[]> | null = null;

  getTrafficReadings(force = false): Observable<TrafficSensorReading[]> {
    return this.loadReadings(
      force,
      () => this.trafficFetchInFlight,
      (obs) => {
        this.trafficFetchInFlight = obs;
      },
      () => this.fetchTrafficReadings(),
      (readings) => this.afterReadingsLoaded('TRAFFIC', this.trafficCache, readings, force),
    );
  }

  getAirPollutionReadings(force = false): Observable<AirPollutionSensorReading[]> {
    return this.loadReadings(
      force,
      () => this.airFetchInFlight,
      (obs) => {
        this.airFetchInFlight = obs;
      },
      () => this.fetchAirPollutionReadings(),
      (readings) => this.afterReadingsLoaded('AIR_POLLUTION', this.airCache, readings, force),
    );
  }

  getStreetLightReadings(force = false): Observable<StreetLightSensorReading[]> {
    return this.loadReadings(
      force,
      () => this.streetFetchInFlight,
      (obs) => {
        this.streetFetchInFlight = obs;
      },
      () => this.fetchStreetLightReadings(),
      (readings) => this.afterReadingsLoaded('STREET_LIGHT', this.streetCache, readings, force),
    );
  }

  getTrafficReadingById(id: string): Observable<TrafficSensorReading> {
    const cached = this.trafficCache.find((reading) => reading.id === id);
    if (cached) {
      return of(cached);
    }

    return this.http
      .get<TrafficSensorReading>(`${this.baseUrl}/sensors/traffic/${id}`)
      .pipe(timeout(10000));
  }

  getAirPollutionReadingById(id: string): Observable<AirPollutionSensorReading> {
    const cached = this.airCache.find((reading) => reading.id === id);
    if (cached) {
      return of(cached);
    }

    return this.http
      .get<AirPollutionSensorReading>(`${this.baseUrl}/sensors/air-pollution/${id}`)
      .pipe(timeout(10000));
  }

  getStreetLightReadingById(id: string): Observable<StreetLightSensorReading> {
    const cached = this.streetCache.find((reading) => reading.id === id);
    if (cached) {
      return of(cached);
    }

    return this.http
      .get<StreetLightSensorReading>(`${this.baseUrl}/sensors/street-lights/${id}`)
      .pipe(timeout(10000));
  }

  private afterReadingsLoaded<T extends { id: string; timestamp: string }>(
    sensorType: AlertSensorType,
    cache: T[],
    readings: T[],
    force: boolean,
  ): void {
    this.replaceCache(cache, readings);
    const readingIds = readings.map((reading) => reading.id);
    const latestReadingTimestamp = this.getLatestReadingTimestamp(readings);

    this.alertsService.refreshAlerts(sensorType, {
      notify: force,
      readingIds,
      latestReadingTimestamp,
    });
  }

  private getLatestReadingTimestamp<T extends { timestamp: string }>(
    readings: T[],
  ): string | undefined {
    if (readings.length === 0) {
      return undefined;
    }

    return readings.reduce((latest, reading) => {
      const latestMs = new Date(latest.timestamp).getTime();
      const readingMs = new Date(reading.timestamp).getTime();
      if (Number.isNaN(latestMs) || (!Number.isNaN(readingMs) && readingMs > latestMs)) {
        return reading;
      }
      return latest;
    }).timestamp;
  }

  private loadReadings<T>(
    force: boolean,
    getInFlight: () => Observable<T> | null,
    setInFlight: (obs: Observable<T> | null) => void,
    fetch: () => Observable<T>,
    onSuccess: (readings: T) => void,
  ): Observable<T> {
    if (!force && getInFlight()) {
      return getInFlight()!;
    }

    const request$ = fetch().pipe(
      tap(onSuccess),
      finalize(() => setInFlight(null)),
    );
    setInFlight(request$);
    return request$;
  }

  private replaceCache<T>(cache: T[], readings: T[]): void {
    cache.length = 0;
    cache.push(...readings);
  }

  private fetchTrafficReadings(): Observable<TrafficSensorReading[]> {
    return this.http
      .get<TrafficSensorReading[]>(`${this.baseUrl}/sensors/traffic`)
      .pipe(
        timeout(10000),
        catchError((error: unknown) => {
          console.error('Failed to load traffic readings', error);
          return of([] as TrafficSensorReading[]);
        }),
      );
  }

  private fetchAirPollutionReadings(): Observable<AirPollutionSensorReading[]> {
    return this.http
      .get<AirPollutionSensorReading[]>(`${this.baseUrl}/sensors/air-pollution`)
      .pipe(
        timeout(10000),
        catchError((error: unknown) => {
          console.error('Failed to load air pollution readings', error);
          return of([] as AirPollutionSensorReading[]);
        }),
      );
  }

  private fetchStreetLightReadings(): Observable<StreetLightSensorReading[]> {
    return this.http
      .get<StreetLightSensorReading[]>(`${this.baseUrl}/sensors/street-lights`)
      .pipe(
        timeout(10000),
        catchError((error: unknown) => {
          console.error('Failed to load street light readings', error);
          return of([] as StreetLightSensorReading[]);
        }),
      );
  }
}
