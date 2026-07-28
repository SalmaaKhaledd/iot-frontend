import { Component, DestroyRef, HostListener, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { merge, Subject, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import type { StreetLightSensorReading } from '../../../../core/models/sensor-reading.models';
import {
  formatReadingMetaTimestamp,
  formatRelativeWithClock,
  parseReadingTimestamp,
} from '../../utils/reading-time';
import { SensorReadingsService } from '../../../../core/services/sensor-readings.service';
import { SettingsService } from '../../../../core/services/settings.service';
import { StreetLightAlertsComponent } from '../street-light-alerts/street-light-alerts.component';
import { AlertModalShellComponent } from '../alert-modal-shell/alert-modal-shell.component';

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
  imports: [MatIconModule, MatTooltipModule, AlertModalShellComponent, StreetLightAlertsComponent],
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
  readonly refreshTrigger$ = new Subject<void>();
  readonly currentTime = signal(Date.now());

  readonly selectedReading = computed(() => {
    const history = this.readingHistory();
    const index = this.selectedReadingIndex();
    return history.length > index ? history[index] : null;
  });

  readonly dropdownReadings = computed(() => {
    const history = this.readingHistory().slice(0, 5);
    const now = this.currentTime();
    if (history.length === 0) return [];

    return history.map((reading, index) => {
      const target = parseReadingTimestamp(reading.timestamp);
      const label = target
        ? formatRelativeWithClock(target, new Date(now))
        : reading.timestamp;
      return { index, label, reading };
    });
  });

  readonly configuredInterval = signal<number>(15); // minutes (default)

  constructor() {
    const intervalId = setInterval(() => this.currentTime.set(Date.now()), 60000);
    this.destroyRef.onDestroy(() => clearInterval(intervalId));

    this.settingsService.getSensorConfig()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(config => {
          this.configuredInterval.set(config.streetLightReadingInterval);
          return merge(
            this.refreshTrigger$,
            timer(0, config.streetLightReadingInterval * 60000),
          );
        }),
        switchMap(() => {
          return this.sensorReadingsService.getStreetLightReadings();
        })
      )
      .subscribe({
        next: (response) => {
          const items = response.content.map((reading) => this.toStreetLightItem(reading));
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
    return formatReadingMetaTimestamp(timestamp);
  }

  refresh(): void {
    this.refreshTrigger$.next();
  }

  onSelectReading(index: number): void {
    this.selectedReadingIndex.set(index);
  }

  @HostListener('window:openSensorAlerts', ['$event'])
  onOpenSensorAlerts(event: Event): void {
    const customEvent = event as CustomEvent;
    if (customEvent.detail.sensorType === 'street-light') {
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

