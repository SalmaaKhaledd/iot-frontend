import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Subject, timer, merge } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { SensorReadingsService } from '../../core/services/sensor-readings.service';
import { AlertsService, ApiAlert } from '../../core/services/alerts.service';
import type {
  PaginatedResponse,
  TrafficSensorReading,
  TrafficQueryParams,
} from '../../core/models/sensor-reading.models';
import { CustomSelect } from '../../shared/components/custom-select/custom-select';
import { DateTimePicker } from '../../shared/components/date-time-picker/date-time-picker';

interface FilterForm {
  fromDate: Date | null;
  fromTime: string;
  toDate: Date | null;
  toTime: string;
  location: string;
  congestionLevel: string;
  sortBy: string;
  minDensity: number | null;
  maxDensity: number | null;
  minSpeed: number | null;
  maxSpeed: number | null;
}

const DEFAULT_FILTER: FilterForm = {
  fromDate: null,
  fromTime: '',
  toDate: null,
  toTime: '',
  location: '',
  congestionLevel: '',
  sortBy: 'timestamp:desc',
  minDensity: null,
  maxDensity: null,
  minSpeed: null,
  maxSpeed: null,
};

@Component({
  selector: 'app-traffic-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatDatepickerModule,
    MatInputModule,
    MatFormFieldModule,
    TopbarComponent,
    CustomSelect,
    DateTimePicker,
  ],
  templateUrl: './traffic-dashboard.html',
  styleUrl: './traffic-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrafficDashboard {
  private readonly sensorService = inject(SensorReadingsService);
  private readonly alertsService = inject(AlertsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly applyTrigger$ = new Subject<void>();

  // Tracks active auto-dismiss timers keyed by alert id.
  // Stored so manual X-dismiss can cancel a pending timer before it fires.
  private readonly alertTimers = new Map<string, ReturnType<typeof setTimeout>>();

  readonly isFilterExpanded = signal<boolean>(true);
  readonly pageSize = signal<number>(5);
  readonly selectedPageSize = '5';

  readonly readings = signal<TrafficSensorReading[]>([]);
  readonly totalElements = signal<number>(0);
  readonly totalPages = signal<number>(0);
  readonly currentPage = signal<number>(0);
  readonly isLoading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly lastUpdated = signal<string | null>(null);
  readonly activeParams = signal<TrafficQueryParams>({ page: 0, size: 5 });
  readonly dateRangeError = signal<string | null>(null);
  readonly timeRangeError = signal<string | null>(null);

  // Only TRAFFIC alerts are shown on this dashboard.
  readonly activeAlerts = signal<ApiAlert[]>([]);

  readonly pageSizeOptions = [
    { label: '5',  value: '5' },
    { label: '10', value: '10' },
    { label: '15', value: '15' },
    { label: '20', value: '20' },
    { label: '25', value: '25' },
  ];

  filterForm: FilterForm = { ...DEFAULT_FILTER };

  readonly locationOptions = [
    { label: 'All locations', value: '' },
    { label: 'Ring Road', value: 'CAIRO_RING_ROAD' },
    { label: 'October Bridge', value: 'OCTOBER_BRIDGE' },
    { label: 'Salah Salem Road', value: 'SALAH_SALEM' },
  ];

  readonly congestionOptions = [
    { label: 'All levels', value: '' },
    { label: 'Low', value: 'LOW' },
    { label: 'Moderate', value: 'MODERATE' },
    { label: 'High', value: 'HIGH' },
    { label: 'Severe', value: 'SEVERE' },
  ];

  readonly sortOptions = [
    { label: 'Most recent first', value: 'timestamp:desc' },
    { label: 'Oldest first', value: 'timestamp:asc' },
    { label: 'Density (high to low)', value: 'trafficDensity:desc' },
    { label: 'Density (low to high)', value: 'trafficDensity:asc' },
    { label: 'Speed (high to low)', value: 'avgSpeed:desc' },
    { label: 'Speed (low to high)', value: 'avgSpeed:asc' },
  ];

  readonly min = Math.min;

  constructor() {
    // ── Sensor data polling ──────────────────────────────────────────────────
    // Each tick also triggers alertsService.refreshAlerts() via tap() in
    // SensorReadingsService, so alerts stay in sync with readings automatically.
    merge(
      timer(0, 60000),
      this.applyTrigger$,
    )
      .pipe(
        switchMap(() => this.sensorService.getTrafficReadings(this.activeParams())),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response: PaginatedResponse<TrafficSensorReading>) => {
          this.readings.set(response.content);
          this.totalElements.set(response.totalElements);
          this.totalPages.set(response.totalPages);
          this.isLoading.set(false);
          this.error.set(null);
          this.lastUpdated.set(new Date().toLocaleTimeString());
        },
        error: () => {
          this.isLoading.set(false);
          this.error.set('Failed to load traffic data. Please try again.');
        },
      });

    // ── Alert banner subscription ────────────────────────────────────────────
    // alerts$ is a BehaviorSubject — it emits immediately on subscribe and then
    // again whenever refreshAlerts() fires (after every sensor fetch).
    // We filter to TRAFFIC only and start a 5-second auto-dismiss timer for
    // each alert we haven't seen before. The timer map prevents duplicate timers
    // when the same alert appears in successive emissions.
    this.alertsService.alerts$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(alerts => {
        const trafficAlerts = alerts.filter(a => a.sensorType === 'TRAFFIC');

        trafficAlerts.forEach(alert => {
          if (!this.alertTimers.has(alert.id)) {
            const handle = setTimeout(() => this.dismissAlert(alert.id), 5000);
            this.alertTimers.set(alert.id, handle);
          }
        });

        this.activeAlerts.set(trafficAlerts);
      });
  }

  // Called by both the X button (manual) and the auto-dismiss timer.
  // Cancels the pending timer first so whichever path fires second is a no-op.
  dismissAlert(id: string): void {
    const handle = this.alertTimers.get(id);
    if (handle !== undefined) {
      clearTimeout(handle);
      this.alertTimers.delete(id);
    }

    this.alertsService.deleteAlert(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: err => console.error('Failed to dismiss alert', err),
      });
  }

  // Derives a human-readable banner message from the alert contract fields.
  alertBannerMessage(alert: ApiAlert): string {
    const metric = alert.metric.replace(/_/g, ' ').toLowerCase();
    if (alert.alertType === 'ABOVE') {
      return `Traffic alert: ${metric} exceeded threshold (${alert.triggeredValue} > ${alert.thresholdValue})`;
    }
    return `Traffic alert: ${metric} dropped below threshold (${alert.triggeredValue} < ${alert.thresholdValue})`;
  }

  // Red (danger) for density exceeded — most operationally urgent.
  // Amber (warning) for speed dropped below threshold — less critical.
  // Defaults to warning for any other metric.
  alertSeverityClass(alert: ApiAlert): string {
    if (alert.metric === 'TRAFFIC_DENSITY' && alert.alertType === 'ABOVE') {
      return 'banner-danger';
    }
    return 'banner-warning';
  }

  applyFilters(): void {
    this.dateRangeError.set(null);
    this.timeRangeError.set(null);
    this.onDensityChange();
    this.onSpeedChange();

    let hasError = false;

    if (this.filterForm.fromDate && this.filterForm.toDate &&
        this.filterForm.toDate < this.filterForm.fromDate) {
      this.dateRangeError.set('Invalid date range.');
      hasError = true;
    }

    if ((this.filterForm.fromDate && this.filterForm.toDate) &&
        (this.filterForm.fromDate.toDateString() === this.filterForm.toDate.toDateString()) &&
        (this.filterForm.fromTime && this.filterForm.toTime)) {
      const fromMinutes = this.toMinutes(this.filterForm.fromTime);
      const toMinutes = this.toMinutes(this.filterForm.toTime);
      if (toMinutes <= fromMinutes) {
        this.timeRangeError.set('Invalid time range.');
        hasError = true;
      }
    }

    if (hasError) return;

    const [sortBy, sortDir] = this.filterForm.sortBy.split(':');

    const params: TrafficQueryParams = {
      page: 0,
      size: this.pageSize(),
      sortBy,
      sortDir: sortDir as 'asc' | 'desc',
    };

    if (this.filterForm.location) params.location = this.filterForm.location;
    if (this.filterForm.congestionLevel) params.congestionLevel = this.filterForm.congestionLevel as TrafficQueryParams['congestionLevel'];
    if (this.filterForm.fromDate && this.filterForm.fromTime) {
      const d = this.filterForm.fromDate;
      const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      params.timestampStart = `${dateStr}T${this.filterForm.fromTime}:00`;
    }
    if (this.filterForm.toDate && this.filterForm.toTime) {
      const d = this.filterForm.toDate;
      const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      params.timestampEnd = `${dateStr}T${this.filterForm.toTime}:59`;
    }
    if (this.filterForm.minDensity !== null) params.minDensity = this.filterForm.minDensity;
    if (this.filterForm.maxDensity !== null) params.maxDensity = this.filterForm.maxDensity;
    if (this.filterForm.minSpeed !== null) params.minSpeed = this.filterForm.minSpeed;
    if (this.filterForm.maxSpeed !== null) params.maxSpeed = this.filterForm.maxSpeed;

    this.currentPage.set(0);
    this.activeParams.set(params);
    this.applyTrigger$.next();
  }

  resetFilters(): void {
    this.dateRangeError.set(null);
    this.timeRangeError.set(null);
    this.filterForm = { ...DEFAULT_FILTER };
    this.currentPage.set(0);
    this.activeParams.set({ page: 0, size: this.pageSize() });
    this.applyTrigger$.next();
  }

  private toMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  onDensityChange(): void {
    if (this.filterForm.minDensity !== null) {
      this.filterForm.minDensity = Math.min(500, Math.max(0, this.filterForm.minDensity));
    }
    if (this.filterForm.maxDensity !== null) {
      this.filterForm.maxDensity = Math.min(500, Math.max(0, this.filterForm.maxDensity));
    }
    if (this.filterForm.minDensity !== null && this.filterForm.maxDensity !== null
        && this.filterForm.minDensity > this.filterForm.maxDensity) {
      this.filterForm.minDensity = this.filterForm.maxDensity;
    }
  }

  onSpeedChange(): void {
    if (this.filterForm.minSpeed !== null) {
      this.filterForm.minSpeed = Math.round(Math.min(120, Math.max(0, this.filterForm.minSpeed)) * 10) / 10;
    }
    if (this.filterForm.maxSpeed !== null) {
      this.filterForm.maxSpeed = Math.round(Math.min(120, Math.max(0, this.filterForm.maxSpeed)) * 10) / 10;
    }
    if (this.filterForm.minSpeed !== null && this.filterForm.maxSpeed !== null
        && this.filterForm.minSpeed > this.filterForm.maxSpeed) {
      this.filterForm.minSpeed = this.filterForm.maxSpeed;
    }
  }

  onDateChange(): void {
    if (this.filterForm.fromDate && this.filterForm.toDate && this.filterForm.toDate >= this.filterForm.fromDate) {
      this.dateRangeError.set(null);
    }
  }

  onTimeRangeChange(): void {
    if (!this.filterForm.fromDate || !this.filterForm.toDate) return;
    if (this.filterForm.fromDate.toDateString() !== this.filterForm.toDate.toDateString()) return;
    if (!this.filterForm.fromTime || !this.filterForm.toTime) return;
    if (this.toMinutes(this.filterForm.toTime) > this.toMinutes(this.filterForm.fromTime)) {
      this.timeRangeError.set(null);
    }
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.activeParams.set({ ...this.activeParams(), page, size: this.pageSize() });
    this.applyTrigger$.next();
  }

  onPageSizeChange(value: string): void {
    const size = Number(value);
    this.pageSize.set(size);
    this.currentPage.set(0);
    this.activeParams.set({ ...this.activeParams(), page: 0, size });
    this.applyTrigger$.next();
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }

  toggleFilters(): void {
    this.isFilterExpanded.update(v => !v);
  }
}