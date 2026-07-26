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

  readonly filteredAlerts = computed(() => {
    const filter = this.statusFilter();
    return this.streetLightAlerts().filter((a: StreetLightAlert) => {
      const matchesStatus = filter === 'all' || a.status === filter;
      return matchesStatus;
    });
  });

  readonly rangeText = computed(() => {
    const total = this.totalElements();
    if (total === 0) return '0 of 0';
    const start = (this.currentPage() - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage() * this.pageSize, total);
    return `${start}-${end} of ${total}`;
  });

  constructor() {
    toObservable(this.currentPage)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((page) => {
          return this.alertsService.getAlertsBySensor('STREET_LIGHT', page - 1, this.pageSize);
        }),
        switchMap((response: PaginatedResponse<ApiAlert>) => {
          this.totalElements.set(response.totalElements || 0);
          const alerts = response.content || [];
          if (alerts.length === 0) return of([]);

          const requests = alerts.map((alert: ApiAlert) => {
            const metricName = (alert.metric || 'Sensor').replace(/_/g, ' ');
            const isBelow = alert.alertType === 'BELOW';
            const directionStr = isBelow ? 'BELOW' : 'ABOVE';
            const title = `${metricName} Alert`;
            const directionVerb = isBelow ? 'dropped below' : 'exceeded';
            const message = `${metricName} in ${alert.location || 'Unknown Location'} ${directionVerb} threshold.`;
            const report = `${metricName} reached ${alert.triggeredValue ?? 'N/A'} (Threshold: ${alert.thresholdValue ?? 'N/A'}).`;

            const fallbackObj = {
              id: alert.id || crypto.randomUUID(),
              lightId: alert.readingId || 'Unknown',
              location: alert.location || 'Unknown Location',
              title: title,
              message: message,
              report: report,
              direction: directionStr as 'ABOVE' | 'BELOW',
              time: this.formatDate(alert.triggeredAt || new Date().toISOString()),
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
                title: title,
                message: message,
                report: report,
                direction: directionStr as 'ABOVE' | 'BELOW',
                time: this.formatDate(alert.triggeredAt || new Date().toISOString()),
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

  private formatDate(isoString: string): string {
    if (!isoString) return 'Unknown Time';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Unknown Time';
    
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'short' });
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    
    return `${day} ${month}, ${hours}:${minutes} ${ampm}`;
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