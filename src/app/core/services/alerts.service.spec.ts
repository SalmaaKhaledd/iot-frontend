import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AlertsService, ApiAlert } from './alerts.service';
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

    const req = httpMock.expectOne(`${environment.apiUrl}/alerts?page=0&size=20&sortBy=triggeredAt&sortDir=desc`);
    expect(req.request.method).toBe('GET');
    req.flush({
      content: mockAlerts,
      totalElements: mockAlerts.length,
      totalPages: 1,
      number: 0,
      size: 20,
    });
  });

  it('should optimistically mark an alert as read', () => {
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
        readingId: '123',
        readAt: null,
      }
    ];
    let latestAlerts: ApiAlert[] = [];
    service.alerts$.subscribe(alerts => {
      latestAlerts = alerts;
    });

    service.getAlerts().subscribe();

    const getReq = httpMock.expectOne(`${environment.apiUrl}/alerts?page=0&size=20&sortBy=triggeredAt&sortDir=desc`);
    getReq.flush({
      content: mockAlerts,
      totalElements: mockAlerts.length,
      totalPages: 1,
      number: 0,
      size: 20,
    });

    service.markAsRead('1').subscribe();

    expect(latestAlerts[0].readAt).toBeTruthy();

    const patchReq = httpMock.expectOne(`${environment.apiUrl}/alerts/1/read`);
    expect(patchReq.request.method).toBe('PATCH');
    patchReq.flush({ message: 'Alert marked as read.' });
  });

  it('should preserve optimistic read state when a stale refresh returns unread data', () => {
    const unreadAlert: ApiAlert = {
      id: '1',
      sensorType: 'TRAFFIC',
      location: 'Main St',
      metric: 'CONGESTION',
      triggeredValue: 80,
      thresholdValue: 70,
      alertType: 'ABOVE',
      triggeredAt: new Date().toISOString(),
      readingId: '123',
      readAt: null,
    };
    let latestAlerts: ApiAlert[] = [];
    service.alerts$.subscribe(alerts => {
      latestAlerts = alerts;
    });

    service.getAlerts().subscribe();
    httpMock.expectOne(`${environment.apiUrl}/alerts?page=0&size=20&sortBy=triggeredAt&sortDir=desc`).flush({
      content: [unreadAlert],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 20,
    });

    service.markAsRead('1').subscribe();
    const patchReq = httpMock.expectOne(`${environment.apiUrl}/alerts/1/read`);
    const optimisticReadAt = latestAlerts[0].readAt;

    service.getAlerts().subscribe();
    httpMock.expectOne(`${environment.apiUrl}/alerts?page=0&size=20&sortBy=triggeredAt&sortDir=desc`).flush({
      content: [{ ...unreadAlert, readAt: null }],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 20,
    });

    expect(latestAlerts[0].readAt).toBe(optimisticReadAt);

    patchReq.flush({ message: 'Alert marked as read.' });
  });

  it('should rollback optimistic read state when marking unread alert fails', () => {
    const unreadAlert: ApiAlert = {
      id: '1',
      sensorType: 'TRAFFIC',
      location: 'Main St',
      metric: 'CONGESTION',
      triggeredValue: 80,
      thresholdValue: 70,
      alertType: 'ABOVE',
      triggeredAt: new Date().toISOString(),
      readingId: '123',
      readAt: null,
    };
    let latestAlerts: ApiAlert[] = [];
    service.alerts$.subscribe(alerts => {
      latestAlerts = alerts;
    });

    service.getAlerts().subscribe();
    httpMock.expectOne(`${environment.apiUrl}/alerts?page=0&size=20&sortBy=triggeredAt&sortDir=desc`).flush({
      content: [unreadAlert],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 20,
    });

    service.markAsRead('1').subscribe({ error: () => undefined });
    expect(latestAlerts[0].readAt).toBeTruthy();

    httpMock.expectOne(`${environment.apiUrl}/alerts/1/read`).flush(
      { message: 'Failed to mark alert as read.' },
      { status: 500, statusText: 'Server Error' },
    );

    expect(latestAlerts[0].readAt).toBeNull();
  });

  it('should keep existing read state when marking an already-read alert fails', () => {
    const readAt = '2026-07-01T10:00:00';
    const readAlert: ApiAlert = {
      id: '1',
      sensorType: 'TRAFFIC',
      location: 'Main St',
      metric: 'CONGESTION',
      triggeredValue: 80,
      thresholdValue: 70,
      alertType: 'ABOVE',
      triggeredAt: new Date().toISOString(),
      readingId: '123',
      readAt,
    };
    let latestAlerts: ApiAlert[] = [];
    service.alerts$.subscribe(alerts => {
      latestAlerts = alerts;
    });

    service.getAlerts().subscribe();
    httpMock.expectOne(`${environment.apiUrl}/alerts?page=0&size=20&sortBy=triggeredAt&sortDir=desc`).flush({
      content: [readAlert],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 20,
    });

    service.markAsRead('1').subscribe({ error: () => undefined });
    httpMock.expectOne(`${environment.apiUrl}/alerts/1/read`).flush(
      { message: 'Failed to mark alert as read.' },
      { status: 500, statusText: 'Server Error' },
    );

    expect(latestAlerts[0].readAt).toBe(readAt);
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
