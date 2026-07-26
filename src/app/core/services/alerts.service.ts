import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, defer, Observable, Subject, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import type { PaginatedResponse } from '../models/sensor-reading.models';

export interface ApiAlert {
  id: string;
  sensorType: string; 
  location: string;
  metric: string;
  triggeredValue: number;
  thresholdValue: number;
  alertType: 'ABOVE' | 'BELOW';
  triggeredAt: string; //timestamp
  readingId: string | null;
  readAt?: string | null;
}

@Injectable({ providedIn: 'root' })
export class AlertsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  private readonly alertDeletedSource = new Subject<string>();
  readonly alertDeleted$ = this.alertDeletedSource.asObservable();

  private readonly alertsSubject = new BehaviorSubject<ApiAlert[]>([]);
  readonly alerts$ = this.alertsSubject.asObservable();
  private readonly locallyReadAtById = new Map<string, string>();

  getAlerts(): Observable<ApiAlert[]> {
    return this.http.get<PaginatedResponse<ApiAlert>>(`${this.baseUrl}/alerts?page=0&size=20&sortBy=triggeredAt&sortDir=desc`).pipe(
      map((response) => response.content),
      map((alerts) => this.applyLocalReadState(alerts)),
      tap((alerts) => this.alertsSubject.next(alerts)),
    );
  }

  refreshAlerts(): void {
    this.getAlerts().subscribe({
      error: err => console.error('Failed to refresh alerts', err)
    });
  }

  markAsRead(id: string): Observable<void> {
    return defer(() => {
      const currentAlerts = this.alertsSubject.getValue();
      const currentAlert = currentAlerts.find((a) => a.id === id);
      const previousReadAt = currentAlert?.readAt ?? null;
      const hadLocalReadAt = this.locallyReadAtById.has(id);
      const optimisticReadAt = previousReadAt ?? this.locallyReadAtById.get(id) ?? new Date().toISOString();

      this.locallyReadAtById.set(id, optimisticReadAt);
      this.setAlertReadAt(id, optimisticReadAt);

      return this.http.patch(`${this.baseUrl}/alerts/${id}/read`, {}).pipe(
        map(() => undefined),
        catchError((error) => {
          if (!previousReadAt && !hadLocalReadAt) {
            this.locallyReadAtById.delete(id);
            this.setAlertReadAt(id, null);
          }
          return throwError(() => error);
        }),
      );
    });
  }

  deleteAlert(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/alerts/${id}`).pipe(
      tap(() => {
        this.locallyReadAtById.delete(id);
        this.alertDeletedSource.next(id);
        const currentAlerts = this.alertsSubject.getValue();
        this.alertsSubject.next(currentAlerts.filter(a => a.id !== id));
      })
    );
  }

  private applyLocalReadState(alerts: ApiAlert[]): ApiAlert[] {
    return alerts.map((alert) => {
      if (alert.readAt) {
        this.locallyReadAtById.set(alert.id, alert.readAt);
        return alert;
      }

      const localReadAt = this.locallyReadAtById.get(alert.id);
      return localReadAt ? { ...alert, readAt: localReadAt } : alert;
    });
  }

  private setAlertReadAt(id: string, readAt: string | null): void {
    this.alertsSubject.next(
      this.alertsSubject.getValue().map((alert) =>
        alert.id === id ? { ...alert, readAt } : alert,
      ),
    );
  }
}
