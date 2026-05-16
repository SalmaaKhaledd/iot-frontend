import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

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

@Injectable({ providedIn: 'root' })
export class AlertsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  private readonly alertDeletedSource = new Subject<string>();
  readonly alertDeleted$ = this.alertDeletedSource.asObservable();

  getAlerts(): Observable<ApiAlert[]> {
    return this.http.get<ApiAlert[]>(`${this.baseUrl}/alerts`);
  }

  deleteAlert(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/alerts/${id}`).pipe(
      tap(() => this.alertDeletedSource.next(id))
    );
  }
}
