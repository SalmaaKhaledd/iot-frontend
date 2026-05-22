import { CommonModule } from '@angular/common';
import { Component, DestroyRef, HostListener, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { merge, Subject, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import type { AirPollutionSensorReading } from '../../models/sensor-reading.models';
import {
  formatReadingMetaTimestamp,
  formatRelativeWithClock,
  parseReadingTimestamp,
} from '../../utils/reading-time';
import { SensorReadingsService } from '../../services/sensor-readings.service';
import { SettingsService } from '../../../../core/services/settings.service';
import { AirQualityAlertsComponent } from '../air-quality-alerts/air-quality-alerts.component';

type PollutionLevel = 'Good' | 'Moderate' | 'Unhealthy' | 'Very Unhealthy';

type AirSensorItem = {
  readonly id: string;
  readonly location: string;
  readonly timestamp: string;
  readonly pm2_5: number;
  readonly pm10: number;
  readonly co: number;
  readonly ozone: number;
  readonly no2: number;
  readonly so2: number;
  readonly pollutionLevel: PollutionLevel;
};

@Component({
  selector: 'app-air-quality-sensor-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule, AirQualityAlertsComponent],
  templateUrl: './air-quality-sensor-card.component.html',
  styleUrl: './air-quality-sensor-card.component.scss',
})
export class AirQualitySensorCardComponent {
  private readonly sensorReadingsService = inject(SensorReadingsService);
  private readonly settingsService = inject(SettingsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly showAlerts = signal(false);
  readonly missingThresholds = signal<string[]>([]);
  readonly readingHistory = signal<AirSensorItem[]>([]);
  readonly selectedReadingIndex = signal(0);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly refreshTrigger$ = new Subject<void>();
  readonly currentTime = signal(Date.now());

  readonly latestReading = computed(() => {
    const history = this.readingHistory();
    return history.length > 0 ? history[0] : null;
  });

  readonly configuredInterval = signal<number>(10); // minutes (default)

  readonly dropdownReadings = computed(() => {
    const history = this.readingHistory().slice(0, 5);
    if (history.length === 0) return [];
    const now = this.currentTime();

    return history.map((reading, index) => {
      const target = parseReadingTimestamp(reading.timestamp);
      const label = target
        ? formatRelativeWithClock(target, new Date(now))
        : reading.timestamp;
      return { index, label, reading };
    });
  });

  readonly selectedSensorData = computed<AirSensorItem | null>(() => {
    const history = this.readingHistory();
    const index = this.selectedReadingIndex();
    return history[index] ?? history[0] ?? null;
  });

  readonly ringDashOffset = computed(() => {
    const sensor = this.selectedSensorData();
    if (!sensor) {
      return 553;
    }

    const normalized = Math.min(
      100,
      Math.round(
        (sensor.pm2_5 / 1000) * 25 +
          (sensor.pm10 / 1000) * 20 +
          (sensor.co / 50) * 15 +
          (sensor.ozone / 300) * 15 +
          (sensor.no2 / 500) * 13 +
          (sensor.so2 / 500) * 12,
      ),
    );
    return 553 - Math.round((normalized / 100) * 553);
  });

  readonly recommendationText = computed(() => {
    const sensor = this.selectedSensorData();
    if (!sensor) {
      return 'No air quality readings are available right now.';
    }

    switch (sensor.pollutionLevel) {
      case 'Good':
        return 'Air quality is good. Outdoor activity is safe for most people.';
      case 'Moderate':
        return 'Air quality is moderate. Sensitive individuals should stay cautious.';
      case 'Unhealthy':
        return 'Air quality is unhealthy. Limit prolonged outdoor exposure.';
      default:
        return 'Air quality is very unhealthy. Avoid outdoor activity where possible.';
    }
  });

  readonly showRecommendation = computed(() => {
    const sensor = this.selectedSensorData();
    if (!sensor) {
      return false;
    }

    return sensor.pollutionLevel !== 'Good';
  });

  constructor() {
    const intervalId = setInterval(() => this.currentTime.set(Date.now()), 60000);
    this.destroyRef.onDestroy(() => clearInterval(intervalId));

    this.settingsService.getSensorConfig()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(config => {
          this.configuredInterval.set(config.airQualityReadingInterval);
          return merge(
            this.refreshTrigger$,
            timer(0, config.airQualityReadingInterval * 60000),
          );
        }),
        switchMap(() => {
          return this.sensorReadingsService.getAirPollutionReadings();
        })
      )
      .subscribe({
        next: (readings) => {
          const items = readings.map((reading) => this.toAirSensorItem(reading));
          this.readingHistory.set(items);
          this.selectedReadingIndex.set(0);
          this.isLoading.set(false);
          this.errorMessage.set(null);
        },
        error: () => {
          this.isLoading.set(false);
          this.errorMessage.set('Unable to load air quality readings right now.');
        },
      });

    this.settingsService.getSettings()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (settings) => {
          const airSettings = settings.filter(s => s.type === 'AIR_POLLUTION');
          const metrics = airSettings.map(s => s.metric);
          const required = ['CO', 'OZONE'];
          const missing = required.filter(m => !metrics.includes(m));
          this.missingThresholds.set(missing);
        }
      });
  }

  refresh(): void {
    this.refreshTrigger$.next();
  }

  onSelectReading(index: number): void {
    this.selectedReadingIndex.set(index);
  }

  coWidth(value: number): number {
    return Math.min(100, Math.round((value / 50) * 100));
  }

  ozoneWidth(value: number): number {
    return Math.min(100, Math.round((value / 300) * 100));
  }

  particulateWidth(value: number): number {
    return Math.min(100, Math.round((value / 1000) * 100));
  }

  gasWidth(value: number): number {
    return Math.min(100, Math.round((value / 500) * 100));
  }

  formatTimestamp(timestamp: string): string {
    return formatReadingMetaTimestamp(timestamp);
  }

  private toAirSensorItem(reading: AirPollutionSensorReading): AirSensorItem {
    return {
      id: reading.id,
      location: reading.location,
      timestamp: reading.timestamp,
      pm2_5: reading.pm2_5,
      pm10: reading.pm10,
      co: reading.co,
      ozone: reading.ozone,
      no2: reading.no2,
      so2: reading.so2,
      pollutionLevel: this.toPollutionLevel(reading.pollutionLevel),
    };
  }

  private toPollutionLevel(level: AirPollutionSensorReading['pollutionLevel']): PollutionLevel {
    switch (level) {
      case 'GOOD':
        return 'Good';
      case 'MODERATE':
        return 'Moderate';
      case 'UNHEALTHY':
        return 'Unhealthy';
      case 'VERY_UNHEALTHY':
        return 'Very Unhealthy';
      case 'HAZARDOUS':
      default:
        return 'Unhealthy';
    }
  }

  @HostListener('window:openSensorAlerts', ['$event'])
  onOpenSensorAlerts(event: Event): void {
    const customEvent = event as CustomEvent;
    if (customEvent.detail.sensorType === 'air-quality') {
      this.showAlerts.set(true);
      if (customEvent.detail.alertId) {
        let attempts = 0;
        const interval = setInterval(() => {
          const alertEl = document.getElementById('alert-' + customEvent.detail.alertId);
          if (alertEl) {
            clearInterval(interval);
            alertEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            alertEl.classList.add('highlight-alert');
            setTimeout(() => alertEl.classList.remove('highlight-alert'), 2000);
          } else if (attempts >= 20) {
            clearInterval(interval);
          }
          attempts++;
        }, 100);
      }
    }
  }
}
