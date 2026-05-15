import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import type { SensorConfiguration } from '../../features/settings/settings.types';

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
  private readonly sensorConfigSubject = new BehaviorSubject<SensorConfiguration>(this.loadInitialConfig());

  private loadInitialConfig(): SensorConfiguration {
    const stored = localStorage.getItem('sensorConfig');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse stored sensor config', e);
      }
    }
    return {
      trafficReadingInterval: 5,
      airQualityReadingInterval: 10,
      streetLightReadingInterval: 15,
    };
  }

  getSensorConfig(): Observable<SensorConfiguration> {
    return this.sensorConfigSubject.asObservable();
  }

  saveSensorConfig(config: SensorConfiguration): void {
    localStorage.setItem('sensorConfig', JSON.stringify(config));
    this.sensorConfigSubject.next(config);
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
