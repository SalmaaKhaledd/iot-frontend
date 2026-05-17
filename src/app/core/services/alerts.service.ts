import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export type AlertSensorType = 'TRAFFIC' | 'AIR_POLLUTION' | 'STREET_LIGHT';

export interface ApiAlert {
  id: string;
  sensorType: string;
  location: string;
  metric: string;
  triggeredValue: number;
  thresholdValue: number;
  alertType: 'ABOVE' | 'BELOW';
  triggeredAt: string;
  readingId: string | null;
}

export type NewAlertsForType = {
  readonly sensorType: AlertSensorType;
  readonly alerts: readonly ApiAlert[];
};

export type RefreshAlertsOptions = {
  /** When true, show toast notifications for new alerts of this type only. */
  readonly notify?: boolean;
  /** Reading ids from the current sensor history batch. */
  readonly readingIds?: readonly string[];
  /** Newest reading timestamp in the current history batch (ISO). */
  readonly latestReadingTimestamp?: string;
};

const ALL_SENSOR_TYPES: readonly AlertSensorType[] = [
  'TRAFFIC',
  'AIR_POLLUTION',
  'STREET_LIGHT',
];

export function normalizeAlertSensorType(sensorType: string): AlertSensorType | null {
  const normalized = sensorType?.trim().toUpperCase().replace(/-/g, '_');
  if (normalized === 'TRAFFIC') {
    return 'TRAFFIC';
  }
  if (normalized === 'AIR_POLLUTION' || normalized === 'AIRPOLLUTION') {
    return 'AIR_POLLUTION';
  }
  if (normalized === 'STREET_LIGHT' || normalized === 'STREETLIGHT') {
    return 'STREET_LIGHT';
  }
  return null;
}

/** Keep alerts tied to readings in the current history window. */
export function filterAlertsToReadingHistory(
  alerts: readonly ApiAlert[],
  readingIds: readonly string[] | undefined,
  latestReadingTimestamp: string | undefined,
): ApiAlert[] {
  if (!readingIds?.length) {
    return [];
  }

  const readingIdSet = new Set(readingIds);
  const latestMs = latestReadingTimestamp
    ? new Date(latestReadingTimestamp).getTime()
    : Number.NaN;
  const hasLatestCutoff = !Number.isNaN(latestMs);

  return alerts.filter((alert) => {
    if (alert.readingId) {
      return readingIdSet.has(alert.readingId);
    }
    if (!hasLatestCutoff || !alert.triggeredAt) {
      return false;
    }
    const triggeredMs = new Date(alert.triggeredAt).getTime();
    return !Number.isNaN(triggeredMs) && triggeredMs <= latestMs;
  });
}

@Injectable({ providedIn: 'root' })
export class AlertsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  private readonly alertDeletedSource = new Subject<string>();
  readonly alertDeleted$ = this.alertDeletedSource.asObservable();

  private readonly alertsByType: Record<AlertSensorType, BehaviorSubject<ApiAlert[]>> = {
    TRAFFIC: new BehaviorSubject<ApiAlert[]>([]),
    AIR_POLLUTION: new BehaviorSubject<ApiAlert[]>([]),
    STREET_LIGHT: new BehaviorSubject<ApiAlert[]>([]),
  };

  private readonly alertsSubject = new BehaviorSubject<ApiAlert[]>([]);
  readonly alerts$ = this.alertsSubject.asObservable();

  private readonly newAlertsForTypeSource = new Subject<NewAlertsForType>();
  readonly newAlertsForType$ = this.newAlertsForTypeSource.asObservable();

  private readonly syncedSensorTypes = new Set<AlertSensorType>();
  private readonly panelVisibleTypes = new Set<AlertSensorType>();

  isSynced(sensorType: AlertSensorType): boolean {
    return this.syncedSensorTypes.has(sensorType);
  }

  alertsForType(sensorType: AlertSensorType): Observable<ApiAlert[]> {
    return this.alertsByType[sensorType].asObservable();
  }

  getAlerts(): Observable<ApiAlert[]> {
    return this.http.get<ApiAlert[]>(`${this.baseUrl}/alerts`).pipe(
      tap((alerts) => this.replaceAllFromApi(alerts)),
    );
  }

  refreshAlerts(sensorType: AlertSensorType, options: RefreshAlertsOptions = {}): void {
    const notify = options.notify ?? false;
    const readingIdSet =
      options.readingIds && options.readingIds.length > 0
        ? new Set(options.readingIds)
        : null;

    const typeSubject = this.alertsByType[sensorType];
    const previousIds = new Set(typeSubject.getValue().map((alert) => alert.id));
    const hadSyncedType = this.syncedSensorTypes.has(sensorType);

    this.http.get<ApiAlert[]>(`${this.baseUrl}/alerts`).subscribe({
      next: (allAlerts) => {
        const forSensorType = allAlerts.filter(
          (alert) => normalizeAlertSensorType(alert.sensorType) === sensorType,
        );
        const forType = filterAlertsToReadingHistory(
          forSensorType,
          options.readingIds,
          options.latestReadingTimestamp,
        );

        typeSubject.next(forType);
        this.syncedSensorTypes.add(sensorType);
        if (notify) {
          this.panelVisibleTypes.add(sensorType);
        }
        this.publishPanelAlerts();

        if (notify && hadSyncedType) {
          const newlyAdded = forType
            .filter((alert) => !previousIds.has(alert.id))
            .filter((alert) => this.isAlertLinkedToReadings(alert, readingIdSet));

          if (newlyAdded.length > 0) {
            this.newAlertsForTypeSource.next({ sensorType, alerts: newlyAdded });
          }
        }
      },
      error: (err) => console.error(`Failed to refresh ${sensorType} alerts`, err),
    });
  }

  deleteAlert(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/alerts/${id}`).pipe(
      tap(() => {
        for (const sensorType of ALL_SENSOR_TYPES) {
          const subject = this.alertsByType[sensorType];
          const next = subject.getValue().filter((alert) => alert.id !== id);
          if (next.length !== subject.getValue().length) {
            subject.next(next);
          }
        }
        this.publishPanelAlerts();
        this.alertDeletedSource.next(id);
      }),
    );
  }

  private isAlertLinkedToReadings(
    alert: ApiAlert,
    readingIdSet: Set<string> | null,
  ): boolean {
    if (!readingIdSet) {
      return true;
    }
    return alert.readingId != null && readingIdSet.has(alert.readingId);
  }

  private replaceAllFromApi(alerts: ApiAlert[]): void {
    for (const sensorType of ALL_SENSOR_TYPES) {
      const forType = alerts.filter(
        (alert) => normalizeAlertSensorType(alert.sensorType) === sensorType,
      );
      this.alertsByType[sensorType].next(forType);
      if (forType.length > 0) {
        this.syncedSensorTypes.add(sensorType);
        this.panelVisibleTypes.add(sensorType);
      }
    }
    this.publishPanelAlerts();
  }

  private publishPanelAlerts(): void {
    const combined: ApiAlert[] = [];
    for (const sensorType of ALL_SENSOR_TYPES) {
      if (this.panelVisibleTypes.has(sensorType)) {
        combined.push(...this.alertsByType[sensorType].getValue());
      }
    }
    this.alertsSubject.next(combined);
  }
}
