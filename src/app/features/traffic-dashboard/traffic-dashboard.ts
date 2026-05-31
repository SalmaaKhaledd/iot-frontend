import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Subject, timer, merge } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Chart, registerables } from 'chart.js';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { SensorReadingsService } from '../../core/services/sensor-readings.service';
import { AlertsService, ApiAlert } from '../../core/services/alerts.service';
import { environment } from '../../../environments/environment';
import type {
  PaginatedResponse,
  TrafficSensorReading,
  TrafficQueryParams,
} from '../../core/models/sensor-reading.models';
import { CustomSelect } from '../../shared/components/custom-select/custom-select';
import { DateTimePicker } from '../../shared/components/date-time-picker/date-time-picker';

Chart.register(...registerables);

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
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly elRef = inject(ElementRef);
  private readonly applyTrigger$ = new Subject<void>();

  private speedChart: Chart | null = null;
  private densityChart: Chart | null = null;
  private donutChart: Chart | null = null;

  private readonly alertTimers = new Map<string, ReturnType<typeof setTimeout>>();

  readonly isFilterExpanded = signal<boolean>(true);
  readonly isAnalyticsExpanded = signal<boolean>(true);
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
  readonly activeAlerts = signal<ApiAlert[]>([]);

  // Separate signal for chart data — fetches full filtered dataset
  readonly chartReadings = signal<TrafficSensorReading[]>([]);

  // Thresholds fetched from /api/settings
  readonly speedThreshold = signal<number | null>(null);
  readonly densityThreshold = signal<number | null>(null);

  // ── Analytics computed values ────────────────────────────────────────────
  readonly avgDensity = computed(() => {
    const r = this.chartReadings();
    if (!r.length) return 0;
    return Math.round(r.reduce((sum, x) => sum + x.trafficDensity, 0) / r.length);
  });

  readonly avgSpeed = computed(() => {
    const r = this.chartReadings();
    if (!r.length) return 0;
    return Math.round((r.reduce((sum, x) => sum + x.avgSpeed, 0) / r.length) * 10) / 10;
  });

  readonly peakDensity = computed(() => {
    const r = this.chartReadings();
    if (!r.length) return 0;
    return Math.max(...r.map(x => x.trafficDensity));
  });

  readonly dominantCongestion = computed(() => {
    const r = this.chartReadings();
    if (!r.length) return '—';
    const counts: Record<string, number> = {};
    r.forEach(x => { counts[x.congestionLevel] = (counts[x.congestionLevel] ?? 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  });

  readonly dominantCongestionClass = computed(() =>
    this.dominantCongestion().toLowerCase()
  );

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
    // Fetch user thresholds once on load
    this.fetchThresholds();

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
          this.fetchChartData(this.activeParams());
        },
        error: () => {
          this.isLoading.set(false);
          this.error.set('Failed to load traffic data. Please try again.');
        },
      });

    this.alertsService.alerts$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(alerts => {
        const trafficAlerts = alerts.filter(a => a.sensorType === 'TRAFFIC');
        trafficAlerts.forEach(alert => {
          if (!this.alertTimers.has(alert.id)) {
            const handle = setTimeout(() => this.hideBanner(alert.id), 5000);
            this.alertTimers.set(alert.id, handle);
          }
        });
        this.activeAlerts.set(trafficAlerts);
      });
  }

  // ── Threshold fetching ───────────────────────────────────────────────────
  private fetchThresholds(): void {
    const token = localStorage.getItem('iot_auth_token');
    if (!token) return;

    this.http.get<any[]>(`${environment.apiUrl}/settings`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (settings) => {
        const speed   = settings.find(s => s.type === 'TRAFFIC' && s.metric === 'AVG_SPEED');
        const density = settings.find(s => s.type === 'TRAFFIC' && s.metric === 'TRAFFIC_DENSITY');
        if (speed)   this.speedThreshold.set(speed.thresholdValue);
        if (density) this.densityThreshold.set(density.thresholdValue);
        this.updateCharts();
      },
      error: () => {},
    });
  }

  // ── Chart data fetch — all pages for current filter ──────────────────────
  // Separate from the table fetch so charts always show the full filtered
  // dataset regardless of which page the table is on.
  private fetchChartData(params: TrafficQueryParams): void {
    const total = this.totalElements();
    if (!total) return;

    const chartParams: TrafficQueryParams = {
      ...params,
      page: 0,
      size: total,
    };

    this.sensorService.getTrafficReadings(chartParams)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.chartReadings.set(response.content);
          setTimeout(() => {
            if (!this.speedChart) this.initCharts();
            else this.updateCharts();
          }, 0);
        },
        error: () => {},
      });
  }

  // ── Chart lifecycle ──────────────────────────────────────────────────────
  private getChartColors(): { grid: string; text: string } {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
      || window.matchMedia('(prefers-color-scheme: dark)').matches;
    return {
      grid: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
      text: isDark ? 'rgba(255,255,255,0.5)'  : 'rgba(0,0,0,0.45)',
    };
  }

  private initCharts(): void {
    const { grid, text } = this.getChartColors();

    const scaleOpts = (zero: boolean) => ({
      x: { grid: { color: grid }, ticks: { color: text, font: { size: 10 } } },
      y: { grid: { color: grid }, ticks: { color: text, font: { size: 10 } }, beginAtZero: zero },
    });

    const speedEl   = this.elRef.nativeElement.querySelector('#speedChart');
    const densityEl = this.elRef.nativeElement.querySelector('#densityChart');
    const donutEl   = this.elRef.nativeElement.querySelector('#donutChart');

    if (speedEl) {
      this.speedChart = new Chart(speedEl, {
        type: 'line',
        data: {
          labels: [],
          datasets: [
            {
              label: 'Avg speed',
              data: [],
              borderColor: '#1d9e75',
              backgroundColor: 'rgba(29,158,117,0.08)',
              fill: true, tension: 0.4, pointRadius: 3,
              pointBackgroundColor: [],
              borderWidth: 2, order: 1,
            },
            {
              label: 'Threshold',
              data: [],
              borderColor: '#f59e0b',
              borderWidth: 1.5,
              borderDash: [6, 4],
              pointRadius: 0,
              fill: false, tension: 0, order: 0,
            },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { filter: (i) => i.datasetIndex === 0 } },
          scales: scaleOpts(false),
        },
      });
    }

    if (densityEl) {
      this.densityChart = new Chart(densityEl, {
        type: 'line',
        data: {
          labels: [],
          datasets: [
            {
              label: 'Density',
              data: [],
              borderColor: '#378add',
              backgroundColor: 'rgba(55,138,221,0.08)',
              fill: true, tension: 0.4, pointRadius: 3,
              pointBackgroundColor: [],
              borderWidth: 2, order: 1,
            },
            {
              label: 'Threshold',
              data: [],
              borderColor: '#f59e0b',
              borderWidth: 1.5,
              borderDash: [6, 4],
              pointRadius: 0,
              fill: false, tension: 0, order: 0,
            },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { filter: (i) => i.datasetIndex === 0 } },
          scales: scaleOpts(true),
        },
      });
    }

    if (donutEl) {
      this.donutChart = new Chart(donutEl, {
        type: 'doughnut',
        data: {
          labels: ['Low', 'Moderate', 'High', 'Severe'],
          datasets: [{
            data: [0, 0, 0, 0],
            backgroundColor: ['#4ade80', '#facc15', '#fb923c', '#f87171'],
            borderWidth: 0, hoverOffset: 6,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          cutout: '65%',
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const total = (ctx.dataset.data as number[]).reduce((a, b) => a + b, 0);
                  const pct = total ? Math.round((ctx.raw as number) / total * 100) : 0;
                  return ` ${ctx.label}: ${ctx.raw} readings (${pct}%)`;
                },
              },
            },
          },
        },
      });
    }

    this.updateCharts();
  }

  private updateCharts(): void {
    const r = this.chartReadings();
    if (!r.length) return;

    const sorted = [...r].reverse();
    const labels  = sorted.map(x => {
      const d = new Date(x.timestamp);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    });
    const speeds  = sorted.map(x => x.avgSpeed);
    const density = sorted.map(x => x.trafficDensity);
    const n       = sorted.length;

    const sThr = this.speedThreshold();
    const dThr = this.densityThreshold();

    if (this.speedChart) {
      this.speedChart.data.labels = labels;
      this.speedChart.data.datasets[0].data = speeds;
      (this.speedChart.data.datasets[0] as any).pointBackgroundColor =
        speeds.map(v => sThr !== null && v < sThr ? '#ef4444' : '#1d9e75');
      this.speedChart.data.datasets[1].data = sThr !== null ? Array(n).fill(sThr) : [];
      this.speedChart.update('none');
    }

    if (this.densityChart) {
      this.densityChart.data.labels = labels;
      this.densityChart.data.datasets[0].data = density;
      (this.densityChart.data.datasets[0] as any).pointBackgroundColor =
        density.map(v => dThr !== null && v > dThr ? '#ef4444' : '#378add');
      this.densityChart.data.datasets[1].data = dThr !== null ? Array(n).fill(dThr) : [];
      this.densityChart.update('none');
    }

    if (this.donutChart) {
      const counts = { LOW: 0, MODERATE: 0, HIGH: 0, SEVERE: 0 };
      r.forEach(x => { if (x.congestionLevel in counts) counts[x.congestionLevel as keyof typeof counts]++; });
      this.donutChart.data.datasets[0].data = [counts.LOW, counts.MODERATE, counts.HIGH, counts.SEVERE];
      this.donutChart.update('none');
    }
  }

  // ── Alert methods ────────────────────────────────────────────────────────
  // Called by the 5-second timer — UI only, no backend call
  private hideBanner(id: string): void {
    const handle = this.alertTimers.get(id);
    if (handle !== undefined) { clearTimeout(handle); this.alertTimers.delete(id); }
    this.activeAlerts.update(alerts => alerts.filter(a => a.id !== id));
  }

  // Called by the manual X button — deletes from backend
  dismissAlert(id: string): void {
    this.hideBanner(id);
    this.alertsService.deleteAlert(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: err => console.error('Failed to dismiss alert', err) });
  }

  alertBannerMessage(alert: ApiAlert): string {
    const metric = alert.metric.replace(/_/g, ' ').toLowerCase();
    return alert.alertType === 'ABOVE'
      ? `Traffic alert: ${metric} exceeded threshold (${alert.triggeredValue} > ${alert.thresholdValue})`
      : `Traffic alert: ${metric} dropped below threshold (${alert.triggeredValue} < ${alert.thresholdValue})`;
  }

  alertSeverityClass(alert: ApiAlert): string {
    return alert.metric === 'TRAFFIC_DENSITY' && alert.alertType === 'ABOVE'
      ? 'banner-danger' : 'banner-warning';
  }

  // ── Filter methods ───────────────────────────────────────────────────────
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
      if (this.toMinutes(this.filterForm.toTime) <= this.toMinutes(this.filterForm.fromTime)) {
        this.timeRangeError.set('Invalid time range.');
        hasError = true;
      }
    }

    if (hasError) return;

    const [sortBy, sortDir] = this.filterForm.sortBy.split(':');
    const params: TrafficQueryParams = {
      page: 0, size: this.pageSize(), sortBy,
      sortDir: sortDir as 'asc' | 'desc',
    };

    if (this.filterForm.location) params.location = this.filterForm.location;
    if (this.filterForm.congestionLevel) params.congestionLevel = this.filterForm.congestionLevel as TrafficQueryParams['congestionLevel'];
    if (this.filterForm.fromDate && this.filterForm.fromTime) {
      const d = this.filterForm.fromDate;
      params.timestampStart = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${this.filterForm.fromTime}:00`;
    }
    if (this.filterForm.toDate && this.filterForm.toTime) {
      const d = this.filterForm.toDate;
      params.timestampEnd = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${this.filterForm.toTime}:59`;
    }
    if (this.filterForm.minDensity !== null) params.minDensity = this.filterForm.minDensity;
    if (this.filterForm.maxDensity !== null) params.maxDensity = this.filterForm.maxDensity;
    if (this.filterForm.minSpeed   !== null) params.minSpeed   = this.filterForm.minSpeed;
    if (this.filterForm.maxSpeed   !== null) params.maxSpeed   = this.filterForm.maxSpeed;

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
    if (this.filterForm.minDensity !== null)
      this.filterForm.minDensity = Math.min(500, Math.max(0, this.filterForm.minDensity));
    if (this.filterForm.maxDensity !== null)
      this.filterForm.maxDensity = Math.min(500, Math.max(0, this.filterForm.maxDensity));
    if (this.filterForm.minDensity !== null && this.filterForm.maxDensity !== null
        && this.filterForm.minDensity > this.filterForm.maxDensity)
      this.filterForm.minDensity = this.filterForm.maxDensity;
  }

  onSpeedChange(): void {
    if (this.filterForm.minSpeed !== null)
      this.filterForm.minSpeed = Math.round(Math.min(120, Math.max(0, this.filterForm.minSpeed)) * 10) / 10;
    if (this.filterForm.maxSpeed !== null)
      this.filterForm.maxSpeed = Math.round(Math.min(120, Math.max(0, this.filterForm.maxSpeed)) * 10) / 10;
    if (this.filterForm.minSpeed !== null && this.filterForm.maxSpeed !== null
        && this.filterForm.minSpeed > this.filterForm.maxSpeed)
      this.filterForm.minSpeed = this.filterForm.maxSpeed;
  }

  onDateChange(): void {
    if (this.filterForm.fromDate && this.filterForm.toDate
        && this.filterForm.toDate >= this.filterForm.fromDate)
      this.dateRangeError.set(null);
  }

  onTimeRangeChange(): void {
    if (!this.filterForm.fromDate || !this.filterForm.toDate) return;
    if (this.filterForm.fromDate.toDateString() !== this.filterForm.toDate.toDateString()) return;
    if (!this.filterForm.fromTime || !this.filterForm.toTime) return;
    if (this.toMinutes(this.filterForm.toTime) > this.toMinutes(this.filterForm.fromTime))
      this.timeRangeError.set(null);
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

  goBack(): void { this.router.navigate(['/home']); }

  toggleFilters(): void { this.isFilterExpanded.update(v => !v); }

  toggleAnalytics(): void { this.isAnalyticsExpanded.update(v => !v); }
}