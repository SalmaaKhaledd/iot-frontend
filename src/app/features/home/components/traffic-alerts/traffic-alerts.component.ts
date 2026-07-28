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

interface TrafficAlert {
  id: string;
  sensorId?: string;
  location?: string;
  title: string;
  message: string;
  report: string;
  direction: 'ABOVE' | 'BELOW';
  time: string;
  trafficDensity: number;
  avgSpeed: number;
  congestionLevel: 'Low' | 'Moderate' | 'High' | 'Severe';
}

@Component({
  selector: 'app-traffic-alerts',
  standalone: true,
  imports: [CommonModule, MatIconModule, ChipFilterComponent, PaginationBarComponent],
  templateUrl: './traffic-alerts.component.html',
  styleUrl: './traffic-alerts.component.scss',
})
export class TrafficAlertsComponent {
  private readonly alertsService = inject(AlertsService);
  private readonly sensorReadingsService = inject(SensorReadingsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly trafficAlerts = signal<TrafficAlert[]>([]);

  // Filter state
  readonly isFiltersOpen = signal(false);
  readonly congestionFilter = signal('all');

  readonly congestionOptions = [
    { label: 'All', value: 'all' },
    { label: 'Low', value: 'low', cssClass: 'chip-success' },
    { label: 'Moderate', value: 'moderate', cssClass: 'chip-warning' },
    { label: 'High', value: 'high', cssClass: 'chip-error' },
    { label: 'Severe', value: 'severe', cssClass: 'chip-critical' },
  ];

  // Server-side Pagination state
  readonly currentPage = signal(1);
  readonly pageSize = 10;
  readonly totalElements = signal(0);

  readonly filteredAlerts = computed(() => this.trafficAlerts());
  private readonly congestionLevelQuery = computed(() => enumFilter(this.congestionFilter(), {
    low: 'LOW',
    moderate: 'MODERATE',
    high: 'HIGH',
    severe: 'SEVERE',
  } as const));
  private readonly alertQuery = computed(() => ({
    page: this.currentPage(),
    congestionLevel: this.congestionLevelQuery(),
  }));

  readonly rangeText = computed(() => {
    return alertRangeText(this.currentPage(), this.pageSize, this.totalElements());
  });

  constructor() {
    toObservable(this.alertQuery)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(({ page, congestionLevel }) => {
          return this.alertsService.getAlertsBySensor('TRAFFIC', page - 1, this.pageSize, { congestionLevel });
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
              trafficDensity: 0,
              avgSpeed: 0,
              congestionLevel: 'Low' as any
            };

            if (!alert.readingId) {
              return of(fallbackObj);
            }

            return this.sensorReadingsService.getTrafficReadingById(alert.readingId).pipe(
              map((reading) => ({
                id: alert.id || crypto.randomUUID(),
                sensorId: reading.id,
                location: reading.location || alert.location,
                ...summary,
                trafficDensity: reading.trafficDensity || 0,
                avgSpeed: reading.avgSpeed || 0,
                congestionLevel: this.toTrafficLevel(reading.congestionLevel)
              } as TrafficAlert)),
              catchError(() => of(fallbackObj))
            );
          });
          return forkJoin(requests);
        }),
        map((results) => results.filter((r): r is TrafficAlert => r !== null))
      )
      .subscribe({
        next: (alerts: TrafficAlert[]) => {
          alerts.sort((a: TrafficAlert, b: TrafficAlert) => new Date(b.time).getTime() - new Date(a.time).getTime());
          this.trafficAlerts.set(alerts);
        },
        error: (err: unknown) => console.error('Failed to load traffic alerts', err)
      });
  }

  private toTrafficLevel(level: string): 'Low' | 'Moderate' | 'High' | 'Severe' {
    switch (level?.toUpperCase()) {
      case 'LOW': return 'Low';
      case 'MODERATE': return 'Moderate';
      case 'HIGH': return 'High';
      case 'SEVERE': return 'Severe';
      default: return 'Severe';
    }
  }

  toggleFilters(): void { this.isFiltersOpen.update(v => !v); }
  
  setCongestion(level: string): void { 
    this.congestionFilter.set(level); 
    this.currentPage.set(1);
  }
  
  getCongestionColor(level: string): string {
    switch (level) {
      case 'Low':
        return 'success';
      case 'Moderate':
        return 'warning';
      case 'High':
        return 'error';
      case 'Severe':
        return 'critical';
      default:
        return 'info';
    }
  }

  deleteAlert(alertId: string, event: Event): void {
    event.stopPropagation();
    this.alertsService.deleteAlert(alertId).subscribe({
      next: () => {
        this.trafficAlerts.update(alerts => alerts.filter(a => a.id !== alertId));
        this.totalElements.update(total => Math.max(0, total - 1));
      },
      error: (err) => console.error('Failed to delete alert', err)
    });
  }

  onAlertHover(alert: TrafficAlert): void {
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
