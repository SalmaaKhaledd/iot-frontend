import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { StreetLightAlertsComponent } from './street-light-alerts.component';
import { AlertsService, ApiAlert } from '../../../../core/services/alerts.service';
import { SensorReadingsService } from '../../services/sensor-readings.service';
import { StreetLightSensorReading } from '../../models/sensor-reading.models';

describe('StreetLightAlertsComponent', () => {
  let component: StreetLightAlertsComponent;
  let fixture: ComponentFixture<StreetLightAlertsComponent>;
  let mockAlertsService: any;
  let mockSensorService: any;

  beforeEach(async () => {
    mockAlertsService = {
      getAlerts: vi.fn(),
      deleteAlert: vi.fn()
    };
    mockSensorService = {
      getStreetLightReadingById: vi.fn()
    };
    
    const mockApiAlerts: ApiAlert[] = [
      {
        id: '1',
        sensorType: 'STREET_LIGHT',
        location: 'Downtown',
        metric: 'BRIGHTNESS_LEVEL',
        triggeredValue: 90,
        thresholdValue: 80,
        alertType: 'ABOVE',
        triggeredAt: new Date().toISOString(),
        readingId: '123'
      }
    ];

    const mockReading: StreetLightSensorReading = {
      id: '123',
      location: 'Downtown',
      timestamp: new Date().toISOString(),
      brightnessLevel: 80,
      powerConsumption: 40,
      status: 'ON'
    };

    mockAlertsService.getAlerts.mockReturnValue(of(mockApiAlerts));
    mockAlertsService.deleteAlert.mockReturnValue(of(undefined));
    mockSensorService.getStreetLightReadingById.mockReturnValue(of(mockReading));

    await TestBed.configureTestingModule({
      imports: [StreetLightAlertsComponent],
      providers: [
        { provide: AlertsService, useValue: mockAlertsService },
        { provide: SensorReadingsService, useValue: mockSensorService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StreetLightAlertsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('exposes the alert list from service', () => {
    expect(component.streetLightAlerts()).toHaveLength(1);
    expect(component.filteredAlerts()).toHaveLength(1);
  });

  it('toggles the filter panel state', () => {
    expect(component.isFiltersOpen()).toBe(false);
    component.toggleFilters();
    expect(component.isFiltersOpen()).toBe(true);
  });

  it('maps status values to colors', () => {
    expect(component.getStatusColor('on')).toBe('success');
    expect(component.getStatusColor('off')).toBe('inactive');
  });

  it('deletes alert when deleteAlert is called', () => {
    const event = new MouseEvent('click');
    const spy = vi.spyOn(event, 'stopPropagation');
    
    component.deleteAlert('1', event);
    
    expect(spy).toHaveBeenCalled();
    expect(mockAlertsService.deleteAlert).toHaveBeenCalledWith('1');
    expect(component.streetLightAlerts()).toHaveLength(0);
  });
});