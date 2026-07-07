import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  Input,
  OnDestroy,
  OnInit,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { EMPTY, Observable, Subject, merge, timer } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { Chart, registerables } from 'chart.js';
import type { Plugin } from 'chart.js';

import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { CustomSelect } from '../../shared/components/custom-select/custom-select';
import { DateTimePicker } from '../../shared/components/date-time-picker/date-time-picker';
import { SensorReadingsService } from '../../core/services/sensor-readings.service';
import { AlertsService, ApiAlert } from '../../core/services/alerts.service';
import { buildIsoTimestamp, validateDateRange } from '../../shared/utils/date-filter.utils';
import type {
  AirPollutionParams,
  AirPollutionSensorReading,
  AirPollutionStats,
  PaginatedResponse,
  StatsParams,
  StreetLightParams,
  StreetLightSensorReading,
  StreetLightStats,
  TrafficParams,
  TrafficSensorReading,
  TrafficStats,
} from '../../core/models/sensor-reading.models';
import type {
  ColumnDef,
  DistributionChartConfig,
  LineChartMetric,
  SensorDashboardConfig,
  SensorType,
} from './sensor-dashboard.config';

// Register Chart.js building blocks once for the whole app. The generic
// dashboard is the only chart consumer after the traffic migration.
Chart.register(...registerables);

/** Shared animation duration (ms) applied to every chart for consistency. */
const CHART_ANIMATION_MS = 600;

type SensorReading =
  | TrafficSensorReading
  | AirPollutionSensorReading
  | StreetLightSensorReading;

type SensorStats = TrafficStats | AirPollutionStats | StreetLightStats;

interface FilterState {
  fromDate: Date | null;
  fromTime: string;
  toDate: Date | null;
  toTime: string;
  location: string;
  sortBy: string;
  /** Sensor-specific filter values, keyed by backend param name. */
  extra: Record<string, string | number | null>;
}

/** Maps the dashboard sensor type to the alert `sensorType` enum. */
const ALERT_SENSOR_TYPE: Record<SensorType, string> = {
  traffic: 'TRAFFIC',
  'air-pollution': 'AIR_POLLUTION',
  'street-lights': 'STREET_LIGHT',
};

