import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { vi } from 'vitest';
import { NotificationPanelComponent } from './notification-panel.component';
import { AlertsService, ApiAlert } from '../../../core/services/alerts.service';

describe('NotificationPanelComponent', () => {
  let component: NotificationPanelComponent;
  let fixture: ComponentFixture<NotificationPanelComponent>;
  let mockAlertsService: any;
  let alertDeletedSubject: Subject<string>;

  beforeEach(async () => {
    alertDeletedSubject = new Subject<string>();
    mockAlertsService = {
      getAlerts: vi.fn(),
      alertDeleted$: alertDeletedSubject.asObservable()
    };

    const mockApiAlerts: ApiAlert[] = [
      {
        id: 'alert-1',
        sensorType: 'TRAFFIC',
        location: 'Main St',
        metric: 'CONGESTION',
        triggeredValue: 90,
        thresholdValue: 80,
        alertType: 'ABOVE',
        triggeredAt: new Date().toISOString(),
        readingId: '123'
      },
      {
        id: 'alert-2',
        sensorType: 'AIR_POLLUTION',
        location: 'Downtown',
        metric: 'CO',
        triggeredValue: 50,
        thresholdValue: 40,
        alertType: 'ABOVE',
        triggeredAt: new Date().toISOString(),
        readingId: '124'
      }
    ];

    mockAlertsService.getAlerts.mockReturnValue(of(mockApiAlerts));

    await TestBed.configureTestingModule({
      imports: [NotificationPanelComponent],
      providers: [
        { provide: AlertsService, useValue: mockAlertsService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('shows the unread badge count', () => {
    const badge = fixture.nativeElement.querySelector('.notify-badge') as HTMLElement;
    expect(component.unreadCount()).toBe(2);
    expect(badge.textContent?.trim()).toBe('2');
  });

  it('toggles the panel and clears the expanded report when closed', () => {
    component.toggle();
    component.toggleReport('alert-2');

    expect(component.isOpen()).toBe(true);
    expect(component.expandedAlertId()).toBe('alert-2');

    component.close();

    expect(component.isOpen()).toBe(false);
    expect(component.expandedAlertId()).toBeNull();
  });

  it('collapses the panel when clicking outside', () => {
    component.toggle();

    const event = new MouseEvent('click');
    Object.defineProperty(event, 'target', {
      value: document.createElement('div'),
    });

    component.onDocumentClick(event);

    expect(component.isOpen()).toBe(false);
    expect(component.expandedAlertId()).toBeNull();
  });

  it('removes alert when alertDeleted$ emits', () => {
    expect(component.alerts().length).toBe(2);
    alertDeletedSubject.next('alert-1');
    expect(component.alerts().length).toBe(1);
    expect(component.alerts()[0].id).toBe('alert-2');
  });
});