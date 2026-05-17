import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AlertsService } from '../../../../core/services/alerts.service';
import { SensorReadingsService } from '../../services/sensor-readings.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { ApiAlert } from '../../../../core/services/alerts.service';

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
  imports: [CommonModule, MatIconModule],
  templateUrl: './air-quality-alerts.component.html',
  styleUrl: './air-quality-alerts.component.scss',
})
export class AirQualityAlertsComponent {
  private readonly alertsService = inject(AlertsService);
  private readonly sensorReadingsService = inject(SensorReadingsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly airQualityAlerts = signal<AirQualityAlert[]>([]);

  // Filter state
  readonly isFiltersOpen = signal(false);
  readonly pollutionFilter = signal('all');

  readonly filteredAlerts = computed(() => {
    const filter = this.pollutionFilter();
    return this.airQualityAlerts().filter((a: AirQualityAlert) => {
      let matchesPollution = true;
      if (filter === 'good') matchesPollution = a.pollutionLevel === 'Good';
      else if (filter === 'moderate') matchesPollution = a.pollutionLevel === 'Moderate';
      else if (filter === 'unhealthy') matchesPollution = a.pollutionLevel === 'Unhealthy';
      else if (filter === 'very-unhealthy') matchesPollution = a.pollutionLevel === 'Very Unhealthy';
      else if (filter === 'hazardous') matchesPollution = a.pollutionLevel === 'Hazardous';
      return matchesPollution;
    });
  });

  constructor() {
    this.alertsService.getAlerts()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map((alerts: ApiAlert[]) => alerts.filter((a: ApiAlert) => a.sensorType === 'AIR_POLLUTION')),
        switchMap((alerts: ApiAlert[]) => {
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
              id: alert.id || Math.random().toString(),
              sensorId: alert.readingId || 'Unknown',
              location: alert.location || 'Unknown Location',
              title: title,
              message: message,
              report: report,
              direction: directionStr as 'ABOVE' | 'BELOW',
              time: this.formatDate(alert.triggeredAt || new Date().toISOString()),
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
                id: alert.id || Math.random().toString(),
                sensorId: reading.id,
                location: reading.location || alert.location || 'Unknown Location',
                title: title,
                message: message,
                report: report,
                direction: directionStr as 'ABOVE' | 'BELOW',
                time: this.formatDate(alert.triggeredAt || new Date().toISOString()),
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
  setPollution(level: string): void { this.pollutionFilter.set(level); }

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
      },
      error: (err) => console.error('Failed to delete alert', err)
    });
  }

  onAlertHover(alert: AirQualityAlert): void {
    // Handle hover - show report tooltip
  }
}
