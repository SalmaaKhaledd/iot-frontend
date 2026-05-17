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

    const req = httpMock.expectOne(`${environment.apiUrl}/alerts`);
    expect(req.request.method).toBe('GET');
    req.flush(mockAlerts);
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
