import { CommonModule } from '@angular/common';
import { Component, DestroyRef, HostListener, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';

import type { AirPollutionSensorReading } from '../../models/sensor-reading.models';
import { SensorReadingsService } from '../../services/sensor-readings.service';
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
  imports: [CommonModule, MatIconModule, AirQualityAlertsComponent],
  templateUrl: './air-quality-sensor-card.component.html',
  styleUrl: './air-quality-sensor-card.component.scss',
})
export class AirQualitySensorCardComponent {
  private readonly sensorReadingsService = inject(SensorReadingsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly showAlerts = signal(false);
  readonly readingHistory = signal<AirSensorItem[]>([]);
  readonly selectedReadingIndex = signal(0);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  readonly latestReading = computed(() => {
    const history = this.readingHistory();
    return history.length > 0 ? history[0] : null;
  });

  readonly dropdownReadings = computed(() => {
    const history = this.readingHistory().slice(0, 5);
    const now = Date.now();
    return history.map((reading, index) => ({
      index,
      label: index === 0 ? 'Now' : this.formatRelativeTime(new Date(reading.timestamp), new Date(now)),
      reading,
    }));
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

  constructor() {
    this.sensorReadingsService
      .getAirPollutionReadings()
      .pipe(takeUntilDestroyed(this.destroyRef))
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
  }

  onSelectReading(index: number): void {
    this.selectedReadingIndex.set(index);
  }

  private formatRelativeTime(date: Date, now: Date): string {
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
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
    const parsed = new Date(timestamp);
    if (Number.isNaN(parsed.getTime())) {
      return timestamp;
    }

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(parsed);
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
    }
  }
}