@Component({
  selector: 'app-sensor-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    TopbarComponent,
    CustomSelect,
    DateTimePicker,
  ],
  styleUrls: ['./sensor-dashboard.component.scss'],
  providers: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard-page" [attr.data-testid]="config.testIds?.page ?? 'sensor-dashboard-page'">
      <app-topbar></app-topbar>

      <div class="page-container">
        <!-- Header -->
        <div class="page-header">
          <nav class="breadcrumb">
            <span class="breadcrumb-item" (click)="goBack()">
              <mat-icon class="breadcrumb-home-icon">home</mat-icon>
              Home
            </span>
            <mat-icon class="breadcrumb-sep">chevron_right</mat-icon>
            <span class="breadcrumb-item active">{{ config.title }}</span>
          </nav>
          <div class="title-row">
            <button class="back-btn" (click)="goBack()" data-testid="back-button">
              <mat-icon>chevron_left</mat-icon>
            </button>
            <div>
              <h1 class="page-title">{{ config.title }}</h1>
              <p class="page-subtitle">Data auto-refreshes every 60 seconds</p>
            </div>
          </div>
        </div>

        <!-- Alert banners -->
        @if (activeAlerts().length > 0) {
          <div class="alert-banner-strip" data-testid="alert-banner-strip">
            @for (alert of activeAlerts(); track alert.id) {
              <div class="alert-banner" [ngClass]="alertSeverityClass(alert)" role="alert" data-testid="alert-banner">
                <div class="alert-banner-content">
                  <mat-icon class="alert-banner-icon">
                    {{ alertSeverityClass(alert) === 'banner-danger' ? 'error' : 'warning' }}
                  </mat-icon>
                  <span class="alert-banner-message">{{ alertBannerMessage(alert) }}</span>
                </div>
                <button class="alert-banner-close" (click)="dismissAlert(alert.id)" aria-label="Dismiss alert" data-testid="alert-banner-close">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
            }
          </div>
        }

        <!-- Filter panel -->
        <div class="filter-panel" data-testid="filter-panel">
          <div class="filter-header" [class.expanded]="isFilterExpanded()" (click)="toggleFilters()">
            <div style="display:flex;align-items:center;gap:0.5rem">
              <mat-icon class="filter-icon">tune</mat-icon>
              <span class="filter-title">Filters</span>
            </div>
            <div style="display:flex;align-items:center;gap:0.5rem">
              <span class="filter-toggle-hint">{{ isFilterExpanded() ? 'Collapse' : 'Expand' }}</span>
              <mat-icon class="filter-chevron" [class.rotated]="isFilterExpanded()">expand_more</mat-icon>
            </div>
          </div>

          @if (isFilterExpanded()) {
            <div class="filter-row-1">
              <div class="filter-group">
                <label class="filter-label">From</label>
                <app-date-time-picker
                  [value]="filterValues().fromDate"
                  [timeValue]="filterValues().fromTime"
                  placeholder="Pick date & time"
                  (valueChange)="patchFilter({ fromDate: $event })"
                  (timeValueChange)="patchFilter({ fromTime: $event })"
                  data-testid="from-datetime">
                </app-date-time-picker>
              </div>
              <div class="filter-group">
                <label class="filter-label">To</label>
                <app-date-time-picker
                  [value]="filterValues().toDate"
                  [timeValue]="filterValues().toTime"
                  placeholder="Pick date & time"
                  (valueChange)="patchFilter({ toDate: $event })"
                  (timeValueChange)="patchFilter({ toTime: $event })"
                  data-testid="to-datetime">
                </app-date-time-picker>
                @if (dateError()) {
                  <span class="filter-error" data-testid="date-error">{{ dateError() }}</span>
                }
              </div>
              <div class="filter-group">
                <label class="filter-label">Location</label>
                <app-custom-select
                  [options]="config.locationOptions"
                  placeholder="All locations"
                  [value]="filterValues().location"
                  (valueChange)="patchFilter({ location: $event })"
                  data-testid="location-select">
                </app-custom-select>
              </div>

              <!-- Sensor-specific filters -->
              @for (extra of config.extraFilterConfig ?? []; track extra.label) {
                <div class="filter-group">
                  <label class="filter-label">{{ extra.label }}</label>
                  @if (extra.kind === 'select') {
                    <app-custom-select
                      [options]="extra.options"
                      [placeholder]="extra.placeholder ?? 'All'"
                      [value]="extraValueStr(extra.key)"
                      (valueChange)="setExtra(extra.key, $event)"
                      [attr.data-testid]="extra.testId ?? ('extra-filter-' + extra.key)">
                    </app-custom-select>
                  } @else {
                    <div class="range-inputs">
                      <input class="filter-input range-input" type="number"
                        [attr.min]="extra.min ?? null" [attr.max]="extra.max ?? null" [attr.step]="extra.step ?? 'any'"
                        placeholder="min"
                        [ngModel]="extraValue(extra.minKey)"
                        (ngModelChange)="setExtra(extra.minKey, toNum($event))"
                        [attr.data-testid]="'extra-filter-' + extra.minKey" />
                      <span class="range-sep">-</span>
                      <input class="filter-input range-input" type="number"
                        [attr.min]="extra.min ?? null" [attr.max]="extra.max ?? null" [attr.step]="extra.step ?? 'any'"
                        placeholder="max"
                        [ngModel]="extraValue(extra.maxKey)"
                        (ngModelChange)="setExtra(extra.maxKey, toNum($event))"
                        [attr.data-testid]="'extra-filter-' + extra.maxKey" />
                    </div>
                  }
                </div>
              }
            </div>

            <div class="filter-row-2">
              <div class="filter-group">
                <label class="filter-label">Sort by</label>
                <app-custom-select
                  [options]="config.sortOptions"
                  placeholder="Sort by"
                  [value]="filterValues().sortBy"
                  (valueChange)="patchFilter({ sortBy: $event })"
                  data-testid="sort-select">
                </app-custom-select>
              </div>
              <div class="filter-btn-group">
                <button class="btn-reset" (click)="resetFilters()" data-testid="reset-filters-btn">
                  Clear filters
                </button>
                <button class="btn-apply" (click)="applyFilters()" data-testid="apply-filters-btn">
                  Apply filters
                </button>
              </div>
            </div>
          }
        </div>

        <!-- Table panel -->
        <div class="table-panel">
          <div class="table-header">
            <div class="table-title-row">
              <span class="live-dot"></span>
              <h2 class="table-title">Sensor readings</h2>
            </div>
            @if (lastUpdated()) {
              <span class="last-updated">Last updated: {{ lastUpdated() }}</span>
            }
          </div>

          @if (isLoading()) {
            <div class="state-container" data-testid="loading-state">
              <mat-icon class="state-icon spinning">autorenew</mat-icon>
              <p class="state-text">Loading data...</p>
            </div>
          }

          @if (!isLoading() && error()) {
            <div class="state-container error" data-testid="error-state">
              <mat-icon class="state-icon">error_outline</mat-icon>
              <p class="state-text">{{ error() }}</p>
              <button class="btn-apply" (click)="retry()" data-testid="retry-btn">Retry</button>
            </div>
          }

          @if (!isLoading() && !error() && readings().length > 0) {
            <div class="table-wrapper">
              <table class="readings-table" [attr.data-testid]="config.testIds?.table ?? 'sensor-table'">
                <thead>
                  <tr>
                    @for (col of config.columns; track col.key) {
                      <th>{{ col.label }}{{ col.unit ? ' (' + col.unit + ')' : '' }}</th>
                    }
                  </tr>
                </thead>
                <tbody>
                  @for (reading of readings(); track reading.id) {
                    <tr class="table-row" [attr.data-testid]="config.testIds?.row ?? 'sensor-row'">
                      @for (col of config.columns; track col.key) {
                        <td [attr.data-col]="col.key">
                          @if (col.key === 'timestamp') {
                            {{ reading.timestamp | date: 'yyyy-MM-dd HH:mm' }}
                          } @else {
                            {{ formatCell(reading, col) }}
                          }
                        </td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <div class="pagination-row">
              <div class="pagination-size">
                <label class="filter-label">Items per page</label>
                <app-custom-select
                  [options]="pageSizeOptions"
                  [value]="pageSizeStr()"
                  (valueChange)="onPageSizeChange($event)"
                  data-testid="page-size-select">
                </app-custom-select>
              </div>

              <span class="pagination-info">
                {{ currentPage() * pageSize() + 1 }} – {{ min((currentPage() + 1) * pageSize(), totalElements()) }}
                of {{ totalElements() }} readings
              </span>

              <div class="pagination-controls">
                <button class="page-btn icon-btn"
                  [disabled]="currentPage() === 0"
                  (click)="goToPage(0)"
                  title="First page"
                  data-testid="first-page-btn">
                  <mat-icon>first_page</mat-icon>
                </button>
                <button class="page-btn labeled-btn"
                  [disabled]="currentPage() === 0"
                  (click)="goToPage(currentPage() - 1)"
                  data-testid="prev-page-btn">
                  <mat-icon>arrow_back</mat-icon> Prev
                </button>
                <button class="page-btn labeled-btn"
                  [disabled]="currentPage() >= totalPages() - 1"
                  (click)="goToPage(currentPage() + 1)"
                  data-testid="next-page-btn">
                  Next <mat-icon>arrow_forward</mat-icon>
                </button>
                <button class="page-btn icon-btn"
                  [disabled]="currentPage() >= totalPages() - 1"
                  (click)="goToPage(totalPages() - 1)"
                  title="Last page"
                  data-testid="last-page-btn">
                  <mat-icon>last_page</mat-icon>
                </button>
              </div>
            </div>
          }

          @if (!isLoading() && !error() && readings().length === 0) {
            <div class="state-container" data-testid="empty-state">
              <mat-icon class="state-icon">inbox</mat-icon>
              <p class="state-text">No readings match your filters.</p>
            </div>
          }
        </div>

        <!-- Analytics panel -->
        <div class="analytics-panel" data-testid="analytics-panel">
          <div class="analytics-header" (click)="toggleAnalytics()" data-testid="analytics-header">
            <div class="analytics-header-left">
              <mat-icon class="analytics-icon">insert_chart</mat-icon>
              <span class="analytics-title">Detailed analytics</span>
            </div>
            <div class="analytics-header-right">
              <span class="analytics-toggle-hint">{{ isAnalyticsExpanded() ? 'Collapse' : 'Expand' }}</span>
              <mat-icon class="analytics-chevron" [class.rotated]="isAnalyticsExpanded()">expand_more</mat-icon>
            </div>
          </div>

          @if (isAnalyticsExpanded()) {
            <div class="analytics-body">
              @if (!hasDateRange()) {
                <div class="state-container" data-testid="analytics-range-message">
                  <mat-icon class="state-icon">date_range</mat-icon>
                  <p class="state-text">Select a date range to view analytics.</p>
                </div>
              } @else if (statsError()) {
                <div class="state-container error" data-testid="analytics-error">
                  <mat-icon class="state-icon">error_outline</mat-icon>
                  <p class="state-text">{{ statsError() }}</p>
                </div>
              } @else if (statsLoading()) {
                <div class="state-container" data-testid="analytics-loading">
                  <mat-icon class="state-icon spinning">autorenew</mat-icon>
                  <p class="state-text">Loading analytics...</p>
                </div>
              } @else if (statsData()) {
                <div class="analytics-cards" data-testid="analytics-cards">
                  @for (metric of config.statsConfig.metrics; track metric.key) {
                    <div class="analytics-card" [attr.data-testid]="'stat-card-' + metric.key">
                      <span class="analytics-card-label">{{ metric.label }}</span>
                      <span class="analytics-card-value">
                        {{ statValue(metric.key) }}
                        @if (metric.unit) {
                          <span class="analytics-card-unit">{{ metric.unit }}</span>
                        }
                      </span>
                    </div>
                  }
                </div>

                @if (config.charts) {
                  <div class="analytics-section-header">
                    <mat-icon class="analytics-section-icon">bar_chart</mat-icon>
                    <h3 class="analytics-section-title">Analytics</h3>
                  </div>
                  <div class="analytics-charts-row" data-testid="analytics-charts">
                    @if (config.charts.metric1) {
                      <div
                        class="analytics-chart-panel"
                        [style.--chart-glow]="glow(config.charts.metric1.color)"
                      >
                        <span class="analytics-chart-label">{{ config.charts.metric1.label }}</span>
                        @if (hasDailyData()) {
                          <div class="analytics-chart-wrap">
                            <canvas id="sensorLineChart1" data-testid="analytics-line-chart-1"></canvas>
                          </div>
                        } @else {
                          <div class="analytics-chart-empty" data-testid="analytics-line-chart-1-empty">
                            No data for selected period
                          </div>
                        }
                      </div>
                    }
                    @if (config.charts.metric2) {
                      <div
                        class="analytics-chart-panel"
                        [style.--chart-glow]="glow(config.charts.metric2.color)"
                      >
                        <span class="analytics-chart-label">{{ config.charts.metric2.label }}</span>
                        @if (hasDailyData()) {
                          <div class="analytics-chart-wrap">
                            <canvas id="sensorLineChart2" data-testid="analytics-line-chart-2"></canvas>
                          </div>
                        } @else {
                          <div class="analytics-chart-empty" data-testid="analytics-line-chart-2-empty">
                            No data for selected period
                          </div>
                        }
                      </div>
                    }
                    @if (config.charts.distributionChart) {
                      <div
                        class="analytics-chart-panel"
                        [style.--chart-glow]="glow(firstDistributionColor())"
                      >
                        <span class="analytics-chart-label">{{ config.charts.distributionChart.label }}</span>
                        @if (distributionHasData()) {
                          <div class="analytics-chart-wrap">
                            <canvas id="sensorDonutChart" data-testid="analytics-donut-chart"></canvas>
                          </div>
                        } @else {
                          <div class="analytics-chart-empty" data-testid="analytics-donut-chart-empty">
                            No data for selected period
                          </div>
                        }
                      </div>
                    }
                  </div>
                }
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class SensorDashboard implements OnInit, OnDestroy {
  @Input({ required: true }) config!: SensorDashboardConfig;

  private readonly sensorService = inject(SensorReadingsService);
  private readonly alertsService = inject(AlertsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly elRef = inject(ElementRef);
  private readonly decimalPipe = inject(DecimalPipe);
  private readonly injector = inject(Injector);
  private readonly refresh$ = new Subject<void>();
  private readonly alertTimers = new Map<string, ReturnType<typeof setTimeout>>();

  // The analytics panel seeds a default date range on init (see ngOnInit), but
  // the readings table must keep loading exactly as before — unfiltered until
  // the user explicitly applies a date range. This flag keeps those date params
  // out of the readings request until then.
  private filtersApplied = false;

  // Chart.js instances — recreated whenever fresh stats arrive, destroyed on
  // teardown. Kept as plain fields (not signals); they are imperative resources.
  private lineChart1: Chart | null = null;
  private lineChart2: Chart | null = null;
  private donutChart: Chart | null = null;

  // ── UI state ───────────────────────────────────────────────────────────────
  readonly isFilterExpanded = signal<boolean>(true);
  readonly isAnalyticsExpanded = signal<boolean>(true);

  // ── Table / pagination state ────────────────────────────────────────────────
  readonly readings = signal<SensorReading[]>([]);
  readonly totalElements = signal<number>(0);
  readonly totalPages = signal<number>(0);
  readonly currentPage = signal<number>(0);
  readonly pageSize = signal<number>(5);
  readonly isLoading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly lastUpdated = signal<string | null>(null);

  // ── Filter state ─────────────────────────────────────────────────────────────
  readonly filterValues = signal<FilterState>(this.emptyFilterState());
  readonly dateError = signal<string | null>(null);

  // ── Alerts ───────────────────────────────────────────────────────────────────
  readonly activeAlerts = signal<ApiAlert[]>([]);

  // ── Analytics state ──────────────────────────────────────────────────────────
  readonly statsData = signal<SensorStats | null>(null);
  readonly statsLoading = signal<boolean>(false);
  readonly statsError = signal<string | null>(null);

  readonly hasDateRange = computed(
    () => !!this.filterValues().fromDate && !!this.filterValues().toDate,
  );
  readonly pageSizeStr = computed(() => String(this.pageSize()));

  readonly pageSizeOptions = [
    { label: '5', value: '5' },
    { label: '10', value: '10' },
    { label: '15', value: '15' },
    { label: '20', value: '20' },
    { label: '25', value: '25' },
  ];

  readonly min = Math.min;

  ngOnDestroy(): void {
    this.destroyCharts();
    for (const handle of this.alertTimers.values()) {
      clearTimeout(handle);
    }
    this.alertTimers.clear();
  }

  ngOnInit(): void {
    // Seed defaults now that the config input is available. The default analytics
    // range (last 7 days) makes the charts populate on first load and keeps the
    // date pickers visibly reflecting the active range. The readings table stays
    // unfiltered (filtersApplied=false) until the user explicitly applies.
    this.filterValues.set(this.initialFilterState());

    merge(timer(0, 60000), this.refresh$)
      .pipe(
        switchMap(() => {
          const validation = validateDateRange(
            this.toYmd(this.filterValues().fromDate),
            this.toYmd(this.filterValues().toDate),
            false,
          );
          if (validation) {
            this.dateError.set(validation.message);
            this.isLoading.set(false);
            return EMPTY;
          }

          this.dateError.set(null);
          this.isLoading.set(true);

          return this.requestReadings(this.buildParams(this.currentPage())).pipe(
            catchError(() => {
              this.isLoading.set(false);
              this.error.set(`Failed to load ${this.config.title.toLowerCase()}. Please try again.`);
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((response: PaginatedResponse<SensorReading>) => {
        this.readings.set(response.content);
        this.totalElements.set(response.totalElements);
        this.totalPages.set(response.totalPages);
        this.currentPage.set(response.number);
        this.isLoading.set(false);
        this.error.set(null);
        this.lastUpdated.set(new Date().toLocaleTimeString());
      });

    this.alertsService.alerts$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((alerts) => {
      const mine = alerts.filter((a) => a.sensorType === ALERT_SENSOR_TYPE[this.config.sensorType]);
      mine.forEach((alert) => {
        if (!this.alertTimers.has(alert.id)) {
          const handle = setTimeout(() => this.hideBanner(alert.id), 5000);
          this.alertTimers.set(alert.id, handle);
        }
      });
      this.activeAlerts.set(mine);
    });

    // Load analytics immediately using the default range above. The readings
    // table loads independently via the stream above and is untouched here.
    this.fetchStats();
  }

  // ── Service dispatch ─────────────────────────────────────────────────────────
  private requestReadings(
    params: Record<string, unknown>,
  ): Observable<PaginatedResponse<SensorReading>> {
    switch (this.config.sensorType) {
      case 'traffic':
        return this.sensorService.getTrafficReadings(params as TrafficParams);
      case 'air-pollution':
        return this.sensorService.getAirPollutionReadings(params as AirPollutionParams);
      case 'street-lights':
        return this.sensorService.getStreetLightReadings(params as StreetLightParams);
      default:
        throw new Error(`Unsupported sensor type: ${this.config.sensorType}`);
    }
  }

  private requestStats(params: StatsParams): Observable<SensorStats> {
    switch (this.config.sensorType) {
      case 'traffic':
        return this.sensorService.getTrafficStats(params);
      case 'air-pollution':
        return this.sensorService.getAirPollutionStats(params);
      case 'street-lights':
        return this.sensorService.getStreetLightStats(params);
      default:
        throw new Error(`Unsupported sensor type: ${this.config.sensorType}`);
    }
  }

  // ── Param building ───────────────────────────────────────────────────────────
  private buildParams(page: number): Record<string, unknown> {
    const fv = this.filterValues();
    const [sortBy, sortDir] = (fv.sortBy || 'timestamp:desc').split(':');

    const params: Record<string, unknown> = {
      page,
      size: this.pageSize(),
      sortBy,
      sortDir,
    };

    if (fv.location) params['location'] = fv.location;

    // The seeded default range drives analytics only; it must not scope the
    // readings table until the user explicitly applies filters.
    if (this.filtersApplied) {
      const fromYmd = this.toYmd(fv.fromDate);
      const toYmd = this.toYmd(fv.toDate);
      if (fromYmd) params['timestampStart'] = buildIsoTimestamp(fromYmd, fv.fromTime || undefined, false);
      if (toYmd) params['timestampEnd'] = buildIsoTimestamp(toYmd, fv.toTime || undefined, true);
    }

    for (const [key, value] of Object.entries(fv.extra)) {
      if (value !== null && value !== undefined && value !== '') {
        params[key] = value;
      }
    }

    return params;
  }

  // ── Filter actions ───────────────────────────────────────────────────────────
  applyFilters(): void {
    this.filtersApplied = true;
    this.currentPage.set(0);
    this.refresh$.next();
    this.fetchStats();
  }

  resetFilters(): void {
    this.filtersApplied = false;
    // Re-seed the default 7-day analytics range so the charts behave exactly as
    // they do on first load instead of going blank after a reset.
    this.filterValues.set(this.initialFilterState());
    this.dateError.set(null);
    this.statsError.set(null);
    this.currentPage.set(0);
    this.refresh$.next();
    this.fetchStats();
  }

  retry(): void {
    this.error.set(null);
    this.isLoading.set(true);
    this.refresh$.next();
  }

  patchFilter(patch: Partial<FilterState>): void {
    this.filterValues.update((fv) => ({ ...fv, ...patch }));
  }

  setExtra(key: string, value: string | number | null): void {
    this.filterValues.update((fv) => ({ ...fv, extra: { ...fv.extra, [key]: value } }));
  }

  extraValue(key: string): string | number | null {
    return this.filterValues().extra[key] ?? null;
  }

  extraValueStr(key: string): string {
    const value = this.filterValues().extra[key];
    return value === null || value === undefined ? '' : String(value);
  }

  toNum(value: unknown): number | null {
    if (value === '' || value === null || value === undefined) return null;
    const num = Number(value);
    return Number.isNaN(num) ? null : num;
  }

  // ── Pagination ───────────────────────────────────────────────────────────────
  goToPage(page: number): void {
    this.currentPage.set(page);
    this.refresh$.next();
  }

  onPageSizeChange(value: string): void {
    this.pageSize.set(Number(value));
    this.currentPage.set(0);
    this.refresh$.next();
  }

  // ── Analytics ────────────────────────────────────────────────────────────────
  private fetchStats(): void {
    const fv = this.filterValues();
    const fromYmd = this.toYmd(fv.fromDate);
    const toYmd = this.toYmd(fv.toDate);

    if (!fromYmd || !toYmd) {
      this.statsData.set(null);
      this.statsError.set(null);
      return;
    }

    const validation = validateDateRange(fromYmd, toYmd, true);
    if (validation) {
      this.statsData.set(null);
      this.statsError.set(validation.message);
      return;
    }

    this.statsError.set(null);
    this.statsLoading.set(true);

    const params: StatsParams = {
      from: buildIsoTimestamp(fromYmd, fv.fromTime || undefined, false),
      to: buildIsoTimestamp(toYmd, fv.toTime || undefined, true),
      location: fv.location || undefined,
    };

    this.requestStats(params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (stats) => {
          this.statsData.set(stats);
          this.statsLoading.set(false);
          // Defer so the @if-rendered canvases exist in the DOM before drawing.
          this.scheduleChartRender();
        },
        error: () => {
          this.statsError.set('Failed to load analytics. Please try again.');
          this.statsLoading.set(false);
          this.destroyCharts();
        },
      });
  }

  statValue(key: string): string {
    const stats = this.statsData();
    if (!stats) return '—';
    const value = (stats as unknown as Record<string, unknown>)[key];
    if (value === null || value === undefined) return '—';
    if (typeof value === 'number') return this.formatNumber(value);
    return String(value);
  }

  // ── Table cell rendering ─────────────────────────────────────────────────────
  formatCell(reading: SensorReading, col: ColumnDef): string {
    const value = (reading as unknown as Record<string, unknown>)[col.key];
    if (value === null || value === undefined) return '—';
    const display = typeof value === 'number' ? this.formatNumber(value) : String(value);
    return col.unit ? `${display} ${col.unit}` : display;
  }

  /** Formats a number for display: thousands separators, up to 2 decimals. */
  private formatNumber(value: number): string {
    return this.decimalPipe.transform(value, '1.0-2') ?? String(value);
  }

  // ── Alerts ───────────────────────────────────────────────────────────────────
  private hideBanner(id: string): void {
    const handle = this.alertTimers.get(id);
    if (handle !== undefined) {
      clearTimeout(handle);
      this.alertTimers.delete(id);
    }
    this.activeAlerts.update((alerts) => alerts.filter((a) => a.id !== id));
  }

  dismissAlert(id: string): void {
    this.hideBanner(id);
    this.alertsService.markAsRead(id);
  }

  alertBannerMessage(alert: ApiAlert): string {
    const metric = alert.metric.replace(/_/g, ' ').toLowerCase();
    return alert.alertType === 'ABOVE'
      ? `${this.config.title}: ${metric} exceeded threshold (${alert.triggeredValue} > ${alert.thresholdValue})`
      : `${this.config.title}: ${metric} dropped below threshold (${alert.triggeredValue} < ${alert.thresholdValue})`;
  }

  alertSeverityClass(alert: ApiAlert): string {
    return alert.alertType === 'ABOVE' ? 'banner-danger' : 'banner-warning';
  }

  // ── Misc ─────────────────────────────────────────────────────────────────────
  goBack(): void {
    this.router.navigate([this.config.backRoute]);
  }

  toggleFilters(): void {
    this.isFilterExpanded.update((v) => !v);
  }

  toggleAnalytics(): void {
    const expanded = !this.isAnalyticsExpanded();
    this.isAnalyticsExpanded.set(expanded);
    if (expanded && this.statsData()) {
      // Canvases are (re)created by the @if when expanding — rebuild charts.
      this.scheduleChartRender();
    } else if (!expanded) {
      // Collapsing removes the canvases from the DOM; drop the stale instances.
      this.destroyCharts();
    }
  }

  // ── Charts ───────────────────────────────────────────────────────────────────
  /**
   * Schedules a chart rebuild after the next render, so the `@if`-controlled
   * canvases are guaranteed to exist in the DOM. Uses Angular's render hook
   * instead of a setTimeout(0) macrotask, which is fragile and untracked.
   */
  private scheduleChartRender(): void {
    afterNextRender(() => this.renderCharts(), { injector: this.injector });
  }

  /** Rebuilds all configured charts from the current stats response. */
  private renderCharts(): void {
    this.destroyCharts();

    const charts = this.config.charts;
    const stats = this.statsData();
    if (!charts || !stats || !this.isAnalyticsExpanded()) return;

    const daily = this.dailyAverages(stats);

    if (charts.metric1) {
      this.lineChart1 = this.buildLineChart('sensorLineChart1', charts.metric1, daily);
    }
    if (charts.metric2) {
      this.lineChart2 = this.buildLineChart('sensorLineChart2', charts.metric2, daily);
    }
    if (charts.distributionChart) {
      this.donutChart = this.buildDonutChart('sensorDonutChart', charts.distributionChart, stats);
    }
  }

  private destroyCharts(): void {
    this.lineChart1?.destroy();
    this.lineChart2?.destroy();
    this.donutChart?.destroy();
    this.lineChart1 = null;
    this.lineChart2 = null;
    this.donutChart = null;
  }

  private canvas(id: string): HTMLCanvasElement | null {
    return (this.elRef.nativeElement as HTMLElement).querySelector<HTMLCanvasElement>(`#${id}`);
  }

  private buildLineChart(
    canvasId: string,
    metric: LineChartMetric,
    daily: Array<Record<string, unknown>>,
  ): Chart | null {
    const canvas = this.canvas(canvasId);
    if (!canvas) return null;

    const labels = daily.map((entry) => String(entry['date'] ?? ''));
    const data = daily.map((entry) => Number(entry[metric.key] ?? 0));
    const base = this.baseChartOptions();

    return new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: metric.label,
            data,
            borderColor: metric.color,
            // Vertical gradient: line colour at ~30% on top → transparent at the
            // bottom. Scriptable so it recomputes against the live chart area.
            backgroundColor: (context: { chart: Chart }) => {
              const { ctx, chartArea } = context.chart;
              if (!chartArea) return this.hexToRgba(metric.color, 0);
              const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
              gradient.addColorStop(0, this.hexToRgba(metric.color, 0.3));
              gradient.addColorStop(1, this.hexToRgba(metric.color, 0));
              return gradient;
            },
            pointBackgroundColor: metric.color,
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5,
          },
        ],
      },
      options: {
        ...base,
        scales: {
          x: base.scales.x,
          y: {
            ...base.scales.y,
            beginAtZero: true,
            title: { display: false },
            ticks: {
              ...base.scales.y.ticks,
              maxTicksLimit: 5,
              callback: (value: string | number) => this.formatAxisValue(Number(value)),
            },
          },
        },
      },
    });
  }

  /** Adaptive precision so the Y-axis stays readable across value scales. */
  private formatAxisValue(value: number): string {
    const abs = Math.abs(value);
    if (abs < 1) return value.toFixed(2);
    if (abs < 100) return value.toFixed(1);
    return value.toFixed(0);
  }

  private buildDonutChart(
    canvasId: string,
    cfg: DistributionChartConfig,
    stats: SensorStats,
  ): Chart | null {
    const canvas = this.canvas(canvasId);
    if (!canvas) return null;

    const distribution = (stats as unknown as Record<string, unknown>)[cfg.field] as
      | Record<string, number>
      | undefined;
    const dist = distribution ?? {};

    // Drive colour/data order from the colorMap so colours stay stable. Data
    // keys are kept raw; only the display labels are humanised.
    const keys = Object.keys(cfg.colorMap);
    const labels = keys.map((key) => this.humanizeLabel(key));
    const data = keys.map((key) => Number(dist[key] ?? 0));
    const colors = keys.map((key) => cfg.colorMap[key]);

    const base = this.baseChartOptions();

    return new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: colors,
            // Transparent borders so segments don't get harsh white outlines.
            borderColor: 'transparent',
            borderWidth: 0,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        ...base,
        cutout: '70%',
        plugins: {
          ...base.plugins,
          legend: {
            position: 'right' as const,
            labels: {
              usePointStyle: true,
              pointStyle: 'circle' as const,
              boxWidth: 8,
              padding: 12,
              font: { family: this.chartFont(), size: 11 },
              color: this.chartTextColor(),
            },
          },
        },
      },
      plugins: [this.donutCenterTextPlugin()],
    });
  }

  /** Inline Chart.js plugin: renders the total count in the donut's center hole. */
  private donutCenterTextPlugin(): Plugin<'doughnut'> {
    const font = this.chartFont();
    // Both the number and the "total" label use the same themed light colour.
    const numberColor = this.chartTextColor();
    const labelColor = this.chartTextColor();
    return {
      id: 'donutCenterText',
      afterDatasetsDraw: (chart) => {
        const area = chart.chartArea;
        if (!area) return;
        const total = (chart.data.datasets[0]?.data as number[]).reduce(
          (sum, n) => sum + Number(n ?? 0),
          0,
        );
        const ctx = chart.ctx;
        const cx = (area.left + area.right) / 2;
        const cy = (area.top + area.bottom) / 2;
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = numberColor;
        ctx.font = `700 22px ${font}`;
        ctx.fillText(String(total), cx, cy - 8);
        ctx.fillStyle = labelColor;
        ctx.font = `400 11px ${font}`;
        ctx.fillText('total', cx, cy + 12);
        ctx.restore();
      },
    };
  }

  /** Turns enum-style keys (e.g. VERY_UNHEALTHY) into "Very Unhealthy". */
  private humanizeLabel(key: string): string {
    return key
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  /** Visual options shared by every chart so all three look identical. */
  private baseChartOptions() {
    const font = this.chartFont();
    // Themed light text + subtle grid so every chart stays legible on the dark
    // navy background. Pulled centrally so all three dashboards benefit.
    const textColor = this.chartTextColor();
    const gridColor = 'rgba(255, 255, 255, 0.06)';
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: CHART_ANIMATION_MS },
      // Global default colour for any text Chart.js renders.
      color: textColor,
      plugins: {
        // Hidden by default — the card title already names the metric. The donut
        // re-enables and repositions its legend (segments need identifying).
        legend: { display: false, labels: { color: textColor } },
        title: { display: false },
        tooltip: {
          // A lighter shade of the panel background rather than pure black.
          backgroundColor: this.cssVar('--t-metric-bg') || this.cssVar('--t-card-inner'),
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          cornerRadius: 8,
          padding: 10,
          caretSize: 0,
          titleColor: this.cssVar('--t-text-primary'),
          bodyColor: this.cssVar('--t-text-secondary'),
          titleFont: { family: font, size: 12, weight: 'bold' as const },
          bodyFont: { family: font, size: 11 },
        },
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { family: font, size: 10 } },
        },
        y: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { family: font, size: 10 } },
        },
      },
    };
  }

  /**
   * Light text colour for chart elements, read from the theme's muted/secondary
   * text variable so it tracks the active theme. Falls back to translucent white.
   */
  private chartTextColor(): string {
    const root = getComputedStyle(document.documentElement);
    return (
      root.getPropertyValue('--t-text-secondary').trim() ||
      root.getPropertyValue('--t-text-muted').trim() ||
      'rgba(255, 255, 255, 0.6)'
    );
  }

  private dailyAverages(stats: SensorStats): Array<Record<string, unknown>> {
    const value = (stats as unknown as Record<string, unknown>)['dailyAverages'];
    return Array.isArray(value) ? (value as Array<Record<string, unknown>>) : [];
  }

  private chartFont(): string {
    const family = getComputedStyle(document.body).fontFamily;
    return family || 'system-ui, sans-serif';
  }

  /** Reads a CSS custom property off the host so canvas colours track the theme. */
  private cssVar(name: string): string {
    return getComputedStyle(this.elRef.nativeElement as HTMLElement).getPropertyValue(name).trim();
  }

  // ── Template chart helpers ─────────────────────────────────────────────────
  /** Color-matched card glow (the line/segment colour at low opacity). */
  glow(hex: string): string {
    if (!hex || !hex.startsWith('#')) return 'transparent';
    return this.hexToRgba(hex, 0.1);
  }

  /** Representative colour for the donut card glow (first colorMap entry). */
  firstDistributionColor(): string {
    const colorMap = this.config.charts?.distributionChart?.colorMap ?? {};
    return Object.values(colorMap)[0] ?? '';
  }

  /** True when the line charts have at least one daily-average point to plot. */
  hasDailyData(): boolean {
    const stats = this.statsData();
    return !!stats && this.dailyAverages(stats).length > 0;
  }

  /** True when the distribution has at least one non-zero segment. */
  distributionHasData(): boolean {
    const stats = this.statsData();
    const cfg = this.config.charts?.distributionChart;
    if (!stats || !cfg) return false;
    const dist = (stats as unknown as Record<string, unknown>)[cfg.field] as
      | Record<string, number>
      | undefined;
    if (!dist) return false;
    return Object.keys(cfg.colorMap).some((key) => Number(dist[key] ?? 0) > 0);
  }

  private hexToRgba(hex: string, alpha: number): string {
    const clean = hex.replace('#', '');
    const full =
      clean.length === 3
        ? clean
            .split('')
            .map((c) => c + c)
            .join('')
        : clean;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  private emptyFilterState(): FilterState {
    const extra: Record<string, string | number | null> = {};
    for (const filter of this.config?.extraFilterConfig ?? []) {
      if (filter.kind === 'select') {
        extra[filter.key] = '';
      } else {
        extra[filter.minKey] = null;
        extra[filter.maxKey] = null;
      }
    }
    return {
      fromDate: null,
      fromTime: '',
      toDate: null,
      toTime: '',
      location: '',
      sortBy: this.config?.sortOptions?.[0]?.value ?? 'timestamp:desc',
      extra,
    };
  }

  /**
   * Empty filter state seeded with the default analytics range (last 7 days), so
   * the charts populate on first load and after a reset. The readings table stays
   * unfiltered because `filtersApplied` remains false until the user applies.
   */
  private initialFilterState(): FilterState {
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 7);
    return { ...this.emptyFilterState(), fromDate, toDate };
  }

  private toYmd(date: Date | null): string | undefined {
    if (!date) return undefined;
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
}
