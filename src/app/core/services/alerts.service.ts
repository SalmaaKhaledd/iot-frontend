import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
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

  getAlerts(): Observable<ApiAlert[]> {
    return this.http.get<ApiAlert[]>(`${this.baseUrl}/alerts`);
  }
}
