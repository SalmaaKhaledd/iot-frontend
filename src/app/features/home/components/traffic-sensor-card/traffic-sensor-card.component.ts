import { CommonModule } from '@angular/common';
import { Component, DestroyRef, HostListener, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';

import type { TrafficCongestionLevel, TrafficSensorReading } from '../../models/sensor-reading.models';
import { SensorReadingsService } from '../../services/sensor-readings.service';
import { TrafficAlertsComponent } from '../traffic-alerts/traffic-alerts.component';

type TrendPoint = {
  readonly time: string;
  readonly density: number;
};

type TrafficLevel = 'Low' | 'Moderate' | 'High' | 'Severe';

type TrafficSensorItem = {
  readonly id: string;
  readonly location: string;
  readonly timestamp: string;
  readonly trafficDensity: number;
  readonly avgSpeed: number;
  readonly congestionLevel: TrafficLevel;
};

@Component({
  selector: 'app-traffic-sensor-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, TrafficAlertsComponent],
  templateUrl: './traffic-sensor-card.component.html',
  styleUrl: './traffic-sensor-card.component.scss',
})
export class TrafficSensorCardComponent {
  private readonly sensorReadingsService = inject(SensorReadingsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly showAlerts = signal(false);
  readonly readingHistory = signal<TrafficSensorItem[]>([]);
  readonly selectedReadingIndex = signal(0);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  readonly hoveredIndex = signal<number | null>(null);

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

  readonly trendData = computed<readonly TrendPoint[]>(() =>
    this.readingHistory()
      .slice(0, 6)
      .reverse()
      .map((reading) => ({
        time: this.formatTrendTime(reading.timestamp),
        density: reading.trafficDensity,
      })),
  );

  readonly maxDensity = computed(() => {
    const points = this.trendData();
    if (points.length === 0) {
      return 0;
    }

    const max = Math.max(...points.map((point) => point.density));
    return Math.ceil(max / 10) * 10;
  });

  readonly selectedSensorData = computed(() => {
    const history = this.readingHistory();
    const index = this.selectedReadingIndex();
    return history[index] ?? history[0] ?? null;
  });

  constructor() {
    this.sensorReadingsService
      .getTrafficReadings()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (readings) => {
          const items = readings.map((reading) => this.toTrafficSensorItem(reading));
          this.readingHistory.set(items);
          this.selectedReadingIndex.set(0);
          this.isLoading.set(false);
          this.errorMessage.set(null);
        },
        error: () => {
          this.isLoading.set(false);
          this.errorMessage.set('Unable to load traffic readings right now.');
        },
      });
  }

  getBarHeight(density: number): string {
    const maxDensity = this.maxDensity();
    if (maxDensity <= 0) {
      return '0%';
    }

    const percentage = (density / maxDensity) * 100;
    return percentage + '%';
  }

  @HostListener('window:openSensorAlerts', ['$event'])
  onOpenSensorAlerts(event: Event): void {
    const customEvent = event as CustomEvent;
    if (customEvent.detail.sensorType === 'traffic') {
      this.showAlerts.set(true);
    }
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

  private formatTrendTime(timestamp: string): string {
    const parsed = new Date(timestamp);
    if (Number.isNaN(parsed.getTime())) {
      return timestamp;
    }

    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(parsed);
  }

  private toTrafficSensorItem(reading: TrafficSensorReading): TrafficSensorItem {
    return {
      id: reading.id,
      location: reading.location,
      timestamp: reading.timestamp,
      trafficDensity: reading.trafficDensity,
      avgSpeed: reading.avgSpeed,
      congestionLevel: this.toTrafficLevel(reading.congestionLevel),
    };
  }

  private toTrafficLevel(level: TrafficCongestionLevel | TrafficSensorReading['congestionLevel']): TrafficLevel {
    switch (level) {
      case 'LOW':
        return 'Low';
      case 'MODERATE':
        return 'Moderate';
      case 'HIGH':
        return 'High';
      case 'SEVERE':
      default:
        return 'Severe';
    }
  }
}
