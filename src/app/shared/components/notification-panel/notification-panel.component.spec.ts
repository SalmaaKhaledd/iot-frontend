import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { vi } from 'vitest';
import { NotificationPanelComponent, type NotificationAlert } from './notification-panel.component';
import { AlertsService, ApiAlert } from '../../../core/services/alerts.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AlertToastComponent } from '../alert-toast/alert-toast.component';

describe('NotificationPanelComponent', () => {
  let component: NotificationPanelComponent;
  let fixture: ComponentFixture<NotificationPanelComponent>;
  let mockAlertsService: any;
  let mockRouter: { url: string };
  let mockSnackBar: { openFromComponent: ReturnType<typeof vi.fn> };
  let alertDeletedSubject: Subject<string>;
  let alertsSubject: Subject<ApiAlert[]>;
  let snackBarActionSubject: Subject<void>;

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

  beforeEach(async () => {
    alertDeletedSubject = new Subject<string>();
    alertsSubject = new Subject<ApiAlert[]>();
    snackBarActionSubject = new Subject<void>();
    mockRouter = { url: '/home' };
    mockSnackBar = {
      openFromComponent: vi.fn(() => ({
        onAction: () => snackBarActionSubject.asObservable(),
      })),
    };

    mockAlertsService = {
      getAlerts: vi.fn().mockReturnValue(of(mockApiAlerts)),
      markAsRead: vi.fn().mockReturnValue(of(undefined)),
      alerts$: alertsSubject.asObservable(),
      alertDeleted$: alertDeletedSubject.asObservable()
    };

    TestBed.configureTestingModule({
      imports: [NotificationPanelComponent],
      providers: [
        { provide: AlertsService, useValue: mockAlertsService },
        { provide: Router, useValue: mockRouter },
      ]
    });
    TestBed.overrideProvider(MatSnackBar, { useValue: mockSnackBar });
    await TestBed.compileComponents();

    fixture = TestBed.createComponent(NotificationPanelComponent);
    component = fixture.componentInstance;
    alertsSubject.next(mockApiAlerts);
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

  it('marks the selected notification as read and emits jump event', () => {
    const emitted: Array<{type: 'traffic' | 'air-quality' | 'street-light', alertId: string}> = [];
    component.jumpToAlert.subscribe(event => emitted.push(event));
    component.toggle();

    component.navigateToAlert(component.alerts()[0]);

    expect(mockAlertsService.markAsRead).toHaveBeenCalledWith('alert-1');
    expect(emitted).toEqual([{ type: 'traffic', alertId: 'alert-1' }]);
    expect(component.isOpen()).toBe(false);
  });

  it('routes toast actions through the same alert jump event', () => {
    const emitted: Array<{type: 'traffic' | 'air-quality' | 'street-light', alertId: string}> = [];
    const toastAlert: NotificationAlert = {
      id: 'alert-3',
      type: 'street-light',
      typeIcon: 'lightbulb',
      typeLabel: 'STREET-LIGHT',
      severity: 'info',
      severityIcon: 'info',
      direction: 'BELOW',
      title: 'BRIGHTNESS Alert',
      message: 'BRIGHTNESS in Side St dropped below threshold.',
      report: 'BRIGHTNESS reached 20 (Threshold: 30).',
      time: '28 Jul, 9:00 PM',
      isRead: false,
    };
    component.jumpToAlert.subscribe(event => emitted.push(event));
    mockAlertsService.markAsRead.mockClear();
    mockSnackBar.openFromComponent.mockClear();

    (component as unknown as { showAlertToast(alert: NotificationAlert): void }).showAlertToast(toastAlert);

    expect(mockSnackBar.openFromComponent).toHaveBeenCalledWith(
      AlertToastComponent,
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'BRIGHTNESS Alert',
          message: 'BRIGHTNESS in Side St dropped below threshold.',
          type: 'street-light',
          severity: 'info',
          icon: 'lightbulb',
        }),
      }),
    );

    snackBarActionSubject.next();

    expect(mockAlertsService.markAsRead).toHaveBeenCalledWith('alert-3');
    expect(emitted).toEqual([{ type: 'street-light', alertId: 'alert-3' }]);
  });

  it('updates unread count from service read state', () => {
    alertsSubject.next([
      { ...mockApiAlerts[0], readAt: new Date().toISOString() },
      mockApiAlerts[1],
    ]);

    expect(component.unreadCount()).toBe(1);
  });
});
