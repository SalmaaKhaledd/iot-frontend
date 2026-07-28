import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AlertsService } from '../../../../core/services/alerts.service';
import { SensorReadingsService } from '../../../../core/services/sensor-readings.service';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { ApiAlert } from '../../../../core/services/alerts.service';
import type { PaginatedResponse } from '../../../../core/models/sensor-reading.models';
import { alertRangeText, buildAlertSummary, enumFilter } from '../alert-modal-utils';
import { ChipFilterComponent } from '../../../../shared/components/chip-filter/chip-filter';
import { PaginationBarComponent } from '../../../../shared/components/pagination-bar/pagination-bar';

interface AirQualityAlert {
  id: string;
  sensorId?: string;
  location?: string;
  title: string;
  message: string;
  report: string;
  direction: 'ABOVE' | 'BELOW';
  time: string;
  pollutionLevel: 'Good' | 'Moderate' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous';
  pm2_5: number;
  pm10: number;
  co: number;
  ozone: number;
  no2: number;
  so2: number;
}

@Component({
  selector: 'app-air-quality-alerts',
  standalone: true,
  imports: [CommonModule, MatIconModule,ChipFilterComponent,PaginationBarComponent],
  templateUrl: './air-quality-alerts.component.html',
  styleUrl: './air-quality-alerts.component.scss',
})
export class AirQualityAlertsComponent {
  private readonly alertsService = inject(AlertsService);
  private readonly sensorReadingsService = inject(SensorReadingsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly airQualityAlerts = signal<AirQualityAlert[]>([]);

  readonly pollutionOptions = [
    { label: 'All', value: 'all' },
    { label: 'Good', value: 'good', cssClass: 'chip-success' },
    { label: 'Moderate', value: 'moderate', cssClass: 'chip-warning' },
    { label: 'Unhealthy', value: 'unhealthy', cssClass: 'chip-error' },
    { label: 'Very Unhealthy', value: 'very-unhealthy', cssClass: 'chip-critical' },
    { label: 'Hazardous', value: 'hazardous', cssClass: 'chip-critical' },
  ]; 
  // Filter state
  readonly isFiltersOpen = signal(false);
  readonly pollutionFilter = signal('all');

  // Server-side Pagination state
  readonly currentPage = signal(1);
  readonly pageSize = 10;
  readonly totalElements = signal(0);

  readonly filteredAlerts = computed(() => this.airQualityAlerts());
  private readonly pollutionLevelQuery = computed(() => enumFilter(this.pollutionFilter(), {
    good: 'GOOD',
    moderate: 'MODERATE',
    unhealthy: 'UNHEALTHY',
    'very-unhealthy': 'VERY_UNHEALTHY',
    hazardous: 'HAZARDOUS',
  } as const));
  private readonly alertQuery = computed(() => ({
    page: this.currentPage(),
    pollutionLevel: this.pollutionLevelQuery(),
  }));

  readonly rangeText = computed(() => {
    return alertRangeText(this.currentPage(), this.pageSize, this.totalElements());
  });

  constructor() {
    toObservable(this.alertQuery)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(({ page, pollutionLevel }) => {
          // Spring Boot paginated APIs are 0-indexed, so we pass page - 1
          return this.alertsService.getAlertsBySensor('AIR_POLLUTION', page - 1, this.pageSize, { pollutionLevel });
        }),
        switchMap((response: PaginatedResponse<ApiAlert>) => {
          this.totalElements.set(response.totalElements || 0);
          const alerts = response.content || [];
          if (alerts.length === 0) return of([]);

          const requests = alerts.map((alert: ApiAlert) => {
            const summary = buildAlertSummary(alert);

            const fallbackObj = {
              id: alert.id || crypto.randomUUID(),
              sensorId: alert.readingId || 'Unknown',
              location: alert.location || 'Unknown Location',
              ...summary,
              pollutionLevel: 'Moderate' as any,
              pm2_5: 0,
              pm10: 0,
              co: 0,
              ozone: 0,
              no2: 0,
              so2: 0
            };

            if (!alert.readingId) {
              return of(fallbackObj);
            }

            return this.sensorReadingsService.getAirPollutionReadingById(alert.readingId).pipe(
              map((reading) => ({
                id: alert.id || crypto.randomUUID(),
                sensorId: reading.id,
                location: reading.location || alert.location || 'Unknown Location',
                ...summary,
                pollutionLevel: this.toPollutionLevel(reading.pollutionLevel),
                pm2_5: reading.pm2_5 || 0,
                pm10: reading.pm10 || 0,
                co: reading.co || 0,
                ozone: reading.ozone || 0,
                no2: reading.no2 || 0,
                so2: reading.so2 || 0
              } as AirQualityAlert)),
              catchError(() => of(fallbackObj))
            );
          });
          return forkJoin(requests);
        }),
        map((results) => results.filter((r): r is AirQualityAlert => r !== null))
      )
      .subscribe({
        next: (alerts: AirQualityAlert[]) => {
          alerts.sort((a: AirQualityAlert, b: AirQualityAlert) => new Date(b.time).getTime() - new Date(a.time).getTime());
          this.airQualityAlerts.set(alerts);
        },
        error: (err: unknown) => console.error('Failed to load air quality alerts', err)
      });
  }

  private toPollutionLevel(level: string): 'Good' | 'Moderate' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous' {
    switch (level?.toUpperCase()) {
      case 'GOOD': return 'Good';
      case 'MODERATE': return 'Moderate';
      case 'UNHEALTHY': return 'Unhealthy';
      case 'VERY_UNHEALTHY': return 'Very Unhealthy';
      case 'HAZARDOUS': return 'Hazardous';
      default: return 'Unhealthy';
    }
  }

  toggleFilters(): void { this.isFiltersOpen.update(v => !v); }
  
  setPollution(level: string): void { 
    this.pollutionFilter.set(level); 
    this.currentPage.set(1);
  }

  getPollutionColor(level: string): string {
    switch (level) {
      case 'Good':
        return 'success';
      case 'Moderate':
        return 'warning';
      case 'Unhealthy':
        return 'error';
      case 'Very Unhealthy':
        return 'critical';
      case 'Hazardous':
        return 'critical';
      default:
        return 'info';
    }
  }

  deleteAlert(alertId: string, event: Event): void {
    event.stopPropagation();
    this.alertsService.deleteAlert(alertId).subscribe({
      next: () => {
        this.airQualityAlerts.update(alerts => alerts.filter(a => a.id !== alertId));
        this.totalElements.update(total => Math.max(0, total - 1));
      },
      error: (err) => console.error('Failed to delete alert', err)
    });
  }

  onAlertHover(alert: AirQualityAlert): void {
    // Handle hover - show report tooltip
  }

  nextPage(): void {
    if (this.currentPage() * this.pageSize < this.totalElements()) {
      this.currentPage.update(p => p + 1);
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }
}
