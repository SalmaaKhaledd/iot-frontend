import { Component, EventEmitter, Output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AlertsService, type ApiAlert } from '../../core/services/alerts.service';
import { SensorReadingsService } from '../../core/services/sensor-readings.service';
import type { AlertNavigationTarget } from '../../shared/models/alert-navigation.model';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { trafficDashboardConfig } from '../traffic-dashboard/traffic-dashboard-config';
import { SensorDashboard } from './sensor-dashboard.component';

@Component({
  selector: 'app-topbar',
  standalone: true,
  template: '',
})
class TopbarStubComponent {
  @Output() readonly jumpToAlert = new EventEmitter<AlertNavigationTarget>();
}

describe('SensorDashboard', () => {
  let fixture: ComponentFixture<SensorDashboard>;
  let routerSpy: { navigate: ReturnType<typeof vi.fn> };
  let alertsSubject: Subject<ApiAlert[]>;

  const emptyReadingsPage = {
    content: [],
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size: 5,
  };

  beforeEach(async () => {
    routerSpy = {
      navigate: vi.fn().mockResolvedValue(true),
    };
    alertsSubject = new Subject<ApiAlert[]>();

    await TestBed.configureTestingModule({
      imports: [SensorDashboard],
      providers: [
        { provide: Router, useValue: routerSpy },
        {
          provide: SensorReadingsService,
          useValue: {
            getTrafficReadings: vi.fn().mockReturnValue(of(emptyReadingsPage)),
            getTrafficStats: vi.fn().mockReturnValue(throwError(() => new Error('stats unavailable'))),
          },
        },
        {
          provide: AlertsService,
          useValue: {
            alerts$: alertsSubject.asObservable(),
            alertDeleted$: new Subject<string>().asObservable(),
            markAsRead: vi.fn().mockReturnValue(of(undefined)),
          },
        },
      ],
    })
      .overrideComponent(SensorDashboard, {
        remove: { imports: [TopbarComponent] },
        add: { imports: [TopbarStubComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(SensorDashboard);
    fixture.componentRef.setInput('config', trafficDashboardConfig);
    fixture.detectChanges();
  });

  it('routes topbar notification jumps to the home alert modal target', () => {
    const topbar = fixture.debugElement.query(By.directive(TopbarStubComponent))
      .componentInstance as TopbarStubComponent;

    topbar.jumpToAlert.emit({ type: 'air-quality', alertId: 'alert-42' });

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/home'], {
      queryParams: { openAlert: 'air-quality', alertId: 'alert-42' },
    });
  });
});
