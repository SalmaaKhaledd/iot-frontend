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
  imports: [CommonModule, MatIconModule],
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

  // Server-side Pagination state
  readonly currentPage = signal(1);
  readonly pageSize = 10;
  readonly totalElements = signal(0);

  // Mirrors the signal since the backend handles filtering
  readonly filteredAlerts = computed(() => this.trafficAlerts());

  readonly rangeText = computed(() => {
    const total = this.totalElements();
    if (total === 0) return '0 of 0';
    const start = (this.currentPage() - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage() * this.pageSize, total);
    return `${start}-${end} of ${total}`;
  });

  constructor() {
    toObservable(computed(() => ({ page: this.currentPage(), filter: this.congestionFilter() })))
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(({ page, filter }) => {
          return this.alertsService.getAlertsBySensor('TRAFFIC', page - 1, this.pageSize, filter);
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
              sensorId: alert.readingId || 'Unknown',
              location: alert.location || 'Unknown Location',
              title: title,
              message: message,
              report: report,
              direction: directionStr as 'ABOVE' | 'BELOW',
              time: this.formatDate(alert.triggeredAt || new Date().toISOString()),
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
                title: title,
                message: message,
                report: report,
                direction: directionStr as 'ABOVE' | 'BELOW',
                time: this.formatDate(alert.triggeredAt || new Date().toISOString()),
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