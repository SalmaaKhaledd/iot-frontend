import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { TrafficAlertsComponent } from './traffic-alerts.component';
import { AlertsService, ApiAlert } from '../../../../core/services/alerts.service';
import { SensorReadingsService } from '../../services/sensor-readings.service';
import { TrafficSensorReading } from '../../models/sensor-reading.models';

describe('TrafficAlertsComponent', () => {
  let component: TrafficAlertsComponent;
  let fixture: ComponentFixture<TrafficAlertsComponent>;
  let mockAlertsService: any;
  let mockSensorService: any;

  beforeEach(async () => {
    const mockApiAlerts: ApiAlert[] = [
      {
        id: '1',
        sensorType: 'TRAFFIC',
        location: 'Main St',
        metric: 'CONGESTION',
        triggeredValue: 90,
        thresholdValue: 80,
        alertType: 'ABOVE',
        triggeredAt: new Date().toISOString(),
        readingId: '123',
      },
    ];

    const mockReading: TrafficSensorReading = {
      id: '123',
      location: 'Main St',
      timestamp: new Date().toISOString(),
      trafficDensity: 80,
      avgSpeed: 25,
      congestionLevel: 'HIGH',
    };

    mockAlertsService = {
      alertsForType: vi.fn().mockReturnValue(of(mockApiAlerts)),
      deleteAlert: vi.fn().mockReturnValue(of(undefined)),
    };
    mockSensorService = {
      getTrafficReadingById: vi.fn().mockReturnValue(of(mockReading)),
    };

    await TestBed.configureTestingModule({
      imports: [TrafficAlertsComponent],
      providers: [
        { provide: AlertsService, useValue: mockAlertsService },
        { provide: SensorReadingsService, useValue: mockSensorService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TrafficAlertsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('exposes the alert list from service', () => {
    expect(component.trafficAlerts()).toHaveLength(1);
    expect(component.filteredAlerts()).toHaveLength(1);
  });

  it('toggles the filter panel state', () => {
    expect(component.isFiltersOpen()).toBe(false);
    component.toggleFilters();
    expect(component.isFiltersOpen()).toBe(true);
  });

  it('maps congestion levels to colors', () => {
    expect(component.getCongestionColor('Low')).toBe('success');
    expect(component.getCongestionColor('Moderate')).toBe('warning');
    expect(component.getCongestionColor('High')).toBe('error');
    expect(component.getCongestionColor('Severe')).toBe('critical');
  });

  it('deletes alert when deleteAlert is called', () => {
    const event = new MouseEvent('click');
    const spy = vi.spyOn(event, 'stopPropagation');
    
    component.deleteAlert('1', event);
    
    expect(spy).toHaveBeenCalled();
    expect(mockAlertsService.deleteAlert).toHaveBeenCalledWith('1');
    expect(component.trafficAlerts()).toHaveLength(0);
  });
});