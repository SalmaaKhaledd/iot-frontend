import { Component, DestroyRef, HostListener, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import type { StreetLightSensorReading } from '../../models/sensor-reading.models';
import { SensorReadingsService } from '../../services/sensor-readings.service';
import { SettingsService } from '../../../../core/services/settings.service';
import { StreetLightAlertsComponent } from '../street-light-alerts/street-light-alerts.component';

type StreetLightItem = {
  readonly id: string;
  readonly location: string;
  readonly timestamp: string;
  readonly brightnessLevel: number;
  readonly powerConsumption: number;
  readonly status: 'ON' | 'OFF';
};

@Component({
  selector: 'app-street-light-card',
  standalone: true,
  imports: [MatIconModule, MatTooltipModule, StreetLightAlertsComponent],
  templateUrl: './street-light-card.component.html',
  styleUrl: './street-light-card.component.scss',
})
export class StreetLightCardComponent {
  private readonly sensorReadingsService = inject(SensorReadingsService);
  private readonly settingsService = inject(SettingsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly showAlerts = signal(false);
  readonly missingThresholds = signal<string[]>([]);
  readonly readingHistory = signal<StreetLightItem[]>([]);
  readonly selectedReadingIndex = signal(0);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  readonly selectedReading = computed(() => {
    const history = this.readingHistory();
    const index = this.selectedReadingIndex();
    return history.length > index ? history[index] : null;
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

  constructor() {
    this.sensorReadingsService
      .getStreetLightReadings()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (readings) => {
          const items = readings.map((reading) => this.toStreetLightItem(reading));
          this.readingHistory.set(items);
          this.selectedReadingIndex.set(0);
          this.isLoading.set(false);
          this.errorMessage.set(null);
        },
        error: () => {
          this.isLoading.set(false);
          this.errorMessage.set('Unable to load street light readings right now.');
        },
      });

    this.settingsService.getSettings()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (settings) => {
          const lightSettings = settings.filter(s => s.type === 'STREET_LIGHT');
          const metrics = lightSettings.map(s => s.metric);
          const required = ['BRIGHTNESS_LEVEL', 'POWER_CONSUMPTION'];
          const missing = required.filter(m => !metrics.includes(m));
          this.missingThresholds.set(missing);
        }
      });
  }

  readonly totalLights = computed(() => this.selectedReading()?.id ? 1 : 0);
  readonly lightsOn = computed(() => (this.selectedReading()?.status === 'ON' ? 1 : 0));
  readonly lightsOff = computed(() => (this.selectedReading()?.status === 'OFF' ? 1 : 0));
  readonly averageBrightness = computed(() => this.selectedReading()?.brightnessLevel ?? 0);
  readonly powerUsage = computed(() => this.selectedReading()?.powerConsumption ?? 0);

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
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: false,
      }).format(date);
    }
  }

  @HostListener('window:openSensorAlerts', ['$event'])
  onOpenSensorAlerts(event: Event): void {
    const customEvent = event as CustomEvent;
    if (customEvent.detail.sensorType === 'street-light') {
      this.showAlerts.set(true);
    }
  }

  private toStreetLightItem(reading: StreetLightSensorReading): StreetLightItem {
    return {
      id: reading.id,
      location: reading.location,
      timestamp: reading.timestamp,
      brightnessLevel: reading.brightnessLevel,
      powerConsumption: reading.powerConsumption,
      status: reading.status,
    };
  }
}
