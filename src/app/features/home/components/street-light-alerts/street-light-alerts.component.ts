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

interface StreetLightAlert {
  id: string;
  lightId: string;
  location: string;
  title: string;
  message: string;
  report: string;
  direction: 'ABOVE' | 'BELOW';
  time: string;
  status: 'on' | 'off';
  brightness: number;
  powerConsumption: number;
}

@Component({
  selector: 'app-street-light-alerts',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './street-light-alerts.component.html',
  styleUrl: './street-light-alerts.component.scss',
})
export class StreetLightAlertsComponent {
  private readonly alertsService = inject(AlertsService);
  private readonly sensorReadingsService = inject(SensorReadingsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly streetLightAlerts = signal<StreetLightAlert[]>([]);

  // Filter state
  readonly isFiltersOpen = signal(false);
  readonly statusFilter = signal('all');

  // Server-side Pagination state
  readonly currentPage = signal(1);
  readonly pageSize = 10;
  readonly totalElements = signal(0);

  readonly filteredAlerts = computed(() => this.streetLightAlerts());
  private readonly statusQuery = computed(() => enumFilter(this.statusFilter(), {
    on: 'ON',
    off: 'OFF',
  } as const));
  private readonly alertQuery = computed(() => ({
    page: this.currentPage(),
    status: this.statusQuery(),
  }));

  readonly rangeText = computed(() => {
    return alertRangeText(this.currentPage(), this.pageSize, this.totalElements());
  });

  constructor() {
    toObservable(this.alertQuery)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(({ page, status }) => {
          return this.alertsService.getAlertsBySensor('STREET_LIGHT', page - 1, this.pageSize, { status });
        }),
        switchMap((response: PaginatedResponse<ApiAlert>) => {
          this.totalElements.set(response.totalElements || 0);
          const alerts = response.content || [];
          if (alerts.length === 0) return of([]);

          const requests = alerts.map((alert: ApiAlert) => {
            const summary = buildAlertSummary(alert);

            const fallbackObj = {
              id: alert.id || crypto.randomUUID(),
              lightId: alert.readingId || 'Unknown',
              location: alert.location || 'Unknown Location',
              ...summary,
              status: 'off' as any,
              brightness: 0,
              powerConsumption: 0
            };

            if (!alert.readingId) {
              return of(fallbackObj);
            }

            return this.sensorReadingsService.getStreetLightReadingById(alert.readingId).pipe(
              map((reading) => ({
                id: alert.id || crypto.randomUUID(),
                lightId: reading.id,
                location: reading.location || alert.location,
                ...summary,
                status: reading.status ? reading.status.toLowerCase() as 'on' | 'off' : 'off',
                brightness: reading.brightnessLevel || 0,
                powerConsumption: reading.powerConsumption || 0
              } as StreetLightAlert)),
              catchError(() => of(fallbackObj))
            );
          });
          return forkJoin(requests);
        }),
        map((results) => results.filter((r): r is StreetLightAlert => r !== null))
      )
      .subscribe({
        next: (alerts: StreetLightAlert[]) => {
          alerts.sort((a: StreetLightAlert, b: StreetLightAlert) => new Date(b.time).getTime() - new Date(a.time).getTime());
          this.streetLightAlerts.set(alerts);
        },
        error: (err: unknown) => console.error('Failed to load street light alerts', err)
      });
  }

  toggleFilters(): void { this.isFiltersOpen.update(v => !v); }
  
  setStatus(status: string): void { 
    this.statusFilter.set(status); 
    this.currentPage.set(1);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'on':
        return 'success';
      case 'off':
        return 'inactive';
      default:
        return 'inactive';
    }
  }

  deleteAlert(alertId: string, event: Event): void {
    event.stopPropagation();
    this.alertsService.deleteAlert(alertId).subscribe({
      next: () => {
        this.streetLightAlerts.update(alerts => alerts.filter(a => a.id !== alertId));
        this.totalElements.update(total => Math.max(0, total - 1));
      },
      error: (err) => console.error('Failed to delete alert', err)
    });
  }

  onAlertHover(alert: StreetLightAlert): void {
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
