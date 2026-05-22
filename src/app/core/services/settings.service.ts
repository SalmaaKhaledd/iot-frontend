import { HttpClient } from '@angular/common/http';
import { Injectable, inject, effect } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import {
  createDefaultSensorConfiguration,
  type SensorConfiguration,
} from '../../features/settings/settings.types';

interface IntervalSettingsResponse {
  id: string;
  userId?: string;
  trafficInterval: number;
  airPollutionInterval: number;
  streetLightInterval: number;
}

interface IntervalSettingsPayload {
  id?: string;
  userId?: string;
  trafficInterval: number;
  airPollutionInterval: number;
  streetLightInterval: number;
}

export interface ThresholdSetting {
  id: string;
  userId?: string;
  type: string;
  metric: string;
  thresholdValue: number;
  alertType: string;
  createdAt: string;
}

export interface SaveThresholdSetting {
  id?: string;
  type: string;
  metric: string;
  thresholdValue: number;
  alertType: string;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly baseUrl = environment.apiUrl;
  private readonly defaultSensorConfig = createDefaultSensorConfiguration();
  private readonly sensorConfigSubject = new BehaviorSubject<SensorConfiguration>(this.defaultSensorConfig);
  private currentIntervalId: string | null = null;
  private sensorConfigLoaded = false;
  private sensorConfigLoading = false;

  constructor() {
    effect(() => {
      if (!this.authService.currentUser()) {
        this.clearCache();
      }
    });
  }

  clearCache(): void {
    this.sensorConfigLoaded = false;
    this.currentIntervalId = null;
    this.sensorConfigSubject.next(this.defaultSensorConfig);
    // Clear any potential legacy local storage keys
    localStorage.removeItem('sensor_config');
    localStorage.removeItem('sensorConfig');
    localStorage.removeItem('intervals');
  }

  private toSensorConfig(response: IntervalSettingsResponse): SensorConfiguration {
    this.currentIntervalId = response.id;

    return {
      trafficReadingInterval: response.trafficInterval,
      airQualityReadingInterval: response.airPollutionInterval,
      streetLightReadingInterval: response.streetLightInterval,
    };
  }

  private toPayload(config: SensorConfiguration): IntervalSettingsPayload {
    return {
      ...(this.currentIntervalId ? { id: this.currentIntervalId } : {}),
      userId: this.authService.getUser()?.id,
      trafficInterval: config.trafficReadingInterval,
      airPollutionInterval: config.airQualityReadingInterval,
      streetLightInterval: config.streetLightReadingInterval,
    };
  }

  getSensorConfig(): Observable<SensorConfiguration> {
    if (!this.sensorConfigLoaded && !this.sensorConfigLoading) {
      void this.loadSensorConfig().subscribe();
    }

    return this.sensorConfigSubject.asObservable();
  }

  loadSensorConfig(forceReload = false): Observable<SensorConfiguration> {
    if (this.sensorConfigLoaded && !forceReload) {
      return of(this.sensorConfigSubject.getValue());
    }

    this.sensorConfigLoading = true;

    return this.http.get<any>(`${this.baseUrl}/intervals`).pipe(
      map((responses) => {
        const userId = this.authService.getUser()?.id;
        let userConfig: any = null;

        if (Array.isArray(responses)) {
          userConfig = responses.find((c: any) => 
            String(c.userId) === String(userId) || String(c.user_id) === String(userId)
          );
        } else if (responses && typeof responses === 'object') {
          // If the backend returns a single object (authenticated via token), 
          // we use it. We also verify userId if the backend provides it.
          if (!responses.userId || String(responses.userId) === String(userId) || String(responses.user_id) === String(userId)) {
            userConfig = responses;
          }
        }

        if (userConfig) {
          return this.toSensorConfig(userConfig);
        }
        return this.defaultSensorConfig;
      }),
      tap((config) => {
        this.sensorConfigLoaded = true;
        this.sensorConfigSubject.next(config);
      }),
      catchError((error: unknown) => {
        console.error('Failed to load sensor intervals', error);
        this.currentIntervalId = null;
        this.sensorConfigLoaded = true;
        this.sensorConfigSubject.next(this.defaultSensorConfig);
        return of(this.defaultSensorConfig);
      }),
      finalize(() => {
        this.sensorConfigLoading = false;
      }),
    );
  }

  saveSensorConfig(config: SensorConfiguration): Observable<SensorConfiguration> {
    return this.http.put<IntervalSettingsResponse>(`${this.baseUrl}/intervals`, this.toPayload(config)).pipe(
      map((response) => this.toSensorConfig(response)),
      tap((savedConfig) => {
        this.sensorConfigLoaded = true;
        this.sensorConfigSubject.next(savedConfig);
      }),
    );
  }

  getSettings(): Observable<ThresholdSetting[]> {
    return this.http.get<ThresholdSetting[]>(`${this.baseUrl}/settings`).pipe(
      map(settings => {
        const userId = this.authService.getUser()?.id;
        return settings.filter(s => !s.userId || s.userId === userId);
      })
    );
  }

  saveSettings(settings: SaveThresholdSetting[]): Observable<ThresholdSetting[]> {
    return this.http.put<ThresholdSetting[]>(`${this.baseUrl}/settings`, settings);
  }

  deleteSetting(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/settings/${id}`);
  }
}
