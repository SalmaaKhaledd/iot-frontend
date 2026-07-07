import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
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

  getAlerts(): Observable<ApiAlert[]> {
    return this.http.get<PaginatedResponse<ApiAlert>>(`${this.baseUrl}/alerts?page=0&size=20&sortBy=triggeredAt&sortDir=desc`).pipe(
      map((response) => response.content),
      tap((alerts) => this.alertsSubject.next(alerts)),
    );
  }

  refreshAlerts(): void {
    this.getAlerts().subscribe({
      error: err => console.error('Failed to refresh alerts', err)
    });
  }

  markAsRead(id: string): void {
    const currentAlerts = this.alertsSubject.getValue();
    this.alertsSubject.next(
      currentAlerts.map((a) =>
        a.id === id ? { ...a, readAt: a.readAt ?? new Date().toISOString() } : a,
      ),
    );
    this.http.patch(`${this.baseUrl}/alerts/${id}/read`, {}).subscribe();
  }

  deleteAlert(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/alerts/${id}`).pipe(
      tap(() => {
        this.alertDeletedSource.next(id);
        const currentAlerts = this.alertsSubject.getValue();
        this.alertsSubject.next(currentAlerts.filter(a => a.id !== id));
      })
    );
  }
}
