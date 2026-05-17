import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import {
  AlertsService,
  ApiAlert,
  filterAlertsToReadingHistory,
  normalizeAlertSensorType,
} from './alerts.service';
import { environment } from '../../../environments/environment';

describe('AlertsService', () => {
  let service: AlertsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AlertsService]
    });
    service = TestBed.inject(AlertsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get alerts', () => {
    const mockAlerts: ApiAlert[] = [
      {
        id: '1',
        sensorType: 'TRAFFIC',
        location: 'Main St',
        metric: 'CONGESTION',
        triggeredValue: 80,
        thresholdValue: 70,
        alertType: 'ABOVE',
        triggeredAt: new Date().toISOString(),
        readingId: '123'
      }
    ];

    service.getAlerts().subscribe(alerts => {
      expect(alerts).toEqual(mockAlerts);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/alerts`);
    expect(req.request.method).toBe('GET');
    req.flush(mockAlerts);
  });

  it('should normalize sensor type strings', () => {
    expect(normalizeAlertSensorType('street_light')).toBe('STREET_LIGHT');
    expect(normalizeAlertSensorType('AIR-POLLUTION')).toBe('AIR_POLLUTION');
  });

  it('should filter alerts to the current reading history window', () => {
    const latest = '2026-05-17T12:00:00';
    const inHistory: ApiAlert = {
      id: 'traffic-1',
      sensorType: 'TRAFFIC',
      location: 'Main St',
      metric: 'CONGESTION',
      triggeredValue: 80,
      thresholdValue: 70,
      alertType: 'ABOVE',
      triggeredAt: latest,
      readingId: 'reading-1',
    };
    const stale: ApiAlert = {
      ...inHistory,
      id: 'traffic-old',
      readingId: 'reading-old',
    };

    const filtered = filterAlertsToReadingHistory(
      [inHistory, stale],
      ['reading-1'],
      latest,
    );
    expect(filtered).toEqual([inHistory]);
  });

  it('should merge alerts by sensor type on refreshAlerts', () => {
    const latest = '2026-05-17T12:00:00';
    const trafficAlert: ApiAlert = {
      id: 'traffic-1',
      sensorType: 'TRAFFIC',
      location: 'Main St',
      metric: 'CONGESTION',
      triggeredValue: 80,
      thresholdValue: 70,
      alertType: 'ABOVE',
      triggeredAt: latest,
      readingId: 'reading-1',
    };
    const streetAlert: ApiAlert = {
      ...trafficAlert,
      id: 'street-1',
      sensorType: 'STREET_LIGHT',
      metric: 'BRIGHTNESS_LEVEL',
      readingId: 'reading-street',
    };

    let panelAlerts: ApiAlert[] = [];
    service.alerts$.subscribe((value) => (panelAlerts = value));

    service.refreshAlerts('TRAFFIC', {
      notify: false,
      readingIds: ['reading-1'],
      latestReadingTimestamp: latest,
    });
    httpMock.expectOne(`${environment.apiUrl}/alerts`).flush([trafficAlert, streetAlert]);
    expect(panelAlerts).toEqual([]);

    service.refreshAlerts('TRAFFIC', {
      notify: true,
      readingIds: ['reading-1'],
      latestReadingTimestamp: latest,
    });
    httpMock.expectOne(`${environment.apiUrl}/alerts`).flush([trafficAlert, streetAlert]);
    expect(panelAlerts).toEqual([trafficAlert]);
  });

  it('should only notify for manual refresh with matching reading ids', () => {
    const trafficAlert: ApiAlert = {
      id: 'traffic-1',
      sensorType: 'TRAFFIC',
      location: 'Main St',
      metric: 'CONGESTION',
      triggeredValue: 80,
      thresholdValue: 70,
      alertType: 'ABOVE',
      triggeredAt: new Date().toISOString(),
      readingId: 'reading-1',
    };
    const airAlert: ApiAlert = {
      ...trafficAlert,
      id: 'air-1',
      sensorType: 'AIR_POLLUTION',
      metric: 'PM2_5',
      readingId: 'reading-air',
    };

    const notifications: unknown[] = [];
    service.newAlertsForType$.subscribe((event) => notifications.push(event));

    const latest = trafficAlert.triggeredAt;

    service.refreshAlerts('TRAFFIC', {
      notify: false,
      readingIds: ['reading-1'],
      latestReadingTimestamp: latest,
    });
    httpMock.expectOne(`${environment.apiUrl}/alerts`).flush([trafficAlert]);

    service.refreshAlerts('TRAFFIC', {
      notify: true,
      readingIds: ['reading-1'],
      latestReadingTimestamp: latest,
    });
    httpMock.expectOne(`${environment.apiUrl}/alerts`).flush([trafficAlert, airAlert]);

    expect(notifications).toHaveLength(0);

    const newerTrafficAlert: ApiAlert = {
      ...trafficAlert,
      id: 'traffic-2',
      readingId: 'reading-2',
    };
    service.refreshAlerts('TRAFFIC', {
      notify: true,
      readingIds: ['reading-2'],
      latestReadingTimestamp: latest,
    });
    httpMock.expectOne(`${environment.apiUrl}/alerts`).flush([trafficAlert, newerTrafficAlert, airAlert]);

    expect(notifications).toHaveLength(1);
    expect(notifications[0]).toEqual({
      sensorType: 'TRAFFIC',
      alerts: [newerTrafficAlert],
    });
  });

  it('should delete an alert and emit on alertDeleted$', () => {
    const alertId = 'test-id';
    
    // Subscribe to the alertDeleted$ subject to verify it emits
    let emittedId: string | null = null;
    service.alertDeleted$.subscribe(id => {
      emittedId = id;
    });

    service.deleteAlert(alertId).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/alerts/${alertId}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null); // Return empty response

    expect(emittedId).toBe(alertId);
  });
});
